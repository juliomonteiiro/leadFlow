import { createContext, useCallback, useContext, useState } from 'react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastState {
  message: string
  type:    ToastType
  id:      number
}

interface ToastContextValue {
  toast:     ToastState | null
  showToast: (message: string, type?: ToastType) => void
  hideToast: () => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null)

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type, id: Date.now() })
  }, [])

  const hideToast = useCallback(() => setToast(null), [])

  return (
    <ToastContext.Provider value={{ toast, showToast, hideToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
