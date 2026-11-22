import * as THREE from 'three'

/** Original, texture-free character geometry. Reference photos guide proportions only. */
export function createAvatar(): THREE.Group {
  const root=new THREE.Group();root.name='Jin_Fengzhou'
  const skin=new THREE.MeshStandardMaterial({color:'#dba58a',roughness:.82})
  const blush=new THREE.MeshStandardMaterial({color:'#c58e78',roughness:.9})
  const hair=new THREE.MeshStandardMaterial({color:'#171d24',roughness:.86})
  const knit=new THREE.MeshStandardMaterial({color:'#243443',roughness:1})
  const rib=new THREE.MeshStandardMaterial({color:'#1b2b38',roughness:1})
  const trousers=new THREE.MeshStandardMaterial({color:'#40505f',roughness:1})
  const shoe=new THREE.MeshStandardMaterial({color:'#e7edf0',roughness:.9})
  const sole=new THREE.MeshStandardMaterial({color:'#c5d2da',roughness:1})
  const white=new THREE.MeshStandardMaterial({color:'#ece5da',roughness:.65})
  const iris=new THREE.MeshStandardMaterial({color:'#2a2526',roughness:.6})
  const pupil=new THREE.MeshStandardMaterial({color:'#10151b',roughness:.5})
  function oval(parent:THREE.Object3D,name:string,material:THREE.Material,p:number[],s:number[],segments=32){const m=new THREE.Mesh(new THREE.SphereGeometry(1,segments,24),material);m.name=name;m.position.set(p[0],p[1],p[2]);m.scale.set(s[0],s[1],s[2]);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
  function stroke(parent:THREE.Object3D,name:string,points:THREE.Vector3[],radius:number,material:THREE.Material){const curve=new THREE.CatmullRomCurve3(points);const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,20,radius,8,false),material);mesh.name=name;parent.add(mesh);return mesh}
  oval(root,'torso',knit,[0,2.85,0],[.88,1.12,.46])
  oval(root,'hem',rib,[0,1.99,0],[.77,.15,.43])
  oval(root,'hips',trousers,[0,1.89,0],[.66,.4,.37])
  oval(root,'neck',skin,[0,3.88,0],[.31,.43,.3])
  oval(root,'crewneck_collar',rib,[0,3.73,.035],[.43,.14,.37])
  for(const side of [-1,1]){
    oval(root,`leg_${side}`,trousers,[side*.39,1.22,0],[.34,1.16,.34])
    oval(root,`shoe_${side}`,shoe,[side*.39,.2,.18],[.36,.25,.59])
    oval(root,`sole_${side}`,sole,[side*.39,.065,.19],[.37,.085,.6])
    const arm=new THREE.Group();arm.name=side===1?'wave_arm':'left_arm';arm.position.set(side*.78,3.4,0);root.add(arm)
    oval(arm,'shoulder',knit,[side*-.04,-.09,0],[.31,.36,.32])
    oval(arm,'sleeve',knit,[side*.22,-.58,0],[.29,.85,.32])
    oval(arm,'cuff',rib,[side*.28,-1.27,.015],[.24,.15,.25])
    oval(arm,'hand',skin,[side*.28,-1.48,.07],[.19,.27,.15])
    oval(arm,'thumb',skin,[side*.12,-1.44,.16],[.09,.16,.09])
  }
  const head=new THREE.Group();head.name='head';head.position.set(0,4.65,0);root.add(head)
  // Broad cheeks, a rounded jaw, restrained eyes and swept black hair preserve key cues.
  const face=oval(head,'head_shape',skin,[0,0,0],[.79,1,.65],64)
  const facePositions=face.geometry.attributes.position
  for(let i=0;i<facePositions.count;i++){
    const y=facePositions.getY(i)
    const taper=y<-.12?1-.12*THREE.MathUtils.smoothstep(-y,.12,.95):1
    facePositions.setX(i,facePositions.getX(i)*taper)
  }
  face.geometry.computeVertexNormals()
  for(const side of [-1,1]){
    oval(head,'ear',skin,[side*.78,-.08,-.015],[.14,.27,.15])
    oval(head,'ear_inner',blush,[side*.84,-.08,.065],[.055,.15,.05])
    const eye=new THREE.Group();eye.name=`eye_${side}`;eye.position.set(side*.3,.05,.565);head.add(eye)
    oval(eye,'eye_white',white,[0,0,0],[.205,.095,.065])
    const moving=new THREE.Group();moving.name=`gaze_${side}`;eye.add(moving)
    oval(moving,'iris',iris,[0,0,.056],[.072,.075,.026])
    oval(moving,'pupil',pupil,[0,0,.078],[.038,.044,.012])
    oval(moving,'catchlight',white,[-.021,.024,.089],[.014,.015,.008])
    stroke(head,'upper_lid',[new THREE.Vector3(side*.3-.19,.065,.596),new THREE.Vector3(side*.3,.125,.623),new THREE.Vector3(side*.3+.19,.065,.596)],.017,hair)
    stroke(head,'eyebrow',[new THREE.Vector3(side*.3-.19,.29,.575),new THREE.Vector3(side*.3,.32,.64),new THREE.Vector3(side*.3+.17,.28,.58)],.028,hair)
  }
  oval(head,'nose_bridge',skin,[0,-.12,.59],[.09,.2,.095])
  oval(head,'nose_tip',skin,[0,-.27,.67],[.13,.085,.09])
  for(const side of [-1,1])oval(head,'nostril',blush,[side*.075,-.30,.71],[.02,.012,.018])
  stroke(head,'mouth',[new THREE.Vector3(-.23,-.55,.563),new THREE.Vector3(0,-.58,.62),new THREE.Vector3(.23,-.55,.563)],.019,blush)
  oval(head,'lower_lip',skin,[0,-.61,.583],[.16,.032,.036])
  oval(head,'cheek_mole',hair,[.38,-.53,.543],[.012,.012,.009],12)
  oval(head,'hair_cap',hair,[0,.56,-.11],[.815,.65,.64],40)
  oval(head,'back_hair',hair,[0,.15,-.4],[.75,.79,.34])
  for(const side of [-1,1])oval(head,'sideburn',hair,[side*.72,.2,.02],[.1,.36,.2])
  for(let i=0;i<24;i++){
    const t=i/23,x=(t-.5)*1.46
    const tuft=oval(head,'swept_hair',hair,[x,.73+.13*Math.sin(t*Math.PI),.27+.1*Math.sin(t*Math.PI)],[.15,.35+(.5-Math.abs(t-.5))*.2,.23])
    tuft.rotation.z=-.24+.55*(t-.5);tuft.rotation.x=-.45
  }
  for(let i=0;i<9;i++){const tuft=oval(head,'front_sweep',hair,[-.53+i*.12,.61+Math.sin(i*.3)*.12,.46],[.12,.23,.17]);tuft.rotation.z=-.6;tuft.rotation.x=-.4}
  root.userData={title:'Jin Fengzhou — stylized character',description:'Original procedural 3D model, guided by supplied portrait; no photographic textures.',license:'Personal character asset for Jin Fengzhou'}
  return root
}
