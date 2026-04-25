import { Modal } from '@/components/ui/Modal'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  loading?: boolean
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmClass = variant === 'danger'
    ? 'bg-danger hover:bg-danger/90 text-white'
    : 'bg-brand hover:bg-brand-hover text-white'

  return (
    <Modal title={title} onClose={onCancel} size="sm">
      <div className="flex flex-col gap-5">
        <p className="text-sm text-text-secondary">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-btn text-sm text-text-secondary hover:bg-surface-hover disabled:opacity-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`${confirmClass} px-4 py-2 rounded-btn text-sm font-medium disabled:opacity-50 transition-colors`}
          >
            {loading ? 'Processando...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
