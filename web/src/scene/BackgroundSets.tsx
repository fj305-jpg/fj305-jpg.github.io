/**
 * Personal scene for the MIT-licensed Sen résumé framework.
 * Fixed R3F stage + DOM chapter anchors + damped scroll camera + pointer parallax.
 * The upstream author's character, baked animation and HDR are intentionally unused.
 * The subject is an original textured relief, not a full turntable character model.
 */
import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { useJourney } from '../journey'

const BLUE='#32466e', PALE='#1c2c49', INK='#5e709b'
export { Cambridge, Campus, Charts, Engineering, ChapterSet }

function ChapterSet({chapters:ids,children,focus}:{chapters:number[];children:ReactNode;focus?:'quant'|'engineering'}){
  const root=useRef<THREE.Group>(null)
  const opacity=useRef(0)
  const materials=useRef<THREE.Material[]>([])
  useEffect(()=>{
    const all=new Set<THREE.Material>()
    root.current?.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line){const list=Array.isArray(o.material)?o.material:[o.material];list.forEach(m=>{m.transparent=true;all.add(m)})}})
    materials.current=[...all]
  },[])
  useFrame((_,dt)=>{
    const state=useJourney.getState()
    const target=ids.includes(state.active)&&(!focus||state.focus===focus)?1:0
    opacity.current=THREE.MathUtils.damp(opacity.current,target,3,dt)
    if(root.current){root.current.visible=opacity.current>.005;root.current.position.y=(1-opacity.current)*-.5}
    materials.current.forEach(m=>{m.opacity=opacity.current*.42})
  })
  return <group ref={root}>{children}</group>
}

/** King's Chapel: twelve Perpendicular Gothic bays and four corner turrets.
 * Restrained architectural lines, with no photographic or coloured backdrop. */
