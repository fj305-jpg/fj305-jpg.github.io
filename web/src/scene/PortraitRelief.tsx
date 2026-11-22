import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useJourney } from '../journey'
const names=['up-left','up','up-right','left','front','right','down-left','down','down-right']
const vertexShader='varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}'
const fragmentShader=`
uniform sampler2D a0;uniform sampler2D a1;uniform sampler2D a2;uniform sampler2D a3;
uniform sampler2D motion;uniform vec2 pose;uniform float fade;uniform float ready;varying vec2 vUv;
vec4 field(vec2 uv,vec2 corner){
 vec2 origin=vec2(corner.x*.5,(1.-corner.y)*.5);
 return texture2D(motion,origin+clamp(uv,vec2(.00521),vec2(.99479))*.5);
}
vec4 aligned(sampler2D art,vec2 corner){
 vec2 amount=mix(pose,1.-pose,corner);
 vec2 uv=vUv;
 // Invert the forward motion field at the desired position. Each real pose
 // contributes aligned facial features instead of a displaced double exposure.
 for(int i=0;i<3;i++){vec4 f=field(uv,corner);uv=vUv-ready*(f.xy*amount.x+f.zw*amount.y);}
 vec4 c=texture2D(art,uv);return vec4(c.rgb*c.a,c.a);
}
void main(){
 vec4 c=aligned(a0,vec2(0.,0.))*(1.-pose.x)*(1.-pose.y)
       +aligned(a1,vec2(1.,0.))*pose.x*(1.-pose.y)
       +aligned(a2,vec2(0.,1.))*(1.-pose.x)*pose.y
       +aligned(a3,vec2(1.,1.))*pose.x*pose.y;
 if(c.a<.01)discard;
 gl_FragColor=vec4(c.rgb/max(c.a,.0001),c.a*fade*smoothstep(0.,.025,vUv.y));
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`
/** Continuous pose coordinates + motion-compensated interpolation of real keyframes. */
export default function PortraitRelief({reducedMotion}:{reducedMotion:boolean}){
 const textures=useTexture(names.map(n=>import.meta.env.BASE_URL+'personal/directions/'+n+'.webp'))
 const [fields,setFields]=useState<THREE.DataTexture[]>([])
 const mesh=useRef<THREE.Mesh>(null)
 const {size,camera}=useThree()
 const mobileViewport=size.width<641
 useLayoutEffect(()=>{if(mesh.current){mesh.current.position.set(mobileViewport?0:2.35,mobileViewport?1.7:-.12,.3);mesh.current.scale.setScalar(mobileViewport?.47:1)}},[mobileViewport])
 const pointer=useRef({x:0,y:0,engaged:false}),override=useRef<{x:number;y:number}|null>(null)
 const pose=useRef({x:0,y:0}),hello=useRef(0)
 const projected=useMemo(()=>new THREE.Vector3(),[])
 const empty=useMemo(()=>{const t=new THREE.DataTexture(new Float32Array(4),1,1,THREE.RGBAFormat,THREE.FloatType);t.needsUpdate=true;return t},[])
 const uniforms=useMemo(()=>({a0:{value:textures[4]},a1:{value:textures[4]},a2:{value:textures[4]},a3:{value:textures[4]},motion:{value:empty},pose:{value:new THREE.Vector2()},ready:{value:0},fade:{value:1}}),[textures,empty])
 useEffect(()=>{
  const abort=new AbortController();const owned:THREE.DataTexture[]=[]
  Promise.all([0,1,2,3].map(async i=>{
   const response=await fetch(import.meta.env.BASE_URL+'personal/motion/cell-'+i+'.bin',{signal:abort.signal})
   if(!response.ok)throw new Error('Portrait motion asset unavailable')
   const data=new Uint16Array(await response.arrayBuffer())
   if(data.length!==192*192*4)throw new Error('Invalid portrait motion asset')
   const t=new THREE.DataTexture(data,192,192,THREE.RGBAFormat,THREE.HalfFloatType)
   t.minFilter=THREE.LinearFilter;t.magFilter=THREE.LinearFilter;t.needsUpdate=true;owned.push(t);return t
  })).then(result=>{if(!abort.signal.aborted)setFields(result)}).catch(error=>{if(error.name!=='AbortError')console.warn('Portrait stays front-facing because motion assets could not load.')})
  return()=>{abort.abort();owned.forEach(t=>t.dispose())}
 },[])
 useEffect(()=>()=>empty.dispose(),[empty])
 useEffect(()=>{
  textures.forEach(t=>{t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true})
  const move=(e:PointerEvent)=>{pointer.current={x:e.clientX/window.innerWidth*2-1,y:1-e.clientY/window.innerHeight*2,engaged:true};override.current=null}
  const turn=(e:Event)=>{override.current={x:(e as CustomEvent<number>).detail<0?-.85:.85,y:0}}
  const reset=()=>{override.current={x:0,y:0};hello.current=0}
  const greet=()=>{hello.current=performance.now()+1300}
  const leave=()=>{pointer.current.engaged=false;override.current={x:0,y:0}}
  window.addEventListener('pointermove',move);window.addEventListener('avatar-turn',turn)
  window.addEventListener('portrait-reset',reset);window.addEventListener('portrait-greet',greet)
  document.documentElement.addEventListener('pointerleave',leave)
  return()=>{window.removeEventListener('pointermove',move);window.removeEventListener('avatar-turn',turn);window.removeEventListener('portrait-reset',reset);window.removeEventListener('portrait-greet',greet);document.documentElement.removeEventListener('pointerleave',leave)}
 },[textures])
 useFrame((_,elapsed)=>{
  if(!mesh.current)return
  const dt=Math.min(elapsed,.05),active=useJourney.getState().active,mobile=size.width<641
  const scale=mobile?.47:active===0?1:.88
  mesh.current.position.x=THREE.MathUtils.damp(mesh.current.position.x,mobile?0:[2.35,2.8,2.7,3.1,3.1,2.8,2.7][active],3,dt)
  mesh.current.position.y=THREE.MathUtils.damp(mesh.current.position.y,mobile?1.7:-.12,3,dt)
  mesh.current.scale.setScalar(THREE.MathUtils.damp(mesh.current.scale.x,scale,4,dt))
  projected.set(0,.85,0).applyMatrix4(mesh.current.matrixWorld).project(camera)
  const engaged=pointer.current.engaged
  let tx=override.current?.x??(engaged?THREE.MathUtils.clamp((pointer.current.x-projected.x)/.9,-1,1):0)
  let ty=override.current?.y??(engaged?THREE.MathUtils.clamp((projected.y-pointer.current.y)/.7,-1,1):0)
  if(performance.now()<hello.current){ty+=Math.sin((hello.current-performance.now())/1300*Math.PI*4)*.22}
  if(reducedMotion||fields.length!==4){tx=0;ty=0}
  pose.current.x=THREE.MathUtils.damp(pose.current.x,tx,8,dt)
  pose.current.y=THREE.MathUtils.damp(pose.current.y,THREE.MathUtils.clamp(ty,-1,1),8,dt)
  const x=THREE.MathUtils.clamp(pose.current.x+1,0,2),y=THREE.MathUtils.clamp(pose.current.y+1,0,2)
  const col=Math.min(1,Math.floor(x)),row=Math.min(1,Math.floor(y)),i=row*3+col
  uniforms.a0.value=textures[i];uniforms.a1.value=textures[i+1];uniforms.a2.value=textures[i+3];uniforms.a3.value=textures[i+4]
  uniforms.pose.value.set(x-col,y-row)
  uniforms.motion.value=fields[row*2+col]??empty;uniforms.ready.value=fields.length===4?1:0
  uniforms.fade.value=THREE.MathUtils.damp(uniforms.fade.value,mobile&&active>0?.12:1,4,dt)
 })
 return <mesh ref={mesh} position={[2.35,-.12,.3]} onDoubleClick={()=>window.dispatchEvent(new Event('portrait-greet'))}>
  <planeGeometry args={[5.6,5.6]}/>
  <shaderMaterial transparent depthWrite={false} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader}/>
 </mesh>
}



