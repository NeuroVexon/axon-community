import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'
import { Loader2, Shield, UserPlus, LogIn } from 'lucide-react'

export default function LoginPage() {
  const { t } = useTranslation()
  const { login, register } = useAuth()

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [hasUsers, setHasUsers] = useState(true)
  const [registrationEnabled, setRegistrationEnabled] = useState(true)

  useEffect(() => {
    api.getAuthStatus()
      .then((status) => {
        setHasUsers(status.has_users)
        setRegistrationEnabled(status.registration_enabled)
        if (!status.has_users) {
          setMode('register')
        }
      })
      .catch(() => {
        // Fallback: assume has users
      })
      .finally(() => setCheckingStatus(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'register') {
        await register(email, password, displayName || undefined)
      } else {
        await login(email, password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.unknownError'))
    } finally {
      setLoading(false)
    }
  }

  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-nv-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-nv-accent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-nv-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-nv-accent/10 border border-nv-accent/20 mb-4">
            <Shield className="w-8 h-8 text-nv-accent" />
          </div>
          <h1 className="text-2xl font-bold text-white">Axon</h1>
          <p className="text-sm text-gray-500 mt-1">by NeuroVexon</p>
        </div>

        {/* Card */}
        <div className="bg-nv-black-200 rounded-2xl border border-nv-gray-light p-8">
          <h2 className="text-lg font-semibold text-white mb-1">
            {!hasUsers
              ? t('auth.createAdmin')
              : mode === 'register'
                ? t('auth.registerTitle')
                : t('auth.loginTitle')}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {!hasUsers
              ? t('auth.createAdminDesc')
              : mode === 'register'
                ? t('auth.registerDesc')
                : t('auth.loginDesc')}
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">
                  {t('auth.displayName')}
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t('auth.displayNamePlaceholder')}
                  className="w-full px-4 py-3 bg-nv-black border border-nv-gray-light rounded-lg
                             text-white placeholder-gray-500 focus:outline-none focus:border-nv-accent"
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">
                {t('auth.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                autoFocus
                className="w-full px-4 py-3 bg-nv-black border border-nv-gray-light rounded-lg
                           text-white placeholder-gray-500 focus:outline-none focus:border-nv-accent"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">
                {t('auth.password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? t('auth.passwordMinLength') : ''}
                required
                minLength={mode === 'register' ? 8 : undefined}
                className="w-full px-4 py-3 bg-nv-black border border-nv-gray-light rounded-lg
                           text-white placeholder-gray-500 focus:outline-none focus:border-nv-accent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-nv-accent text-nv-black font-semibold rounded-xl
                         hover:bg-opacity-90 disabled:opacity-50 flex items-center justify-center gap-2
                         shadow-nv-glow transition-all"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : mode === 'register' ? (
                <UserPlus className="w-5 h-5" />
              ) : (
                <LogIn className="w-5 h-5" />
              )}
              {mode === 'register' ? t('auth.registerButton') : t('auth.loginButton')}
            </button>
          </form>

          {/* Toggle Login/Register */}
          {hasUsers && registrationEnabled && (
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login')
                  setError('')
                }}
                className="text-sm text-gray-500 hover:text-nv-accent transition-colors"
              >
                {mode === 'login' ? t('auth.switchToRegister') : t('auth.switchToLogin')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
