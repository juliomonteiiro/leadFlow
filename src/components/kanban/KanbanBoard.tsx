import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragOverEvent,
  DragStartEvent,
  MeasuringStrategy,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
} from '@dnd-kit/core'
import { KanbanColumn }      from '@/components/kanban/KanbanColumn'
import { useStages }         from '@/hooks/useStages'
import { useRequiredFields } from '@/hooks/useRequiredFields'
import { useActivityLog }    from '@/hooks/useActivityLog'
import { useCampaigns }      from '@/hooks/useCampaigns'
import { useToast }          from '@/hooks/useToast'
import { supabase }          from '@/lib/supabase'
import type { Campaign, FunnelStage, Lead } from '@/lib/types'

type KanbanColumns = Record<string, Lead[]>
type PendingMove = { leadId: string; stageId: string; sortOrder: number }

const COLUMN_DROP_PREFIX = 'column-drop-'

export type KanbanBoardProps = {
  leads: Lead[]
  leadsLoading: boolean
  updateStage: (leadId: string, stageId: string, sortOrder?: number) => Promise<boolean>
  onLeadClick: (lead: Lead) => void
  onCreateClick: () => void
}

function asSortNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

function compareLeadsByOrder(a: Lead, b: Lead): number {
  const ao = asSortNumber(a.sort_order)
  const bo = asSortNumber(b.sort_order)
  if (ao === undefined && bo === undefined) {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  }
  if (ao === undefined) return 1
  if (bo === undefined) return -1
  if (ao !== bo) return ao - bo
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
}

function buildColumns(leads: Lead[], stages: FunnelStage[]): KanbanColumns {
  const columns: KanbanColumns = Object.fromEntries(stages.map((stage) => [stage.id, []]))
  const knownStages = new Set(stages.map((stage) => stage.id))

  for (const lead of leads) {
    if (knownStages.has(lead.stage_id)) {
      columns[lead.stage_id].push(lead)
    }
  }

  for (const stage of stages) {
    columns[stage.id].sort(compareLeadsByOrder)
  }

  return columns
}

function cloneColumns(columns: KanbanColumns): KanbanColumns {
  return Object.fromEntries(Object.entries(columns).map(([stageId, items]) => [stageId, [...items]]))
}

function findContainer(columns: KanbanColumns, id: string): string | null {
  if (Object.prototype.hasOwnProperty.call(columns, id)) return id
  for (const [stageId, items] of Object.entries(columns)) {
    if (items.some((lead) => lead.id === id)) return stageId
  }
  return null
}

function resolveOverToStageId(columns: KanbanColumns, overId: string): string | null {
  if (overId.startsWith(COLUMN_DROP_PREFIX)) {
    const stageId = overId.slice(COLUMN_DROP_PREFIX.length)
    return Object.prototype.hasOwnProperty.call(columns, stageId) ? stageId : null
  }
  return findContainer(columns, overId)
}

function findLead(columns: KanbanColumns, leadId: string): Lead | null {
  for (const items of Object.values(columns)) {
    const lead = items.find((item) => item.id === leadId)
    if (lead) return lead
  }
  return null
}

function hasPendingMove(columns: KanbanColumns, pending: PendingMove): boolean {
  const lead = findLead(columns, pending.leadId)
  const currentOrder = asSortNumber(lead?.sort_order)
  return lead?.stage_id === pending.stageId
    && currentOrder !== undefined
    && Math.abs(currentOrder - pending.sortOrder) < 0.0001
}

function applyPersistedMove(columns: KanbanColumns, pending: PendingMove): KanbanColumns {
  const stageId = findContainer(columns, pending.leadId)
  if (!stageId) return columns
  return {
    ...columns,
    [stageId]: columns[stageId].map((lead) =>
      lead.id === pending.leadId
        ? { ...lead, stage_id: pending.stageId, sort_order: pending.sortOrder }
        : lead,
    ),
  }
}

