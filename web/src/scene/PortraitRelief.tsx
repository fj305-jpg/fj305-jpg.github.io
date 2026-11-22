import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useJourney } from '../journey'

const LIMIT=THREE.MathUtils.degToRad(15)
const clamp=THREE.MathUtils.clamp
/** Photo-referenced illustration on an original shallow relief; no full-turn model. */
export default function PortraitRelief({reducedMotion}:{reducedMotion:boolean}){
  const texture=useTexture(`${import.meta.env.BASE_URL}personal/jin-chin-portrait.png`)
  texture.colorSpace=THREE.SRGBColorSpace
  const mesh=useRef<THREE.Mesh>(null)
  const {size,camera,gl}=useThree()
  const pointer=useRef({x:0,y:0}),yaw=useRef(0),drag=useRef<number|null>(null),greet=useRef(0)
  const projected=useMemo(()=>new THREE.Vector3(),[])
  const geometry=useMemo(()=>{
    const g=new THREE.PlaneGeometry(5.6,5.6,80,80),p=g.attributes.position
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i)
      // Soft depth across the face, torso and supporting hand, with original UVs intact.
      const face=.3*Math.exp(-((x-.1)**2/.9+(y-1)**2/1.5))
      const hand=.12*Math.exp(-((x-.95)**2/.5+(y-.1)**2/.8))
      p.setZ(i,face+hand-.016*x*x)
    }
    g.computeVertexNormals();return g
  },[])
  const uniforms=useMemo(()=>({art:{value:texture},gaze:{value:new THREE.Vector2()},fade:{value:1}}),[texture])
  useEffect(()=>{
    const move=(e:PointerEvent)=>{pointer.current={x:e.clientX/window.innerWidth*2-1,y:1-e.clientY/window.innerHeight*2}}
    const turn=(e:Event)=>{yaw.current=clamp(yaw.current+(e as CustomEvent<number>).detail,-LIMIT,LIMIT)}
    const reset=()=>{yaw.current=0;pointer.current={x:0,y:0}}
    const hello=()=>{greet.current=performance.now()+1500}
    window.addEventListener('pointermove',move);window.addEventListener('avatar-turn',turn);window.addEventListener('portrait-reset',reset);window.addEventListener('portrait-greet',hello)
    return ()=>{window.removeEventListener('pointermove',move);window.removeEventListener('avatar-turn',turn);window.removeEventListener('portrait-reset',reset);window.removeEventListener('portrait-greet',hello);gl.domElement.style.cursor=''}
  },[gl])
  useFrame(({clock},dt)=>{
    if(!mesh.current)return
    const active=useJourney.getState().active,mobile=size.width<641
    const targetX=mobile?0:[2.35,2.8,2.7,3.1,3.1,2.8,2.7][active]
    const scale=mobile?.47:active===0?1:.88
    mesh.current.position.x=THREE.MathUtils.damp(mesh.current.position.x,targetX,3,dt)
    mesh.current.position.y=THREE.MathUtils.damp(mesh.current.position.y,mobile?1.7:-.12,3,dt)
    mesh.current.scale.lerp(new THREE.Vector3(scale,scale,scale),1-Math.exp(-dt*4))
    projected.set(.25,1.04,.3).applyMatrix4(mesh.current.matrixWorld).project(camera)
    const dx=clamp(pointer.current.x-projected.x,-1,1),dy=clamp(pointer.current.y-projected.y,-1,1)
    const nod=performance.now()<greet.current&&!reducedMotion?Math.sin((greet.current-performance.now())*.006)*.025:0
    mesh.current.rotation.y=THREE.MathUtils.damp(mesh.current.rotation.y,clamp(yaw.current+(reducedMotion?0:dx*.095),-LIMIT,LIMIT),6,dt)
    mesh.current.rotation.x=THREE.MathUtils.damp(mesh.current.rotation.x,reducedMotion?0:-dy*.025+nod,6,dt)
    mesh.current.rotation.z=reducedMotion?0:Math.sin(clock.elapsedTime*.65)*.002
    uniforms.gaze.value.x=THREE.MathUtils.damp(uniforms.gaze.value.x,reducedMotion?0:dx*.006,9,dt)
    uniforms.gaze.value.y=THREE.MathUtils.damp(uniforms.gaze.value.y,reducedMotion?0:dy*.003,9,dt)
    uniforms.fade.value=THREE.MathUtils.damp(uniforms.fade.value,mobile&&active>0?.12:1,4,dt)
  })
  function down(e:ThreeEvent<PointerEvent>){e.stopPropagation();drag.current=e.clientX;(e.target as unknown as {setPointerCapture:(id:number)=>void}).setPointerCapture(e.pointerId);gl.domElement.style.cursor='grabbing'}
  function up(e:ThreeEvent<PointerEvent>){drag.current=null;(e.target as unknown as {releasePointerCapture:(id:number)=>void}).releasePointerCapture(e.pointerId);gl.domElement.style.cursor='grab'}
  return <mesh ref={mesh} geometry={geometry} position={[2.35,-.12,.3]}
    onPointerOver={()=>{gl.domElement.style.cursor='grab'}} onPointerOut={()=>{if(drag.current===null)gl.domElement.style.cursor=''}}
    onPointerDown={down} onPointerUp={up} onPointerCancel={up}
    onPointerMove={e=>{if(drag.current!==null){yaw.current=clamp(yaw.current+(e.clientX-drag.current)*.003,-LIMIT,LIMIT);drag.current=e.clientX}}}
    onDoubleClick={()=>window.dispatchEvent(new Event('portrait-greet'))}>
    <shaderMaterial transparent depthWrite={false} side={THREE.DoubleSide} uniforms={uniforms}
      vertexShader={`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
      fragmentShader={`uniform sampler2D art;uniform vec2 gaze;uniform float fade;varying vec2 vUv;
      void main(){vec2 uv=vUv;
      vec2 e1=(uv-vec2(.462,.691))/vec2(.027,.011);
      vec2 e2=(uv-vec2(.589,.698))/vec2(.027,.011);
      float mask=max(1.-smoothstep(.4,1.,length(e1)),1.-smoothstep(.4,1.,length(e2)));
      // Move the image samples inside the eye openings; eyelid boundaries remain fixed.
      uv-=gaze*mask;vec4 c=texture2D(art,uv);if(c.a<.02)discard;
      gl_FragColor=vec4(c.rgb,c.a*fade*smoothstep(0.,.045,vUv.y));
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`}/>
  </mesh>
}
