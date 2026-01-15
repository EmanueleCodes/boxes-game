import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Copy, Check, Users, ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/game/$roomId')({
	component: RouteComponent,
})

function RouteComponent() {
	const { roomId } = Route.useParams()
	const [copied, setCopied] = useState(false)

	const roomQuery = useQuery({
		queryKey: ['room', roomId],
		queryFn: async () => {
			return await trpcClient.game.status.query({ roomId })
		},
		refetchInterval: 2000, // Refresh every 2 seconds to see new players
	})

	const handleCopyRoomId = async () => {
		try {
			await navigator.clipboard.writeText(roomId)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		} catch (err) {
			console.error('Failed to copy:', err)
		}
	}

	if (roomQuery.isLoading) {
		return (
			<div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
				<div className="text-white text-xl">Loading room...</div>
			</div>
		)
	}

	if (roomQuery.isError) {
		return (
			<div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
				<div className="max-w-md w-full bg-slate-800/50 backdrop-blur-sm border border-red-700 rounded-xl p-8 shadow-xl">
					<h1 className="text-3xl font-bold text-white mb-4 text-center">
						Room Not Found
					</h1>
					<p className="text-gray-400 text-center mb-6">
						{roomQuery.error?.message || 'This room does not exist or has been closed.'}
					</p>
					<div className="space-y-3">
						<button
							onClick={() => {
								window.location.href = '/game/create'
							}}
							className="w-full px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors"
						>
							Create New Room
						</button>
						<button
							onClick={() => {
								window.location.href = '/game/join'
							}}
							className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
						>
							Join Different Room
						</button>
					</div>
				</div>
			</div>
		)
	}

	if (!roomQuery.data) {
		return (
			<div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
				<div className="text-white">No room data available</div>
			</div>
		)
	}

	const room = roomQuery.data.room
	const playerCount = room.players.length
	const minPlayers = 2
	const canStart = playerCount >= minPlayers

	return (
		<div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
			<div className="max-w-2xl w-full bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 shadow-xl">
				{/* Header */}
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-white mb-2">Game Room</h1>
					<div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
						<label className="text-sm text-gray-400 mb-2 block">Room ID</label>
						<div className="flex items-center gap-2">
							<code className="flex-1 text-2xl font-mono font-bold text-cyan-400 bg-slate-800 px-4 py-3 rounded-lg">
								{room.roomId}
							</code>
							<button
								onClick={handleCopyRoomId}
								className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
								title="Copy Room ID"
							>
								{copied ? (
									<Check className="w-5 h-5 text-green-400" />
								) : (
									<Copy className="w-5 h-5 text-gray-300" />
								)}
							</button>
						</div>
					</div>
				</div>

				{/* Game State Display */}
				{room.gameState !== 'waiting' && (
					<div className="mb-6 p-4 bg-yellow-900/50 border border-yellow-700 rounded-lg">
						<p className="text-yellow-300 text-center">
							Game Status: <span className="font-semibold capitalize">{room.gameState}</span>
						</p>
					</div>
				)}

				{/* Waiting Room */}
				{room.gameState === 'waiting' && (
					<div className="space-y-6">
						{/* Player Count */}
						<div className="flex items-center justify-center gap-2 text-gray-300">
							<Users className="w-5 h-5" />
							<span className="text-lg">
								{playerCount} / {minPlayers}+ players
							</span>
						</div>

						{/* Status Message */}
						<div className="text-center">
							{canStart ? (
								<p className="text-green-400 text-lg font-semibold">
									✓ Ready to start! Waiting for game to begin...
								</p>
							) : (
								<p className="text-yellow-400 text-lg font-semibold">
									Waiting for players... Need {minPlayers - playerCount} more player{minPlayers - playerCount > 1 ? 's' : ''}
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
									{room.players.map((player) => (
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
				)}

				{/* Navigation */}
				<div className="mt-8 text-center">
					<button
						onClick={() => {
							window.location.href = '/'
						}}
						className="text-gray-400 hover:text-gray-300 text-sm transition-colors flex items-center justify-center gap-2 mx-auto"
					>
						<ArrowLeft className="w-4 h-4" />
						Back to Home
					</button>
				</div>
			</div>
		</div>
	)
}
