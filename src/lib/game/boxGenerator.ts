import type { Box, BoxAnimation } from '../types'
import { simpleStatic } from './patterns/simpleStatic'
import { slidingPlane } from './patterns/slidingPlane'
import { snakeStaggered } from './patterns/snakeStaggered'

// Re-export for convenience
export type { BoxAnimation } from '../types'

/**
 * Box Group - a collection of boxes with shared animation behavior
 * The pattern/animation is owned by the group, not individual boxes
 */
export interface BoxGroup {
    /** Individual boxes in this group */
    boxes: Box[]
    /** The correct count (answer) */
    correctCount: number
    /** Animation metadata for the entire group */
    animation: BoxAnimation
}

/**
 * Pattern generator function type
 * Each pattern function generates a BoxGroup with a specific layout/animation style
 */
export type PatternGenerator = () => BoxGroup

/**
 * Select a pattern based on round number (1-10)
 * Difficulty increases as rounds progress
 */
export function selectPattern(round: number): PatternGenerator {
    if (round <= 3) {
        // Early rounds: Simple, static patterns
        return simpleStatic
    } else if (round <= 6) {
        // Mid rounds: Medium difficulty with movement
        // Alternate between sliding and simple static
        return round % 2 === 0 ? slidingPlane : simpleStatic
    } else {
        // Late rounds: Complex patterns with animations
        // Rotate through all patterns
        const patterns: PatternGenerator[] = [simpleStatic, slidingPlane, snakeStaggered]
        return patterns[(round - 7) % patterns.length]
    }
}

/**
 * Generate a box group for a specific round
 * This is the main entry point for box generation
 */
export function generateBoxGroup(round: number): BoxGroup {
    const patternGenerator = selectPattern(round)
    return patternGenerator()
}
