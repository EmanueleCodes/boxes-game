import { useState } from 'react'
import { Copy, Check, Wifi, WifiOff } from 'lucide-react'

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'

interface RoomHeaderProps {
	roomId: string
	connectionState: ConnectionState
	usePolling: boolean
}

/**
 * RoomHeader - Displays room title, ID, and connection status
 */
export function RoomHeader({ roomId, connectionState, usePolling }: RoomHeaderProps) {
	const [copied, setCopied] = useState(false)

	const handleCopyRoomId = async () => {
		try {
			await navigator.clipboard.writeText(roomId)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		} catch (err) {
			console.error('Failed to copy:', err)
		}
	}

	return (
		<div className="text-center mb-8">
			<div className="flex items-center justify-center gap-3 mb-2">
				<h1 className="text-3xl font-bold text-white">Game Room</h1>
				<ConnectionIndicator
					connectionState={connectionState}
					usePolling={usePolling}
				/>
			</div>
			<div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
				<label className="text-sm text-gray-400 mb-2 block">Room ID</label>
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
		</div>
	)
}

function ConnectionIndicator({
	connectionState,
	usePolling,
}: {
	connectionState: ConnectionState
	usePolling: boolean
}) {
	if (usePolling) {
		return (
			<div title="Auto-updating every 2s">
				<Wifi className="w-5 h-5 text-green-400" />
			</div>
		)
	}

	if (connectionState === 'connected') {
		return (
			<div title="Connected">
				<Wifi className="w-5 h-5 text-green-400" />
			</div>
		)
	}

	if (connectionState === 'connecting') {
		return (
			<div title="Connecting...">
				<Wifi className="w-5 h-5 text-yellow-400 animate-pulse" />
			</div>
		)
	}

	return (
		<div title="Disconnected">
			<WifiOff className="w-5 h-5 text-red-400" />
		</div>
	)
}
