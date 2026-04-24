interface Tab { id: string; label: string }
interface TabsProps { tabs: Tab[]; activeId: string; onChange: (id: string) => void }

export function Tabs({ tabs, activeId, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 border-b border-surface-border mb-6">
      {tabs.map((tab) => (
        <button key={tab.id} onClick={() => onChange(tab.id)}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeId === tab.id
              ? 'border-brand text-brand'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}>
          {tab.label}
        </button>
      ))}
    </div>
  )
}
