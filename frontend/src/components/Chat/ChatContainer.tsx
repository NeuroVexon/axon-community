import { useRef, useEffect } from 'react'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import ToolApprovalModal from '../Tools/ToolApprovalModal'
import { useChat } from '../../hooks/useChat'

interface ChatContainerProps {
  sessionId: string | null
  onSessionChange: (id: string) => void
  loadConversationId?: string | null
}

export default function ChatContainer({ sessionId, onSessionChange, loadConversationId }: ChatContainerProps) {
  const {
    messages,
    isLoading,
    pendingApproval,
    sendMessage,
    approveToolCall,
    rejectToolCall,
    loadConversation,
  } = useChat(sessionId, onSessionChange)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load conversation from sidebar click
  useEffect(() => {
    if (loadConversationId) {
      loadConversation(loadConversationId)
    }
  }, [loadConversationId, loadConversation])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="h-full flex flex-col bg-nv-black-100">
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
            <h2 className="text-2xl font-display font-bold mb-2">Willkommen bei Axon</h2>
            <p className="text-gray-500 max-w-md">
              Dein KI-Assistent mit voller Kontrolle. Jede Aktion wird dir zur Bestätigung vorgelegt.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4 max-w-lg">
              <ExamplePrompt text="Lies die Datei config.json" onClick={sendMessage} />
              <ExamplePrompt text="Suche im Web nach Python Tutorials" onClick={sendMessage} />
              <ExamplePrompt text="Liste alle Dateien im aktuellen Ordner" onClick={sendMessage} />
              <ExamplePrompt text="Führe den Befehl 'ls -la' aus" onClick={sendMessage} />
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
