import fs from 'node:fs/promises'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { createAvatar } from './src/scene/avatarModel.ts'
globalThis.FileReader = class {
  result=null
  onloadend=null
  readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.()})}
  readAsDataURL(blob){blob.arrayBuffer().then(result=>{this.result='data:'+blob.type+';base64,'+Buffer.from(result).toString('base64');this.onloadend?.()})}
}
const avatar=createAvatar()
const result=await new GLTFExporter().parseAsync(avatar,{binary:true})
await fs.writeFile('public/personal/jin-fengzhou.glb',Buffer.from(result))
console.log('Exported original 3D character:',result.byteLength,'bytes')
