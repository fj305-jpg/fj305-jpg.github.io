import { useEffect,useLayoutEffect,useMemo,useRef,useState } from 'react'
import { useFrame,useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useJourney } from '../journey'
const vertex='varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}'
const fragment=`
uniform sampler2D art;uniform float fade;varying vec2 vUv;
void main(){
 vec3 raw=texture2D(art,vec2(vUv.x*.5,vUv.y)).rgb;
 float a=texture2D(art,vec2(.5+vUv.x*.5,vUv.y)).r;
 if(a<.02)discard;
 vec3 rgb=clamp(raw/max(a,.02),0.,1.);
 vec3 linear=mix(pow((rgb+.055)/1.055,vec3(2.4)),rgb/12.92,lessThanEqual(rgb,vec3(.04045)));
 gl_FragColor=vec4(linear,a*fade*smoothstep(0.,.035,vUv.y));
 #include <colorspace_fragment>
}`
export default function PortraitRelief({reducedMotion}:{reducedMotion:boolean}){
 const poster=useTexture(import.meta.env.BASE_URL+'personal/directions/front.webp')
 const root=useRef<THREE.Group>(null),{size,camera,gl}=useThree(),mobile=size.width<641
 const [texture,setTexture]=useState<THREE.VideoTexture|null>(null)
 const media=useRef<{v:HTMLVideoElement;t:THREE.VideoTexture;busy:boolean;shown:number;start:number;count:number;latency:number}|null>(null)
 const pointer=useRef({x:0,y:0,engaged:false}),pose=useRef({x:0,y:0}),demo=useRef(0)
 const projected=useMemo(()=>new THREE.Vector3(),[])
 const uniforms=useMemo(()=>({art:{value:poster as THREE.Texture},fade:{value:1}}),[poster])
 const stats=useRef({start:performance.now(),renders:0,decoded:0})
 useLayoutEffect(()=>{poster.colorSpace=THREE.SRGBColorSpace;poster.needsUpdate=true;if(root.current){root.current.position.set(mobile?0:2.35,mobile?1.7:-.12,.3);root.current.scale.setScalar(mobile?.47:1)}},[poster,mobile])
 useEffect(()=>{
  if(reducedMotion)return
  let disposed=false
  let url="",presented=false
  const abort=new AbortController()
  const v=document.createElement('video');v.id='portrait-decoder';v.muted=true;v.playsInline=true;v.preload='auto';v.crossOrigin='anonymous';v.style.cssText='position:fixed;width:1px;height:1px;opacity:0;pointer-events:none';v.setAttribute('aria-hidden','true');v.tabIndex=-1;document.body.appendChild(v)
  const t=new THREE.VideoTexture(v);t.colorSpace=THREE.NoColorSpace
  const s={v,t,busy:false,shown:-1,start:0,count:0,latency:0};media.current=s
  v.addEventListener('loadeddata',()=>{s.busy=true;s.start=performance.now();v.currentTime=292.5/60},{once:true})
  v.addEventListener('seeked',()=>{if(disposed)return;s.busy=false;s.shown=Math.floor(v.currentTime*60);s.latency=performance.now()-s.start;s.count++;t.needsUpdate=true;if(!presented){presented=true;setTexture(t);window.dispatchEvent(new CustomEvent("portrait-ready",{detail:true}))};if(import.meta.env.DEV&&(new URLSearchParams(location.search).has('autoDemo')||new URLSearchParams(location.search).has('videoTest'))&&s.count===1)demo.current=performance.now()+600000;gl.domElement.dataset.portraitFrame=String(s.shown)})
  v.addEventListener('error',()=>{if(!disposed){setTexture(null);window.dispatchEvent(new Event('portrait-error'))}})
  window.dispatchEvent(new Event('portrait-loading'))
  fetch(import.meta.env.BASE_URL+'personal/sequence-v8/'+(mobile?'portrait-mobile.mp4':'portrait.mp4'),{signal:abort.signal}).then(r=>{if(!r.ok)throw new Error('Portrait video unavailable');return r.blob()}).then(blob=>{if(disposed)return;url=URL.createObjectURL(blob);v.src=url;v.load()}).catch(e=>{if(e.name!=='AbortError'){gl.domElement.dataset.portraitError='true';window.dispatchEvent(new Event('portrait-error'))}})
  const out=document.createElement('output');out.id='portrait-performance';out.style.cssText='position:fixed;top:105px;left:15px;z-index:9999;background:#101b32;color:white;padding:12px;font:16px monospace;pointer-events:none';out.textContent='Video loading';if(import.meta.env.DEV&&(new URLSearchParams(location.search).has('perf')||new URLSearchParams(location.search).has('videoTest')))document.body.append(out)
  return()=>{disposed=true;abort.abort();if(url)URL.revokeObjectURL(url);media.current=null;v.pause();v.removeAttribute('src');v.load();v.remove();t.dispose();out.remove()}
 },[gl,reducedMotion,mobile])
 useEffect(()=>{
  const move=(e:PointerEvent)=>{pointer.current={x:e.clientX/innerWidth*2-1,y:1-e.clientY/innerHeight*2,engaged:true}}
  const leave=()=>{pointer.current.engaged=false},preview=()=>{demo.current=performance.now()+3600}
  window.addEventListener('pointermove',move);window.addEventListener('portrait-demo',preview);document.documentElement.addEventListener('pointerleave',leave)
  return()=>{window.removeEventListener('pointermove',move);window.removeEventListener('portrait-demo',preview);document.documentElement.removeEventListener('pointerleave',leave)}
 },[])
 useFrame((_,elapsed)=>{
  if(!root.current)return
  const dt=Math.min(elapsed,.05),active=useJourney.getState().active,now=performance.now()
  const damp=(a:number,b:number,l=4)=>reducedMotion?b:THREE.MathUtils.damp(a,b,l,dt)
  root.current.position.x=damp(root.current.position.x,mobile?0:[2.35,2.8,2.7,3.1,3.1,2.8,2.7][active]);root.current.position.y=damp(root.current.position.y,mobile?1.7:-.12);root.current.scale.setScalar(damp(root.current.scale.x,mobile?.47:active===0?1:.88))
  projected.set(0,.8,0).applyMatrix4(root.current.matrixWorld).project(camera)
  let tx=pointer.current.engaged?THREE.MathUtils.clamp((pointer.current.x-projected.x)/.9,-1,1):0,ty=pointer.current.engaged?THREE.MathUtils.clamp((projected.y-pointer.current.y)/.8,-1,1):0
  if(now<demo.current){tx=-Math.sin((1-(demo.current-now)/3600)*Math.PI*2);ty=0}
  if(reducedMotion||!media.current||media.current.shown<0){tx=0;ty=0}
  pose.current.x=reducedMotion?0:damp(pose.current.x,tx,12);pose.current.y=reducedMotion?0:damp(pose.current.y,ty,12)
  const frame=Math.round((pose.current.y+1)*4)*65+Math.round((pose.current.x+1)*32),s=media.current
  if(s&&!s.v.error&&!s.busy&&s.v.readyState>=2&&s.shown!==frame){s.busy=true;s.start=now;s.v.currentTime=(frame+.5)/60}
  if(texture&&media.current?.t===texture)uniforms.art.value=texture
  uniforms.fade.value=damp(uniforms.fade.value,mobile&&active>0?.12:1)
  const m=stats.current;m.renders++
  if(import.meta.env.DEV&&now-m.start>1000){const seconds=(now-m.start)/1000;const label=Math.round(m.renders/seconds)+' render FPS | '+Math.round(((s?.count??0)-m.decoded)/seconds)+' seeks/s | '+Math.round(s?.latency??0)+' ms seek';gl.domElement.dataset.motionStats=label;gl.domElement.dataset.portraitReady=String(!!texture);const out=document.getElementById('portrait-performance');if(out)out.textContent=label;m.renders=0;m.decoded=s?.count??0;m.start=now}
 })
 return <group ref={root} position={[2.35,-.12,.3]}><mesh><planeGeometry args={[5.6,5.6]}/>{texture&&!reducedMotion&&texture===media.current?.t?<shaderMaterial transparent depthWrite={false} toneMapped={false} uniforms={uniforms} vertexShader={vertex} fragmentShader={fragment}/>:<meshBasicMaterial map={poster} transparent toneMapped={false}/>}</mesh></group>
}



