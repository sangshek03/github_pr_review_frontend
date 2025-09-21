import { io, Socket } from 'socket.io-client'

export interface Message {
    id: string
    content: string
    sender: 'user' | 'assistant'
    timestamp: Date
    metadata?: {
        confidence_score?: number
        response_time?: number
        [key: string]: any
    }
}

export interface ChatEvents {
    onMessage: (message: Message) => void
    onTyping: (isTyping: boolean) => void
    onConnect: () => void
    onDisconnect: () => void
    onError: (error: string) => void
}
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8000';

export class ChatService {
    private socket: Socket | null = null
    private token: string
    private currentSessionId: string | null = null
    private typingTimeout: NodeJS.Timeout | null = null
    private baseUrl: string
    private wsUrl: string

    constructor(token: string, baseUrl: string = API_BASE_URL || 'localhost:8000') {
        this.token = token
        this.baseUrl = baseUrl
        this.wsUrl = WS_BASE_URL
    }

    connect(events: ChatEvents): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                this.socket = io(`${this.wsUrl}/chat`, {
                    auth: {
                        token: this.token,
                    },
                    transports: ['websocket'],
                })

                this.socket.on('connect', () => {
                    events.onConnect()
                    resolve(true)
                })

                this.socket.on('disconnect', (reason) => {
                    events.onDisconnect()
                })

                this.socket.on('connect_error', (error) => {
                    console.error('Socket connection error:', error)
                    events.onError(error.message || 'Connection failed')
                    reject(error)
                })

                this.socket.on('error', (error) => {
                    console.error('Socket error:', error)
                    events.onError(error.message || 'Socket error')
                })

                this.socket.on('session_joined', (data) => {
                })

                this.socket.on('message:new', (data) => {
                    const message: Message = {
                        id: data.message.message_id,
                        content: data.message.content,
                        sender:
                            data.message.sender_type === 'user'
                                ? 'user'
                                : 'assistant',
                        timestamp: new Date(data.message.created_at),
                        metadata: data.response_metadata,
                    }
                    events.onMessage(message)
                })

                this.socket.on('message:typing', (data) => {
                    events.onTyping(data.is_typing)
                })

                this.socket.on('session_users', (data) => {
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    joinSession(sessionId: string): void {
        if (!this.socket?.connected) {
            throw new Error('Socket not connected')
        }

        this.currentSessionId = sessionId
        this.socket.emit('join_session', { session_id: sessionId })
    }

    sendMessage(message: string): void {
        if (!this.socket?.connected) {
            throw new Error('Socket not connected')
        }

        if (!this.currentSessionId) {
            throw new Error('No active session')
        }

        this.socket.emit('message:send', {
            session_id: this.currentSessionId,
            message: message,
        })
    }

    startTyping(): void {
        if (this.socket?.connected && this.currentSessionId) {
            this.socket.emit('typing:start', {
                session_id: this.currentSessionId,
            })

            // Auto-stop typing after 3 seconds
            if (this.typingTimeout) {
                clearTimeout(this.typingTimeout)
            }
            this.typingTimeout = setTimeout(() => {
                this.stopTyping()
            }, 3000)
        }
    }

    stopTyping(): void {
        if (this.socket?.connected && this.currentSessionId) {
            this.socket.emit('typing:stop', {
                session_id: this.currentSessionId,
            })

            if (this.typingTimeout) {
                clearTimeout(this.typingTimeout)
                this.typingTimeout = null
            }
        }
    }

    disconnect(): void {
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout)
        }

        if (this.socket) {
            this.socket.disconnect()
            this.socket = null
        }
    }

    isConnected(): boolean {
        return this.socket?.connected || false
    }

    getCurrentSessionId(): string | null {
        return this.currentSessionId
    }
}
