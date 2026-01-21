import { useState, useEffect } from 'react'
import { BoxRenderer } from './BoxRenderer'
import { Scoreboard } from './Scoreboard'
import type { SerializedRoom } from './types'

interface GameViewProps {
	room: SerializedRoom
	playerId: string | null
}

/**
 * GameView - Renders the active game based on round state
 */
export function GameView({ room, playerId }: GameViewProps) {
	const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

	// Calculate time remaining for showing boxes
	useEffect(() => {
		if (room.roundState !== 'showingBoxes') {
			setTimeRemaining(null)
			return
		}

		const visibleDuration = room.roundData.animation.visibleDuration
		const startedAt = room.roundData.startedAt
		const endTime = startedAt + visibleDuration

		const updateTimer = () => {
			const now = Date.now()
			const remaining = Math.max(0, Math.ceil((endTime - now) / 1000))
			setTimeRemaining(remaining)
		}

		// Initial update
		updateTimer()

		// Update every 100ms for smooth countdown
		const interval = setInterval(updateTimer, 100)

		return () => clearInterval(interval)
	}, [room.roundState, room.roundData.startedAt, room.roundData.animation.visibleDuration])

	return (
		<div className="space-y-6">
			{/* Round Header */}
			<RoundHeader
				currentRound={room.currentRound}
				totalRounds={10}
				timeRemaining={timeRemaining}
			/>

			{/* Round State Content */}
			{room.roundState === 'showingBoxes' && (
				<ShowingBoxesPhase boxes={room.roundData.boxes} />
			)}

			{room.roundState === 'answering' && <AnsweringPhase />}

			{room.roundState === 'showResults' && (
				<ResultsPhase correctCount={room.roundData.correctCount} />
			)}

			{/* Scoreboard */}
			<Scoreboard players={room.players} currentPlayerId={playerId} />
		</div>
	)
}

function RoundHeader({
	currentRound,
	totalRounds,
	timeRemaining,
}: {
	currentRound: number
	totalRounds: number
	timeRemaining: number | null
}) {
	return (
		<div className="flex items-center justify-between">
			<div className="text-white">
				<span className="text-2xl font-bold">Round {currentRound}</span>
				<span className="text-gray-400 ml-2">/ {totalRounds}</span>
			</div>
			{timeRemaining !== null && (
				<div className="bg-cyan-500/20 border border-cyan-500 rounded-lg px-4 py-2">
					<span className="text-cyan-400 font-mono text-xl font-bold">
						{timeRemaining}s
					</span>
				</div>
			)}
		</div>
	)
}

function ShowingBoxesPhase({ boxes }: { boxes: SerializedRoom['roundData']['boxes'] }) {
	return (
		<div className="space-y-4">
			<div className="text-center">
				<p className="text-yellow-400 text-lg font-semibold animate-pulse">
					Count the boxes!
				</p>
			</div>
			<BoxRenderer boxes={boxes} />
		</div>
	)
}

function AnsweringPhase() {
	return (
		<div className="space-y-4">
			<div className="text-center">
				<p className="text-white text-lg">How many boxes did you count?</p>
			</div>
			<div className="bg-slate-900/50 rounded-lg p-6 border border-slate-600">
				<p className="text-gray-400 text-center">
					Answer input coming in Phase 5...
				</p>
			</div>
		</div>
	)
}

function ResultsPhase({ correctCount }: { correctCount: number }) {
	return (
		<div className="space-y-4">
			<div className="text-center">
				<p className="text-white text-lg">Round Results</p>
				<p className="text-cyan-400 text-3xl font-bold mt-2">
					Correct Answer: {correctCount}
				</p>
			</div>
		</div>
	)
}
