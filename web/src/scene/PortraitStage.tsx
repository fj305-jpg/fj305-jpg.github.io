import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import PortraitRelief from './PortraitRelief'
import { Cambridge, Campus, Charts, Engineering, ChapterSet } from './BackgroundSets'
import { useJourney } from '../journey'

function InterestScene(){
  const interest=useJourney(s=>s.interest)
  const spin=useRef<THREE.Group>(null)
  useFrame((_,dt)=>{if(spin.current&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches)spin.current.rotation.y+=dt*.07})
  return <group position={[2.5,.1,-2.5]} rotation={[.05,-.12,0]}>
    {interest==='karting'&&<group rotation={[-.7,0,.15]}>
      {[1,1.2].map(scale=><Line key={scale} points={Array.from({length:81},(_,i)=>{const a=i/80*Math.PI*2;return [Math.cos(a)*2.4*scale,Math.sin(a)*1.15*scale+.18*Math.sin(a*3),0]})} color="#416c97" lineWidth={1.7}/>)}
      <Line points={[[-2.35,-.45,.01],[-2.8,-.45,.01]]} color="#255d9f" lineWidth={4}/>
    </group>}
    {interest==='football'&&<group ref={spin}><mesh><icosahedronGeometry args={[1.45,1]}/><meshStandardMaterial color="#dce5ee" roughness={.8}/></mesh><mesh scale={1.005}><icosahedronGeometry args={[1.45,1]}/><meshBasicMaterial color="#3f6184" wireframe/></mesh></group>}
    {interest==='guandan'&&[-1.05,-.35,.35,1.05].map((x,i)=><group key={x} position={[x,0,i*.03]} rotation={[0,0,(i-1.5)*-.14]}>
      <mesh><boxGeometry args={[1,1.6,.035]}/><meshStandardMaterial color="#edf1f6"/></mesh>
      <Line points={[[-.44,-.73,.03],[.44,-.73,.03],[.44,.73,.03],[-.44,.73,.03],[-.44,-.73,.03]]} color="#56718f" lineWidth={1}/>
      <mesh position={[0,0,.04]} rotation={[0,0,Math.PI/4]}><planeGeometry args={[.32,.32]}/><meshBasicMaterial color={i%2?'#ac5b64':'#34577b'}/></mesh>
    </group>)}
  </group>
}
export default function PortraitStage({reducedMotion}:{reducedMotion:boolean}){
  const {camera}=useThree()
  const bg=useMemo(()=>new THREE.Color('#0b1425'),[]),goal=useMemo(()=>new THREE.Color(),[])
  useFrame((state,dt)=>{
    const active=useJourney.getState().active
    goal.set(['#0b1425','#101c30','#101a30','#0b1b2b','#111b30','#0c1c2a','#0b1425'][active])
    bg.lerp(goal,1-Math.exp(-dt*2));state.scene.background=bg
    camera.lookAt(0,.2,0)
  })
  return <>
    <ambientLight intensity={1.3}/><directionalLight position={[3,6,5]} intensity={1.5}/>
    <PortraitRelief reducedMotion={reducedMotion}/>
    <ChapterSet chapters={[1]}><Campus/></ChapterSet>
    <ChapterSet chapters={[0,2]}><Cambridge/></ChapterSet>
    <ChapterSet chapters={[3]}><Charts/></ChapterSet>
    <ChapterSet chapters={[4]}><Engineering paused={reducedMotion}/></ChapterSet>
    <ChapterSet chapters={[5]}><InterestScene/></ChapterSet>
  </>
}

