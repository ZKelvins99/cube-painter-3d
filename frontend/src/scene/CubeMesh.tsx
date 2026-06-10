import { useMemo } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { Edges } from '@react-three/drei'
import * as THREE from 'three'
import {
  buildHingeTree,
  flatCenterVec,
  hingePointVec,
  hingeRotation,
  type HingeLink,
} from '@/animation/foldHierarchy'
import { UNFOLD_LAYOUTS } from '@/data/unfoldLayouts'
import { FACE_LABELS } from '@/lib/faceLabels'
import { useCubeStore } from '@/store/cubeStore'
import type { FaceId, UnfoldLayout } from '@/types/cube'
import { useFaceTextures } from '@/scene/useFaceTextures'

const FLAT_ROTATION: [number, number, number] = [-Math.PI / 2, 0, 0]

function FacePlane({
  faceId,
  texture,
  onClick,
  onPointerOver,
  onPointerOut,
}: {
  faceId: FaceId
  texture: THREE.CanvasTexture
  onClick: (event: ThreeEvent<MouseEvent>) => void
  onPointerOver: (event: ThreeEvent<PointerEvent>) => void
  onPointerOut: (event: ThreeEvent<PointerEvent>) => void
}) {
  return (
    <mesh
      userData={{ title: FACE_LABELS[faceId] }}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        color="#ffffff"
        side={THREE.DoubleSide}
        toneMapped={false}
      />
      <Edges color="#94a3b8" threshold={15} />
    </mesh>
  )
}

function HingeBranch({
  link,
  childLinks,
  layout,
  globalT,
  textures,
  onFaceClick,
  onFacePointerOver,
  onFacePointerOut,
}: {
  link: HingeLink
  childLinks: HingeLink[]
  layout: UnfoldLayout
  globalT: number
  textures: Record<FaceId, THREE.CanvasTexture>
  onFaceClick: (faceId: FaceId) => (event: ThreeEvent<MouseEvent>) => void
  onFacePointerOver: (faceId: FaceId) => (event: ThreeEvent<PointerEvent>) => void
  onFacePointerOut: (event: ThreeEvent<PointerEvent>) => void
}) {
  const hingePos = hingePointVec(link.edge)
  const faceOffset = hingePointVec(link.edge)
  const rotation = hingeRotation(link, layout, globalT)
  const nested = childLinks.filter((child) => child.parent === link.faceId)

  return (
    <group position={hingePos}>
      <group rotation={rotation}>
        <group position={faceOffset}>
          <FacePlane
            faceId={link.faceId}
            texture={textures[link.faceId]}
            onClick={onFaceClick(link.faceId)}
            onPointerOver={onFacePointerOver(link.faceId)}
            onPointerOut={onFacePointerOut}
          />
          {nested.map((child) => (
            <HingeBranch
              key={child.faceId}
              link={child}
              childLinks={childLinks}
              layout={layout}
              globalT={globalT}
              textures={textures}
              onFaceClick={onFaceClick}
              onFacePointerOver={onFacePointerOver}
              onFacePointerOut={onFacePointerOut}
            />
          ))}
        </group>
      </group>
    </group>
  )
}

export function CubeMesh() {
  const unfoldType = useCubeStore((s) => s.unfoldType)
  const foldProgress = useCubeStore((s) => s.foldProgress)
  const setActiveFace = useCubeStore((s) => s.setActiveFace)
  const setHoveredFace3d = useCubeStore((s) => s.setHoveredFace3d)
  const textures = useFaceTextures()
  useCubeStore((s) => s.faceTextureVersion)

  const layout = UNFOLD_LAYOUTS[unfoldType - 1]
  const links = useMemo(() => buildHingeTree(layout), [layout])
  const rootLinks = useMemo(
    () => links.filter((link) => link.parent === layout.anchorFace),
    [links, layout.anchorFace],
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
      <group position={flatCenterVec(layout, layout.anchorFace)} rotation={FLAT_ROTATION}>
        <FacePlane
          faceId={layout.anchorFace}
          texture={textures[layout.anchorFace]}
          onClick={handleFaceClick(layout.anchorFace)}
          onPointerOver={handleFacePointerOver(layout.anchorFace)}
          onPointerOut={handleFacePointerOut}
        />
        {rootLinks.map((link) => (
          <HingeBranch
            key={link.faceId}
            link={link}
            childLinks={links}
            layout={layout}
            globalT={foldProgress}
            textures={textures}
            onFaceClick={handleFaceClick}
            onFacePointerOver={handleFacePointerOver}
            onFacePointerOut={handleFacePointerOut}
          />
        ))}
      </group>
    </group>
  )
}
