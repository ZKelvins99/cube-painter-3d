import { useMemo } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { Edges } from '@react-three/drei'
import * as THREE from 'three'
import { computeHingePoses } from '@/animation/foldHierarchy'
import { UNFOLD_LAYOUTS } from '@/data/unfoldLayouts'
import { FACE_LABELS } from '@/lib/faceLabels'
import { useCubeStore } from '@/store/cubeStore'
import { type FaceId } from '@/types/cube'

function FacePlane({
  faceId,
  canvas,
  textureVersion,
  onClick,
  onPointerOver,
  onPointerOut,
}: {
  faceId: FaceId
  canvas: HTMLCanvasElement
  textureVersion: number
  onClick: (event: ThreeEvent<MouseEvent>) => void
  onPointerOver: (event: ThreeEvent<PointerEvent>) => void
  onPointerOut: (event: ThreeEvent<PointerEvent>) => void
}) {
  const texture = useMemo(() => {
    const map = new THREE.CanvasTexture(canvas)
    map.colorSpace = THREE.SRGBColorSpace
    map.flipY = false
    map.needsUpdate = true
    return map
  }, [canvas, textureVersion])

  return (
    <mesh
      userData={{ title: FACE_LABELS[faceId] }}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} color="#ffffff" side={THREE.DoubleSide} toneMapped={false} />
      <Edges color="#94a3b8" threshold={15} />
    </mesh>
  )
}

type CubeMeshProps = {
  canvases: Record<FaceId, HTMLCanvasElement>
  textureVersion: number
}

export function CubeMesh({ canvases, textureVersion }: CubeMeshProps) {
  const unfoldType = useCubeStore((s) => s.unfoldType)
  const foldProgress = useCubeStore((s) => s.foldProgress)
  const setActiveFace = useCubeStore((s) => s.setActiveFace)
  const setHoveredFace3d = useCubeStore((s) => s.setHoveredFace3d)

  const layout = UNFOLD_LAYOUTS[unfoldType - 1]
  const poses = useMemo(
    () => computeHingePoses(unfoldType, foldProgress),
    [unfoldType, foldProgress],
  )

  const handleFaceClick = (faceId: FaceId) => (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    setActiveFace(faceId)
  }

  const handleFacePointerOver = (faceId: FaceId) => (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    setHoveredFace3d(faceId)
    document.body.style.cursor = 'pointer'
  }

  const handleFacePointerOut = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    setHoveredFace3d(null)
    document.body.style.cursor = 'auto'
  }

  return (
    <group>
      {layout.cells.map((cell) => {
        const faceId = cell.faceId
        const { position, rotation } = poses[faceId]
        return (
          <group key={faceId} position={position} rotation={rotation}>
            <FacePlane
              faceId={faceId}
              canvas={canvases[faceId]}
              textureVersion={textureVersion}
              onClick={handleFaceClick(faceId)}
              onPointerOver={handleFacePointerOver(faceId)}
              onPointerOut={handleFacePointerOut}
            />
          </group>
        )
      })}
    </group>
  )
}
