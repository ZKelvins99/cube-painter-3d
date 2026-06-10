import { useMemo } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { UNFOLD_LAYOUTS } from '@/data/unfoldLayouts'
import { useCubeStore } from '@/store/cubeStore'
import { FACE_IDS, type FaceId } from '@/types/cube'
import { useFaceTextures } from '@/scene/useFaceTextures'

export function CubeMesh() {
  const unfoldType = useCubeStore((s) => s.unfoldType)
  const setActiveFace = useCubeStore((s) => s.setActiveFace)
  const textures = useFaceTextures()

  const cubePoses = useMemo(
    () => UNFOLD_LAYOUTS[unfoldType - 1].cubePoses,
    [unfoldType],
  )

  const handleFaceClick = (faceId: FaceId) => (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    setActiveFace(faceId)
  }

  return (
    <>
      {FACE_IDS.map((faceId) => {
        const { position, rotation } = cubePoses[faceId]
        return (
          <mesh
            key={faceId}
            position={position}
            rotation={rotation}
            onClick={handleFaceClick(faceId)}
          >
            <planeGeometry args={[1, 1]} />
            <meshStandardMaterial map={textures[faceId]} />
          </mesh>
        )
      })}
    </>
  )
}
