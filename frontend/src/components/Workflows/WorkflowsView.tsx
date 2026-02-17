import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import {
  GitBranch,
  Plus,
  Play,
  Trash2,
  Loader2,
  X,
  Save,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'

interface WorkflowStep {
  order: number
  prompt: string
  store_as: string
}

interface Workflow {
  id: string
  name: string
  description: string | null
  trigger_phrase: string | null
  agent_id: string | null
  steps: WorkflowStep[]
  approval_mode: string
  enabled: boolean
  created_at: string
  updated_at: string
}

interface WorkflowRunResult {
  id: string
  status: string
  context: Record<string, string> | null
  error: string | null
  started_at: string
  completed_at: string | null
}

interface AgentOption {
  id: string
  name: string
}

export default function WorkflowsView() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [agents, setAgents] = useState<AgentOption[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [runningId, setRunningId] = useState<string | null>(null)
  const [runResult, setRunResult] = useState<{ id: string; result: WorkflowRunResult } | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const { t } = useTranslation()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [wfData, agData] = await Promise.all([
        api.getWorkflows(),
        api.getAgents()
      ])
      setWorkflows(wfData)
      setAgents(agData.filter((a: { enabled: boolean }) => a.enabled))
    } catch (error) {
      console.error('Failed to load workflows:', error)
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    try {
      await api.deleteWorkflow(id)
      setWorkflows(prev => prev.filter(w => w.id !== id))
    } catch (error) {
      console.error('Failed to delete workflow:', error)
    }
  }

  const handleToggle = async (wf: Workflow) => {
    try {
      await api.updateWorkflow(wf.id, { enabled: !wf.enabled })
      setWorkflows(prev => prev.map(w =>
        w.id === wf.id ? { ...w, enabled: !w.enabled } : w
      ))
    } catch (error) {
      console.error('Failed to toggle workflow:', error)
    }
  }

  const handleRun = async (wf: Workflow) => {
    setRunningId(wf.id)
    setRunResult(null)
    try {
      const result = await api.runWorkflow(wf.id)
      setRunResult({ id: wf.id, result })
    } catch (error) {
      console.error('Failed to run workflow:', error)
    }
    setRunningId(null)
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
      <WorkflowEditor
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
            <GitBranch className="w-8 h-8 text-nv-accent" />
            <h1 className="text-2xl font-bold">{t('workflows.title')}</h1>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="px-4 py-2 bg-nv-accent text-nv-black font-semibold rounded-lg
                       hover:bg-opacity-90 flex items-center gap-2 shadow-nv-glow transition-all"
          >
            <Plus className="w-5 h-5" />
            {t('workflows.new')}
          </button>
        </div>

        {workflows.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>{t('workflows.empty')}</p>
            <p className="text-sm mt-1">{t('workflows.emptyHint')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {workflows.map((wf) => (
              <div
                key={wf.id}
                className={clsx(
                  'bg-nv-black-200 rounded-xl border transition-all',
                  wf.enabled ? 'border-nv-gray-light' : 'border-nv-gray-light/30 opacity-60'
                )}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{wf.name}</h3>
                        <span className="px-2 py-0.5 bg-nv-black-lighter text-xs text-gray-400 rounded">
                          {t('workflows.steps', { count: wf.steps.length })}
                        </span>
                        {wf.trigger_phrase && (
                          <code className="px-2 py-0.5 bg-nv-black-lighter text-xs text-nv-accent rounded font-mono">
                            "{wf.trigger_phrase}"
                          </code>
                        )}
                        <span className="px-2 py-0.5 bg-nv-black-lighter text-xs text-gray-400 rounded">
                          {wf.approval_mode === 'each_step' ? t('workflows.modeEachStep') :
                           wf.approval_mode === 'once_at_start' ? t('workflows.modeOnce') :
                           wf.approval_mode === 'never' ? t('workflows.modeNever') : wf.approval_mode}
                        </span>
                      </div>
                      {wf.description && (
                        <p className="text-sm text-gray-400 mb-2">{wf.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => setExpandedId(expandedId === wf.id ? null : wf.id)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-nv-black-lighter rounded-lg transition-all"
                        title={t('workflows.showSteps')}
                      >
                        {expandedId === wf.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleRun(wf)}
                        disabled={runningId === wf.id}
                        className="p-2 text-gray-400 hover:text-nv-accent hover:bg-nv-black-lighter rounded-lg transition-all"
                        title={t('workflows.runNow')}
                      >
                        {runningId === wf.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleToggle(wf)}
                        className={clsx(
                          'w-12 h-6 rounded-full transition-all relative',
                          wf.enabled ? 'bg-nv-accent' : 'bg-gray-600'
                        )}
                      >
                        <div className={clsx(
                          'w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all',
                          wf.enabled ? 'left-6' : 'left-0.5'
                        )} />
                      </button>
                      <button
                        onClick={() => handleDelete(wf.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-nv-black-lighter rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Run Result */}
                  {runResult && runResult.id === wf.id && (
                    <div className={clsx(
                      'mt-3 p-3 rounded-lg text-sm',
                      runResult.result.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                      runResult.result.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                      'bg-yellow-500/10 text-yellow-400'
                    )}>
                      <div className="flex items-center gap-2 mb-1">
                        {runResult.result.status === 'completed' ? <CheckCircle className="w-4 h-4" /> :
                         runResult.result.status === 'failed' ? <XCircle className="w-4 h-4" /> :
                         <AlertCircle className="w-4 h-4" />}
                        <span className="font-medium">
                          {runResult.result.status === 'completed' ? t('workflows.completed') :
                           runResult.result.status === 'failed' ? t('workflows.failed') : runResult.result.status}
                        </span>
                      </div>
                      {runResult.result.error && <p>{runResult.result.error}</p>}
                      {runResult.result.context && Object.keys(runResult.result.context).length > 0 && (
                        <div className="mt-2 space-y-1">
                          {Object.entries(runResult.result.context).map(([key, val]) => (
                            <div key={key}>
                              <span className="text-gray-400 font-mono text-xs">{key}:</span>
                              <span className="ml-2 text-gray-300">{String(val).slice(0, 200)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Expanded Steps */}
                {expandedId === wf.id && (
                  <div className="border-t border-nv-gray-light/30 px-6 py-4 space-y-2">
                    {wf.steps
                      .sort((a, b) => a.order - b.order)
                      .map((step, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm">
                          <span className="w-6 h-6 bg-nv-accent/20 text-nv-accent rounded-full flex items-center justify-center text-xs font-mono flex-shrink-0 mt-0.5">
                            {step.order}
                          </span>
                          <div className="flex-1">
                            <code className="text-xs text-gray-400 font-mono">{step.store_as}</code>
                            <p className="text-gray-300 mt-0.5">{step.prompt}</p>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function WorkflowEditor({
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
  const [description, setDescription] = useState('')
  const [triggerPhrase, setTriggerPhrase] = useState('')
  const [agentId, setAgentId] = useState('')
  const [approvalMode, setApprovalMode] = useState('each_step')
  const [steps, setSteps] = useState<WorkflowStep[]>([
    { order: 1, prompt: '', store_as: 'step_1' }
  ])
  const [saving, setSaving] = useState(false)

  const APPROVAL_MODES = [
    { value: 'each_step', label: t('workflows.modeEachStep'), description: t('workflows.modeEachStepDesc') },
    { value: 'once_at_start', label: t('workflows.modeOnce'), description: t('workflows.modeOnceDesc') },
    { value: 'never', label: t('workflows.modeNever'), description: t('workflows.modeNeverDesc') },
  ]

  const addStep = () => {
    const nextOrder = steps.length + 1
    setSteps([...steps, { order: nextOrder, prompt: '', store_as: `step_${nextOrder}` }])
  }

  const removeStep = (index: number) => {
    if (steps.length <= 1) return
    const updated = steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 }))
    setSteps(updated)
  }

  const updateStep = (index: number, field: keyof WorkflowStep, value: string | number) => {
    const updated = [...steps]
    updated[index] = { ...updated[index], [field]: value }
    setSteps(updated)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.createWorkflow({
        name,
        description: description || undefined,
        trigger_phrase: triggerPhrase || undefined,
        agent_id: agentId || undefined,
        steps,
        approval_mode: approvalMode,
      })
      onSave()
    } catch (error) {
      console.error('Failed to create workflow:', error)
    }
    setSaving(false)
  }

  return (
    <div className="h-full overflow-auto p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">{t('workflows.editorTitle')}</h1>
          <button onClick={onCancel} className="p-2 text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Name & Description */}
          <div className="bg-nv-black-200 rounded-xl p-6 border border-nv-gray-light">
            <label className="block text-sm font-medium mb-2">{t('workflows.name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('workflows.namePlaceholder')}
              className="w-full px-4 py-3 bg-nv-black border border-nv-gray-light rounded-lg
                         text-white placeholder-gray-500 focus:outline-none focus:border-nv-accent"
            />
            <label className="block text-sm font-medium mb-2 mt-4">{t('workflows.description')}</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('workflows.descriptionPlaceholder')}
              className="w-full px-4 py-3 bg-nv-black border border-nv-gray-light rounded-lg
                         text-white placeholder-gray-500 focus:outline-none focus:border-nv-accent"
            />
          </div>

          {/* Trigger */}
          <div className="bg-nv-black-200 rounded-xl p-6 border border-nv-gray-light">
            <label className="block text-sm font-medium mb-2">{t('workflows.trigger')}</label>
            <input
              type="text"
              value={triggerPhrase}
              onChange={(e) => setTriggerPhrase(e.target.value)}
              placeholder={t('workflows.triggerPlaceholder')}
              className="w-full px-4 py-3 bg-nv-black border border-nv-gray-light rounded-lg
                         text-white placeholder-gray-500 focus:outline-none focus:border-nv-accent font-mono"
            />
          </div>

          {/* Steps */}
          <div className="bg-nv-black-200 rounded-xl p-6 border border-nv-gray-light">
            <label className="block text-sm font-medium mb-4">{t('workflows.stepsLabel')}</label>
            <div className="space-y-4">
              {steps.map((step, i) => (
                <div key={i} className="bg-nv-black rounded-lg p-4 border border-nv-gray-light/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-nv-accent font-mono">Step {step.order}</span>
                    {steps.length > 1 && (
                      <button
                        onClick={() => removeStep(i)}
                        className="text-gray-500 hover:text-red-400 text-xs"
                      >
                        {t('workflows.removeStep')}
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={step.store_as}
                    onChange={(e) => updateStep(i, 'store_as', e.target.value)}
                    placeholder={t('workflows.stepVariable')}
                    className="w-full px-3 py-2 bg-nv-black-lighter border border-nv-gray-light rounded text-sm
                               text-white placeholder-gray-500 focus:outline-none focus:border-nv-accent font-mono mb-2"
                  />
                  <textarea
                    value={step.prompt}
                    onChange={(e) => updateStep(i, 'prompt', e.target.value)}
                    placeholder={t('workflows.stepPromptPlaceholder')}
                    rows={3}
                    className="w-full px-3 py-2 bg-nv-black-lighter border border-nv-gray-light rounded text-sm
                               text-white placeholder-gray-500 focus:outline-none focus:border-nv-accent resize-none"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={addStep}
              className="mt-3 px-3 py-2 text-sm text-gray-400 hover:text-white border border-dashed border-nv-gray-light rounded-lg
                         hover:border-nv-accent transition-all w-full flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('workflows.addStep')}
            </button>
          </div>

          {/* Approval Mode */}
          <div className="bg-nv-black-200 rounded-xl p-6 border border-nv-gray-light">
            <label className="block text-sm font-medium mb-3">{t('workflows.approvalMode')}</label>
            <div className="space-y-2">
              {APPROVAL_MODES.map(mode => (
                <label
                  key={mode.value}
                  className={clsx(
                    'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border',
                    approvalMode === mode.value
                      ? 'bg-nv-accent/10 border-nv-accent/30 text-white'
                      : 'border-transparent hover:bg-nv-black-lighter text-gray-400'
                  )}
                >
                  <input
                    type="radio"
                    name="approval_mode"
                    value={mode.value}
                    checked={approvalMode === mode.value}
                    onChange={(e) => setApprovalMode(e.target.value)}
                    className="accent-nv-accent"
                  />
                  <div>
                    <span className="text-sm font-medium">{mode.label}</span>
                    <p className="text-xs text-gray-500">{mode.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Agent */}
          {agents.length > 0 && (
            <div className="bg-nv-black-200 rounded-xl p-6 border border-nv-gray-light">
              <label className="block text-sm font-medium mb-2">{t('workflows.agent')}</label>
              <select
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="w-full px-4 py-3 bg-nv-black border border-nv-gray-light rounded-lg
                           text-white focus:outline-none focus:border-nv-accent"
              >
                <option value="">{t('workflows.defaultAgent')}</option>
                {agents.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving || !name.trim() || steps.some(s => !s.prompt.trim())}
            className="w-full px-6 py-4 bg-nv-accent text-nv-black font-semibold rounded-xl
                       hover:bg-opacity-90 disabled:opacity-50 flex items-center justify-center gap-2
                       shadow-nv-glow transition-all"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {t('workflows.createWorkflow')}
          </button>
        </div>
      </div>
    </div>
  )
}
