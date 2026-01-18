import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '../init'
import { roomManager } from '@/lib/game/room'
import { TRPCError } from '@trpc/server'
import type { GameRoom, Player } from '@/lib/types'
import { serializeMessage, type ServerMessage, createGameStartingMessage, createRoundStartMessage } from '@/lib/websocket/messages'
import { startGame, startRound, canStartGame } from '@/lib/game/gameLogic'

// Helper function to generate player ID
function generatePlayerId(): string {
    return crypto.randomUUID()
}

// Helper function to convert GameRoom to serializable format (Maps to arrays)
function serializeRoom(room: GameRoom) {
    return {
        roomId: room.roomId,
        players: Array.from(room.players.values()),
        currentRound: room.currentRound,
        gameState: room.gameState,
        roundState: room.roundState,
        roundData: room.roundData,
        scores: Object.fromEntries(room.scores),
        createdAt: room.createdAt,
        lastActivity: room.lastActivity,
    }
}

// Zod schemas for validation
const gameStateSchema = z.enum(['notStarted', 'started', 'finished'])
const roundStateSchema = z.enum(['notStarted', 'showingBoxes', 'answering', 'showResults'])

const boxSchema = z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
    size: z.number(),
    color: z.string(),
})

const boxAnimationSchema = z.object({
    type: z.enum(['static', 'slide', 'stagger', 'fade']),
    visibleDuration: z.number(),
    config: z
        .object({
            direction: z.enum(['left', 'right', 'up', 'down', 'forward', 'backward']).optional(),
            speed: z.number().optional(),
            staggerDelay: z.number().optional(),
            fadeDuration: z.number().optional(),
        })
        .optional(),
})

const roundDataSchema = z.object({
    boxes: z.array(boxSchema),
    correctCount: z.number(),
    startedAt: z.number(),
    animation: boxAnimationSchema,
})

const playerSchema = z.object({
    id: z.string(),
    name: z.string(),
    score: z.number(),
})

const roomSchema = z.object({
    roomId: z.string(),
    players: z.array(playerSchema),
    currentRound: z.number(),
    gameState: gameStateSchema,
    roundState: roundStateSchema,
    roundData: roundDataSchema,
    scores: z.record(z.string(), z.number()),
    createdAt: z.number(),
    lastActivity: z.number(),
})

export const gameRouter = createTRPCRouter({
    create: publicProcedure
        .input(
            z.object({
                playerName: z.string().min(1, 'Player name is required'),
            })
        )
        .output(z.object({ roomId: z.string(), playerId: z.string() }))
        .mutation(async ({ input }) => {
            const roomId = roomManager.createRoom()
            const room = roomManager.getRoom(roomId)
            
            if (!room) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to create room',
                })
            }

            // Generate playerId for the room creator
            const playerId = generatePlayerId()

            // Create player object
            const player: Player = {
                id: playerId,
                name: input.playerName,
                score: 0,
            }

            // Add creator as first player in room
            room.players.set(playerId, player)
            room.scores.set(playerId, 0)

            // Update last activity
            roomManager.updateLastActivity(roomId)

            return { roomId, playerId }
        }),

    join: publicProcedure
        .input(
            z.object({
                roomId: z.string(),
                playerName: z.string().min(1, 'Player name is required'),
            })
        )
        .output(z.object({ playerId: z.string(), roomState: roomSchema }))
        .mutation(async ({ input }) => {
            const room = roomManager.getRoom(input.roomId)
            if (!room) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Room not found',
                })
            }

            // Check if game has already started
            if (room.gameState !== 'notStarted') {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Game has already started',
                })
            }

            // Generate player ID
            const playerId = generatePlayerId()

            // Create player object
            const player: Player = {
                id: playerId,
                name: input.playerName,
                score: 0,
            }

            // Add player to room
            room.players.set(playerId, player)
            room.scores.set(playerId, 0)

            // Update last activity
            roomManager.updateLastActivity(input.roomId)

            // Broadcast playerJoined to all connected WebSocket clients
            const playerJoinedMessage: ServerMessage = {
                type: 'playerJoined',
                payload: {
                    playerId: player.id,
                    playerName: player.name,
                    totalPlayers: room.players.size,
                },
            }
            broadcastToRoom(input.roomId, playerJoinedMessage)

            // Return playerId and serialized room state
            return { playerId, roomState: serializeRoom(room) }
        }),

    status: publicProcedure
        .input(z.object({ roomId: z.string() }))
        .output(z.object({ room: roomSchema }))
        .query(async ({ input }) => {
            const room = roomManager.getRoom(input.roomId)
            if (!room) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Room not found',
                })
            }

            // Update last activity (viewing room counts as activity)
            roomManager.updateLastActivity(input.roomId)

            // Convert Maps to serializable format
            return { room: serializeRoom(room) }
        }),

    start: publicProcedure
        .input(z.object({ roomId: z.string() }))
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ input }) => {
            const room = roomManager.getRoom(input.roomId)
            
            if (!room) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Room not found',
                })
            }

            // Validate game can start
            if (!canStartGame(room)) {
                if (room.gameState !== 'notStarted') {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: 'Game has already started',
                    })
                }
                if (room.players.size < 2) {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: 'Need at least 2 players to start the game',
                    })
                }
            }

            // Start the game
            startGame(room)

            // Start the first round (generates boxes)
            startRound(room)

            // Update last activity
            roomManager.updateLastActivity(input.roomId)

            // Broadcast gameStarting message to all connected clients
            const gameStartingMessage = createGameStartingMessage(10) // Total rounds = 10
            broadcastToRoom(input.roomId, gameStartingMessage)

            // Broadcast roundStart message with boxes data
            const roundStartMessage = createRoundStartMessage(
                room.currentRound,
                room.roundData.boxes
            )
            broadcastToRoom(input.roomId, roundStartMessage)

            return { success: true }
        }),
})

// Helper function to broadcast to all WebSocket connections in a room
function broadcastToRoom(roomId: string, message: ServerMessage) {
    const room = roomManager.getRoom(roomId)
    if (!room) return

    const serialized = serializeMessage(message)

    // Send to all connected clients
    room.websocketConnections.forEach((ws) => {
        try {
            if (ws.readyState === 1) {
                // WebSocket.OPEN = 1
                ws.send(serialized)
            }
        } catch (error) {
            console.error('Error broadcasting message:', error)
        }
    })
}