import { createContext } from 'react'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastState {
  message: string
  type: ToastType
  id: number
}

export interface ToastContextValue {
  toast: ToastState | null
  showToast: (message: string, type?: ToastType) => void
  hideToast: () => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)
