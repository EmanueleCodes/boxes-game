export interface Box {
    x: number;
    y: number;
    z: number;
    size: number;
    color: string;
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
}

