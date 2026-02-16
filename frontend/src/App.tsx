import { useState, useEffect } from 'react'
import Sidebar from './components/Layout/Sidebar'
import ChatContainer from './components/Chat/ChatContainer'
import AuditDashboard from './components/Monitoring/AuditDashboard'
import MemoryView from './components/Memory/MemoryView'
import SkillsView from './components/Skills/SkillsView'
import { api } from './services/api'
import { Settings as SettingsIcon, Save, Loader2, Check, Key, Eye, EyeOff } from 'lucide-react'
import clsx from 'clsx'

type View = 'chat' | 'audit' | 'memory' | 'skills' | 'settings'

interface Settings {
  app_name: string
  app_version: string
  llm_provider: string
  theme: string
  system_prompt?: string
  available_providers: string[]
  anthropic_api_key_set?: boolean
  anthropic_api_key_masked?: string
  openai_api_key_set?: boolean
  openai_api_key_masked?: string
  ollama_model?: string
  claude_model?: string
  openai_model?: string
}

function SettingsView() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [provider, setProvider] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [anthropicKey, setAnthropicKey] = useState('')
  const [openaiKey, setOpenaiKey] = useState('')
  const [showAnthropicKey, setShowAnthropicKey] = useState(false)
  const [showOpenaiKey, setShowOpenaiKey] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const data = await api.getSettings()
      setSettings(data)
      setProvider(data.llm_provider)
      setSystemPrompt(data.system_prompt || '')
      // Don't load actual keys - just show if they're set
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updates: Record<string, string> = {
        llm_provider: provider,
        system_prompt: systemPrompt
      }
      // Only send API keys if they were changed (not empty)
      if (anthropicKey) {
        updates.anthropic_api_key = anthropicKey
      }
      if (openaiKey) {
        updates.openai_api_key = openaiKey
      }
      await api.updateSettings(updates)
      setSaved(true)
      // Clear the key inputs after save
      setAnthropicKey('')
      setOpenaiKey('')
      // Reload settings to get updated masked keys
      await loadSettings()
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-nv-accent" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <SettingsIcon className="w-8 h-8 text-nv-accent" />
          <h1 className="text-2xl font-bold">Einstellungen</h1>
        </div>

        <div className="space-y-8">
          {/* LLM Provider */}
          <div className="bg-nv-black-200 rounded-xl p-6 border border-nv-gray-light">
            <h2 className="text-lg font-semibold mb-4">LLM Provider</h2>
            <div className="flex gap-3">
              {settings?.available_providers.map((p) => (
                <button
                  key={p}
                  onClick={() => setProvider(p)}
                  className={clsx(
                    'px-5 py-3 rounded-lg text-sm font-medium transition-all',
                    provider === p
                      ? 'bg-nv-accent text-nv-black shadow-nv-glow'
                      : 'bg-nv-black-lighter text-gray-400 hover:text-white border border-nv-gray-light'
                  )}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-3">
              {provider === 'ollama' && '🖥️ Lokales LLM - 100% privat, keine API-Kosten'}
              {provider === 'claude' && '🤖 Anthropic Claude API - beste Qualität'}
              {provider === 'openai' && '⚡ OpenAI GPT API - schnell und zuverlässig'}
            </p>
          </div>

          {/* Claude API Key */}
          {provider === 'claude' && (
            <div className="bg-nv-black-200 rounded-xl p-6 border border-nv-gray-light">
              <div className="flex items-center gap-2 mb-4">
                <Key className="w-5 h-5 text-nv-accent" />
                <h2 className="text-lg font-semibold">Anthropic API Key</h2>
              </div>
              {settings?.anthropic_api_key_set && (
                <p className="text-sm text-green-400 mb-3">
                  ✓ API Key gesetzt: {settings.anthropic_api_key_masked}
                </p>
              )}
              <div className="relative">
                <input
                  type={showAnthropicKey ? 'text' : 'password'}
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder={settings?.anthropic_api_key_set ? 'Neuen Key eingeben zum Ändern...' : 'sk-ant-api...'}
                  className="w-full px-4 py-3 pr-12 bg-nv-black border border-nv-gray-light rounded-lg
                             text-white placeholder-gray-500 focus:outline-none focus:border-nv-accent font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showAnthropicKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Hole deinen API Key von{' '}
                <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer"
                   className="text-nv-accent hover:underline">console.anthropic.com</a>
              </p>
            </div>
          )}

          {/* OpenAI API Key */}
          {provider === 'openai' && (
            <div className="bg-nv-black-200 rounded-xl p-6 border border-nv-gray-light">
              <div className="flex items-center gap-2 mb-4">
                <Key className="w-5 h-5 text-nv-accent" />
                <h2 className="text-lg font-semibold">OpenAI API Key</h2>
              </div>
              {settings?.openai_api_key_set && (
                <p className="text-sm text-green-400 mb-3">
                  ✓ API Key gesetzt: {settings.openai_api_key_masked}
                </p>
              )}
              <div className="relative">
                <input
                  type={showOpenaiKey ? 'text' : 'password'}
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder={settings?.openai_api_key_set ? 'Neuen Key eingeben zum Ändern...' : 'sk-...'}
                  className="w-full px-4 py-3 pr-12 bg-nv-black border border-nv-gray-light rounded-lg
                             text-white placeholder-gray-500 focus:outline-none focus:border-nv-accent font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showOpenaiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Hole deinen API Key von{' '}
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer"
                   className="text-nv-accent hover:underline">platform.openai.com</a>
              </p>
            </div>
          )}

          {/* System Prompt */}
          <div className="bg-nv-black-200 rounded-xl p-6 border border-nv-gray-light">
            <h2 className="text-lg font-semibold mb-4">System Prompt</h2>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Optionaler System-Prompt für alle Konversationen..."
              rows={5}
              className="w-full px-4 py-3 bg-nv-black border border-nv-gray-light rounded-lg
                         text-white placeholder-gray-500 focus:outline-none focus:border-nv-accent
                         resize-none"
            />
          </div>

          {/* App Info */}
          <div className="bg-nv-black-200 rounded-xl p-6 border border-nv-gray-light">
            <h2 className="text-lg font-semibold mb-4">Über Axon</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Name</span>
                <span>{settings?.app_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Version</span>
                <span className="font-mono">{settings?.app_version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Aktiver Provider</span>
                <span className="text-nv-accent">{settings?.llm_provider}</span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full px-6 py-4 bg-nv-accent text-nv-black font-semibold rounded-xl
                       hover:bg-opacity-90 disabled:opacity-50 flex items-center justify-center gap-2
                       shadow-nv-glow transition-all"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : saved ? (
              <Check className="w-5 h-5" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saved ? 'Gespeichert!' : 'Einstellungen speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [currentView, setCurrentView] = useState<View>('chat')
  const [currentSession, setCurrentSession] = useState<string | null>(null)
  const [loadConversationId, setLoadConversationId] = useState<string | null>(null)

  const handleSelectConversation = (id: string) => {
    setCurrentSession(id)
    setLoadConversationId(id)
  }

  const handleNewChat = () => {
    setCurrentSession(null)
    setLoadConversationId(null)
  }

  return (
    <div className="flex h-screen bg-nv-black">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        currentSession={currentSession}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {currentView === 'chat' && (
          <ChatContainer
            key={currentSession || 'new'}
            sessionId={currentSession}
            onSessionChange={setCurrentSession}
            loadConversationId={loadConversationId}
          />
        )}
        {currentView === 'audit' && (
          <AuditDashboard />
        )}
        {currentView === 'memory' && (
          <MemoryView />
        )}
        {currentView === 'skills' && (
          <SkillsView />
        )}
        {currentView === 'settings' && (
          <SettingsView />
        )}
      </main>
    </div>
  )
}

export default App
