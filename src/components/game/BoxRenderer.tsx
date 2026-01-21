import { Canvas, useThree } from '@react-three/fiber'
import { Edges } from '@react-three/drei'
import { useMemo, useEffect } from 'react'
import * as THREE from 'three'
import type { Box } from '@/lib/types'

interface BoxRendererProps {
    boxes: Box[]
    /** Override automatic zoom calculation */
    zoom?: number
    /** Show ground plane */
    showGround?: boolean
}

/**
 * Individual 3D box component with isometric styling
 * Light gray color with darker edges for depth
 */
function Box3D({ box }: { box: Box }) {
    const baseColor = '#d1d5db' // Light gray (Tailwind gray-300)
    const edgeColor = '#6b7280' // Darker gray for edges (Tailwind gray-500)
    
    return (
        <mesh position={[box.x, box.y + box.size / 2, box.z]}>
            <boxGeometry args={[box.size, box.size, box.size]} />
            <meshStandardMaterial color={baseColor} />
            <Edges color={edgeColor} threshold={15} />
        </mesh>
    )
}

/**
 * 8x8 ground plane with subtle grid
 */
function Ground({ center }: { center: { x: number; z: number } }) {
    const gridSize = 8
    const cellSize = 1 // Each cell is 1 unit (same as box size)
    const totalSize = gridSize * cellSize
    
    return (
        <group position={[center.x, 0, center.z]}>
            {/* Base plane */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
                <planeGeometry args={[totalSize, totalSize]} />
                <meshStandardMaterial color="#212222" />
            </mesh>
            {/* Grid lines */}
            <gridHelper 
                args={[totalSize, gridSize, '#3a3b3b', '#2d2e2e']} 
                position={[0, -0.01, 0]}
            />
        </group>
    )
}

/**
 * Camera controller that sets up isometric view and looks at scene center
 */
function IsometricCamera({ 
    center, 
    zoom 
}: { 
    center: { x: number; y: number; z: number }
    zoom: number 
}) {
    const { camera } = useThree()

    useEffect(() => {
        // Position camera for isometric view
        // True isometric angle: camera elevated at ~35.264° (atan(1/√2))
        const distance = 100
        camera.position.set(
            center.x + distance,
            center.y + distance * 0.8, // Slightly lower for better view
            center.z + distance
        )
        
        // Look at the center of the scene
        camera.lookAt(center.x, center.y, center.z)
        
        // Set zoom for orthographic camera
        if (camera instanceof THREE.OrthographicCamera) {
            camera.zoom = zoom
            camera.updateProjectionMatrix()
        }
    }, [camera, center, zoom])

    return null
}

/**
 * BoxRenderer - Main component for rendering boxes in isometric 3D view
 * 
 * Uses React Three Fiber with OrthographicCamera for true isometric perspective.
 * Renders boxes with light gray color and darker edges matching Figma reference.
 */
export function BoxRenderer({ boxes, zoom: zoomOverride, showGround = true }: BoxRendererProps) {
    // Calculate bounds and center of all boxes
    const { center, maxExtent, groundSize } = useMemo(() => {
        if (boxes.length === 0) {
            return { center: { x: 0, y: 0, z: 0 }, maxExtent: 5, groundSize: 20 }
        }

        // Find bounding box
        let minX = Infinity, maxX = -Infinity
        let minY = Infinity, maxY = -Infinity
        let minZ = Infinity, maxZ = -Infinity

        for (const box of boxes) {
            const halfSize = box.size / 2
            minX = Math.min(minX, box.x - halfSize)
            maxX = Math.max(maxX, box.x + halfSize)
            minY = Math.min(minY, box.y)
            maxY = Math.max(maxY, box.y + box.size)
            minZ = Math.min(minZ, box.z - halfSize)
            maxZ = Math.max(maxZ, box.z + halfSize)
        }

        // Calculate center of boxes
        const center = {
            x: (minX + maxX) / 2,
            y: (minY + maxY) / 2,
            z: (minZ + maxZ) / 2,
        }

        // Calculate max extent for zoom calculation
        const extentX = maxX - minX
        const extentY = maxY - minY
        const extentZ = maxZ - minZ
        const maxExtent = Math.max(extentX, extentY, extentZ, 2)

        // Ground size should cover the boxes with padding
        const groundSize = Math.max(extentX, extentZ) * 2 + 6

        return { center, maxExtent, groundSize }
    }, [boxes])

    // Calculate zoom to fit boxes in view
    const calculatedZoom = 50 / maxExtent
    const zoom = zoomOverride ?? calculatedZoom

    return (
        <div className="w-full h-full min-h-[400px] bg-[#e8e8e8] rounded-xl overflow-hidden">
            <Canvas orthographic camera={{ zoom: 1, position: [100, 100, 100], near: 0.1, far: 1000 }}>
                {/* Custom camera controller for isometric view */}
                <IsometricCamera center={center} zoom={zoom} />

                {/* Lighting for depth */}
                <ambientLight intensity={0.6} />
                <directionalLight position={[50, 100, 50]} intensity={0.8} />
                <directionalLight position={[-30, 50, -30]} intensity={0.3} />

                {/* 8x8 ground plane with grid */}
                {showGround && <Ground center={{ x: center.x, z: center.z }} />}

                {/* Render all boxes */}
                {boxes.map((box, index) => (
                    <Box3D key={index} box={box} />
                ))}
            </Canvas>
        </div>
    )
}

export default BoxRenderer
