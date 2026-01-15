import { useEffect, useRef, useState, useCallback } from 'react'
import {
    type ClientMessage,
    type ServerMessage,
    parseServerMessage,
    serializeMessage,
    createJoinMessage,
    createPingMessage,
} from '@/lib/websocket/messages'

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error'

interface UseWebSocketOptions {
    roomId: string
    playerId: string | null
    onMessage?: (message: ServerMessage) => void
    onPlayerJoined?: (message: ServerMessage & { type: 'playerJoined' }) => void
    onPlayerLeft?: (message: ServerMessage & { type: 'playerLeft' }) => void
    onError?: (error: string) => void
    autoReconnect?: boolean
    reconnectInterval?: number
}

interface UseWebSocketReturn {
    connectionState: ConnectionState
    sendMessage: (message: ClientMessage) => void
    sendJoin: () => void
    sendPing: () => void
    sendReady: () => void
    sendAnswer: (round: number, count: number) => void
    reconnect: () => void
    disconnect: () => void
}

export function useWebSocket({
    roomId,
    playerId,
    onMessage,
    onPlayerJoined,
    onPlayerLeft,
    onError,
    autoReconnect = true,
    reconnectInterval = 3000,
}: UseWebSocketOptions): UseWebSocketReturn {
    const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
    const wsRef = useRef<WebSocket | null>(null)
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const isConnectingRef = useRef(false)

    // Get WebSocket URL
    const getWebSocketUrl = useCallback(() => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const host = window.location.host
        return `${protocol}//${host}/api/game/ws/${roomId}`
    }, [roomId])

    // Send message helper
    const sendMessage = useCallback(
        (message: ClientMessage) => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                try {
                    wsRef.current.send(serializeMessage(message))
                } catch (error) {
                    console.error('Error sending message:', error)
                    onError?.('Failed to send message')
                }
            } else {
                console.warn('WebSocket is not open. Current state:', wsRef.current?.readyState)
            }
        },
        [onError]
    )

    // Send specific message types
    const sendJoin = useCallback(() => {
        if (!playerId) {
            console.error('Cannot join: playerId is missing')
            return
        }
        sendMessage(createJoinMessage(roomId, playerId))
    }, [roomId, playerId, sendMessage])

    const sendPing = useCallback(() => {
        sendMessage(createPingMessage())
    }, [sendMessage])

    const sendReady = useCallback(() => {
        sendMessage({ type: 'ready', payload: {} })
    }, [sendMessage])

    const sendAnswer = useCallback(
        (round: number, count: number) => {
            sendMessage({
                type: 'answer',
                payload: {
                    round,
                    count,
                    timestamp: Date.now(),
                },
            })
        },
        [sendMessage]
    )

    // Connect to WebSocket
    const connect = useCallback(() => {
        if (isConnectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
            return
        }

        if (!playerId) {
            console.warn('Cannot connect: playerId is missing')
            return
        }

        isConnectingRef.current = true
        setConnectionState('connecting')

        try {
            const url = getWebSocketUrl()
            const ws = new WebSocket(url)

            ws.onopen = () => {
                console.log('WebSocket connected')
                isConnectingRef.current = false
                setConnectionState('connected')

                // Send join message immediately
                sendJoin()

                // Start ping interval (every 30 seconds)
                pingIntervalRef.current = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        sendPing()
                    }
                }, 30000)
            }

            ws.onmessage = (event) => {
                try {
                    const data = event.data
                    if (typeof data !== 'string') {
                        console.error('Received non-string message')
                        return
                    }

                    const message = parseServerMessage(data)
                    if (!message) {
                        console.error('Failed to parse message:', data)
                        return
                    }

                    // Call specific handlers
                    if (message.type === 'playerJoined' && onPlayerJoined) {
                        onPlayerJoined(message)
                    } else if (message.type === 'playerLeft' && onPlayerLeft) {
                        onPlayerLeft(message)
                    }

                    // Call general message handler
                    onMessage?.(message)
                } catch (error) {
                    console.error('Error handling message:', error)
                }
            }

            ws.onerror = (error) => {
                console.error('WebSocket error:', error)
                isConnectingRef.current = false
                setConnectionState('error')
                onError?.('WebSocket connection error')
            }

            ws.onclose = (event) => {
                console.log('WebSocket closed', event.code, event.reason)
                isConnectingRef.current = false
                setConnectionState('disconnected')

                // Clear ping interval
                if (pingIntervalRef.current) {
                    clearInterval(pingIntervalRef.current)
                    pingIntervalRef.current = null
                }

                // Auto-reconnect if enabled and not a normal closure
                if (autoReconnect && event.code !== 1000) {
                    reconnectTimeoutRef.current = setTimeout(() => {
                        console.log('Attempting to reconnect...')
                        connect()
                    }, reconnectInterval)
                }
            }

            wsRef.current = ws
        } catch (error) {
            console.error('Error creating WebSocket:', error)
            isConnectingRef.current = false
            setConnectionState('error')
            onError?.('Failed to create WebSocket connection')
        }
    }, [roomId, playerId, getWebSocketUrl, sendJoin, sendPing, autoReconnect, reconnectInterval, onError, onMessage, onPlayerJoined, onPlayerLeft])

    // Disconnect
    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = null
        }

        if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current)
            pingIntervalRef.current = null
        }

        if (wsRef.current) {
            wsRef.current.close(1000, 'Manual disconnect')
            wsRef.current = null
        }

        setConnectionState('disconnected')
    }, [])

    // Reconnect manually
    const reconnect = useCallback(() => {
        disconnect()
        setTimeout(() => {
            connect()
        }, 100)
    }, [disconnect, connect])

    // Connect on mount and when roomId/playerId changes
    useEffect(() => {
        if (roomId && playerId) {
            connect()
        }

        return () => {
            disconnect()
        }
    }, [roomId, playerId, connect, disconnect])

    return {
        connectionState,
        sendMessage,
        sendJoin,
        sendPing,
        sendReady,
        sendAnswer,
        reconnect,
        disconnect,
    }
}
