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

export type GameState = 'waiting' | 'counting' | 'answering' | 'results' | 'finished';

export interface GameRoom {
    roomId: string;
    players: Map<string, Player>;
    currentRound: number;
    gameState: GameState;
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