function mergeServerColumnsWithPendingMove(
  serverColumns: KanbanColumns,
  currentColumns: KanbanColumns,
  pending: PendingMove,
): KanbanColumns {
  const serverLeads = new Map<string, Lead>()
  for (const items of Object.values(serverColumns)) {
    for (const lead of items) serverLeads.set(lead.id, lead)
  }

  const merged: KanbanColumns = {}
  const used = new Set<string>()
  for (const [stageId, serverItems] of Object.entries(serverColumns)) {
    const currentItems = currentColumns[stageId] ?? []
    const itemsFromCurrentOrder = currentItems.flatMap((currentLead) => {
      const serverLead = serverLeads.get(currentLead.id)
      if (!serverLead || used.has(currentLead.id)) return []
      used.add(currentLead.id)
      if (currentLead.id === pending.leadId) {
        return [{ ...serverLead, stage_id: pending.stageId, sort_order: pending.sortOrder }]
      }
      return [serverLead]
    })

    const newServerItems = serverItems.filter((lead) => lead.id !== pending.leadId && !used.has(lead.id))
    merged[stageId] = [...itemsFromCurrentOrder, ...newServerItems]
  }

  return merged
}

/** Só transferência entre etapas: sempre no fim da coluna de destino; ignora reordenação na mesma coluna. */
function moveLeadInColumns(columns: KanbanColumns, event: DragOverEvent | DragEndEvent): KanbanColumns {
  const { active, over } = event
  if (!over) return columns

  const activeId = String(active.id)
  const overId = String(over.id)
  const fromStageId = findContainer(columns, activeId)
  const toStageId = resolveOverToStageId(columns, overId)
  if (!fromStageId || !toStageId) return columns
  if (fromStageId === toStageId) return columns

  const fromItems = columns[fromStageId]
  const fromIndex = fromItems.findIndex((lead) => lead.id === activeId)
  if (fromIndex === -1) return columns

  const activeLead = fromItems[fromIndex]
  const nextColumns = cloneColumns(columns)
  nextColumns[fromStageId].splice(fromIndex, 1)
  const targetItems = nextColumns[toStageId]
  targetItems.push({ ...activeLead, stage_id: toStageId })
  return nextColumns
}

function calculateSortOrder(items: Lead[], leadId: string): number {
  const index = items.findIndex((lead) => lead.id === leadId)
  const previousOrder = index > 0 ? asSortNumber(items[index - 1]?.sort_order) : undefined
  const nextOrder = index >= 0 && index < items.length - 1 ? asSortNumber(items[index + 1]?.sort_order) : undefined

  if (previousOrder !== undefined && nextOrder !== undefined) return (previousOrder + nextOrder) / 2
  if (previousOrder !== undefined) return previousOrder + 1024
  if (nextOrder !== undefined) return nextOrder - 1024
  return Date.now()
}

function buildLocalVariations(lead: Lead, campaign: Campaign): string[] {
  const greeting = lead.name?.trim() ? `Olá ${lead.name.trim()}` : 'Olá'
  const context = campaign.context?.trim() || 'Seguimos interessados em entender melhor suas necessidades e como podemos ajudar.'
  const prompt = campaign.prompt?.trim()
  const company = lead.company?.trim() ? ` da ${lead.company.trim()}` : ''
  const title = lead.job_title?.trim() ? ` como ${lead.job_title.trim()}` : ''
  const source = lead.source?.trim() ? ` pela ${lead.source.trim()}` : ''

  return [
    `${greeting}!\n\n${context}\n\nGostaria de agendar uma conversa rápida para entender melhor seu cenário${company} e explorar como podemos gerar valor para você${title}.\n\nVocê teria disponibilidade essa semana?`,
    `${greeting}, tudo bem?\n\nVi que você chegou até nós${source} e fiquei interessado em entender mais sobre seu momento${company}.\n\n${context}\n\nPodemos conversar por 15 minutos essa semana?`,
    prompt
      ? `${greeting}!\n\n${prompt}\n\n${context}\n\nSe fizer sentido, avançamos com um próximo passo ainda esta semana.`
      : `${greeting}!\n\n${context}\n\nSei que seu tempo é valioso${title ? `, especialmente atuando${title}` : ''}. Posso te mostrar em poucos minutos uma proposta prática para ${lead.company?.trim() || 'sua empresa'}?`,
  ]
}

