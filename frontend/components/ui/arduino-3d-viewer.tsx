'use client'

import { Suspense, useMemo, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, Center, Html } from '@react-three/drei'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'
import * as THREE from 'three'

function ArduinoModel() {
  const ref = useRef<THREE.Group>(null!)
  
  const materials = useLoader(MTLLoader, '/models/arduino/Arduino_uno_r3_v2.mtl', (loader: any) => {
    loader.setResourcePath('/models/arduino/')
  })
  
  const obj = useLoader(OBJLoader, '/models/arduino/Arduino_uno_r3_v2.obj', (loader: any) => {
    materials.preload()
    loader.setMaterials(materials)
  })

  // Ensure color space is correct and scale is normalized
  const processedObj = useMemo(() => {
    const clone = obj.clone(true)
    
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m: any) => {
              if (m.map) {
                m.map.colorSpace = THREE.SRGBColorSpace
                m.map.anisotropy = 16
                // Reset base color so it doesn't darken the texture
                if ((m as any).color) (m as any).color.setHex(0xffffff)
              }
            })
          } else {
            const m = mesh.material as THREE.MeshStandardMaterial | THREE.MeshPhongMaterial
            if (m.map) {
              m.map.colorSpace = THREE.SRGBColorSpace
              m.map.anisotropy = 16
              if (m.color) m.color.setHex(0xffffff)
            }
          }
        }
      }
    })

    const box = new THREE.Box3().setFromObject(clone)
    const size = new THREE.Vector3()
    box.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z) || 1
    clone.scale.setScalar(3.5 / maxDim)

    return clone
  }, [obj])

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.15
      ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.05
    }
  })

  return (
    <group ref={ref}>
      <Center>
        <primitive object={processedObj} />
      </Center>
    </group>
  )
}

function LoadingSpinner() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <span className="text-[10px] text-white/40 font-mono uppercase tracking-[0.2em]">
          Initializing 3D
        </span>
      </div>
    </Html>
  )
}

export function Arduino3DViewer({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  
  if (!mounted) return null

  return (
    <div className={className} style={{ background: 'transparent' }}>
      <Canvas
        camera={{ position: [0, 3, 10], fov: 32 }}
        gl={{ 
          antialias: true, 
          alpha: true, 
          outputColorSpace: THREE.SRGBColorSpace,
          powerPreference: 'high-performance'
        }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        <pointLight position={[-10, 5, -5]} intensity={1} color="#4488ff" />
        
        <Suspense fallback={<LoadingSpinner />}>
          <ArduinoModel />
        </Suspense>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.7}
        />
      </Canvas>
    </div>
  )
}
