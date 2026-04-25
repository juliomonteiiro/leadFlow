import { useState }          from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff }       from 'lucide-react'
import { useAuth }           from '@/hooks/useAuth'

export default function RegisterPage() {
  const { signUp }  = useAuth()
  const navigate    = useNavigate()
  const [fullName, setFullName]   = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.')
      return
    }
    setLoading(true)
    setError(null)
    const err = await signUp({ email, password, fullName })
    if (err) {
      setError('Não foi possível criar a conta. Tente outro email.')
      setLoading(false)
      return
    }
    navigate('/kanban')
  }

  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center px-4">
      <div className="bg-surface-card border border-surface-border rounded-card p-8 w-full max-w-md">
        <h1 className="text-2xl font-semibold text-text-primary mb-2">Criar conta</h1>
        <p className="text-text-secondary text-sm mb-6">Seu workspace será criado automaticamente</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-text-secondary">Nome completo</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
              placeholder="Seu nome" required
              className="bg-surface-base border border-surface-border rounded-input px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-text-secondary">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com" required
              className="bg-surface-base border border-surface-border rounded-input px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-text-secondary">Senha</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres" required
                className="w-full bg-surface-base border border-surface-border rounded-input px-3 py-2 pr-10 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand" />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 px-3 text-text-secondary hover:text-text-primary transition-colors"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <p className="text-danger text-sm">{error}</p>}

          <button type="submit" disabled={loading}
            className="bg-brand hover:bg-brand-hover disabled:opacity-50 text-white py-2 rounded-btn font-medium transition-colors">
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className="text-sm text-text-secondary mt-6 text-center">
          Já tem conta?{' '}
          <Link to="/login" className="text-brand hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  )
}
