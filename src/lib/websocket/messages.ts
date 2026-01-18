import type { Box, Player } from '@/lib/types'

// ============================================================================
// CLIENT → SERVER MESSAGES
// ============================================================================

export type JoinMessage = {
    type: 'join'
    payload: {
        roomId: string
        playerId: string
    }
}

export type AnswerMessage = {
    type: 'answer'
    payload: {
        round: number
        count: number
        timestamp: number
    }
}

export type ReadyMessage = {
    type: 'ready'
    payload: {}
}

export type PingMessage = {
    type: 'ping'
    payload: {}
}

// Union of all client messages
export type ClientMessage = JoinMessage | AnswerMessage | ReadyMessage | PingMessage

// ============================================================================
// SERVER → CLIENT MESSAGES
// ============================================================================

export type PlayerJoinedMessage = {
    type: 'playerJoined'
    payload: {
        playerId: string
        playerName: string
        totalPlayers: number
    }
}

export type PlayerLeftMessage = {
    type: 'playerLeft'
    payload: {
        playerId: string
        totalPlayers: number
    }
}

export type GameStartingMessage = {
    type: 'gameStarting'
    payload: {
        roundCount: number
    }
}

export type RoundStartMessage = {
    type: 'roundStart'
    payload: {
        round: number
        boxes: Box[]
    }
}

export type BoxesHiddenMessage = {
    type: 'boxesHidden'
    payload: {
        round: number
    }
}

export type RoundResultsMessage = {
    type: 'roundResults'
    payload: {
        round: number
        correctCount: number
        scores: Array<{
            playerId: string
            playerName: string
            answer: number | null
            points: number
            totalScore: number
        }>
    }
}

export type GameFinishedMessage = {
    type: 'gameFinished'
    payload: {
        winner: Player
        finalScores: Array<{
            playerId: string
            playerName: string
            score: number
        }>
    }
}

export type ErrorMessage = {
    type: 'error'
    payload: {
        message: string
    }
}

export type PongMessage = {
    type: 'pong'
    payload: {}
}

// Union of all server messages
export type ServerMessage =
    | PlayerJoinedMessage
    | PlayerLeftMessage
    | GameStartingMessage
    | RoundStartMessage
    | BoxesHiddenMessage
    | RoundResultsMessage
    | GameFinishedMessage
    | ErrorMessage
    | PongMessage

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isClientMessage(msg: unknown): msg is ClientMessage {
    if (typeof msg !== 'object' || msg === null) return false

    const m = msg as { type?: string; payload?: unknown }

    if (!m.type || typeof m.type !== 'string') return false
    if (m.payload === undefined) return false

    const validTypes: ClientMessage['type'][] = ['join', 'answer', 'ready', 'ping']
    return validTypes.includes(m.type as ClientMessage['type'])
}

export function isServerMessage(msg: unknown): msg is ServerMessage {
    if (typeof msg !== 'object' || msg === null) return false

    const m = msg as { type?: string; payload?: unknown }

    if (!m.type || typeof m.type !== 'string') return false
    if (m.payload === undefined) return false

    const validTypes: ServerMessage['type'][] = [
        'playerJoined',
        'playerLeft',
        'gameStarting',
        'roundStart',
        'boxesHidden',
        'roundResults',
        'gameFinished',
        'error',
        'pong',
    ]
    return validTypes.includes(m.type as ServerMessage['type'])
}

// ============================================================================
// HELPER FUNCTIONS - Create Messages
// ============================================================================

export function createJoinMessage(roomId: string, playerId: string): JoinMessage {
    return {
        type: 'join',
        payload: { roomId, playerId },
    }
}

export function createAnswerMessage(round: number, count: number): AnswerMessage {
    return {
        type: 'answer',
        payload: {
            round,
            count,
            timestamp: Date.now(),
        },
    }
}

export function createReadyMessage(): ReadyMessage {
    return {
        type: 'ready',
        payload: {},
    }
}

export function createPingMessage(): PingMessage {
    return {
        type: 'ping',
        payload: {},
    }
}

// Server message creation helpers (for consistency and type safety)
export function createGameStartingMessage(roundCount: number): GameStartingMessage {
    return {
        type: 'gameStarting',
        payload: { roundCount },
    }
}

export function createRoundStartMessage(round: number, boxes: Box[]): RoundStartMessage {
    return {
        type: 'roundStart',
        payload: { round, boxes },
    }
}

// ============================================================================
// HELPER FUNCTIONS - Parse Messages
// ============================================================================

export function parseClientMessage(data: string): ClientMessage | null {
    try {
        const parsed = JSON.parse(data)
        if (isClientMessage(parsed)) {
            return parsed
        }
        return null
    } catch {
        return null
    }
}

export function parseServerMessage(data: string): ServerMessage | null {
    try {
        const parsed = JSON.parse(data)
        if (isServerMessage(parsed)) {
            return parsed
        }
        return null
    } catch {
        return null
    }
}

// ============================================================================
// HELPER FUNCTIONS - Serialize Messages
// ============================================================================

export function serializeMessage(message: ClientMessage | ServerMessage): string {
    return JSON.stringify(message)
}
