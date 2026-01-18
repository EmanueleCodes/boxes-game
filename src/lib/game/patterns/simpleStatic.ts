import type { Box } from '../../types'
import type { BoxGroup } from '../boxGenerator'

/**
 * Simple static pattern: 4 boxes in the middle
 * - Easy to count
 * - Visible for 3 seconds
 * - No animation
 */
export function simpleStatic(): BoxGroup {
    const boxSize = 1
    const spacing = 2 // Space between boxes
    
    // Create a 2x2 grid in the center
    const boxes: Box[] = [
        { x: -spacing, y: 0, z: -spacing, size: boxSize, color: '#60a5fa' }, // Front-left
        { x: spacing, y: 0, z: -spacing, size: boxSize, color: '#60a5fa' },  // Front-right
        { x: -spacing, y: 0, z: spacing, size: boxSize, color: '#60a5fa' },   // Back-left
        { x: spacing, y: 0, z: spacing, size: boxSize, color: '#60a5fa' },   // Back-right
    ]

    return {
        boxes,
        correctCount: boxes.length,
        animation: {
            type: 'static',
            visibleDuration: 3000, // 3 seconds
        },
    }
}
