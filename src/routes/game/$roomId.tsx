import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useWebSocket } from '@/hooks/useWebSocket'
import type { ServerMessage } from '@/lib/websocket/messages'
import { RoomHeader, WaitingRoom, GameView } from '@/components/game'

// Note: WebSocket is disabled because Cloudflare Workers require Durable Objects
// to maintain state across isolates. Using polling as a reliable fallback.

export const Route = createFileRoute('/game/$roomId')({
	component: RouteComponent,
})

function RouteComponent() {
	const { roomId } = Route.useParams()
	const queryClient = useQueryClient()
	const playerId = typeof window !== 'undefined' ? localStorage.getItem('playerId') : null

	// WebSocket requires Durable Objects on Cloudflare Workers to maintain state.
	// For now, we use polling which works reliably across all environments.
	const usePolling = true

	const roomQuery = useQuery({
		queryKey: ['room', roomId],
		queryFn: async () => {
			return await trpcClient.game.status.query({ roomId })
		},
		refetchInterval: usePolling ? 2000 : false,
	})

	const startGameMutation = useMutation({
		mutationFn: async () => {
			return await trpcClient.game.start.mutate({ roomId })
		},
		onSuccess: () => {
			queryClient.refetchQueries({ queryKey: ['room', roomId] })
		},
		onError: (error: Error) => {
			console.error('Failed to start game:', error)
			alert(error.message || 'Failed to start game. Please try again.')
		},
	})

	// WebSocket connection (disabled when using polling)
	const { connectionState } = useWebSocket({
		roomId,
		playerId: usePolling ? null : playerId,
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

	// Validate player access to room (disabled in development for easier UI testing)
	const isDev = import.meta.env.DEV

	useEffect(() => {
		if (isDev) return // Skip validation in dev mode
		if (!roomQuery.data) return

		const room = roomQuery.data.room
		const isPlayerInRoom = playerId ? room.players.some((p) => p.id === playerId) : false

		if (room.gameState === 'started' && !isPlayerInRoom) {
			alert('This game has already started. You cannot join a game that is already in progress.')
			window.location.href = '/game/join'
		}
	}, [roomQuery.data, playerId, isDev])

	// Loading state
	if (roomQuery.isLoading) {
		return (
			<PageLayout>
				<div className="text-white text-xl">Loading room...</div>
			</PageLayout>
		)
	}

	// Error state
	if (roomQuery.isError) {
		return (
			<PageLayout>
				<ErrorView
					message={roomQuery.error?.message || 'This room does not exist or has been closed.'}
				/>
			</PageLayout>
		)
	}

	// No data state
	if (!roomQuery.data) {
		return (
			<PageLayout>
				<div className="text-white">No room data available</div>
			</PageLayout>
		)
	}

	const room = roomQuery.data.room

	return (
		<PageLayout>

			{/* Navigation */}
			<div className="mt-8 text-center fixed w-sm h-[20px] top-4 left-4">
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

			{room.gameState === 'notStarted' && (<div className="h-full w-full max-w-4xl mx-auto bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 shadow-xl">
				
				{/* Room Header */}
				<RoomHeader
						roomId={room.roomId}
						connectionState={connectionState}
						usePolling={usePolling}
					/>
				
				{/* Waiting Room */}
				
				<WaitingRoom
					players={room.players}
					minPlayers={2}
					onStartGame={() => startGameMutation.mutate()}
					isStarting={startGameMutation.isPending}
				/>
			</div>)}

			{/* Game Finished */}
			{room.gameState === 'finished' && (
				<div className="mb-6 p-4 bg-green-900/50 border border-green-700 rounded-lg">
					<p className="text-green-300 text-center text-lg font-semibold">
						Game Complete!
					</p>
				</div>
			)}

			

			{/* Active Game */}
			{room.gameState === 'started' && (
				<GameView room={room} playerId={playerId} />
			)}
			
		</PageLayout>
	)
}

/**
 * Page layout wrapper
 */
function PageLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
			{children}
		</div>
	)
}

/**
 * Error view when room is not found
 */
function ErrorView({ message }: { message: string }) {
	return (
		<div className="max-w-md w-full bg-slate-800/50 backdrop-blur-sm border border-red-700 rounded-xl p-8 shadow-xl">
			<h1 className="text-3xl font-bold text-white mb-4 text-center">Room Not Found</h1>
			<p className="text-gray-400 text-center mb-6">{message}</p>
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
	)
}
