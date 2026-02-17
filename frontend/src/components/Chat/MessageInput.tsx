import React, { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Paperclip, X, FileText, Image } from 'lucide-react'
import { api } from '../../services/api'
import { useTranslation } from 'react-i18next'

interface UploadedFile {
  id: string
  filename: string
  mime_type: string
  file_size: number
}

interface MessageInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  conversationId?: string | null
}

const ALLOWED_EXTENSIONS = [
  '.pdf', '.txt', '.md', '.csv', '.json',
  '.py', '.js', '.ts', '.html', '.xml', '.yaml', '.yml',
  '.png', '.jpg', '.jpeg'
]

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function MessageInput({ onSend, disabled, conversationId }: MessageInputProps) {
  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation()

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  const handleSubmit = () => {
    if ((input.trim() || attachments.length > 0) && !disabled) {
      onSend(input.trim())
      setInput('')
      setAttachments([])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (attachments.length + files.length > 5) {
      alert(t('input.maxFiles'))
      return
    }

    setUploading(true)
    for (const file of Array.from(files)) {
      try {
        const result = await api.uploadDocument(file, conversationId || undefined)
        setAttachments(prev => [...prev, {
          id: result.id,
          filename: result.filename,
          mime_type: result.mime_type || '',
          file_size: result.file_size,
        }])
      } catch (error) {
        console.error('Upload failed:', error)
      }
    }
    setUploading(false)
  }

  const removeAttachment = async (id: string) => {
    try {
      await api.deleteDocument(id)
    } catch {
      // Ignore delete errors
    }
    setAttachments(prev => prev.filter(a => a.id !== id))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const isImage = (mime: string) => mime.startsWith('image/')

  return (
    <div
      className="max-w-4xl mx-auto"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-nv-black-lighter border border-nv-gray-light rounded-lg text-sm"
            >
              {isImage(att.mime_type) ? (
                <Image className="w-4 h-4 text-blue-400" />
              ) : (
                <FileText className="w-4 h-4 text-nv-accent" />
              )}
              <span className="text-gray-300 max-w-[150px] truncate">{att.filename}</span>
              <span className="text-gray-500 text-xs">{formatFileSize(att.file_size)}</span>
              <button
                onClick={() => removeAttachment(att.id)}
                className="text-gray-500 hover:text-red-400 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={`flex items-end gap-3 bg-nv-black-lighter border rounded-xl p-3 transition-colors ${
        dragOver ? 'border-nv-accent bg-nv-accent/5' : 'border-nv-gray-light'
      }`}>
        {/* File Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading || attachments.length >= 5}
          className="p-2 text-gray-400 hover:text-nv-accent transition-colors disabled:opacity-50"
          title={t('input.uploadTooltip')}
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Paperclip className="w-5 h-5" />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_EXTENSIONS.join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={dragOver ? t('input.dragDrop') : t('input.placeholder')}
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none
                     focus:outline-none disabled:opacity-50 min-h-[24px] max-h-[200px]"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || (!input.trim() && attachments.length === 0)}
          className="p-2 bg-nv-accent text-nv-black rounded-lg hover:bg-opacity-90
                     disabled:opacity-50 disabled:cursor-not-allowed transition-all
                     shadow-nv-glow"
        >
          {disabled ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
      <p className="text-xs text-gray-600 mt-2 text-center">
        {t('input.disclaimer')}
      </p>
    </div>
  )
}
