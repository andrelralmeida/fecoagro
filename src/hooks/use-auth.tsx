import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { Role } from '@/lib/types'

interface AuthContextType {
  user: User | null
  session: Session | null
  role: Role | null
  avatarUrl: string | null
  fullName: string | null
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  loading: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [fullName, setFullName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const userIdRef = useRef<string | null>(null)

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role, full_name, avatar_url')
        .eq('id', userId)
        .single()

      if (error || !data) {
        return { role: 'visitante' as Role, full_name: null, avatar_url: null }
      }
      return {
        role: (data.role as Role) || 'visitante',
        full_name: data.full_name,
        avatar_url: data.avatar_url,
      }
    } catch {
      return { role: 'visitante' as Role, full_name: null, avatar_url: null }
    }
  }

  const refreshProfile = async () => {
    if (!user?.id) return
    const profile = await fetchProfile(user.id)
    setRole(profile.role)
    setFullName(profile.full_name)
    setAvatarUrl(profile.avatar_url)
  }

  useEffect(() => {
    let mounted = true

    const getProfile = async () => {
      if (!user) return
      try {
        const profile = await fetchProfile(user.id)
        if (mounted) {
          setRole(profile.role)
          setFullName(profile.full_name)
          setAvatarUrl(profile.avatar_url)
        }
      } catch (error) {
        console.error('Error in getProfile:', error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    if (user?.id) {
      getProfile()
    } else {
      setLoading(false)
    }

    return () => {
      mounted = false
    }
  }, [user?.id])

  useEffect(() => {
    let mounted = true

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return

      setSession(session)
      const newUser = session?.user ?? null

      if (newUser && newUser.id !== userIdRef.current) {
        setLoading(true)
        userIdRef.current = newUser.id
      } else if (!newUser) {
        setRole(null)
        setAvatarUrl(null)
        setFullName(null)
        setLoading(false)
        userIdRef.current = null
      }

      setUser(newUser)
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return

      setSession(session)
      const newUser = session?.user ?? null

      if (newUser) {
        userIdRef.current = newUser.id
      } else {
        setLoading(false)
      }
      setUser(newUser)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setRole(null)
      setAvatarUrl(null)
      setFullName(null)
      setSession(null)
      setUser(null)
      userIdRef.current = null
    }
    return { error }
  }

  const value = {
    user,
    session,
    role,
    avatarUrl,
    fullName,
    signUp,
    signIn,
    signOut,
    loading,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
