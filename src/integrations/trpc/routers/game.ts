import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '../init'
import { roomManager } from '@/lib/game/room'
import { TRPCError } from '@trpc/server'
import type { GameRoom, Player } from '@/lib/types'

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
        roundData: room.roundData,
        scores: Object.fromEntries(room.scores),
        createdAt: room.createdAt,
        lastActivity: room.lastActivity,
    }
}

// Zod schemas for validation
const gameStateSchema = z.enum(['waiting', 'counting', 'answering', 'results', 'finished'])

const boxSchema = z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
    size: z.number(),
    color: z.string(),
})

const roundDataSchema = z.object({
    boxes: z.array(boxSchema),
    correctCount: z.number(),
    startedAt: z.number(),
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
            if (room.gameState !== 'waiting') {
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
})