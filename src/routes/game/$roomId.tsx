import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Copy, Check, Users, ArrowLeft, Wifi, WifiOff } from 'lucide-react'
import { useWebSocket } from '@/hooks/useWebSocket'
import type { ServerMessage } from '@/lib/websocket/messages'

// Note: WebSocket is disabled because Cloudflare Workers require Durable Objects
// to maintain state across isolates. Using polling as a reliable fallback.

export const Route = createFileRoute('/game/$roomId')({
  component: RouteComponent,
})

function RouteComponent() {
	const { roomId } = Route.useParams()
	const [copied, setCopied] = useState(false)
	const queryClient = useQueryClient()
	const playerId = typeof window !== 'undefined' ? localStorage.getItem('playerId') : null

	// WebSocket requires Durable Objects on Cloudflare Workers to maintain state.
	// For now, we use polling which works reliably across all environments.
	// TODO: Implement Durable Objects for true real-time WebSocket support
	const usePolling = true // Always use polling until Durable Objects are implemented

	const roomQuery = useQuery({
		queryKey: ['room', roomId],
		queryFn: async () => {
			return await trpcClient.game.status.query({ roomId })
		},
		// Use polling for real-time updates (2 second interval)
		refetchInterval: usePolling ? 2000 : false,
	})

	const startGameMutation = useMutation({
		mutationFn: async () => {
			return await trpcClient.game.start.mutate({ roomId })
		},
		onSuccess: () => {
			// Refetch room status to get updated game state
			queryClient.refetchQueries({ queryKey: ['room', roomId] })
		},
		onError: (error: Error) => {
			console.error('Failed to start game:', error)
			alert(error.message || 'Failed to start game. Please try again.')
		},
	})

	// WebSocket connection disabled - requires Durable Objects on Cloudflare Workers
	// Using polling instead for reliable cross-isolate state management
	const { connectionState } = useWebSocket({
		roomId,
		playerId: usePolling ? null : playerId, // Disable WebSocket when using polling
		autoReconnect: !usePolling,
		onPlayerJoined: () => {
			queryClient.refetchQueries({ queryKey: ['room', roomId] })
		},
		onPlayerLeft: () => {
			queryClient.refetchQueries({ queryKey: ['room', roomId] })
		},
		onMessage: (message: ServerMessage) => {
			if (message.type === 'gameStarting' || message.type === 'roundStart') {
				queryClient.refetchQueries({ queryKey: ['room', roomId] })
			}
		},
		onError: (error) => {
			console.error('WebSocket error:', error)
		},
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

	// Validate player access to room - must be before any early returns (Rules of Hooks)
	useEffect(() => {
		if (!roomQuery.data) return // Don't check until data is loaded

		const room = roomQuery.data.room
		const isPlayerInRoom = playerId ? room.players.some(p => p.id === playerId) : false

		// Redirect if game has started and user is not a player
		if (room.gameState === 'started' && !isPlayerInRoom) {
			// Game is in progress and user is not authorized - redirect to join page
			alert('This game has already started. You cannot join a game that is already in progress.')
			window.location.href = '/game/join'
		}
	}, [roomQuery.data, playerId])

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
					<div className="flex items-center justify-center gap-3 mb-2">
						<h1 className="text-3xl font-bold text-white">Game Room</h1>
						{/* Show polling status - green when data is fresh */}
						{usePolling ? (
							<div title="Auto-updating every 2s">
								<Wifi className="w-5 h-5 text-green-400" />
							</div>
						) : connectionState === 'connected' ? (
							<div title="Connected">
								<Wifi className="w-5 h-5 text-green-400" />
							</div>
						) : connectionState === 'connecting' ? (
							<div title="Connecting...">
								<Wifi className="w-5 h-5 text-yellow-400 animate-pulse" />
							</div>
						) : (
							<div title="Disconnected">
								<WifiOff className="w-5 h-5 text-red-400" />
							</div>
						)}
					</div>
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
				{room.gameState !== 'notStarted' && (
					<div className="mb-6 p-4 bg-yellow-900/50 border border-yellow-700 rounded-lg">
						<p className="text-yellow-300 text-center">
							Game Status: <span className="font-semibold capitalize">{room.gameState}</span>
							{room.gameState === 'started' && (
								<span className="ml-2">- Round {room.currentRound} ({room.roundState})</span>
							)}
						</p>
					</div>
				)}

				{/* Waiting Room */}
				{room.gameState === 'notStarted' && (
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
										onClick={() => startGameMutation.mutate()}
										disabled={startGameMutation.isPending}
										className="w-full px-6 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-cyan-500/50"
									>
										{startGameMutation.isPending ? 'Starting Game...' : 'Start Game'}
									</button>
								</>
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
