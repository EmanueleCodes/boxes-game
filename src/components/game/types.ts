/**
 * Shared types for game room components
 */

export interface Player {
	id: string
	name: string
	score: number
	active: boolean
}

export interface BoxData {
	x: number
	y: number
	z: number
	size: number
	color: string
}

export interface AnimationConfig {
	direction?: 'left' | 'right' | 'up' | 'down' | 'forward' | 'backward'
	speed?: number
	staggerDelay?: number
	fadeDuration?: number
}

export interface BoxAnimation {
	type: 'static' | 'slide' | 'stagger' | 'fade'
	visibleDuration: number
	config?: AnimationConfig
}

export interface RoundData {
	boxes: BoxData[]
	correctCount: number
	startedAt: number
	animation: BoxAnimation
}

export type GameState = 'notStarted' | 'started' | 'finished'
export type RoundState = 'notStarted' | 'showingBoxes' | 'answering' | 'showResults'

/**
 * Serialized room data from tRPC (Maps converted to arrays/objects)
 */
export interface SerializedRoom {
	roomId: string
	players: Player[]
	currentRound: number
	gameState: GameState
	roundState: RoundState
	roundData: RoundData
	scores: Record<string, number>
	createdAt: number
	lastActivity: number
}
