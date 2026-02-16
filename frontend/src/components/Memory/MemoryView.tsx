import { useState, useEffect } from 'react'
import { Brain, Plus, Search, Trash2, Tag, Edit3, Save, X, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import { api } from '../../services/api'

interface MemoryEntry {
  id: string
  key: string
  content: string
  source: string
  category: string | null
  created_at: string
  updated_at: string
}

export default function MemoryView() {
  const [memories, setMemories] = useState<MemoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form state
  const [formKey, setFormKey] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formCategory, setFormCategory] = useState('')

  useEffect(() => {
    loadMemories()
  }, [])

  const loadMemories = async (search?: string) => {
    setLoading(true)
    try {
      const data = await api.getMemories({ search, limit: 100 })
      setMemories(data)
    } catch (error) {
      console.error('Failed to load memories:', error)
    }
    setLoading(false)
  }

  const handleSearch = () => {
    loadMemories(searchQuery || undefined)
  }

  const handleCreate = async () => {
    if (!formKey.trim() || !formContent.trim()) return

    try {
      await api.createMemory({
        key: formKey.trim(),
        content: formContent.trim(),
        category: formCategory.trim() || undefined,
      })
      setShowForm(false)
      setFormKey('')
      setFormContent('')
      setFormCategory('')
      loadMemories()
    } catch (error) {
      console.error('Failed to create memory:', error)
    }
  }

  const handleUpdate = async (id: string) => {
    try {
      await api.updateMemory(id, {
        content: formContent.trim(),
        category: formCategory.trim() || undefined,
      })
      setEditingId(null)
      setFormContent('')
      setFormCategory('')
      loadMemories()
    } catch (error) {
      console.error('Failed to update memory:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.deleteMemory(id)
      setMemories(prev => prev.filter(m => m.id !== id))
    } catch (error) {
      console.error('Failed to delete memory:', error)
    }
  }

  const startEdit = (mem: MemoryEntry) => {
    setEditingId(mem.id)
    setFormContent(mem.content)
    setFormCategory(mem.category || '')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormContent('')
    setFormCategory('')
  }

  // Unique categories
  const categories = [...new Set(memories.map(m => m.category).filter(Boolean))] as string[]

  return (
    <div className="h-full overflow-auto p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-nv-accent" />
            <div>
              <h1 className="text-2xl font-bold">Gedächtnis</h1>
              <p className="text-sm text-gray-500">
                Persistente Fakten, die Axon sich merkt
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{memories.length} Einträge</span>
          </div>
        </div>

        {/* Search + Add */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Gedächtnis durchsuchen..."
              className="w-full pl-10 pr-4 py-3 bg-nv-black-lighter border border-nv-gray-light rounded-lg
                         text-white placeholder-gray-500 focus:outline-none focus:border-nv-accent"
            />
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-3 bg-nv-accent text-nv-black font-semibold rounded-lg
                       hover:bg-opacity-90 flex items-center gap-2 shadow-nv-glow transition-all"
          >
            <Plus className="w-5 h-5" />
            Neu
          </button>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={() => { setSearchQuery(''); loadMemories() }}
              className="px-3 py-1 text-xs rounded-full bg-nv-black-lighter border border-nv-gray-light
                         text-gray-400 hover:text-white transition-all"
            >
              Alle
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => { setSearchQuery(cat); loadMemories(cat) }}
                className="px-3 py-1 text-xs rounded-full bg-nv-accent/10 border border-nv-accent/30
                           text-nv-accent hover:bg-nv-accent/20 transition-all flex items-center gap-1"
              >
                <Tag className="w-3 h-3" />
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <div className="mb-6 bg-nv-black-200 rounded-xl p-6 border border-nv-accent/30">
            <h3 className="text-sm font-semibold text-nv-accent mb-4">Neue Erinnerung</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={formKey}
                onChange={(e) => setFormKey(e.target.value)}
                placeholder="Schlüssel (z.B. 'Lieblingssprache')"
                className="w-full px-4 py-2 bg-nv-black border border-nv-gray-light rounded-lg
                           text-white placeholder-gray-500 focus:outline-none focus:border-nv-accent"
              />
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="Inhalt (z.B. 'Der Benutzer programmiert am liebsten in Python')"
                rows={3}
                className="w-full px-4 py-2 bg-nv-black border border-nv-gray-light rounded-lg
                           text-white placeholder-gray-500 focus:outline-none focus:border-nv-accent resize-none"
              />
              <input
                type="text"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder="Kategorie (optional, z.B. 'Präferenz')"
                className="w-full px-4 py-2 bg-nv-black border border-nv-gray-light rounded-lg
                           text-white placeholder-gray-500 focus:outline-none focus:border-nv-accent"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-all"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!formKey.trim() || !formContent.trim()}
                  className="px-4 py-2 bg-nv-accent text-nv-black font-semibold rounded-lg
                             hover:bg-opacity-90 disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Speichern
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-nv-accent" />
          </div>
        )}

        {/* Memory List */}
        {!loading && memories.length === 0 && (
          <div className="text-center py-12">
            <Brain className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">Noch keine Erinnerungen gespeichert.</p>
            <p className="text-sm text-gray-600 mt-1">
              Sage Axon etwas wie "Merk dir, dass ich Python bevorzuge" oder füge hier manuell Einträge hinzu.
            </p>
          </div>
        )}

        {!loading && memories.length > 0 && (
          <div className="space-y-3">
            {memories.map(mem => (
              <div
                key={mem.id}
                className="bg-nv-black-200 rounded-xl p-5 border border-nv-gray-light
                           hover:border-nv-accent/30 transition-all group"
              >
                {editingId === mem.id ? (
                  /* Edit Mode */
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-nv-accent">{mem.key}</p>
                    <textarea
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-nv-black border border-nv-gray-light rounded-lg
                                 text-white focus:outline-none focus:border-nv-accent resize-none"
                    />
                    <input
                      type="text"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      placeholder="Kategorie"
                      className="w-full px-3 py-2 bg-nv-black border border-nv-gray-light rounded-lg
                                 text-white placeholder-gray-500 focus:outline-none focus:border-nv-accent"
                    />
                    <div className="flex gap-2 justify-end">
                      <button onClick={cancelEdit} className="px-3 py-1 text-gray-400 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleUpdate(mem.id)}
                        className="px-3 py-1 bg-nv-accent text-nv-black rounded-lg font-semibold text-sm flex items-center gap-1"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Speichern
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Display Mode */
                  <>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white">{mem.key}</h3>
                          {mem.category && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-nv-accent/10 text-nv-accent border border-nv-accent/30">
                              {mem.category}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm">{mem.content}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                          <span>Quelle: {mem.source === 'agent' ? 'KI' : mem.source === 'user' ? 'Benutzer' : 'System'}</span>
                          <span>{new Date(mem.updated_at).toLocaleDateString('de-DE')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => startEdit(mem)}
                          className="p-1.5 text-gray-500 hover:text-nv-accent transition-all"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(mem.id)}
                          className="p-1.5 text-gray-500 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
