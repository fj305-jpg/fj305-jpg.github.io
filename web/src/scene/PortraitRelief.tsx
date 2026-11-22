import { useLayoutEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useJourney } from '../journey'

/** Stable single portrait while the inconsistent multi-view interpolation is retired. */
export default function PortraitRelief({reducedMotion}:{reducedMotion:boolean}){
 const texture=useTexture(import.meta.env.BASE_URL+'personal/directions/front.webp')
 const mesh=useRef<THREE.Mesh>(null)
 const {size}=useThree()
 const mobile=size.width<641
 useLayoutEffect(()=>{
  texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true
  if(mesh.current){mesh.current.position.set(mobile?0:2.35,mobile?1.7:-.12,.3);mesh.current.scale.setScalar(mobile?.47:1)}
 },[mobile,texture])
 useFrame((_,elapsed)=>{
  if(!mesh.current)return
  const dt=Math.min(elapsed,.05),active=useJourney.getState().active
  const x=mobile?0:[2.35,2.8,2.7,3.1,3.1,2.8,2.7][active]
  const y=mobile?1.7:-.12,scale=mobile?.47:active===0?1:.88
  const damp=(a:number,b:number)=>reducedMotion?b:THREE.MathUtils.damp(a,b,4,dt)
  mesh.current.position.x=damp(mesh.current.position.x,x)
  mesh.current.position.y=damp(mesh.current.position.y,y)
  mesh.current.scale.setScalar(damp(mesh.current.scale.x,scale))
  const material=mesh.current.material as THREE.MeshBasicMaterial
  material.opacity=damp(material.opacity,mobile&&active>0?.12:1)
 })
 return <mesh ref={mesh} position={[2.35,-.12,.3]}>
  <planeGeometry args={[5.6,5.6]}/>
  <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false}/>
 </mesh>
}

