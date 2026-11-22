import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useJourney } from '../journey'
const vertex='varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}'
const headFragment=`
uniform sampler2D art;uniform vec2 offset;uniform vec2 span;uniform float fade;varying vec2 vUv;
void main(){
 // Exactly one baked frame per sample. No crossfade, optical-flow shader or UV warp.
 if(vUv.y<.0147)discard;
 vec4 c=texture2D(art,offset+vUv*span);if(c.a<.02)discard;
 gl_FragColor=vec4(c.rgb,c.a*fade);
 #include <colorspace_fragment>
}`
const bodyFragment=`
uniform sampler2D art;uniform float fade;varying vec2 vUv;
void main(){
 if(vUv.y>.30)discard;
 vec4 c=texture2D(art,vUv);gl_FragColor=vec4(c.rgb,c.a*fade);
 #include <colorspace_fragment>
}`
export default function PortraitRelief({reducedMotion}:{reducedMotion:boolean}){
 const front=useTexture(import.meta.env.BASE_URL+'personal/directions/front.webp')
 const root=useRef<THREE.Group>(null)
 const {size,camera,gl}=useThree(),mobile=size.width<641
 const [atlas,setAtlas]=useState<THREE.Texture|null>(null)
 const initialMobile=useRef(mobile)
 const pose=useRef({x:0,y:0}),pointer=useRef({x:0,y:0,engaged:false}),hello=useRef(0),demo=useRef(0)
 const projected=useMemo(()=>new THREE.Vector3(),[])
 const uniforms=useMemo(()=>({art:{value:front},offset:{value:new THREE.Vector2()},span:{value:new THREE.Vector2(1,1)},fade:{value:1}}),[front])
 useEffect(()=>{
  let cancelled=false
  const url=import.meta.env.BASE_URL+'personal/sequence-v7/'+((initialMobile.current||gl.capabilities.maxTextureSize<8192)?'mobile':'desktop')+'.webp'
  const texture=new THREE.TextureLoader().load(url,t=>{
   if(cancelled){t.dispose();return}
   if(t.image.width>gl.capabilities.maxTextureSize||t.image.height>gl.capabilities.maxTextureSize){t.dispose();return}
   t.colorSpace=THREE.SRGBColorSpace;t.generateMipmaps=false;t.minFilter=THREE.LinearFilter;t.magFilter=THREE.LinearFilter;t.needsUpdate=true
   setAtlas(t)
  },undefined,()=>console.warn('Portrait sequence unavailable; keeping the clear frontal image.'))
  return()=>{cancelled=true;texture.dispose()}
 },[gl])
 useLayoutEffect(()=>{
  front.colorSpace=THREE.SRGBColorSpace;front.needsUpdate=true
  if(root.current){root.current.position.set(mobile?0:2.35,mobile?1.7:-.12,.3);root.current.scale.setScalar(mobile?.47:1)}
 },[front,mobile])
 useEffect(()=>{
  const move=(e:PointerEvent)=>{pointer.current={x:e.clientX/window.innerWidth*2-1,y:1-e.clientY/window.innerHeight*2,engaged:true}}
  const leave=()=>{pointer.current.engaged=false}
  const nod=()=>{hello.current=performance.now()+1400}
  const preview=()=>{demo.current=performance.now()+3600}
  window.addEventListener('pointermove',move);window.addEventListener('portrait-greet',nod);window.addEventListener('portrait-demo',preview);document.documentElement.addEventListener('pointerleave',leave)
  return()=>{window.removeEventListener('pointermove',move);window.removeEventListener('portrait-greet',nod);window.removeEventListener('portrait-demo',preview);document.documentElement.removeEventListener('pointerleave',leave)}
 },[])
 useFrame((_,elapsed)=>{
  if(!root.current)return
  const dt=Math.min(elapsed,.05),active=useJourney.getState().active
  const x=mobile?0:[2.35,2.8,2.7,3.1,3.1,2.8,2.7][active],y=mobile?1.7:-.12,scale=mobile?.47:active===0?1:.88
  const damp=(a:number,b:number,lambda=4)=>reducedMotion?b:THREE.MathUtils.damp(a,b,lambda,dt)
  root.current.position.x=damp(root.current.position.x,x);root.current.position.y=damp(root.current.position.y,y);root.current.scale.setScalar(damp(root.current.scale.x,scale))
  projected.set(0,.8,0).applyMatrix4(root.current.matrixWorld).project(camera)
  let tx=pointer.current.engaged?THREE.MathUtils.clamp((pointer.current.x-projected.x)/.9,-1,1):0
  let ty=pointer.current.engaged?THREE.MathUtils.clamp((projected.y-pointer.current.y)/.8,-1,1):0
  if(performance.now()<hello.current)ty+=Math.sin((hello.current-performance.now())/1400*Math.PI*2)*.4
  if(performance.now()<demo.current){const p=1-(demo.current-performance.now())/3600;tx=-Math.sin(p*Math.PI*2);ty=0}
  if(reducedMotion||!atlas){tx=0;ty=0}
  const step=(a:number,b:number)=>a+THREE.MathUtils.clamp(damp(a,b,9)-a,-dt*3.8,dt*3.8)
  pose.current.x=reducedMotion?0:step(pose.current.x,tx);pose.current.y=reducedMotion?0:step(pose.current.y,THREE.MathUtils.clamp(ty,-1,1))
  const yaw=Math.round((pose.current.x+1)*16),pitch=Math.round((pose.current.y+1)*4),frame=pitch*33+yaw
  gl.domElement.dataset.portraitFrame=String(frame)
  gl.domElement.dataset.portraitReady=String(!!atlas)
  if(atlas){
   const width=atlas.image.width as number,height=atlas.image.height as number,w=width/15,h=height/20
   // Half-texel insets keep bilinear filtering inside this frame's two-pixel gutter.
   uniforms.art.value=atlas
   uniforms.offset.value.set(((frame%15)*w+2.5)/width,(height-(Math.floor(frame/15)+1)*h+2.5)/height)
   uniforms.span.value.set((w-5)/width,(h-5)/height)
  }
  uniforms.fade.value=damp(uniforms.fade.value,mobile&&active>0?.12:1)
  root.current.traverse(o=>{if(o instanceof THREE.Mesh&&o.material instanceof THREE.MeshBasicMaterial)o.material.opacity=uniforms.fade.value})
 })
 return <group ref={root} position={[2.35,-.12,.3]} onDoubleClick={()=>window.dispatchEvent(new Event('portrait-greet'))}>
  {!atlas?<mesh><planeGeometry args={[5.6,5.6]}/><meshBasicMaterial map={front} transparent depthWrite={false} toneMapped={false}/></mesh>:<>
   <mesh><planeGeometry args={[5.6,5.6]}/><shaderMaterial transparent depthWrite={false} toneMapped={false} uniforms={{art:{value:front},fade:uniforms.fade}} vertexShader={vertex} fragmentShader={bodyFragment}/></mesh>
   <mesh position={[0,.728,.002]}><planeGeometry args={[3.584,3.808]}/><shaderMaterial transparent depthWrite={false} toneMapped={false} uniforms={uniforms} vertexShader={vertex} fragmentShader={headFragment}/></mesh>
  </>}
 </group>
}


