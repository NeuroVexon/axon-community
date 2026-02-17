import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import {
  Bot,
  Plus,
  Pencil,
  Trash2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  X,
  Save,
  Star
} from 'lucide-react'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'

interface Agent {
  id: string
  name: string
  description: string
  system_prompt: string | null
  model: string | null
  allowed_tools: string[] | null
  allowed_skills: string[] | null
  risk_level_max: string
  auto_approve_tools: string[] | null
  is_default: boolean
  enabled: boolean
  created_at: string
  updated_at: string
}

const AVAILABLE_TOOLS = [
  'file_read', 'file_write', 'file_list',
  'web_fetch', 'web_search',
  'shell_execute',
  'memory_save', 'memory_search', 'memory_delete'
]

export default function AgentsView() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Agent | null>(null)
  const [creating, setCreating] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    loadAgents()
  }, [])

  const loadAgents = async () => {
    setLoading(true)
    try {
      const data = await api.getAgents()
      setAgents(data)
    } catch (error) {
      console.error('Failed to load agents:', error)
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    try {
      await api.deleteAgent(id)
      setAgents(prev => prev.filter(a => a.id !== id))
    } catch (error) {
      console.error('Failed to delete agent:', error)
    }
  }

  const handleToggle = async (agent: Agent) => {
    try {
      await api.updateAgent(agent.id, { enabled: !agent.enabled })
      setAgents(prev => prev.map(a =>
        a.id === agent.id ? { ...a, enabled: !a.enabled } : a
      ))
    } catch (error) {
      console.error('Failed to toggle agent:', error)
    }
  }

  const RiskIcon = ({ level }: { level: string }) => {
    if (level === 'low') return <Shield className="w-4 h-4 text-green-400" />
    if (level === 'medium') return <ShieldCheck className="w-4 h-4 text-yellow-400" />
    return <ShieldAlert className="w-4 h-4 text-red-400" />
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-nv-accent" />
      </div>
    )
  }

  if (editing || creating) {
    return (
      <AgentEditor
        agent={editing}
        onSave={async () => {
          setEditing(null)
          setCreating(false)
          await loadAgents()
        }}
        onCancel={() => {
          setEditing(null)
          setCreating(false)
        }}
      />
    )
  }

  return (
    <div className="h-full overflow-auto p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Bot className="w-8 h-8 text-nv-accent" />
            <h1 className="text-2xl font-bold">{t('agents.title')}</h1>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="px-4 py-2 bg-nv-accent text-nv-black font-semibold rounded-lg
                       hover:bg-opacity-90 flex items-center gap-2 shadow-nv-glow transition-all"
          >
            <Plus className="w-5 h-5" />
            {t('agents.new')}
          </button>
        </div>

        <div className="space-y-4">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className={clsx(
                'bg-nv-black-200 rounded-xl p-6 border transition-all',
                agent.enabled ? 'border-nv-gray-light' : 'border-nv-gray-light/30 opacity-60'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{agent.name}</h3>
                    {agent.is_default && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-nv-accent/10 text-nv-accent text-xs rounded-full">
                        <Star className="w-3 h-3" /> {t('agents.default')}
                      </span>
                    )}
                    <RiskIcon level={agent.risk_level_max} />
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{agent.description}</p>

                  <div className="flex flex-wrap gap-2">
                    {agent.allowed_tools === null ? (
                      <span className="px-2 py-1 bg-nv-black-lighter text-xs text-gray-400 rounded">
                        {t('agents.allTools')}
                      </span>
                    ) : (
                      agent.allowed_tools.map(tool => (
                        <span key={tool} className="px-2 py-1 bg-nv-black-lighter text-xs text-gray-400 rounded">
                          {tool}
                        </span>
                      ))
                    )}
                    {agent.auto_approve_tools && agent.auto_approve_tools.length > 0 && (
                      <span className="px-2 py-1 bg-green-500/10 text-xs text-green-400 rounded">
                        Auto: {agent.auto_approve_tools.join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleToggle(agent)}
                    className={clsx(
                      'w-12 h-6 rounded-full transition-all relative',
                      agent.enabled ? 'bg-nv-accent' : 'bg-gray-600'
                    )}
                  >
                    <div className={clsx(
                      'w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all',
                      agent.enabled ? 'left-6' : 'left-0.5'
                    )} />
                  </button>
                  <button
                    onClick={() => setEditing(agent)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-nv-black-lighter rounded-lg transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {!agent.is_default && (
                    <button
                      onClick={() => handleDelete(agent.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-nv-black-lighter rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AgentEditor({
  agent,
  onSave,
  onCancel
}: {
  agent: Agent | null
  onSave: () => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(agent?.name || '')
  const [description, setDescription] = useState(agent?.description || '')
  const [systemPrompt, setSystemPrompt] = useState(agent?.system_prompt || '')
  const [model, setModel] = useState(agent?.model || '')
  const [riskLevelMax, setRiskLevelMax] = useState(agent?.risk_level_max || 'high')
  const [useAllTools, setUseAllTools] = useState(agent?.allowed_tools === null)
  const [allowedTools, setAllowedTools] = useState<string[]>(agent?.allowed_tools || [])
  const [autoApproveTools, setAutoApproveTools] = useState<string[]>(agent?.auto_approve_tools || [])
  const [saving, setSaving] = useState(false)

  const RISK_LEVELS = [
    { value: 'low', label: t('agents.riskLow'), color: 'text-green-400' },
    { value: 'medium', label: t('agents.riskMedium'), color: 'text-yellow-400' },
    { value: 'high', label: t('agents.riskHigh'), color: 'text-red-400' },
  ]

  const toggleTool = (tool: string) => {
    setAllowedTools(prev =>
      prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]
    )
  }

  const toggleAutoApprove = (tool: string) => {
    setAutoApproveTools(prev =>
      prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const data = {
        name,
        description,
        system_prompt: systemPrompt || undefined,
        model: model || undefined,
        risk_level_max: riskLevelMax,
        allowed_tools: useAllTools ? undefined : allowedTools,
        auto_approve_tools: autoApproveTools.length > 0 ? autoApproveTools : undefined,
      }

      if (agent) {
        await api.updateAgent(agent.id, data)
      } else {
        await api.createAgent(data)
      }
      onSave()
    } catch (error) {
      console.error('Failed to save agent:', error)
    }
    setSaving(false)
  }

  // Tools available for auto-approve = only allowed tools
  const effectiveTools = useAllTools ? AVAILABLE_TOOLS : allowedTools

  return (
    <div className="h-full overflow-auto p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">
            {agent ? t('agents.editTitle') : t('agents.createTitle')}
          </h1>
          <button onClick={onCancel} className="p-2 text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Name */}
          <div className="bg-nv-black-200 rounded-xl p-6 border border-nv-gray-light">
            <label className="block text-sm font-medium mb-2">{t('agents.name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('agents.namePlaceholder')}
              className="w-full px-4 py-3 bg-nv-black border border-nv-gray-light rounded-lg
                         text-white placeholder-gray-500 focus:outline-none focus:border-nv-accent"
            />
          </div>

          {/* Description */}
          <div className="bg-nv-black-200 rounded-xl p-6 border border-nv-gray-light">
            <label className="block text-sm font-medium mb-2">{t('agents.description')}</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('agents.descriptionPlaceholder')}
              className="w-full px-4 py-3 bg-nv-black border border-nv-gray-light rounded-lg
                         text-white placeholder-gray-500 focus:outline-none focus:border-nv-accent"
            />
          </div>

          {/* System Prompt */}
          <div className="bg-nv-black-200 rounded-xl p-6 border border-nv-gray-light">
            <label className="block text-sm font-medium mb-2">{t('agents.systemPrompt')}</label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder={t('agents.systemPromptPlaceholder')}
              rows={4}
              className="w-full px-4 py-3 bg-nv-black border border-nv-gray-light rounded-lg
                         text-white placeholder-gray-500 focus:outline-none focus:border-nv-accent resize-none"
            />
          </div>

          {/* Model Override */}
          <div className="bg-nv-black-200 rounded-xl p-6 border border-nv-gray-light">
            <label className="block text-sm font-medium mb-2">{t('agents.model')}</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={t('agents.modelPlaceholder')}
              className="w-full px-4 py-3 bg-nv-black border border-nv-gray-light rounded-lg
                         text-white placeholder-gray-500 focus:outline-none focus:border-nv-accent font-mono"
            />
            <p className="text-xs text-gray-500 mt-2">
              {t('agents.modelHint')}
            </p>
          </div>

          {/* Risk Level */}
          <div className="bg-nv-black-200 rounded-xl p-6 border border-nv-gray-light">
            <label className="block text-sm font-medium mb-3">{t('agents.maxRisk')}</label>
            <div className="flex gap-3">
              {RISK_LEVELS.map(level => (
                <button
                  key={level.value}
                  onClick={() => setRiskLevelMax(level.value)}
                  className={clsx(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    riskLevelMax === level.value
                      ? 'bg-nv-accent text-nv-black'
                      : 'bg-nv-black-lighter text-gray-400 hover:text-white border border-nv-gray-light'
                  )}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          {/* Allowed Tools */}
          <div className="bg-nv-black-200 rounded-xl p-6 border border-nv-gray-light">
            <label className="block text-sm font-medium mb-3">{t('agents.allowedTools')}</label>
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={useAllTools}
                onChange={(e) => setUseAllTools(e.target.checked)}
                className="accent-nv-accent"
              />
              <span className="text-sm text-gray-300">{t('agents.allToolsCheck')}</span>
            </label>
            {!useAllTools && (
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TOOLS.map(tool => (
                  <button
                    key={tool}
                    onClick={() => toggleTool(tool)}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-xs font-mono transition-all',
                      allowedTools.includes(tool)
                        ? 'bg-nv-accent text-nv-black'
                        : 'bg-nv-black-lighter text-gray-500 hover:text-white border border-nv-gray-light'
                    )}
                  >
                    {tool}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Auto-Approve Tools */}
          <div className="bg-nv-black-200 rounded-xl p-6 border border-nv-gray-light">
            <label className="block text-sm font-medium mb-2">{t('agents.autoApprove')}</label>
            <p className="text-xs text-gray-500 mb-3">
              {t('agents.autoApproveHint')}
            </p>
            <div className="flex flex-wrap gap-2">
              {effectiveTools.map(tool => (
                <button
                  key={tool}
                  onClick={() => toggleAutoApprove(tool)}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-xs font-mono transition-all',
                    autoApproveTools.includes(tool)
                      ? 'bg-green-500 text-white'
                      : 'bg-nv-black-lighter text-gray-500 hover:text-white border border-nv-gray-light'
                  )}
                >
                  {tool}
                </button>
              ))}
            </div>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="w-full px-6 py-4 bg-nv-accent text-nv-black font-semibold rounded-xl
                       hover:bg-opacity-90 disabled:opacity-50 flex items-center justify-center gap-2
                       shadow-nv-glow transition-all"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {agent ? t('agents.saveAgent') : t('agents.createAgent')}
          </button>
        </div>
      </div>
    </div>
  )
}
