import { useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import { useSnapshot } from 'valtio'
import { getTheme } from '../theme/forgeTheme'
import { state } from '../store/store'

export default function GoldenNuggets(props) {
  const { nodes, materials } = useGLTF('/gold_nuggets-transformed.glb')
  const { playthrough } = useSnapshot(state)
  const theme = getTheme(playthrough)
  const nuggetMaterial = materials['Material.001']

  useEffect(() => {
    nuggetMaterial.color.set(theme.nuggetColor)
    nuggetMaterial.emissive.set(theme.nuggetColor)
    nuggetMaterial.emissiveIntensity = 0.9
  }, [nuggetMaterial, theme.nuggetColor])

  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_2.geometry}
        material={nuggetMaterial}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_2.geometry}
        material={nuggetMaterial}
        rotation={[-Math.PI / 2, 0, -0.9]}
        position={[-1200, 0, 1500]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_2.geometry}
        material={nuggetMaterial}
        rotation={[-Math.PI / 2, 0, 0.9]}
        position={[1200, 0, 1500]}
      />
    </group>
  )
}

useGLTF.preload('/gold_nuggets-transformed.glb')
