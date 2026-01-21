import { createFileRoute } from '@tanstack/react-router'
import { roomManager } from '@/lib/game/room'
import {
    parseClientMessage,
    serializeMessage,
    type ClientMessage,
    type ServerMessage,
    type ErrorMessage,
} from '@/lib/websocket/messages'

// Cloudflare Workers WebSocket types
declare class WebSocketPair {
    constructor()
    0: WebSocket // client
    1: CloudflareWebSocket // server
}

interface CloudflareWebSocket extends WebSocket {
    accept(): void
}

interface ResponseInitWithWebSocket extends ResponseInit {
    webSocket?: WebSocket
}

function websocketHandler({ request, params }: { request: Request; params: { roomId: string } }) {
    const { roomId } = params

    // Check if it's a WebSocket upgrade request
    const upgradeHeader = request.headers.get('Upgrade')
    if (upgradeHeader !== 'websocket') {
        return new Response('Expected WebSocket', { status: 426 })
    }

    // NOTE: We don't validate room exists here because Cloudflare Workers are stateless.
    // The room created via tRPC may be in a different isolate's memory.
    // The join message handler will validate the player exists.

    // Check if WebSocketPair is available (Cloudflare Workers API)
    // Note: This might not be available in dev mode - WebSocket may only work in production
    let client: WebSocket
    let server: CloudflareWebSocket
    
    try {
        // Create WebSocket pair (Cloudflare Workers API)
        const pair = new WebSocketPair()
        client = pair[0]
        server = pair[1]

        // Accept the WebSocket connection
        server.accept()
    } catch (error) {
        console.error('Error creating WebSocket pair:', error)
        return new Response('Failed to create WebSocket connection. WebSocket may not be supported in dev mode.', { status: 501 })
    }

    // Store connection temporarily (we'll get playerId from join message)
    let playerId: string | null = null

    // Handle incoming messages
    server.addEventListener('message', (event: MessageEvent) => {
        try {
            const data = event.data
            if (typeof data !== 'string') {
                sendError(server, 'Invalid message format')
                return
            }

            const message = parseClientMessage(data)
            if (!message) {
                sendError(server, 'Invalid message format')
                return
            }

            // Handle join message separately to capture playerId
            if (message.type === 'join') {
                const { playerId: joinPlayerId } = message.payload
                const currentRoom = roomManager.getRoom(roomId)
                
                if (!currentRoom) {
                    sendError(server, 'Room not found')
                    server.close()
                    return
                }

                // Validate player exists in room
                const player = currentRoom.players.get(joinPlayerId)
                if (!player) {
                    sendError(server, 'Player not found in room')
                    server.close()
                    return
                }

                // Store playerId and WebSocket connection
                playerId = joinPlayerId
                currentRoom.websocketConnections.set(joinPlayerId, server)
                roomManager.updateLastActivity(roomId)

                // Broadcast player joined to all clients
                broadcastToRoom(roomId, {
                    type: 'playerJoined',
                    payload: {
                        playerId: player.id,
                        playerName: player.name,
                        totalPlayers: currentRoom.players.size,
                    },
                })
            } else {
                // Handle other messages (only if already joined)
                if (!playerId) {
                    sendError(server, 'Must join room first')
                    return
                }
                handleMessage(message, server, roomId)
            }
        } catch (error) {
            console.error('WebSocket message error:', error)
            sendError(server, 'Internal server error')
        }
    })

    // Handle connection close
    server.addEventListener('close', () => {
        if (playerId) {
            handleDisconnection(roomId, playerId)
        }
    })

    // Handle errors
    server.addEventListener('error', (error: Event) => {
        console.error('WebSocket error:', error)
        if (playerId) {
            handleDisconnection(roomId, playerId)
        }
    })

    // Return WebSocket response
    return new Response(null, {
        status: 101,
        webSocket: client,
    } as ResponseInitWithWebSocket)
}

function handleMessage(
    message: ClientMessage,
    ws: WebSocket,
    roomId: string
) {
    const room = roomManager.getRoom(roomId)
    if (!room) {
        sendError(ws, 'Room not found')
        ws.close()
        return
    }

    switch (message.type) {
        case 'ping': {
            // Respond with pong
            sendMessage(ws, { type: 'pong', payload: {} })
            break
        }

        case 'ready': {
            // For now, just acknowledge (game logic will handle this later)
            roomManager.updateLastActivity(roomId)
            break
        }

        case 'answer': {
            // For now, just acknowledge (game logic will handle this later)
            roomManager.updateLastActivity(roomId)
            break
        }

        default: {
            sendError(ws, `Unknown message type: ${(message as { type: string }).type}`)
        }
    }
}

function handleDisconnection(roomId: string, playerId: string) {
    const room = roomManager.getRoom(roomId)
    if (!room) return

    // Remove WebSocket connection
    room.websocketConnections.delete(playerId)

    const player = room.players.get(playerId)
    
    if (!player) {
        // Player already removed, nothing to do
        return
    }

    // If game hasn't started yet, remove player completely
    // If game has started, mark as inactive (keep them in game for scoring)
    if (room.gameState === 'notStarted') {
        // Remove player from room
        room.players.delete(playerId)
        room.scores.delete(playerId)

        // Broadcast player left
        broadcastToRoom(roomId, {
            type: 'playerLeft',
            payload: {
                playerId,
                totalPlayers: room.players.size,
            },
        })

        // Cleanup if room is empty
        if (room.players.size === 0) {
            roomManager.deleteRoom(roomId)
        } else {
            roomManager.updateLastActivity(roomId)
        }
    } else {
        // Game is in progress - mark player as inactive but keep them in room
        player.active = false
        roomManager.updateLastActivity(roomId)

        // Broadcast player disconnected (different from left - they're still in the game)
        broadcastToRoom(roomId, {
            type: 'playerLeft',
            payload: {
                playerId,
                totalPlayers: room.players.size,
            },
        })
    }
}

function broadcastToRoom(roomId: string, message: ServerMessage) {
    const room = roomManager.getRoom(roomId)
    if (!room) return

    const serialized = serializeMessage(message)

    // Send to all connected clients
    room.websocketConnections.forEach((ws) => {
        try {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(serialized)
            }
        } catch (error) {
            console.error('Error broadcasting message:', error)
        }
    })
}

function sendMessage(ws: WebSocket, message: ServerMessage) {
    try {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(serializeMessage(message))
        }
    } catch (error) {
        console.error('Error sending message:', error)
    }
}

function sendError(ws: WebSocket, errorMessage: string) {
    const errorMsg: ErrorMessage = {
        type: 'error',
        payload: { message: errorMessage },
    }
    sendMessage(ws, errorMsg)
}

export const Route = createFileRoute('/api/game/ws/$roomId')({
    server: {
        handlers: {
            GET: ({ request, params }) => websocketHandler({ request, params }),
        },
    },
})
