import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useJourney } from '../journey'
const names=['up-left','up','up-right','left','front','right','down-left','down','down-right']
/** Directional artwork, without geometry distortion or eye-UV warping. */
export default function PortraitRelief({reducedMotion}:{reducedMotion:boolean}){
 const textures=useTexture(names.map(n=>import.meta.env.BASE_URL+'personal/directions/'+n+'.webp'))
 const mesh=useRef<THREE.Mesh>(null)
 const {size,camera}=useThree()
 const pointer=useRef({x:0,y:0,engaged:false}),override=useRef<number|null>(null)
 const current=useRef(4),previous=useRef(4),transition=useRef(1),hello=useRef(0)
 const projected=useMemo(()=>new THREE.Vector3(),[])
 const uniforms=useMemo(()=>({before:{value:textures[4]},after:{value:textures[4]},blend:{value:1},fade:{value:1}}),[textures])
 useEffect(()=>{
  textures.forEach(t=>{t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true})
  const move=(e:PointerEvent)=>{pointer.current={x:e.clientX/window.innerWidth*2-1,y:1-e.clientY/window.innerHeight*2,engaged:true};override.current=null}
  const turn=(e:Event)=>{override.current=(e as CustomEvent<number>).detail<0?3:5}
  const reset=()=>{override.current=4;hello.current=0}
  const greet=()=>{hello.current=performance.now()+1000}
  const leave=()=>{pointer.current.engaged=false;override.current=4}
  window.addEventListener('pointermove',move);window.addEventListener('avatar-turn',turn)
  window.addEventListener('portrait-reset',reset);window.addEventListener('portrait-greet',greet)
  document.documentElement.addEventListener('pointerleave',leave)
  return()=>{window.removeEventListener('pointermove',move);window.removeEventListener('avatar-turn',turn);window.removeEventListener('portrait-reset',reset);window.removeEventListener('portrait-greet',greet);document.documentElement.removeEventListener('pointerleave',leave)}
 },[textures])
 useFrame((_,dt)=>{
  if(!mesh.current)return
  const active=useJourney.getState().active,mobile=size.width<641
  const scale=mobile?.47:active===0?1:.88
  mesh.current.position.x=THREE.MathUtils.damp(mesh.current.position.x,mobile?0:[2.35,2.8,2.7,3.1,3.1,2.8,2.7][active],3,dt)
  mesh.current.position.y=THREE.MathUtils.damp(mesh.current.position.y,mobile?1.7:-.12,3,dt)
  mesh.current.scale.setScalar(THREE.MathUtils.damp(mesh.current.scale.x,scale,4,dt))
  projected.set(0,.85,0).applyMatrix4(mesh.current.matrixWorld).project(camera)
  const dx=pointer.current.x-projected.x,dy=pointer.current.y-projected.y
  const col=dx<-.20?0:dx>.20?2:1,row=dy>.22?0:dy<-.22?2:1
  let next=override.current??(pointer.current.engaged?row*3+col:4)
  if(reducedMotion)next=4
  else if(performance.now()<hello.current)next=Math.floor((hello.current-performance.now())/250)%2?7:4
  if(next!==current.current&&transition.current>=1){previous.current=current.current;current.current=next;transition.current=0}
  transition.current=Math.min(1,transition.current+dt/.085)
  uniforms.before.value=textures[previous.current];uniforms.after.value=textures[current.current]
  uniforms.blend.value=transition.current
  uniforms.fade.value=THREE.MathUtils.damp(uniforms.fade.value,mobile&&active>0?.12:1,4,dt)
 })
 return <mesh ref={mesh} position={[2.35,-.12,.3]} onDoubleClick={()=>window.dispatchEvent(new Event('portrait-greet'))}>
  <planeGeometry args={[5.6,5.6]}/>
  <shaderMaterial transparent depthWrite={false} uniforms={uniforms}
   vertexShader={`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
   fragmentShader={`uniform sampler2D before;uniform sampler2D after;uniform float blend;uniform float fade;varying vec2 vUv;
   void main(){vec4 a=texture2D(before,vUv),b=texture2D(after,vUv);float alpha=mix(a.a,b.a,blend);vec3 rgb=mix(a.rgb*a.a,b.rgb*b.a,blend)/max(alpha,.0001);if(alpha<.01)discard;gl_FragColor=vec4(rgb,alpha*fade*smoothstep(0.,.025,vUv.y));
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
   }`}/>
 </mesh>
}


