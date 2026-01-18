import type { Box } from '../../types'
import type { BoxGroup } from '../boxGenerator'

/**
 * Sliding plane pattern: 5 boxes on a plane that slides across the screen
 * - Medium difficulty
 * - Visible for 2 seconds
 * - Slide animation
 */
export function slidingPlane(): BoxGroup {
    const boxSize = 1
    const spacing = 1.5
    
    // Create 5 boxes in a horizontal line
    const boxes: Box[] = [
        { x: -spacing * 2, y: 0, z: 0, size: boxSize, color: '#34d399' },
        { x: -spacing, y: 0, z: 0, size: boxSize, color: '#34d399' },
        { x: 0, y: 0, z: 0, size: boxSize, color: '#34d399' },
        { x: spacing, y: 0, z: 0, size: boxSize, color: '#34d399' },
        { x: spacing * 2, y: 0, z: 0, size: boxSize, color: '#34d399' },
    ]

    return {
        boxes,
        correctCount: boxes.length,
        animation: {
            type: 'slide',
            visibleDuration: 2000, // 2 seconds
            config: {
                direction: 'right',
                speed: 2, // units per second
            },
        },
    }
}
