from pathlib import Path
import cv2, numpy as np, json
root=Path(__file__).resolve().parent.parent
src=root/'web/public/personal/directions'
out=root/'web/public/personal/motion'
out.mkdir(parents=True,exist_ok=True)
names=['up-left','up','up-right','left','front','right','down-left','down','down-right']
size=512
images=[cv2.resize(cv2.imread(str(src/(n+'.webp')),cv2.IMREAD_UNCHANGED),(size,size)) for n in names]
grays=[]
for im in images:
    alpha=im[:,:,3:4].astype(np.float32)/255
    rgb=(im[:,:,:3]*alpha+np.full_like(im[:,:,:3],20)*(1-alpha)).astype(np.uint8)
    grays.append(cv2.cvtColor(rgb,cv2.COLOR_BGR2GRAY))
flow={}
for a in range(9):
    for b in range(9):
        if abs(a//3-b//3)+abs(a%3-b%3)!=1: continue
        dis=cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
        dis.setVariationalRefinementIterations(20)
        f=dis.calc(grays[a],grays[b],None)
        f=cv2.GaussianBlur(f,(0,0),1.4)
        # Stable original torso; gradual neck blend rather than whole-image movement.
        yy=np.arange(size)[:,None]/size
        mask=np.clip((.72-yy)/.12,0,1)
        mask=mask*mask*(3-2*mask)
        f*=mask[:,:,None]
        flow[a,b]=f
stats=[]
for row in range(2):
 for col in range(2):
    ids=[row*3+col,row*3+col+1,(row+1)*3+col,(row+1)*3+col+1]
    atlas=np.zeros((192,192,4),np.float32)
    for k,a in enumerate(ids):
        h=flow[a,ids[k^1]]/size
        v=flow[a,ids[k^2]]/size
        # WebGL UV Y points upwards. Inverse sample mapping handles source positions.
        h[:,:,1]*=-1;v[:,:,1]*=-1
        packed=np.concatenate([h,v],axis=2)
        small=cv2.resize(packed,(96,96),interpolation=cv2.INTER_AREA)
        atlas[(k//2)*96:(k//2+1)*96,(k%2)*96:(k%2+1)*96]=small
    # Flip entire atlas rows; shader locates quadrants in UV coordinates.
    data=np.flipud(atlas).copy().astype('<f2')
    path=out/f'cell-{row*2+col}.bin'
    data.tofile(path)
    stats.append({'cell':row*2+col,'bytes':path.stat().st_size,'maximum_uv_displacement':float(np.max(np.abs(data)))})
print(json.dumps(stats))


