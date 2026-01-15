import { trpcClient } from "@/integrations/tanstack-query/root-provider"
import { createFileRoute } from "@tanstack/react-router"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { ArrowRight } from "lucide-react"

export const Route = createFileRoute('/game/join')({
    component: JoinGame,
})

function JoinGame() {
    const [roomId, setRoomId] = useState<string>("")
    const [playerName, setPlayerName] = useState<string>("")

    const joinGame = useMutation({
        mutationFn: async () => {
            return await trpcClient.game.join.mutate({
                roomId: roomId.toUpperCase().trim(),
                playerName: playerName.trim(),
            })
        },
        onSuccess: (data) => {
            // Store playerId for later use
            localStorage.setItem('playerId', data.playerId)
            window.location.href = `/game/${data.roomState.roomId}`
        },
        onError: (error: Error) => {
            console.error('Failed to join game:', error)
        },
    })

    const canJoin = roomId.trim().length > 0 && playerName.trim().length > 0
    
    return (
        <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 shadow-xl">
                <h1 className="text-3xl font-bold text-white mb-2 text-center">
                    Join Game Room
                </h1>
                <p className="text-gray-400 text-center mb-8">
                    Enter room ID and your name to join
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">
                            Room ID
                        </label>
                        <input 
                            type="text" 
                            placeholder="ABC123" 
                            value={roomId}
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white text-2xl font-mono font-bold text-center uppercase tracking-wider focus:outline-none focus:border-cyan-500"
                            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                            maxLength={6}
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">
                            Player Name
                        </label>
                        <input 
                            type="text" 
                            placeholder="Enter your name" 
                            value={playerName} 
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                            onChange={(e) => setPlayerName(e.target.value)}
                        />
                    </div>

                    {joinGame.isError && (
                        <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
                            {joinGame.error?.message || 'Failed to join game. Please check the room ID and try again.'}
                        </div>
                    )}

                    <button 
                        onClick={() => joinGame.mutate()}
                        disabled={!canJoin || joinGame.isPending}
                        className="w-full px-6 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-500/50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/50 flex items-center justify-center gap-2"
                    >
                        {joinGame.isPending ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                Joining...
                            </>
                        ) : (
                            <>
                                Join Room
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>

                    <div className="text-center space-y-2">
                        <button
                            onClick={() => {
                                window.location.href = '/game/create'
                            }}
                            className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
                        >
                            Create Room Instead
                        </button>
                        <div>
                            <button
                                onClick={() => {
                                    window.location.href = '/'
                                }}
                                className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
                            >
                                ← Back to Home
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}