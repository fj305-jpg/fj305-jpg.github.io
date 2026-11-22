# Offline portrait sequence builder. RIFE-ncnn-vulkan: https://github.com/nihui/rife-ncnn-vulkan
# Install Pillow and numpy. Supply the official extracted RIFE executable with --rife.
# Existing original portrait reference images are not modified.
from pathlib import Path
import argparse
parser=argparse.ArgumentParser()
parser.add_argument('--rife',type=Path,required=True)
parser.add_argument('--work-dir',type=Path)
args=parser.parse_args()
root=Path(__file__).resolve().parent.parent
workspace=(args.work_dir or root.parent.parent/'work/rife-offline-build').resolve()
workspace.mkdir(parents=True,exist_ok=True)
from pathlib import Path
from PIL import Image
base=workspace
src=root/'web/public/personal/directions'
for row,names in enumerate([['up-left','up','up-right'],['left','front','right'],['down-left','down','down-right']]):
 for kind in ['rgb','alpha']:
  (base/f'input-{row}-{kind}').mkdir(exist_ok=True,parents=True)
  (base/f'output-{row}-{kind}').mkdir(exist_ok=True,parents=True)
 for i,name in enumerate(names):
  im=Image.open(src/(name+'.webp')).convert('RGBA').resize((640,640),Image.Resampling.LANCZOS)
  rgb=Image.new('RGB',im.size,(0,0,0));rgb.paste(im,mask=im.getchannel('A'))
  rgb.save(base/f'input-{row}-rgb/{i:03}.png')
  im.getchannel('A').convert('RGB').save(base/f'input-{row}-alpha/{i:03}.png')


from pathlib import Path
import subprocess,time
base=workspace
exe=args.rife.resolve()
model=exe.parent/'rife-v4.6'
started=time.monotonic()
for row,kind in [(0,'rgb'),(1,'rgb'),(2,'rgb'),(0,'alpha'),(1,'alpha'),(2,'alpha')]:
 subprocess.run([str(exe),'-i',str(base/f'input-{row}-{kind}'),'-o',str(base/f'output-{row}-{kind}'),'-n','48','-m',str(model),'-g','0','-j','2:2:2'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 print('Interpolated',row,kind,round(time.monotonic()-started,1),flush=True)
# One batch interleaves independent pairs; odd-index cross-pair results are unused.
for kind in ['rgb','alpha']:
 inp=base/f'vertical-input-{kind}';out=base/f'vertical-output-{kind}'
 inp.mkdir(exist_ok=True);out.mkdir(exist_ok=True)
 for band,(a,b) in enumerate([(0,1),(1,2)]):
  for col in range(33):
   for endpoint,row in enumerate([a,b]):
    index=(band*33+col)*2+endpoint
    (inp/f'{index:04}.png').write_bytes((base/f'output-{row}-{kind}/{col+1:08}.png').read_bytes())
 subprocess.run([str(exe),'-i',str(inp),'-o',str(out),'-n','264','-m',str(model),'-g','0','-j','2:2:2'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 print('Vertical interpolated',kind,round(time.monotonic()-started,1),flush=True)


from pathlib import Path
import subprocess
base=workspace
exe=args.rife.resolve();model=exe.parent/'rife-v4.6'
def source(row,col,kind):
 if row%2==0:return base/f'output-{row//2}-{kind}/{col+1:08}.png'
 return base/f'vertical-output-{kind}/{((row//2)*33+col)*4+2:08}.png'
for kind in ['rgb','alpha']:
 inp=base/f'quarter-input-{kind}';out=base/f'quarter-output-{kind}'
 inp.mkdir(exist_ok=True);out.mkdir(exist_ok=True)
 for band in range(4):
  for col in range(33):
   for endpoint,row in enumerate([band,band+1]):
    index=(band*33+col)*2+endpoint
    (inp/f'{index:04}.png').write_bytes(source(row,col,kind).read_bytes())
 subprocess.run([str(exe),'-i',str(inp),'-o',str(out),'-n','528','-m',str(model),'-g','0','-j','2:2:2'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 print('Quarter-pitch',kind,flush=True)


from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np,json
base=workspace
out=root/'web/public/personal/sequence-v7';out.mkdir(parents=True,exist_ok=True)
frames=[]
for row in range(9):
 for col in range(33):
  if row%4==0:
   source=[base/f'output-{row//4}-{kind}/{col+1:08}.png' for kind in ['rgb','alpha']]
  elif row%2==0:
   index=((row//4)*33+col)*4+2
   source=[base/f'vertical-output-{kind}/{index:08}.png' for kind in ['rgb','alpha']]
  else:
   index=((row//2)*33+col)*4+2
   source=[base/f'quarter-output-{kind}/{index:08}.png' for kind in ['rgb','alpha']]
  rgb=np.asarray(Image.open(source[0]).convert('RGB'),np.float32)
  alpha=np.asarray(Image.open(source[1]).convert('L'),np.float32)/255
  # Restore alpha after interpolation of premultiplied RGB. Preserve source frames.
  restored=np.clip(rgb/np.maximum(alpha[:,:,None],.02),0,255).astype(np.uint8)
  rgba=np.dstack([restored,(alpha*255).astype(np.uint8)])
  im=Image.fromarray(rgba).crop((115,19,525,455))
  frames.append(im)
for label,w,h in [('desktop',384,408),('mobile',192,204)]:
 atlas=Image.new('RGBA',(15*w,20*h))
 for i,im in enumerate(frames):
  atlas.paste(im.resize((w-4,h-4),Image.Resampling.LANCZOS),((i%15)*w+2,(i//15)*h+2))
 path=out/(label+'.webp');atlas.save(path,'WEBP',quality=88,method=4)
 print(label,path.stat().st_size,atlas.size,flush=True)
contact=Image.new('RGB',(5*240,3*275),'#0b1425');draw=ImageDraw.Draw(contact)
for j,(row,col) in enumerate([(r,c) for r in [0,4,8] for c in [0,8,16,24,32]]):
 im=frames[row*33+col].resize((230,245),Image.Resampling.LANCZOS)
 contact.paste(im,((j%5)*240,(j//5)*275),im)
 draw.text(((j%5)*240+8,(j//5)*275+248),f'pitch {row}, yaw {col}',fill='white')
contact.save(workspace/'contact-sheet.jpg')
(out/'manifest.json').write_text(json.dumps({'yawFrames':33,'pitchFrames':9,'atlasColumns':15,'atlasRows':20,'crop':[115/640,19/640,525/640,455/640],'desktopTile':[384,408],'mobileTile':[192,204],'gutter':2},indent=2))
# Slow sweep preview on a solid navy background for inspection.
preview=workspace/'preview';preview.mkdir(exist_ok=True)
for i,col in enumerate(list(range(33))+list(range(31,0,-1))):
 im=frames[132+col];bg=Image.new('RGB',im.size,'#0b1425');bg.paste(im,mask=im.getchannel('A'));bg.save(preview/f'{i:03}.png')
