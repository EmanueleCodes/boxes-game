import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RoomManager } from './room'

describe('Room Cleanup', () => {
    let roomManager: RoomManager

    beforeEach(() => {
        // Create a new RoomManager for each test
        roomManager = new RoomManager()
        // Stop the automatic cleanup timer to control when cleanup runs
        roomManager.stopCleanupTimer()
    })

    it('should delete rooms that are inactive for more than 5 minutes', () => {
        // Create a room
        const roomId = roomManager.createRoom()
        expect(roomManager.roomExists(roomId)).toBe(true)

        // Get the room and manually set lastActivity to 6 minutes ago
        const room = roomManager.getRoom(roomId)
        if (room) {
            room.lastActivity = Date.now() - (1000 * 60 * 6) // 6 minutes ago
        }

        // Manually trigger cleanup
        roomManager.cleanupRooms()

        // Room should be deleted
        expect(roomManager.roomExists(roomId)).toBe(false)
    })

    it('should NOT delete rooms that are active (less than 5 minutes)', () => {
        // Create a room
        const roomId = roomManager.createRoom()
        expect(roomManager.roomExists(roomId)).toBe(true)

        // Get the room and manually set lastActivity to 2 minutes ago (still active)
        const room = roomManager.getRoom(roomId)
        if (room) {
            room.lastActivity = Date.now() - (1000 * 60 * 2) // 2 minutes ago
        }

        // Manually trigger cleanup
        roomManager.cleanupRooms()

        // Room should still exist
        expect(roomManager.roomExists(roomId)).toBe(true)
    })

    it('should update lastActivity when updateLastActivity is called', () => {
        // Create a room
        const roomId = roomManager.createRoom()
        const room = roomManager.getRoom(roomId)
        
        if (!room) throw new Error('Room should exist')

        // Set lastActivity to old timestamp
        const oldActivity = Date.now() - (1000 * 60 * 10) // 10 minutes ago
        room.lastActivity = oldActivity

        // Update activity
        roomManager.updateLastActivity(roomId)

        // lastActivity should be updated (within last second)
        const updatedRoom = roomManager.getRoom(roomId)
        expect(updatedRoom?.lastActivity).toBeGreaterThan(Date.now() - 1000)
        expect(updatedRoom?.lastActivity).toBeGreaterThan(oldActivity)
    })

    it('should handle cleanup of multiple rooms correctly', () => {
        // Create multiple rooms
        const room1 = roomManager.createRoom()
        const room2 = roomManager.createRoom()
        const room3 = roomManager.createRoom()

        // Set room1 to inactive (6 minutes ago)
        const room1Data = roomManager.getRoom(room1)
        if (room1Data) {
            room1Data.lastActivity = Date.now() - (1000 * 60 * 6)
        }

        // Set room2 to inactive (7 minutes ago)
        const room2Data = roomManager.getRoom(room2)
        if (room2Data) {
            room2Data.lastActivity = Date.now() - (1000 * 60 * 7)
        }

        // room3 stays active (recent activity)

        // Manually trigger cleanup
        roomManager.cleanupRooms()

        // room1 and room2 should be deleted
        expect(roomManager.roomExists(room1)).toBe(false)
        expect(roomManager.roomExists(room2)).toBe(false)
        
        // room3 should still exist
        expect(roomManager.roomExists(room3)).toBe(true)
    })
})
