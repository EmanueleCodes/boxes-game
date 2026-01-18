import { GameRoom } from "../types";

export function generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export class RoomManager {

    private rooms: Map<string, GameRoom> = new Map();
    
    private cleanupInterval?:NodeJS.Timeout | null = null;

    constructor(){
        this.rooms = new Map();
        this.cleanupInterval = setInterval(() => this.cleanupRooms(), 1000 * 60 * 5);
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
        return this.rooms.get(roomId)
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