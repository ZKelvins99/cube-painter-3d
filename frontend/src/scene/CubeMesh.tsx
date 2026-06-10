import { useMemo } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { Edges } from '@react-three/drei'
import * as THREE from 'three'
import { computeHingePoses } from '@/animation/foldHierarchy'
import { FACE_LABELS } from '@/lib/faceLabels'
import { useCubeStore } from '@/store/cubeStore'
import { FACE_IDS, type FaceId } from '@/types/cube'
import { useFaceTextures } from '@/scene/useFaceTextures'

export function CubeMesh() {
  const unfoldType = useCubeStore((s) => s.unfoldType)
  const foldProgress = useCubeStore((s) => s.foldProgress)
  const mode = useCubeStore((s) => s.mode)
  const setActiveFace = useCubeStore((s) => s.setActiveFace)
  const setHoveredFace3d = useCubeStore((s) => s.setHoveredFace3d)
  const textures = useFaceTextures()
  // Re-render when offscreen canvases update (CanvasTexture.needsUpdate alone may not repaint R3F)
  useCubeStore((s) => s.faceTextureVersion)

  const snapToCube = mode !== 'step-fold'
  const currentPoses = useMemo(
    () => computeHingePoses(unfoldType, foldProgress, { snapToCube }),
    [unfoldType, foldProgress, snapToCube],
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
    <>
      {FACE_IDS.map((faceId) => {
        const { position, rotation } = currentPoses[faceId]
        const label = FACE_LABELS[faceId]
        return (
          <mesh
            key={faceId}
            position={position}
            rotation={rotation}
            userData={{ title: label }}
            onClick={handleFaceClick(faceId)}
            onPointerOver={handleFacePointerOver(faceId)}
            onPointerOut={handleFacePointerOut}
          >
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
              map={textures[faceId]}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
            <Edges color="#94a3b8" threshold={15} />
          </mesh>
        )
      })}
    </>
  )
}
