import { useRef, useEffect, useState } from 'react'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import ToolApprovalModal from '../Tools/ToolApprovalModal'
import { useChat } from '../../hooks/useChat'
import { api } from '../../services/api'
import { Bot, ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'

interface AgentOption {
  id: string
  name: string
  description: string
  is_default: boolean
}

interface ChatContainerProps {
  agentId?: string | null
  onAgentChange?: (id: string | null) => void
}

export default function ChatContainer({
  agentId,
  onAgentChange,
}: ChatContainerProps) {
  const {
    messages,
    isLoading,
    pendingApproval,
    currentSessionId,
    sendMessage,
    approveToolCall,
    rejectToolCall,
  } = useChat()

  const [agents, setAgents] = useState<AgentOption[]>([])
  const [showAgentDropdown, setShowAgentDropdown] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    api.getAgents().then(data => {
      setAgents(data.filter(a => a.enabled))
      // Select default agent if none selected
      if (!agentId) {
        const defaultAgent = data.find(a => a.is_default && a.enabled)
        if (defaultAgent) onAgentChange?.(defaultAgent.id)
      }
    }).catch(() => {})
  }, [])

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const selectedAgent = agents.find(a => a.id === agentId)

  return (
    <div className="h-full flex flex-col bg-nv-black-100">
      {/* Agent Switcher Header */}
      {agents.length > 1 && (
        <div className="px-6 py-3 border-b border-nv-gray-light bg-nv-black flex items-center">
          <div className="relative">
            <button
              onClick={() => setShowAgentDropdown(!showAgentDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-nv-black-lighter
                         border border-nv-gray-light hover:border-nv-accent transition-all text-sm"
            >
              <Bot className="w-4 h-4 text-nv-accent" />
              <span>{selectedAgent?.name || 'Agent'}</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
            {showAgentDropdown && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-nv-black-200 border border-nv-gray-light
                              rounded-lg shadow-xl z-50 overflow-hidden">
                {agents.map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => {
                      onAgentChange?.(agent.id)
                      setShowAgentDropdown(false)
                    }}
                    className={clsx(
                      'w-full px-4 py-3 text-left hover:bg-nv-black-lighter transition-all',
                      agent.id === agentId && 'bg-nv-accent/10 border-l-2 border-nv-accent'
                    )}
                  >
                    <div className="text-sm font-medium">{agent.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{agent.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 mb-6 bg-nv-black-lighter rounded-2xl flex items-center justify-center">
              <svg
                className="w-12 h-12 text-nv-accent"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">{t('chat.welcome')}</h2>
            <p className="text-gray-500 max-w-md">
              {t('chat.welcomeSub')}
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4 max-w-lg">
              <ExamplePrompt text={t('chat.example1')} onClick={sendMessage} />
              <ExamplePrompt text={t('chat.example2')} onClick={sendMessage} />
              <ExamplePrompt text={t('chat.example3')} onClick={sendMessage} />
              <ExamplePrompt text={t('chat.example4')} onClick={sendMessage} />
            </div>
          </div>
        ) : (
          <MessageList messages={messages} />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-nv-gray-light p-4 bg-nv-black">
        <MessageInput
          onSend={sendMessage}
          disabled={isLoading || pendingApproval !== null}
          conversationId={currentSessionId}
        />
      </div>

      {/* Tool Approval Modal */}
      {pendingApproval && (
        <ToolApprovalModal
          request={pendingApproval}
          onApprove={approveToolCall}
          onReject={rejectToolCall}
        />
      )}
    </div>
  )
}

function ExamplePrompt({ text, onClick }: { text: string; onClick: (text: string) => void }) {
  return (
    <button
      onClick={() => onClick(text)}
      className="p-4 bg-nv-black-lighter border border-nv-gray-light rounded-lg text-left
                 text-sm text-gray-400 hover:border-nv-accent hover:text-white transition-all"
    >
      {text}
    </button>
  )
}
