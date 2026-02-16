/**
 * Axon by NeuroVexon - API Service
 */

const API_BASE = '/api/v1'

interface ChatResponse {
  session_id: string
  message: string
  tool_calls?: Array<{
    id: string
    name: string
    parameters: Record<string, unknown>
  }>
}

interface Conversation {
  id: string
  title: string | null
  created_at: string
  updated_at: string
}

interface AuditEntry {
  id: string
  session_id: string
  timestamp: string
  event_type: string
  tool_name: string | null
  tool_params: Record<string, unknown> | null
  result: string | null
  error: string | null
  user_decision: string | null
  execution_time_ms: number | null
}

interface Settings {
  app_name: string
  app_version: string
  llm_provider: string
  theme: string
  system_prompt?: string
  available_providers: string[]
}

export const api = {
  // Chat
  async sendMessage(message: string, sessionId?: string): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE}/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        session_id: sessionId,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  },

  async streamMessage(
    message: string,
    onChunk: (chunk: { type: string; content?: string }) => void,
    sessionId?: string
  ): Promise<void> {
    const response = await fetch(`${API_BASE}/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        session_id: sessionId,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) return

    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const text = decoder.decode(value)
      const lines = text.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))
            onChunk(data)
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
  },

  /**
   * Stream a message through the Agent Orchestrator.
   * Handles tool approval via SSE events.
   */
  async streamAgentMessage(
    message: string,
    onEvent: (event: {
      type: string
      content?: string
      tool?: string
      params?: Record<string, unknown>
      description?: string
      risk_level?: string
      approval_id?: string
      result?: unknown
      execution_time_ms?: number
      session_id?: string
      message?: string
      error?: string
    }) => void,
    sessionId?: string,
    systemPrompt?: string
  ): Promise<void> {
    const response = await fetch(`${API_BASE}/chat/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        session_id: sessionId,
        system_prompt: systemPrompt,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) return

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))
            onEvent(data)
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
  },

  /**
   * Approve or reject a pending tool request from the agent stream.
   */
  async approveAgentTool(
    approvalId: string,
    decision: 'once' | 'session' | 'never'
  ): Promise<void> {
    const response = await fetch(
      `${API_BASE}/chat/approve/${approvalId}?decision=${decision}`,
      { method: 'POST' }
    )
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
  },

  // Tool Approval
  async approveTool(
    sessionId: string,
    tool: string,
    params: Record<string, unknown>,
    decision: 'once' | 'session' | 'never'
  ): Promise<void> {
    const response = await fetch(`${API_BASE}/tools/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        tool,
        params,
        decision,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
  },

  // Conversations
  async getConversations(limit = 50): Promise<Conversation[]> {
    const response = await fetch(`${API_BASE}/chat/conversations?limit=${limit}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  },

  async getConversation(id: string): Promise<Conversation & { messages: unknown[] }> {
    const response = await fetch(`${API_BASE}/chat/conversations/${id}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  },

  async deleteConversation(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/chat/conversations/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
  },

  // Audit
  async getAuditLogs(options?: {
    sessionId?: string
    eventType?: string
    limit?: number
  }): Promise<AuditEntry[]> {
    const params = new URLSearchParams()
    if (options?.sessionId) params.set('session_id', options.sessionId)
    if (options?.eventType) params.set('event_type', options.eventType)
    if (options?.limit) params.set('limit', options.limit.toString())

    const response = await fetch(`${API_BASE}/audit?${params}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  },

  async getAuditStats(sessionId?: string): Promise<{
    total: number
    by_event_type: Record<string, number>
    by_tool: Record<string, number>
    avg_execution_time_ms: number | null
  }> {
    const params = sessionId ? `?session_id=${sessionId}` : ''
    const response = await fetch(`${API_BASE}/audit/stats${params}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  },

  // Settings
  async getSettings(): Promise<Settings> {
    const response = await fetch(`${API_BASE}/settings`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  },

  async updateSettings(settings: Partial<Settings>): Promise<void> {
    const response = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
  },

  // Skills
  async getSkills(): Promise<Array<{
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
  }>> {
    const response = await fetch(`${API_BASE}/skills`)
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return response.json()
  },

  async approveSkill(id: string, approved: boolean): Promise<void> {
    const response = await fetch(`${API_BASE}/skills/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved }),
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  },

  async toggleSkill(id: string, enabled: boolean): Promise<void> {
    const response = await fetch(`${API_BASE}/skills/${id}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  },

  async deleteSkill(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/skills/${id}`, { method: 'DELETE' })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  },

  async scanSkills(): Promise<{ found: number }> {
    const response = await fetch(`${API_BASE}/skills/scan`, { method: 'POST' })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return response.json()
  },

  // Memory
  async getMemories(options?: {
    category?: string
    search?: string
    limit?: number
  }): Promise<Array<{
    id: string
    key: string
    content: string
    source: string
    category: string | null
    created_at: string
    updated_at: string
  }>> {
    const params = new URLSearchParams()
    if (options?.category) params.set('category', options.category)
    if (options?.search) params.set('search', options.search)
    if (options?.limit) params.set('limit', options.limit.toString())
    const response = await fetch(`${API_BASE}/memory?${params}`)
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return response.json()
  },

  async createMemory(data: {
    key: string
    content: string
    source?: string
    category?: string
  }): Promise<{ id: string; key: string; content: string }> {
    const response = await fetch(`${API_BASE}/memory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return response.json()
  },

  async updateMemory(id: string, data: {
    content?: string
    category?: string
  }): Promise<void> {
    const response = await fetch(`${API_BASE}/memory/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  },

  async deleteMemory(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/memory/${id}`, { method: 'DELETE' })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  },

  async clearMemories(): Promise<void> {
    const response = await fetch(`${API_BASE}/memory`, { method: 'DELETE' })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  },

  // Health
  async healthCheck(): Promise<{
    status: string
    providers: Record<string, boolean>
  }> {
    const response = await fetch(`${API_BASE}/settings/health`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  },
}
