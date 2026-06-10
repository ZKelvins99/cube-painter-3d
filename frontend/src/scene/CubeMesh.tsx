import { useMemo } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { computeUnfoldGrid3D, lerpPose } from '@/animation/foldAnimation'
import { UNFOLD_LAYOUTS } from '@/data/unfoldLayouts'
import { useCubeStore } from '@/store/cubeStore'
import { FACE_IDS, type FaceId } from '@/types/cube'
import { useFaceTextures } from '@/scene/useFaceTextures'

export function CubeMesh() {
  const unfoldType = useCubeStore((s) => s.unfoldType)
  const foldProgress = useCubeStore((s) => s.foldProgress)
  const setActiveFace = useCubeStore((s) => s.setActiveFace)
  const textures = useFaceTextures()

  const unfoldPoses = useMemo(() => computeUnfoldGrid3D(unfoldType), [unfoldType])
  const cubePoses = useMemo(
    () => UNFOLD_LAYOUTS[unfoldType - 1].cubePoses,
    [unfoldType],
  )

  const currentPoses = useMemo(
    () =>
      Object.fromEntries(
        FACE_IDS.map((faceId) => [
          faceId,
          lerpPose(unfoldPoses[faceId], cubePoses[faceId], foldProgress),
        ]),
      ),
    [unfoldPoses, cubePoses, foldProgress],
  )

  const handleFaceClick = (faceId: FaceId) => (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    setActiveFace(faceId)
  }

  return (
    <>
      {FACE_IDS.map((faceId) => {
        const { position, rotation } = currentPoses[faceId]
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
