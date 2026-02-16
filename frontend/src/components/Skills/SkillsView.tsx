import { useState, useEffect } from 'react'
import { Puzzle, Shield, ShieldCheck, ShieldX, ToggleLeft, ToggleRight, RefreshCw, Trash2, Loader2, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'
import { api } from '../../services/api'

interface SkillEntry {
  id: string
  name: string
  display_name: string
  description: string
  version: string
  author: string | null
  enabled: boolean
  approved: boolean
  risk_level: string
  created_at: string
  updated_at: string
}

export default function SkillsView() {
  const [skills, setSkills] = useState<SkillEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    loadSkills()
  }, [])

  const loadSkills = async () => {
    setLoading(true)
    try {
      const data = await api.getSkills()
      setSkills(data)
    } catch (error) {
      console.error('Failed to load skills:', error)
    }
    setLoading(false)
  }

  const handleScan = async () => {
    setScanning(true)
    try {
      await api.scanSkills()
      await loadSkills()
    } catch (error) {
      console.error('Failed to scan skills:', error)
    }
    setScanning(false)
  }

  const handleApprove = async (id: string, approved: boolean) => {
    try {
      await api.approveSkill(id, approved)
      await loadSkills()
    } catch (error) {
      console.error('Failed to approve skill:', error)
    }
  }

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await api.toggleSkill(id, enabled)
      await loadSkills()
    } catch (error) {
      console.error('Failed to toggle skill:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.deleteSkill(id)
      setSkills(prev => prev.filter(s => s.id !== id))
    } catch (error) {
      console.error('Failed to delete skill:', error)
    }
  }

  const riskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-400 bg-green-400/10 border-green-400/30'
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
      case 'high': return 'text-red-400 bg-red-400/10 border-red-400/30'
      case 'critical': return 'text-red-600 bg-red-600/10 border-red-600/30'
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30'
    }
  }

  const riskLabel = (level: string) => {
    switch (level) {
      case 'low': return 'Niedrig'
      case 'medium': return 'Mittel'
      case 'high': return 'Hoch'
      case 'critical': return 'Kritisch'
      default: return level
    }
  }

  return (
    <div className="h-full overflow-auto p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Puzzle className="w-8 h-8 text-nv-accent" />
            <div>
              <h1 className="text-2xl font-bold">Skills</h1>
              <p className="text-sm text-gray-500">
                Erweiterbare Fähigkeiten mit Sicherheitsprüfung
              </p>
            </div>
          </div>
          <button
            onClick={handleScan}
            disabled={scanning}
            className="px-4 py-2 bg-nv-black-lighter border border-nv-gray-light rounded-lg
                       text-gray-400 hover:text-white hover:border-nv-accent transition-all
                       flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={clsx('w-4 h-4', scanning && 'animate-spin')} />
            Scannen
          </button>
        </div>

        {/* Info Box */}
        <div className="mb-6 bg-nv-accent/5 rounded-xl p-4 border border-nv-accent/20">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-nv-accent mt-0.5" />
            <div className="text-sm text-gray-400">
              <p className="font-semibold text-white mb-1">Sicherheits-Gate</p>
              <p>
                Skills müssen explizit genehmigt werden, bevor sie ausgeführt werden können.
                Bei jeder Dateiänderung wird die Genehmigung automatisch widerrufen.
              </p>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-nv-accent" />
          </div>
        )}

        {/* Empty State */}
        {!loading && skills.length === 0 && (
          <div className="text-center py-12">
            <Puzzle className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">Keine Skills gefunden.</p>
            <p className="text-sm text-gray-600 mt-1">
              Lege .py Dateien in <code className="text-nv-accent">backend/skills/</code> ab und klicke "Scannen".
            </p>
          </div>
        )}

        {/* Skills List */}
        {!loading && skills.length > 0 && (
          <div className="space-y-4">
            {skills.map(skill => (
              <div
                key={skill.id}
                className={clsx(
                  'rounded-xl p-5 border transition-all',
                  skill.approved && skill.enabled
                    ? 'bg-nv-black-200 border-nv-accent/30'
                    : 'bg-nv-black-200 border-nv-gray-light'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-white text-lg">{skill.display_name}</h3>
                      <span className="text-xs font-mono text-gray-500">v{skill.version}</span>
                      <span className={clsx(
                        'px-2 py-0.5 text-xs rounded-full border',
                        riskColor(skill.risk_level)
                      )}>
                        {riskLabel(skill.risk_level)}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-3">{skill.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      {skill.author && <span>Autor: {skill.author}</span>}
                      <span>Name: <code className="text-gray-400">{skill.name}</code></span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    {/* Approval Status */}
                    {skill.approved ? (
                      <button
                        onClick={() => handleApprove(skill.id, false)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-400
                                   border border-green-500/30 rounded-lg text-sm hover:bg-green-500/20 transition-all"
                        title="Genehmigung widerrufen"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Genehmigt
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApprove(skill.id, true)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500/10 text-yellow-400
                                   border border-yellow-500/30 rounded-lg text-sm hover:bg-yellow-500/20 transition-all"
                        title="Skill genehmigen"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Genehmigen
                      </button>
                    )}

                    {/* Toggle */}
                    {skill.approved && (
                      <button
                        onClick={() => handleToggle(skill.id, !skill.enabled)}
                        className={clsx(
                          'p-1.5 rounded-lg transition-all',
                          skill.enabled
                            ? 'text-nv-accent hover:text-nv-accent/80'
                            : 'text-gray-500 hover:text-white'
                        )}
                        title={skill.enabled ? 'Deaktivieren' : 'Aktivieren'}
                      >
                        {skill.enabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(skill.id)}
                      className="p-1.5 text-gray-500 hover:text-red-400 transition-all"
                      title="Skill entfernen"
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
