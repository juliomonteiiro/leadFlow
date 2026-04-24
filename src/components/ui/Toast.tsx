import { useEffect }      from 'react'
import { X }              from 'lucide-react'
import type { ToastType } from '@/contexts/toast.context'

interface ToastProps {
  message: string
  type:    ToastType
  onClose: () => void
}

const TYPE_CLASSES: Record<ToastType, string> = {
  success: 'border-success text-success',
  error:   'border-danger text-danger',
  info:    'border-info text-info',
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 bg-surface-card border rounded-card px-4 py-3 shadow-lg ${TYPE_CLASSES[type]}`}>
      <span className="text-sm text-text-primary">{message}</span>
      <button onClick={onClose} className="text-text-muted hover:text-text-primary">
        <X size={14} />
      </button>
    </div>
  )
}
