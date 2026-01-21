import { Users } from 'lucide-react'
import type { Player } from './types'

interface WaitingRoomProps {
	players: Player[]
	minPlayers: number
	onStartGame: () => void
	isStarting: boolean
}

/**
 * WaitingRoom - Lobby view before game starts
 */
export function WaitingRoom({
	players,
	minPlayers,
	onStartGame,
	isStarting,
}: WaitingRoomProps) {
	const playerCount = players.length
	const canStart = playerCount >= minPlayers
	const playersNeeded = minPlayers - playerCount

	return (
		<div className="space-y-6">
			{/* Player Count */}
			<div className="flex items-center justify-center gap-2 text-gray-300">
				<Users className="w-5 h-5" />
				<span className="text-lg">
					{playerCount} / {minPlayers}+ players
				</span>
			</div>

			{/* Status Message */}
			<div className="text-center space-y-4">
				{canStart ? (
					<>
						<p className="text-green-400 text-lg font-semibold">
							✓ Ready to start!
						</p>
						<button
							onClick={onStartGame}
							disabled={isStarting}
							className="w-full px-6 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-cyan-500/50"
						>
							{isStarting ? 'Starting Game...' : 'Start Game'}
						</button>
					</>
				) : (
					<p className="text-yellow-400 text-lg font-semibold">
						Waiting for players... Need {playersNeeded} more player
						{playersNeeded > 1 ? 's' : ''}
					</p>
				)}
			</div>

			{/* Player List */}
			<div className="bg-slate-900/50 rounded-lg p-6 border border-slate-600">
				<h2 className="text-xl font-semibold text-white mb-4">Players</h2>
				{playerCount === 0 ? (
					<p className="text-gray-400 text-center py-4">No players yet</p>
				) : (
					<div className="space-y-2">
						{players.map((player) => (
							<div
								key={player.id}
								className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700"
							>
								<span className="text-white font-medium">{player.name}</span>
								<span className="text-gray-400 text-sm">Score: {player.score}</span>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Share Room */}
			<div className="bg-slate-900/30 rounded-lg p-4 border border-slate-700">
				<p className="text-gray-400 text-sm text-center">
					Share the Room ID with other players to join
				</p>
			</div>
		</div>
	)
}