export function KanbanBoard({ leads, leadsLoading, updateStage, onLeadClick, onCreateClick }: KanbanBoardProps) {
  const { stages, loading: stagesLoading } = useStages()
  const { checkRequiredFields }            = useRequiredFields()
  const { log }                            = useActivityLog()
  const { campaigns }                      = useCampaigns()
  const { showToast }                      = useToast()
  const [activeLeadId, setActiveLeadId]    = useState<string | null>(null)
  const [columns, setColumns]              = useState<KanbanColumns>({})
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const containerRef = useRef<HTMLDivElement | null>(null)
  const dragStateRef = useRef({ active: false, startX: 0, startScrollLeft: 0 })
  const columnsRef = useRef<KanbanColumns>({})
  const startColumnsRef = useRef<KanbanColumns>({})
  const startStageRef = useRef<string | null>(null)
  const pendingMoveRef = useRef<PendingMove | null>(null)
  const lastOverIdRef = useRef<string | null>(null)

  const serverColumns = useMemo(() => buildColumns(leads, stages), [leads, stages])

  useEffect(() => {
    if (activeLeadId) return
    const pendingMove = pendingMoveRef.current
    if (pendingMove && !hasPendingMove(serverColumns, pendingMove)) {
      const mergedColumns = mergeServerColumnsWithPendingMove(serverColumns, columnsRef.current, pendingMove)
      columnsRef.current = mergedColumns
      setColumns(mergedColumns)
      return
    }
    pendingMoveRef.current = null
    columnsRef.current = serverColumns
    setColumns(serverColumns)
  }, [activeLeadId, serverColumns])

  const collisionDetectionStrategy = useCallback<CollisionDetection>((args) => {
    const list = pointerWithin(args)
    if (list.length > 0) {
      lastOverIdRef.current = String(list[0].id)
      return list
    }
    if (lastOverIdRef.current) return [{ id: lastOverIdRef.current }]
    return []
  }, [])

  function handleDragStart(event: DragStartEvent): void {
    const activeId = String(event.active.id)
    const snapshot = cloneColumns(serverColumns)
    const startStageId = findContainer(snapshot, activeId)

    columnsRef.current = snapshot
    startColumnsRef.current = snapshot
    startStageRef.current = startStageId
    lastOverIdRef.current = activeId
    setColumns(snapshot)
    setActiveLeadId(activeId)
  }

  function handleDragOver(event: DragOverEvent): void {
    if (!event.over) return

    const overStageId = resolveOverToStageId(startColumnsRef.current, String(event.over.id))
    if (overStageId === startStageRef.current) return

    const next = moveLeadInColumns(startColumnsRef.current, event)
    if (next === columnsRef.current) return
    columnsRef.current = next
    setColumns(next)
  }

  async function triggerCampaignMessages(leadId: string, stageId: string): Promise<void> {
    const targets = campaigns.filter((campaign) => campaign.trigger_stage_id === stageId && campaign.is_active)
    if (targets.length === 0) return

    const { data: lead, error } = await supabase.from('leads').select('*').eq('id', leadId).maybeSingle()
    if (error || !lead) {
      console.error('Não foi possível carregar lead para mensagens automáticas', error)
      return
    }

    await Promise.allSettled(targets.map((campaign) =>
      supabase.from('generated_messages').insert({
        lead_id: leadId,
        campaign_id: campaign.id,
        variations: buildLocalVariations(lead as Lead, campaign),
        was_sent: false,
        auto_generated: true,
      })
    ))
  }

  async function handleDragEnd(event: DragEndEvent): Promise<void> {
    const { active } = event
    const leadId = String(active.id)
    const overId = event.over?.id ? String(event.over.id) : lastOverIdRef.current

    if (!overId || overId === leadId) {
      setActiveLeadId(null)
      pendingMoveRef.current = null
      lastOverIdRef.current = null
      columnsRef.current = serverColumns
      setColumns(serverColumns)
      return
    }

    const syntheticOver = event.over ?? ({ id: overId } as NonNullable<DragEndEvent['over']>)
    const finalColumns = moveLeadInColumns(startColumnsRef.current, { ...event, over: syntheticOver })
    columnsRef.current = finalColumns
    setColumns(finalColumns)

    const oldStageId = startStageRef.current
    const newStageId = findContainer(finalColumns, leadId)
    const finalLead = findLead(finalColumns, leadId)
    if (!oldStageId || !newStageId || !finalLead) {
      setActiveLeadId(null)
      pendingMoveRef.current = null
      lastOverIdRef.current = null
      columnsRef.current = serverColumns
      setColumns(serverColumns)
      return
    }

    if (oldStageId === newStageId) {
      const restored = cloneColumns(startColumnsRef.current)
      columnsRef.current = restored
      setColumns(restored)
      setActiveLeadId(null)
      lastOverIdRef.current = null
      return
    }

    const originalLead = findLead(startColumnsRef.current, leadId) ?? finalLead
    const missingFields = await checkRequiredFields(originalLead, newStageId)
    if (missingFields.length > 0) {
      const labels = missingFields.map((field) => field.label).join(', ')
      showToast(`Preencha os campos obrigatórios: ${labels}`, 'error')
      setActiveLeadId(null)
      pendingMoveRef.current = null
      lastOverIdRef.current = null
      const reverted = cloneColumns(startColumnsRef.current)
      columnsRef.current = reverted
      setColumns(reverted)
      return
    }

    const sortOrder = calculateSortOrder(finalColumns[newStageId], leadId)
    const pendingMove = { leadId, stageId: newStageId, sortOrder }
    const optimisticColumns = applyPersistedMove(finalColumns, pendingMove)
    pendingMoveRef.current = pendingMove
    columnsRef.current = optimisticColumns
    setColumns(optimisticColumns)

    const moved = await updateStage(leadId, newStageId, sortOrder)
    if (!moved) {
      showToast('Não foi possível mover o lead para a etapa selecionada.', 'error')
      setActiveLeadId(null)
      pendingMoveRef.current = null
      lastOverIdRef.current = null
      const reverted = cloneColumns(startColumnsRef.current)
      columnsRef.current = reverted
      setColumns(reverted)
      return
    }

    await log({ leadId, activityType: 'stage_changed', metadata: { from: oldStageId, to: newStageId } })
    await triggerCampaignMessages(leadId, newStageId)

    setActiveLeadId(null)
    lastOverIdRef.current = null
  }

  function handleDragCancel(): void {
    setActiveLeadId(null)
    pendingMoveRef.current = null
    lastOverIdRef.current = null
    columnsRef.current = serverColumns
    setColumns(serverColumns)
  }

  const activeLead = activeLeadId ? findLead(columns, activeLeadId) : null

  function handleMouseDown(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement
    const isInteractive = target.closest('button, a, input, select, textarea, [role="button"]')
    const isLeadCard = target.closest('[data-kanban-card]')
    if (isInteractive || isLeadCard || !containerRef.current) return

    dragStateRef.current = {
      active: true,
      startX: event.clientX,
      startScrollLeft: containerRef.current.scrollLeft,
    }
    containerRef.current.style.cursor = 'grabbing'
    containerRef.current.style.userSelect = 'none'
  }

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!dragStateRef.current.active || !containerRef.current) return
    const deltaX = event.clientX - dragStateRef.current.startX
    containerRef.current.scrollLeft = dragStateRef.current.startScrollLeft - deltaX
  }

  function stopDragging() {
    if (!containerRef.current) return
    dragStateRef.current.active = false
    containerRef.current.style.cursor = 'grab'
    containerRef.current.style.userSelect = ''
  }

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Kanban</h1>
        <button onClick={onCreateClick} className="bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-btn text-sm font-medium transition-colors">
          + Novo lead
        </button>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div
          ref={containerRef}
          className="flex-1 min-h-0 flex items-stretch gap-5 overflow-x-auto p-4 pb-5 cursor-grab bg-surface-card border border-surface-border rounded-card shadow-sm"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDragging}
          onMouseLeave={stopDragging}
        >
          {stages.map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              leads={columns[stage.id] ?? []}
              loading={stagesLoading || leadsLoading}
              onLeadClick={onLeadClick}
            />
          ))}
        </div>
        <DragOverlay>
          {activeLead ? (
            <div className="w-72 bg-surface-card border border-brand/40 rounded-card p-3.5 shadow-xl opacity-95 pointer-events-none">
              <p className="text-text-primary text-sm font-medium truncate">{activeLead.name}</p>
              {activeLead.company && <p className="text-text-muted text-xs mt-1 truncate">{activeLead.company}</p>}
              {activeLead.job_title && <p className="text-text-muted text-xs mt-0.5 truncate">{activeLead.job_title}</p>}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
