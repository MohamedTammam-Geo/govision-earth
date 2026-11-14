"""Export transparent, georeferenced PNG overlays from aligned NISAR Results_2 rasters.
Run: python scripts/build_maps.py --source /path/to/Results_2_rasters --output .
Dependencies: numpy, Pillow, rasterio, affine.
"""
from pathlib import Path
from argparse import ArgumentParser
import json, csv, hashlib
import numpy as np
from PIL import Image
import rasterio
from rasterio.warp import calculate_default_transform, reproject, Resampling
from rasterio.transform import array_bounds
from affine import Affine

DATES=['20260906','20260930','20261012']
SRC={'asc':'ASC_states_3epochs.tif','desc':'DESC_states_3epochs.tif','fusion':'fusion_candidate_3epochs.tif'}
PAL={
 'asc':{1:(24,158,230,188)},
 'desc':{1:(244,155,63,188)},
 'or':{1:(226,76,134,184)},
 'and':{1:(125,111,229,190)},
 'agreement':{1:(125,111,229,192),2:(24,158,230,204),3:(244,155,63,207),4:(166,171,180,60)},
 'transition':{1:(226,76,134,191),2:(244,155,63,194),3:(125,111,229,150)}
}

def find(src,filename):
 for q in (src/filename,src/(filename+'.tiff')):
  if q.exists():return q
 raise FileNotFoundError(filename)

def main(src,out,limit):
 out=Path(out); src=Path(src);maps=out/'assets/maps';maps.mkdir(parents=True,exist_ok=True)
 (out/'data').mkdir(exist_ok=True)
 ary={};profiles={};paths={}
 for k,name in SRC.items():
  paths[k]=find(src,name)
  with rasterio.open(paths[k]) as ds: ary[k]=ds.read();profiles[k]=ds.profile
 pf=profiles['fusion']; w,h=pf['width'],pf['height']; T=pf['transform']; CRS=pf['crs']
 if CRS.to_epsg()!=32647:raise ValueError('Unexpected source CRS')
 for k,p in profiles.items():
  if p['transform']!=T or p['width']!=w or p['height']!=h or p['crs']!=CRS:raise ValueError('Unaligned raster: '+k)
 with rasterio.open(paths['fusion']) as ds:
  dstT,dw,dh=calculate_default_transform(CRS,'EPSG:4326',w,h,*ds.bounds)
 f=min(1,limit/dw);dw=round(dw*f);dh=round(dh*f);dstT=dstT*Affine.scale(1/f,1/f)
 bb=array_bounds(dh,dw,dstT);bounds=[[bb[1],bb[0]],[bb[3],bb[2]]]
 info={'project':'Govision Earth','application':'SARFlow Explorer','bounds':bounds,'dates':DATES,'area':{},'map_images':{},'reference':'AUTOMATED_SENTINEL2_OPTICAL_PROXY','projection_source':'EPSG:32647','original_grid_m':10,'web_images':'EPSG:4326 / nearest-neighbor categorical / transparency'}
 def emit(date,kind,values,pal):
  dest=np.full((dh,dw),255,dtype=np.uint8)
  reproject(values,dest,src_transform=T,src_crs=CRS,src_nodata=255,dst_transform=dstT,dst_crs='EPSG:4326',dst_nodata=255,resampling=Resampling.nearest)
  rgba=np.zeros((dh,dw,4),dtype=np.uint8)
  for cat,color in pal.items():rgba[dest==cat]=color
  fn=f'{date}_{kind}.png';Image.fromarray(rgba).save(maps/fn,optimize=True)
  info['map_images'][f'{date}_{kind}']='assets/maps/'+fn
 px=abs(T.a*T.e)/1e6
 for i,date in enumerate(DATES):
  a=ary['asc'][i];d=ary['desc'][i];f=ary['fusion'][i]
  valid=(f!=255)&(f!=4)
  for k,arr in [('asc',a),('desc',d)]:
   dst=np.where(arr==255,255,np.where(arr==1,1,0)).astype(np.uint8);emit(date,k,dst,PAL[k])
  or_v=np.where(valid,np.isin(f,[1,2,3]),255).astype(np.uint8)
  and_v=np.where(valid,f==1,255).astype(np.uint8)
  emit(date,'or',or_v,PAL['or']);emit(date,'and',and_v,PAL['and']);emit(date,'agreement',f,PAL['agreement'])
  info['area'][date]={
   'asc':round(float(np.sum(a==1)*px),4),'desc':round(float(np.sum(d==1)*px),4),
   'and':round(float(np.sum(f==1)*px),4),'or':round(float(np.sum(np.isin(f,[1,2,3]))*px),4),
   'asc_only':round(float(np.sum(f==2)*px),4),'desc_only':round(float(np.sum(f==3)*px),4),
   'ambiguous':round(float(np.sum(f==4)*px),4)}
  if i>0:
   prev=ary['fusion'][0];before=np.isin(prev,[1,2,3]);now=np.isin(f,[1,2,3]);mask=(prev!=255)&(f!=255)&(prev!=4)&(f!=4)
   change=np.full(f.shape,255,dtype=np.uint8);change[mask]=0;change[mask & ~before & now]=1;change[mask & before & ~now]=2;change[mask & before & now]=3
   emit(date,'transition',change,PAL['transition'])
   info['area'][date]['new_observed']=round(float(np.sum(change==1)*px),4)
   info['area'][date]['no_longer_observed']=round(float(np.sum(change==2)*px),4)
  print(date,info['area'][date],flush=True)
 with open(out/'data/optical_proxy_scores.csv',newline='',encoding='utf-8') as fl:
  info['scores']=[{k:float(v) if k not in ('model','epoch','reference') else v for k,v in row.items()} for row in csv.DictReader(fl)]
 with open(out/'data/paired_proxy_F1_differences.csv',newline='',encoding='utf-8') as fl:
  info['paired']=[r for r in csv.DictReader(fl)]
 (out/'data/app_data.json').write_text(json.dumps(info,indent=2),encoding='utf-8')
 print('OK',len(info['map_images']),'overlays,',dw,'x',dh,'bounds',bounds)

if __name__=='__main__':
 a=ArgumentParser();a.add_argument('--source',required=True);a.add_argument('--output',default='.');a.add_argument('--max-width',type=int,default=1720);cfg=a.parse_args();main(cfg.source,cfg.output,cfg.max_width)
