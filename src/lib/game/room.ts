import { GameRoom } from "../types";

export function generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export class RoomManager {

    private rooms: Map<string, GameRoom> = new Map();
    
    // Note: setInterval doesn't work reliably in Cloudflare Workers
    // Cleanup happens on-demand during room operations instead
    private cleanupInterval?: ReturnType<typeof setInterval> | null = null;

    constructor(){
        this.rooms = new Map();
        // Don't use setInterval in Cloudflare Workers - it doesn't persist across requests
        // Instead, cleanup is done lazily when accessing rooms
    }

    public cleanupRooms(): void {
        const now = Date.now()
        this.rooms.forEach((room, roomId) => {
            if (now - room.lastActivity > 1000 * 60 * 5) {
                this.rooms.delete(roomId)
            }
        })
    }

    public stopCleanupTimer(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval)
            this.cleanupInterval = null
        }
    }

    public createRoom(): string {
        // Generate unique room ID (handle collisions)
        let roomId: string
        do {
            roomId = generateRoomId()
        } while (this.rooms.has(roomId))

        const now = Date.now()
        const newRoom: GameRoom = {
            roomId,
            players: new Map(),
            currentRound: 0,
            gameState: 'notStarted',
            roundState: 'notStarted',
            roundData: {
                boxes: [],
                correctCount: 0,
                startedAt: 0, // 0 until game actually starts
                animation: {
                    type: 'static',
                    visibleDuration: 3000, // Default, will be replaced when round starts
                },
            },
            scores: new Map(),
            websocketConnections: new Map(),
            createdAt: now,
            lastActivity: now,
        }
        this.rooms.set(roomId, newRoom)
        return roomId
    }

    public getRoom(roomId: string): GameRoom | undefined {
        // Lazy cleanup: check if room is stale before returning
        const room = this.rooms.get(roomId)
        if (room && Date.now() - room.lastActivity > 1000 * 60 * 30) {
            // Room inactive for 30 minutes, delete it
            this.rooms.delete(roomId)
            return undefined
        }
        return room
    }

    public deleteRoom(roomId: string): boolean {
        return this.rooms.delete(roomId)
    }

    public roomExists(roomId: string): boolean {
        return this.rooms.has(roomId)
    }

    public updateLastActivity(roomId: string): void {
        const room = this.rooms.get(roomId)
        if (room) {
            room.lastActivity = Date.now()
        }
    }
}

// Export singleton instance for use in tRPC endpoints
export const roomManager = new RoomManager()