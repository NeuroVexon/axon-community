import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import {
  Clock,
  Plus,
  Play,
  Trash2,
  Loader2,
  X,
  Save,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'

interface ScheduledTask {
  id: string
  name: string
  cron_expression: string
  agent_id: string | null
  prompt: string
  approval_required: boolean
  notification_channel: string
  max_retries: number
  last_run: string | null
  last_result: string | null
  next_run: string | null
  enabled: boolean
  created_at: string
  updated_at: string
}

interface AgentOption {
  id: string
  name: string
}

export default function SchedulerView() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([])
  const [agents, setAgents] = useState<AgentOption[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [runningTaskId, setRunningTaskId] = useState<string | null>(null)
  const { t } = useTranslation()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [tasksData, agentsData] = await Promise.all([
        api.getTasks(),
        api.getAgents()
      ])
      setTasks(tasksData)
      setAgents(agentsData.filter(a => a.enabled))
    } catch (error) {
      console.error('Failed to load data:', error)
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    try {
      await api.deleteTask(id)
      setTasks(prev => prev.filter(t => t.id !== id))
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  const handleToggle = async (task: ScheduledTask) => {
    try {
      await api.toggleTask(task.id)
      setTasks(prev => prev.map(t =>
        t.id === task.id ? { ...t, enabled: !t.enabled } : t
      ))
    } catch (error) {
      console.error('Failed to toggle task:', error)
    }
  }

  const handleRun = async (task: ScheduledTask) => {
    setRunningTaskId(task.id)
    try {
      const result = await api.runTask(task.id)
      setTasks(prev => prev.map(t =>
        t.id === task.id
          ? { ...t, last_run: new Date().toISOString(), last_result: result.result }
          : t
      ))
    } catch (error) {
      console.error('Failed to run task:', error)
    }
    setRunningTaskId(null)
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return '-'
    return new Date(iso).toLocaleString('de-DE', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-nv-accent" />
      </div>
    )
  }

  if (creating) {
    return (
      <TaskEditor
        agents={agents}
        onSave={async () => {
          setCreating(false)
          await loadData()
        }}
        onCancel={() => setCreating(false)}
      />
    )
  }

  return (
    <div className="h-full overflow-auto p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-nv-accent" />
            <h1 className="text-2xl font-bold">{t('scheduler.title')}</h1>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="px-4 py-2 bg-nv-accent text-nv-black font-semibold rounded-lg
                       hover:bg-opacity-90 flex items-center gap-2 shadow-nv-glow transition-all"
          >
            <Plus className="w-5 h-5" />
            {t('scheduler.newTask')}
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>{t('scheduler.empty')}</p>
            <p className="text-sm mt-1">{t('scheduler.emptyHint')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={clsx(
                  'bg-nv-black-200 rounded-xl p-6 border transition-all',
                  task.enabled ? 'border-nv-gray-light' : 'border-nv-gray-light/30 opacity-60'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{task.name}</h3>
                      <code className="px-2 py-0.5 bg-nv-black-lighter text-xs text-nv-accent rounded font-mono">
                        {task.cron_expression}
                      </code>
                      {task.approval_required && (
                        <span className="px-2 py-0.5 bg-yellow-500/10 text-xs text-yellow-400 rounded">
                          Approval
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">{task.prompt}</p>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{t('scheduler.lastRun', { date: formatDate(task.last_run) })}</span>
                      {task.last_result && (
                        <span className="flex items-center gap-1">
                          {task.last_result.startsWith('Fehler') ? (
                            <XCircle className="w-3 h-3 text-red-400" />
                          ) : task.last_result.startsWith('Timeout') ? (
                            <AlertCircle className="w-3 h-3 text-yellow-400" />
                          ) : (
                            <CheckCircle className="w-3 h-3 text-green-400" />
                          )}
                          <span className="truncate max-w-xs">{task.last_result.slice(0, 80)}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleRun(task)}
                      disabled={runningTaskId === task.id}
                      className="p-2 text-gray-400 hover:text-nv-accent hover:bg-nv-black-lighter rounded-lg transition-all"
                      title={t('scheduler.runNow')}
                    >
                      {runningTaskId === task.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleToggle(task)}
                      className={clsx(
                        'w-12 h-6 rounded-full transition-all relative',
                        task.enabled ? 'bg-nv-accent' : 'bg-gray-600'
                      )}
                    >
                      <div className={clsx(
                        'w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all',
                        task.enabled ? 'left-6' : 'left-0.5'
                      )} />
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-nv-black-lighter rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TaskEditor({
  agents,
  onSave,
  onCancel
}: {
  agents: AgentOption[]
  onSave: () => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [cronExpression, setCronExpression] = useState('0 9 * * *')
  const [prompt, setPrompt] = useState('')
  const [agentId, setAgentId] = useState('')
  const [approvalRequired, setApprovalRequired] = useState(true)
  const [saving, setSaving] = useState(false)

  const CRON_PRESETS = [
    { label: t('scheduler.cronEveryHour'), value: '0 * * * *' },
    { label: t('scheduler.cronDaily9'), value: '0 9 * * *' },
    { label: t('scheduler.cronDaily18'), value: '0 18 * * *' },
    { label: t('scheduler.cronMonday9'), value: '0 9 * * 1' },
    { label: t('scheduler.cronEvery30'), value: '*/30 * * * *' },
    { label: t('scheduler.cronEvery6h'), value: '0 */6 * * *' },
  ]

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.createTask({
        name,
        cron_expression: cronExpression,
        prompt,
        agent_id: agentId || undefined,
        approval_required: approvalRequired,
      })
      onSave()
    } catch (error) {
      console.error('Failed to create task:', error)
    }
    setSaving(false)
  }

  return (
    <div className="h-full overflow-auto p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">{t('scheduler.editorTitle')}</h1>
          <button onClick={onCancel} className="p-2 text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Name */}
          <div className="bg-nv-black-200 rounded-xl p-6 border border-nv-gray-light">
            <label className="block text-sm font-medium mb-2">{t('scheduler.name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('scheduler.namePlaceholder')}
              className="w-full px-4 py-3 bg-nv-black border border-nv-gray-light rounded-lg
                         text-white placeholder-gray-500 focus:outline-none focus:border-nv-accent"
            />
          </div>

          {/* Cron */}
          <div className="bg-nv-black-200 rounded-xl p-6 border border-nv-gray-light">
            <label className="block text-sm font-medium mb-2">{t('scheduler.cron')}</label>
            <input
              type="text"
              value={cronExpression}
              onChange={(e) => setCronExpression(e.target.value)}
              className="w-full px-4 py-3 bg-nv-black border border-nv-gray-light rounded-lg
                         text-white font-mono focus:outline-none focus:border-nv-accent mb-3"
            />
            <div className="flex flex-wrap gap-2">
              {CRON_PRESETS.map(preset => (
                <button
                  key={preset.value}
                  onClick={() => setCronExpression(preset.value)}
                  className={clsx(
                    'px-3 py-1 rounded text-xs transition-all',
                    cronExpression === preset.value
                      ? 'bg-nv-accent text-nv-black'
                      : 'bg-nv-black-lighter text-gray-400 hover:text-white border border-nv-gray-light'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div className="bg-nv-black-200 rounded-xl p-6 border border-nv-gray-light">
            <label className="block text-sm font-medium mb-2">{t('scheduler.prompt')}</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('scheduler.promptPlaceholder')}
              rows={4}
              className="w-full px-4 py-3 bg-nv-black border border-nv-gray-light rounded-lg
                         text-white placeholder-gray-500 focus:outline-none focus:border-nv-accent resize-none"
            />
          </div>

          {/* Agent */}
          {agents.length > 0 && (
            <div className="bg-nv-black-200 rounded-xl p-6 border border-nv-gray-light">
              <label className="block text-sm font-medium mb-2">{t('scheduler.agent')}</label>
              <select
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="w-full px-4 py-3 bg-nv-black border border-nv-gray-light rounded-lg
                           text-white focus:outline-none focus:border-nv-accent"
              >
                <option value="">{t('scheduler.defaultAgent')}</option>
                {agents.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Approval */}
          <div className="bg-nv-black-200 rounded-xl p-6 border border-nv-gray-light">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={approvalRequired}
                onChange={(e) => setApprovalRequired(e.target.checked)}
                className="accent-nv-accent w-4 h-4"
              />
              <div>
                <span className="text-sm font-medium">{t('scheduler.approvalRequired')}</span>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t('scheduler.approvalHint')}
                </p>
              </div>
            </label>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving || !name.trim() || !prompt.trim()}
            className="w-full px-6 py-4 bg-nv-accent text-nv-black font-semibold rounded-xl
                       hover:bg-opacity-90 disabled:opacity-50 flex items-center justify-center gap-2
                       shadow-nv-glow transition-all"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {t('scheduler.createTask')}
          </button>
        </div>
      </div>
    </div>
  )
}
