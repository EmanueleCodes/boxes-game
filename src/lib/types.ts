/**
 * Individual box entity - just the box properties
 * Handles styling, position, appearance
 */
export interface Box {
    x: number;
    y: number;
    z: number;
    size: number;
    color: string;
    // Future: texture, material, etc.
}

/**
 * Animation configuration for a box group
 * Owned by the group, not individual boxes
 */
export interface BoxAnimation {
    /** Type of animation to use */
    type: 'static' | 'slide' | 'stagger' | 'fade'
    /** Duration boxes are visible (milliseconds) */
    visibleDuration: number
    /** Pattern-specific animation configuration */
    config?: {
        /** For slide: direction and speed */
        direction?: 'left' | 'right' | 'up' | 'down' | 'forward' | 'backward'
        speed?: number
        /** For stagger: delay between each box appearance (milliseconds) */
        staggerDelay?: number
        /** For fade: fade in/out duration */
        fadeDuration?: number
    }
}

export interface Player {
    id: string;
    name: string;
    score: number;
}

// Overall game status (game lifecycle)
export type GameState = 'notStarted' | 'started' | 'finished';

// Current round status (what's happening in this round)
export type RoundState = 'notStarted' | 'showingBoxes' | 'answering' | 'showResults';

export interface GameRoom {
    roomId: string;
    players: Map<string, Player>;
    currentRound: number;
    gameState: GameState;      // Overall game status
    roundState: RoundState;    // Current round status
    roundData: {
        boxes: Box[];
        correctCount: number;
        startedAt: number;
        animation: BoxAnimation;
    };
    scores: Map<string, number>;
    websocketConnections: Map<string, WebSocket>;
    createdAt: number;
    lastActivity: number;
}

export interface RoundData {
    boxes: Box[];
    correctCount: number;
    startedAt: number;
    animation: BoxAnimation; // Animation metadata for the box group
}