function Cambridge(){
  const line='#7385ad',detail='#53688f'
  const window=(x:number,z:number,w=.43)=>[[x-w/2,-1.55,z],[x-w/2,.48,z],[x-w*.36,.78,z],[x,.99,z],[x+w*.36,.78,z],[x+w/2,.48,z],[x+w/2,-1.55,z],[x-w/2,-1.55,z]] as [number,number,number][]
  return <group position={[2.15,.15,-4.1]} rotation={[0,-.23,0]}>
    <Line points={[[-3.6,-1.85,.85],[3.6,-1.85,.85],[3.6,1.5,.85],[-3.6,1.5,.85],[-3.6,-1.85,.85]]} color={line} lineWidth={1}/>
    <Line points={[[-3.6,1.5,.85],[-3.6,2.12,0],[-3.6,1.5,-.85],[3.6,1.5,-.85],[3.6,2.12,0],[-3.6,2.12,0]]} color={detail} lineWidth={.8}/>
    {Array.from({length:12},(_,i)=>{const x=-3.3+i*.6;return <group key={i}>
      <Line points={window(x,.88)} color={line} lineWidth={.85}/>
      {[-.1,0,.1].map(dx=><Line key={dx} points={[[x+dx,-1.5,.89],[x+dx,.6,.89]]} color={detail} lineWidth={.55}/>)}
      <Line points={[[x-.2,-.15,.89],[x+.2,-.15,.89]]} color={detail} lineWidth={.6}/>
      <Line points={[[x-.29,-1.85,1.03],[x-.29,.9,1.03],[x-.29,1.67,.87],[x-.29,1.98,.87]]} color={detail} lineWidth={.8}/>
      <Line points={[[x-.31,1.5,.86],[x-.31,1.7,.86],[x-.19,1.7,.86],[x-.19,1.5,.86],[x+.09,1.5,.86],[x+.09,1.7,.86],[x+.21,1.7,.86],[x+.21,1.5,.86]]} color={line} lineWidth={.65}/>
    </group>})}
    {[-3.6,3.6].flatMap(x=>[-.85,.85].map(z=><group key={x+':'+z} position={[x,0,z]}>
      <Line points={[[-.1,-1.85,0],[-.1,2.24,0],[-.15,2.34,0],[-.15,2.52,0],[-.07,2.52,0],[-.07,2.75,0],[0,2.93,0],[.07,2.75,0],[.07,2.52,0],[.15,2.52,0],[.15,2.34,0],[.1,2.24,0],[.1,-1.85,0]]} color={line} lineWidth={.95}/>
      <Line points={[[0,1.68,.015],[0,2.35,.015]]} color={detail} lineWidth={.55}/>
    </group>))}
    <Line points={[[-3.6,-1.85,-.85],[-3.6,1.5,-.85],[-3.6,1.5,.85]]} color={line} lineWidth={.8}/>
    <Line points={Array.from({length:50},(_,i)=>{const x=i*.24-5;return [x,-2.2+.08*Math.sin(i*.13),2.4]})} color={detail} lineWidth={.6}/>
    <Line points={Array.from({length:50},(_,i)=>{const x=i*.24-5;return [x,-2.55+.08*Math.sin(i*.13),3.1]})} color={detail} lineWidth={.5}/>
  </group>
}
function Campus(){return <group position={[2.6,-.1,-3.8]} rotation={[0,-.25,0]}>
  <mesh position={[0,.2,0]}><boxGeometry args={[7,3.4,.65]}/><meshStandardMaterial color="#c8dfec"/></mesh>
  {[0,1,2].map(row=>Array.from({length:9},(_,col)=><mesh key={`${row}-${col}`} position={[-3+col*.73,-.8+row*.95,.34]}><planeGeometry args={[.5,.66]}/><meshStandardMaterial color="#78a6c4"/></mesh>))}
  {[-3.5,3.7].map(x=><group key={x} position={[x,-1.5,1]}><mesh><cylinderGeometry args={[.05,.08,2.6,8]}/><meshStandardMaterial color="#8ba9b4"/></mesh><mesh position={[0,1.4,0]}><icosahedronGeometry args={[.9,1]}/><meshStandardMaterial color="#a0c6bf"/></mesh></group>)}
  <mesh position={[0,-1.65,1.5]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[10,6]}/><meshStandardMaterial color="#d4e7f1"/></mesh>
</group>}
function Charts(){
  const values=useMemo(()=>Array.from({length:34},(_,i)=>.3*Math.sin(i*.8)+i*.058+.18*Math.sin(i*2.1)),[])
  return <group position={[.8,-.9,-2.5]} rotation={[0,-.12,0]}>
    {values.map((v,i)=><group key={i} position={[i*.2-1,v,0]}>
      <mesh><boxGeometry args={[.025,.6+Math.abs(Math.sin(i))*.25,.025]}/><meshBasicMaterial color={BLUE}/></mesh>
      <mesh position={[0,.04,0]}><boxGeometry args={[.11,.12+Math.abs(Math.cos(i))*.25,.035]}/><meshBasicMaterial color={i%3===0?'#96afc5':'#5697c5'}/></mesh>
    </group>)}
    {[0,1,2,3,4].map(i=><Line key={i} points={[[-1,i*.65-.3,-.2],[6,i*.65-.3,-.2]]} color={PALE} lineWidth={.5}/>)}
    <Line points={values.map((v,i)=>[i*.2-1,v-.6,.03])} color="#438cc2" lineWidth={1.4}/>
  </group>
}
function Engineering({paused=false}:{paused?:boolean}){const ref=useRef<THREE.Group>(null);useFrame((_,dt)=>{if(ref.current&&!paused)ref.current.rotation.y+=dt*.06});return <group ref={ref} position={[3,0,-2]} rotation={[.3,.2,.1]}>
  <mesh><torusGeometry args={[1.5,.25,12,48]}/><meshStandardMaterial color={BLUE} wireframe/></mesh>
  <mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.8,.8,2,20,4,true]}/><meshStandardMaterial color={INK} wireframe/></mesh>
  <Line points={Array.from({length:120},(_,i)=>{const x=i/15-4;return [x,Math.sin(x*4)*Math.exp(-Math.abs(x)*.4),.7]})} color="#4f8bb7" lineWidth={1.3}/>
</group>}



