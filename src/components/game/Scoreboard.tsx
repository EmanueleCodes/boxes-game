import type { Player } from './types'

interface ScoreboardProps {
	players: Player[]
	currentPlayerId: string | null
}

/**
 * Scoreboard - Displays player rankings and scores
 */
export function Scoreboard({ players, currentPlayerId }: ScoreboardProps) {
	const sortedPlayers = [...players].sort((a, b) => b.score - a.score)

	return (
		<div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
			<h3 className="text-white font-semibold mb-3">Scoreboard</h3>
			<div className="space-y-2">
				{sortedPlayers.map((player, index) => (
					<div
						key={player.id}
						className={`flex items-center justify-between p-2 rounded ${
							player.id === currentPlayerId
								? 'bg-cyan-500/20 border border-cyan-500/50'
								: 'bg-slate-800'
						}`}
					>
						<div className="flex items-center gap-2">
							<span className="text-gray-400 w-6">{index + 1}.</span>
							<span className="text-white">{player.name}</span>
							{player.id === currentPlayerId && (
								<span className="text-xs text-cyan-400">(you)</span>
							)}
						</div>
						<span className="text-cyan-400 font-mono">{player.score}</span>
					</div>
				))}
			</div>
		</div>
	)
}
