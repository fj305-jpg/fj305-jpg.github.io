import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Line } from '@react-three/drei'
import * as THREE from 'three'
import { createAvatar } from './avatarModel'
import { Cambridge, Campus, Charts, Engineering, ChapterSet } from './BackgroundSets'
import { useJourney } from '../journey'

export default function ResumeScene({reducedMotion}:{reducedMotion:boolean}){
  const model=useMemo(createAvatar,[])
  const group=useRef<THREE.Group>(null)
  const {size,camera,gl}=useThree()
  const pointer=useRef({x:0,y:0}),yaw=useRef(0),drag=useRef<number|null>(null),wave=useRef(0)
  const bg=useMemo(()=>new THREE.Color('#edf3f7'),[])
  const goal=useMemo(()=>new THREE.Color(),[])
  const parts=useMemo(()=>({head:model.getObjectByName('head'),arm:model.getObjectByName('wave_arm'),eyes:[model.getObjectByName('gaze_-1'),model.getObjectByName('gaze_1')]}),[model])
  useEffect(()=>{
    const move=(e:PointerEvent)=>{pointer.current={x:e.clientX/window.innerWidth*2-1,y:1-e.clientY/window.innerHeight*2}}
    const turn=(e:Event)=>{yaw.current+=(e as CustomEvent<number>).detail}
    const hello=()=>{wave.current=performance.now()+2000}
    window.addEventListener('pointermove',move);window.addEventListener('avatar-turn',turn);window.addEventListener('portrait-greet',hello)
    return ()=>{window.removeEventListener('pointermove',move);window.removeEventListener('avatar-turn',turn);window.removeEventListener('portrait-greet',hello);gl.domElement.style.cursor=''}
  },[gl])
  useFrame((state,dt)=>{
    const active=useJourney.getState().active,mobile=size.width<641
    goal.set(['#edf3f7','#e8f0f4','#e4edf5','#e2ecf4','#e7eef4','#edf3f7'][active]);bg.lerp(goal,1-Math.exp(-dt*2));state.scene.background=bg
    camera.position.x=THREE.MathUtils.damp(camera.position.x,reducedMotion?0:pointer.current.x*.15,3,dt);camera.lookAt(0,.2,0)
    if(group.current){
      const scale=mobile?.43:.82
      group.current.scale.lerp(new THREE.Vector3(scale,scale,scale),1-Math.exp(-dt*4))
      group.current.position.x=THREE.MathUtils.damp(group.current.position.x,mobile?.08:[2.7,2.8,2.7,2.9,2.8,2.7][active],3,dt)
      group.current.position.y=THREE.MathUtils.damp(group.current.position.y,mobile?.35:-2.5,3,dt)
      group.current.rotation.y=THREE.MathUtils.damp(group.current.rotation.y,yaw.current+(reducedMotion?0:pointer.current.x*.12),5,dt)
    }
    if(parts.head&&!reducedMotion){parts.head.rotation.y=THREE.MathUtils.damp(parts.head.rotation.y,pointer.current.x*.13,5,dt);parts.head.rotation.x=THREE.MathUtils.damp(parts.head.rotation.x,-pointer.current.y*.07,5,dt)}
    parts.eyes.forEach(eye=>{if(eye){eye.position.x=reducedMotion?0:pointer.current.x*.035;eye.position.y=reducedMotion?0:pointer.current.y*.018}})
    if(parts.arm){const waving=performance.now()<wave.current&&!reducedMotion;parts.arm.rotation.z=THREE.MathUtils.damp(parts.arm.rotation.z,waving?2.35+Math.sin(state.clock.elapsedTime*12)*.17:0,8,dt)}
  })
  return <>
    <ambientLight intensity={.8}/><hemisphereLight args={['#f7fbff','#a0afba',.8]}/>
    <directionalLight position={[-3,7,6]} intensity={2.2} color="#fff4e9" castShadow/><directionalLight position={[5,3,2]} intensity={1} color="#c2def6"/>
    <group ref={group} position={[2.7,-2.85,0]} scale={.91}>
      <primitive object={model}
        onPointerOver={()=>{gl.domElement.style.cursor='grab'}} onPointerOut={()=>{if(drag.current===null)gl.domElement.style.cursor=''}}
        onPointerDown={(e:any)=>{e.stopPropagation();drag.current=e.clientX;e.target.setPointerCapture(e.pointerId);gl.domElement.style.cursor='grabbing'}}
        onPointerMove={(e:any)=>{if(drag.current!==null){yaw.current+=(e.clientX-drag.current)*.012;drag.current=e.clientX}}}
        onPointerUp={(e:any)=>{drag.current=null;e.target.releasePointerCapture(e.pointerId);gl.domElement.style.cursor='grab'}}
        onDoubleClick={()=>window.dispatchEvent(new Event('portrait-greet'))}/>
    </group>
    <ContactShadows position={[2.7,-2.9,0]} opacity={.25} scale={6} blur={2.5} far={5} resolution={256} frames={1}/>
    <ChapterSet chapters={[1]}><Campus/></ChapterSet>
    <ChapterSet chapters={[2]}><Cambridge/></ChapterSet>
    <ChapterSet chapters={[3]}><Charts/></ChapterSet>
    <ChapterSet chapters={[4]}><Engineering paused={reducedMotion}/></ChapterSet>
    <Line points={Array.from({length:100},(_,i)=>{const x=i/8-5;return [x,.5*Math.sin(x*.65)-1,-5]})} color="#b3c9db" lineWidth={.7}/>
  </>
}
