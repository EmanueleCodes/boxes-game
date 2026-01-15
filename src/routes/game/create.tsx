import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Copy, Check, ArrowRight } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'

export const Route = createFileRoute('/game/create')({
    component: CreateGame,
})

function CreateGame() {
    const [roomId, setRoomId] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    const createGameRoomMutation = useMutation({
        mutationFn: async () => {
            return await trpcClient.game.create.mutate()
        },
        onSuccess: (data) => {
            setRoomId(data.roomId)
            // Store playerId in localStorage for later use
            localStorage.setItem('playerId', data.playerId)
        },
        onError: (error: Error) => {
            console.error('Failed to create room:', error)
            alert('Failed to create room. Please try again.')
        },
    })

    const handleCreateRoom = () => {
        createGameRoomMutation.mutate()
    }

    const handleCopyRoomId = async () => {
        if (roomId) {
            try {
                await navigator.clipboard.writeText(roomId)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
            } catch (err) {
                console.error('Failed to copy:', err)
            }
        }
    }


    return (
        <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 shadow-xl">
                <h1 className="text-3xl font-bold text-white mb-2 text-center">
                    Create Game Room
                </h1>
                <p className="text-gray-400 text-center mb-8">
                    Start a new multiplayer counting game
                </p>

                {!roomId ? (
                    <div className="space-y-4">
                        <button
                            onClick={handleCreateRoom}
                            disabled={createGameRoomMutation.isPending}
                            className="w-full px-6 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-500/50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/50 flex items-center justify-center gap-2"
                        >
                            {createGameRoomMutation.isPending ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    Creating Room...
                                </>
                            ) : (
                                <>
                                    Create Room
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>

                        <div className="text-center">
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
                ) : (
                    <div className="space-y-4">
                        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
                            <label className="text-sm text-gray-400 mb-2 block">
                                Room ID
                            </label>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 text-2xl font-mono font-bold text-cyan-400 bg-slate-800 px-4 py-3 rounded-lg">
                                    {roomId}
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

                        <p className="text-sm text-gray-400 text-center">
                            Share this Room ID with other players to join your
                            game
                        </p>

                        <button
                            onClick={() => {
                                if (roomId) {
                                    window.location.href = `/game/${roomId}`
                                }
                            }}
                            className="w-full px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/50 flex items-center justify-center gap-2"
                        >
                            Go to Room
                            <ArrowRight className="w-5 h-5" />
                        </button>

                        <div className="text-center">
                            <button
                                onClick={() => {
                                    setRoomId(null)
                                    createGameRoomMutation.reset()
                                }}
                                className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
                            >
                                Create Another Room
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

