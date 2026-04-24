import { supabase } from '@/lib/supabase'

interface SignInParams {
  email:    string
  password: string
}

interface SignUpParams {
  email:    string
  password: string
  fullName: string
}

interface UseAuthReturn {
  signIn:  (params: SignInParams) => Promise<string | null>
  signUp:  (params: SignUpParams) => Promise<string | null>
  signOut: ()                     => Promise<void>
}

export function useAuth(): UseAuthReturn {
  async function signIn({ email, password }: SignInParams): Promise<string | null> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  }

  async function signUp({ email, password, fullName }: SignUpParams): Promise<string | null> {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    return error?.message ?? null
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut()
  }

  return { signIn, signUp, signOut }
}
