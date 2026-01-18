import type { Box } from '../../types'
import type { BoxGroup } from '../boxGenerator'

/**
 * Snake pattern: Adjacent boxes appearing in a staggered sequence
 * - High difficulty
 * - Each box appears 0.1s after the previous
 * - Visible for shorter duration
 */
export function snakeStaggered(): BoxGroup {
    const boxSize = 1
    const spacing = 1.5
    
    // Create a snake-like pattern (L-shape)
    const boxes: Box[] = [
        // Horizontal segment (5 boxes)
        { x: -spacing * 2, y: 0, z: 0, size: boxSize, color: '#f472b6' },
        { x: -spacing, y: 0, z: 0, size: boxSize, color: '#f472b6' },
        { x: 0, y: 0, z: 0, size: boxSize, color: '#f472b6' },
        { x: spacing, y: 0, z: 0, size: boxSize, color: '#f472b6' },
        { x: spacing * 2, y: 0, z: 0, size: boxSize, color: '#f472b6' },
        // Vertical segment (4 boxes going up)
        { x: spacing * 2, y: spacing, z: 0, size: boxSize, color: '#f472b6' },
        { x: spacing * 2, y: spacing * 2, z: 0, size: boxSize, color: '#f472b6' },
        { x: spacing * 2, y: spacing * 3, z: 0, size: boxSize, color: '#f472b6' },
        { x: spacing * 2, y: spacing * 4, z: 0, size: boxSize, color: '#f472b6' },
    ]

    return {
        boxes,
        correctCount: boxes.length,
        animation: {
            type: 'stagger',
            visibleDuration: 1500, // 1.5 seconds (shorter due to difficulty)
            config: {
                staggerDelay: 100, // 0.1s between each box appearance
            },
        },
    }
}
