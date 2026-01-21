import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { BoxRenderer } from '@/components/game/BoxRenderer'
import { simpleStatic } from '@/lib/game/patterns/simpleStatic'
import { slidingPlane } from '@/lib/game/patterns/slidingPlane'
import { snakeStaggered } from '@/lib/game/patterns/snakeStaggered'
import type { Box } from '@/lib/types'

export const Route = createFileRoute('/dev/boxes')({
	component: DevBoxesPage,
})

type PatternName = 'simpleStatic' | 'slidingPlane' | 'snakeStaggered' | 'custom'

const patterns = {
	simpleStatic,
	slidingPlane,
	snakeStaggered,
}

function DevBoxesPage() {
	// Pattern selection
	const [selectedPattern, setSelectedPattern] = useState<PatternName>('simpleStatic')

	// Custom pattern controls
	const [boxCount, setBoxCount] = useState(9)
	const [boxSize, setBoxSize] = useState(1)
	const [adjacent, setAdjacent] = useState(true) // Boxes touching each other
	const [spacing, setSpacing] = useState(1)
	const [layout, setLayout] = useState<'grid' | 'line' | 'random' | 'stack'>('grid')
	
	// Effective spacing: if adjacent, spacing equals box size
	const effectiveSpacing = adjacent ? boxSize : spacing

	// Camera controls
	const [cameraZoom, setCameraZoom] = useState<number | null>(null) // null = auto
	const [showGround, setShowGround] = useState(true)

	// Generate boxes based on selection
	const boxes = useMemo<Box[]>(() => {
		if (selectedPattern !== 'custom') {
			return patterns[selectedPattern]().boxes
		}

		// Generate custom pattern
		return generateCustomBoxes(boxCount, boxSize, effectiveSpacing, layout)
	}, [selectedPattern, boxCount, boxSize, effectiveSpacing, layout])

	const patternInfo = useMemo(() => {
		if (selectedPattern !== 'custom') {
			const group = patterns[selectedPattern]()
			return {
				count: group.correctCount,
				animation: group.animation,
			}
		}
		return {
			count: boxes.length,
			animation: { type: 'static' as const, visibleDuration: 3000 },
		}
	}, [selectedPattern, boxes.length])

	return (
		<div className="min-h-screen bg-slate-900 text-white p-6">
			<div className="w-full mx-auto">
				{/* Header */}
				<div className="mb-6">
					<h1 className="text-3xl font-bold mb-2">Box Pattern Playground</h1>
					<p className="text-gray-400">
						Test and preview box patterns, camera angles, and rendering
					</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Controls Panel */}
					<div className="lg:col-span-1 space-y-6">
						{/* Pattern Selection */}
						<ControlPanel title="Pattern">
							<div className="space-y-2">
								{(['simpleStatic', 'slidingPlane', 'snakeStaggered', 'custom'] as const).map(
									(pattern) => (
										<button
											key={pattern}
											onClick={() => setSelectedPattern(pattern)}
											className={`w-full px-4 py-2 rounded-lg text-left transition-colors ${
												selectedPattern === pattern
													? 'bg-cyan-500 text-white'
													: 'bg-slate-700 hover:bg-slate-600'
											}`}
										>
											{pattern === 'simpleStatic' && '2x2 Grid (Simple)'}
											{pattern === 'slidingPlane' && 'Horizontal Line (Slide)'}
											{pattern === 'snakeStaggered' && 'L-Shape Snake (Stagger)'}
											{pattern === 'custom' && 'Custom Pattern'}
										</button>
									)
								)}
							</div>
						</ControlPanel>

						{/* Custom Pattern Controls */}
						{selectedPattern === 'custom' && (
							<ControlPanel title="Custom Pattern">
								<div className="space-y-4">
									<SliderControl
										label="Box Count"
										value={boxCount}
										min={1}
										max={64}
										onChange={setBoxCount}
									/>
									<SliderControl
										label="Box Size"
										value={boxSize}
										min={0.5}
										max={2}
										step={0.1}
										onChange={setBoxSize}
									/>
									<div className="flex items-center justify-between">
										<span className="text-sm text-gray-400">Adjacent (touching)</span>
										<button
											onClick={() => setAdjacent(!adjacent)}
											className={`px-3 py-1 rounded text-sm ${
												adjacent
													? 'bg-cyan-500 text-white'
													: 'bg-slate-700 text-gray-300'
											}`}
										>
											{adjacent ? 'ON' : 'OFF'}
										</button>
									</div>
									{!adjacent && (
										<SliderControl
											label="Spacing"
											value={spacing}
											min={1}
											max={5}
											step={0.5}
											onChange={setSpacing}
										/>
									)}
									<div>
										<label className="text-sm text-gray-400 block mb-2">Layout</label>
										<select
											value={layout}
											onChange={(e) => setLayout(e.target.value as typeof layout)}
											className="w-full bg-slate-700 rounded-lg px-3 py-2"
										>
											<option value="grid">Grid</option>
											<option value="line">Line</option>
											<option value="random">Random</option>
											<option value="stack">Vertical Stack</option>
										</select>
									</div>
								</div>
							</ControlPanel>
						)}

						{/* Camera Controls */}
						<ControlPanel title="Camera">
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<span className="text-sm text-gray-400">Auto Zoom</span>
									<button
										onClick={() => setCameraZoom(cameraZoom === null ? 20 : null)}
										className={`px-3 py-1 rounded text-sm ${
											cameraZoom === null
												? 'bg-cyan-500 text-white'
												: 'bg-slate-700 text-gray-300'
										}`}
									>
										{cameraZoom === null ? 'ON' : 'OFF'}
									</button>
								</div>
								{cameraZoom !== null && (
									<SliderControl
										label="Zoom Level"
										value={cameraZoom}
										min={5}
										max={150}
										onChange={setCameraZoom}
									/>
								)}
								<div className="flex items-center justify-between">
									<span className="text-sm text-gray-400">Show Ground</span>
									<button
										onClick={() => setShowGround(!showGround)}
										className={`px-3 py-1 rounded text-sm ${
											showGround
												? 'bg-cyan-500 text-white'
												: 'bg-slate-700 text-gray-300'
										}`}
									>
										{showGround ? 'ON' : 'OFF'}
									</button>
								</div>
							</div>
						</ControlPanel>

						{/* Pattern Info */}
						<ControlPanel title="Pattern Info">
							<div className="space-y-2 text-sm">
								<div className="flex justify-between">
									<span className="text-gray-400">Box Count:</span>
									<span className="font-mono text-cyan-400">{patternInfo.count}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-400">Animation:</span>
									<span className="font-mono text-cyan-400">
										{patternInfo.animation.type}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-400">Duration:</span>
									<span className="font-mono text-cyan-400">
										{patternInfo.animation.visibleDuration}ms
									</span>
								</div>
							</div>
						</ControlPanel>

						{/* Quick Actions */}
						<ControlPanel title="Actions">
							<div className="space-y-2">
								<button
									onClick={() => {
										// Force re-render by toggling pattern
										const current = selectedPattern
										setSelectedPattern('custom')
										setTimeout(() => setSelectedPattern(current), 0)
									}}
									className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg"
								>
									Refresh View
								</button>
								<button
									onClick={() => {
										console.log('Boxes:', JSON.stringify(boxes, null, 2))
									}}
									className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg"
								>
									Log Boxes to Console
								</button>
							</div>
						</ControlPanel>
					</div>

					{/* Preview Panel */}
					<div className="lg:col-span-2">
						<ControlPanel title="3D Preview">
							<div className="aspect-[4/3] w-full min-h-[500px]">
								<BoxRenderer 
									boxes={boxes} 
									zoom={cameraZoom ?? undefined}
									showGround={showGround}
								/>
							</div>
						</ControlPanel>

						{/* Box Data Table */}
						<div className="mt-6">
							<ControlPanel title="Box Data">
								<div className="overflow-x-auto">
									<table className="w-full text-sm">
										<thead>
											<tr className="text-left text-gray-400 border-b border-slate-700">
												<th className="pb-2 pr-4">#</th>
												<th className="pb-2 pr-4">X</th>
												<th className="pb-2 pr-4">Y</th>
												<th className="pb-2 pr-4">Z</th>
												<th className="pb-2 pr-4">Size</th>
												<th className="pb-2">Color</th>
											</tr>
										</thead>
										<tbody>
											{boxes.map((box, i) => (
												<tr key={i} className="border-b border-slate-800">
													<td className="py-2 pr-4 text-gray-500">{i + 1}</td>
													<td className="py-2 pr-4 font-mono">{box.x}</td>
													<td className="py-2 pr-4 font-mono">{box.y}</td>
													<td className="py-2 pr-4 font-mono">{box.z}</td>
													<td className="py-2 pr-4 font-mono">{box.size}</td>
													<td className="py-2">
														<span
															className="inline-block w-4 h-4 rounded mr-2"
															style={{ backgroundColor: box.color }}
														/>
														<span className="font-mono text-xs">{box.color}</span>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</ControlPanel>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

/**
 * Control panel wrapper
 */
function ControlPanel({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
			<h3 className="text-lg font-semibold mb-4 text-white">{title}</h3>
			{children}
		</div>
	)
}

/**
 * Slider control component
 */
function SliderControl({
	label,
	value,
	min,
	max,
	step = 1,
	onChange,
}: {
	label: string
	value: number
	min: number
	max: number
	step?: number
	onChange: (value: number) => void
}) {
	return (
		<div>
			<div className="flex justify-between text-sm mb-1">
				<label className="text-gray-400">{label}</label>
				<span className="font-mono text-cyan-400">{value}</span>
			</div>
			<input
				type="range"
				value={value}
				min={min}
				max={max}
				step={step}
				onChange={(e) => onChange(Number(e.target.value))}
				className="w-full accent-cyan-500"
			/>
		</div>
	)
}

/**
 * Generate custom box pattern
 */
function generateCustomBoxes(
	count: number,
	size: number,
	spacing: number,
	layout: 'grid' | 'line' | 'random' | 'stack'
): Box[] {
	const boxes: Box[] = []
	const color = '#60a5fa'

	switch (layout) {
		case 'grid': {
			const cols = Math.ceil(Math.sqrt(count))
			for (let i = 0; i < count; i++) {
				const col = i % cols
				const row = Math.floor(i / cols)
				boxes.push({
					x: (col - (cols - 1) / 2) * spacing,
					y: 0,
					z: (row - (cols - 1) / 2) * spacing,
					size,
					color,
				})
			}
			break
		}
		case 'line': {
			for (let i = 0; i < count; i++) {
				boxes.push({
					x: (i - (count - 1) / 2) * spacing,
					y: 0,
					z: 0,
					size,
					color,
				})
			}
			break
		}
		case 'random': {
			const spread = spacing * Math.sqrt(count)
			for (let i = 0; i < count; i++) {
				boxes.push({
					x: (Math.random() - 0.5) * spread,
					y: 0,
					z: (Math.random() - 0.5) * spread,
					size,
					color,
				})
			}
			break
		}
		case 'stack': {
			for (let i = 0; i < count; i++) {
				boxes.push({
					x: 0,
					y: i * spacing,
					z: 0,
					size,
					color,
				})
			}
			break
		}
	}

	return boxes
}
