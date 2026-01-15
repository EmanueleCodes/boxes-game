import { describe, it, expect } from 'vitest'
import { generateRoomId } from './room'

describe('generateRoomId', () => {
    it('should generate a 6-character string', () => {
        const roomId = generateRoomId()
        expect(roomId).toHaveLength(6)
    })
    
    it('should generate uppercase alphanumeric characters only', () => {
        const roomId = generateRoomId()
        // Should match pattern: exactly 6 uppercase letters or digits
        expect(roomId).toMatch(/^[A-Z0-9]{6}$/)
    })
    
    it('should generate different IDs on multiple calls', () => {
        const ids = new Set<string>()
        const iterations = 100
        
        for (let i = 0; i < iterations; i++) {
            const id = generateRoomId()
            ids.add(id)
        }
        
        // With 100 iterations, we should get mostly unique IDs
        // (allowing for very rare collisions)
        expect(ids.size).toBeGreaterThan(iterations * 0.95) // 95% uniqueness is reasonable
    })
    
    it('should not contain lowercase letters', () => {
        const roomId = generateRoomId()
        expect(roomId).not.toMatch(/[a-z]/)
    })
    
    it('should not contain special characters', () => {
        const roomId = generateRoomId()
        // Should only contain A-Z and 0-9
        expect(roomId).toMatch(/^[A-Z0-9]+$/)
    })
})
