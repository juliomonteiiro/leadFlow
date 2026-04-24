import { useEffect } from 'react'
import { X }         from 'lucide-react'

interface ModalProps {
  title:    string
  onClose:  () => void
  children: React.ReactNode
  size?:    'sm' | 'md' | 'lg'
}

const SIZE_CLASS: Record<string, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
}

export function Modal({ title, onClose, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`bg-surface-card border border-surface-border rounded-card w-full ${SIZE_CLASS[size]} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border shrink-0">
          <h2 className="text-text-primary font-semibold">{title}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto p-6 flex-1">{children}</div>
      </div>
    </div>
  )
}
