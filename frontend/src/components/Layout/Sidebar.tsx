import { useState, useEffect } from 'react'
import {
  MessageSquare,
  ClipboardList,
  Settings,
  Plus,
  Bird,
  Brain,
  Puzzle,
  Bot,
  Clock,
  GitBranch,
  BarChart3,
  Trash2
} from 'lucide-react'
import clsx from 'clsx'
import { api } from '../../services/api'
import { useTranslation } from 'react-i18next'

interface Conversation {
  id: string
  title: string | null
  created_at: string
  updated_at: string
}

interface SidebarProps {
  currentView: 'dashboard' | 'chat' | 'audit' | 'memory' | 'skills' | 'agents' | 'scheduler' | 'workflows' | 'settings'
  onViewChange: (view: 'dashboard' | 'chat' | 'audit' | 'memory' | 'skills' | 'agents' | 'scheduler' | 'workflows' | 'settings') => void
  currentSession: string | null
  onNewChat: () => void
  onSelectConversation?: (id: string) => void
}

export default function Sidebar({
  currentView,
  onViewChange,
  currentSession,
  onNewChat,
  onSelectConversation
}: SidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const { t } = useTranslation()

  const navItems = [
    { id: 'dashboard' as const, label: t('sidebar.dashboard'), icon: BarChart3 },
    { id: 'chat' as const, label: t('sidebar.chat'), icon: MessageSquare },
    { id: 'memory' as const, label: t('sidebar.memory'), icon: Brain },
    { id: 'agents' as const, label: t('sidebar.agents'), icon: Bot },
    { id: 'scheduler' as const, label: t('sidebar.scheduler'), icon: Clock },
    { id: 'workflows' as const, label: t('sidebar.workflows'), icon: GitBranch },
    { id: 'skills' as const, label: t('sidebar.skills'), icon: Puzzle },
    { id: 'audit' as const, label: t('sidebar.audit'), icon: ClipboardList },
    { id: 'settings' as const, label: t('sidebar.settings'), icon: Settings },
  ]

  useEffect(() => {
    loadConversations()
  }, [currentSession])

  const loadConversations = async () => {
    try {
      const data = await api.getConversations(20)
      setConversations(data)
    } catch {
      // Silently fail - sidebar still works
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    try {
      await api.deleteConversation(id)
      setConversations(prev => prev.filter(c => c.id !== id))
      if (currentSession === id) {
        onNewChat()
      }
    } catch {
      // Silently fail
    }
  }

  const handleSelect = (id: string) => {
    onViewChange('chat')
    onSelectConversation?.(id)
  }

  return (
    <aside className="w-64 bg-nv-black border-r border-nv-gray-light h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-nv-gray-light">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-nv-black-lighter rounded-lg flex items-center justify-center">
            <Bird className="w-6 h-6 text-nv-accent" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold tracking-wider">AXON</h1>
            <p className="text-xs text-gray-500 font-mono">by NeuroVexon</p>
          </div>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <button
          onClick={() => { onNewChat(); onViewChange('chat') }}
          className="w-full px-4 py-3 bg-nv-accent text-nv-black font-semibold rounded-lg
                     hover:bg-opacity-90 shadow-nv-glow transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t('sidebar.newChat')}
        </button>
      </div>

      {/* Navigation */}
      <nav className="px-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentView === item.id

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={clsx(
                'w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-all',
                isActive
                  ? 'bg-nv-accent text-nv-black font-semibold shadow-nv-glow'
                  : 'text-gray-400 hover:text-white hover:bg-nv-black-lighter'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Conversation History */}
      {conversations.length > 0 && (
        <div className="flex-1 overflow-y-auto px-4 mt-4 border-t border-nv-gray-light pt-4">
          <p className="text-xs text-gray-600 uppercase tracking-wider mb-2 px-2">
            {t('sidebar.history')}
          </p>
          <div className="space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleSelect(conv.id)}
                className={clsx(
                  'w-full px-3 py-2 rounded-lg text-left text-sm transition-all group flex items-center justify-between',
                  currentSession === conv.id
                    ? 'bg-nv-accent/10 text-nv-accent border border-nv-accent/30'
                    : 'text-gray-400 hover:text-white hover:bg-nv-black-lighter'
                )}
              >
                <span className="truncate flex-1">
                  {conv.title || t('sidebar.untitled')}
                </span>
                <button
                  onClick={(e) => handleDelete(e, conv.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-nv-gray-light">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-2 h-2 bg-nv-success rounded-full animate-pulse" />
          <span>Axon v2.0.0</span>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          {t('sidebar.tagline')}
        </p>
      </div>
    </aside>
  )
}
