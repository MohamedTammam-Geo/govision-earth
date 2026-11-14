"""Rebuild public map overlays from local, aligned NISAR categorical rasters.

Usage: python scripts/build_assets.py --source /path/to/rasters --output .
Sources are the user's Results_2 outputs. We use no model-estimated values.
"""
import argparse, json, csv, hashlib
from pathlib import Path
import numpy as np
from PIL import Image
import rasterio
from rasterio.warp import calculate_default_transform, reproject, Resampling
from rasterio.transform import array_bounds

SRC={
 'A':'ASC_states_3epochs.tif',
 'D':'DESC_states_3epochs.tif',
 'fusion':'fusion_candidate_3epochs.tif',
 'typology':'water_typology_3epochs.tif',
}
DATES=['20260906','20260930','20261012']
# All data are in 10m EPSG:32647. Palettes are for presentation, not classes.
COLORS={
 'ascending': (65,191,232,210), 'descending': (246,170,104,210),
 'or': (40,211,169,215), 'and': (162,150,243,225),
 'agreement': {1:(157,140,242,225),2:(61,192,235,224),3:(245,175,105,225),4:(124,136,155,125)},
 'change': {1:(45,211,170,232),2:(228,154,90,220),3:(147,143,244,170)}
}

def parse():
 p=argparse.ArgumentParser();p.add_argument('--source',required=True);p.add_argument('--output',required=True);p.add_argument('--max-width',type=int,default=1600);return p.parse_args()

def main():
 args=parse();src=Path(args.source);out=Path(args.output);maps=out/'assets'/'maps';maps.mkdir(parents=True,exist_ok=True);(out/'data').mkdir(exist_ok=True)
 arrays={};profiles={};descriptions={}
 for name,fn in SRC.items():
  path=src/fn
  if not path.exists():path=src/(fn+'.tiff')  # Some connector exports append '.tiff'.
  if not path.exists():raise FileNotFoundError(path)
  with rasterio.open(path) as ds:
   arrays[name]=ds.read();profiles[name]=ds.profile;descriptions[name]=ds.descriptions
 srcpf=profiles['fusion'];w,h=srcpf['width'],srcpf['height'];transform=srcpf['transform'];crs=srcpf['crs'];
 assert crs.to_epsg()==32647
 for name,pf in profiles.items():
  assert (pf['crs']==crs and pf['width']==w and pf['height']==h and pf['transform']==transform),f'misaligned {name}'
 # Native 10m AOI grid. Reproject to north-up Web-friendly EPSG:4326.
 destination_transform,dw,dh=calculate_default_transform(crs,'EPSG:4326',w,h,*rasterio.open((src/SRC['fusion'] if (src/SRC['fusion']).exists() else src/(SRC['fusion']+'.tiff'))).bounds)
 ratio=min(1,args.max_width/dw)
 dw=max(1,round(dw*ratio));dh=max(1,round(dh*ratio))
 from affine import Affine
 destination_transform=destination_transform*Affine.scale(1/ratio,1/ratio)
 bounds=array_bounds(dh,dw,destination_transform)
 spatial_bounds=[[bounds[1],bounds[0]],[bounds[3],bounds[2]]]
 metadata={
  'title':'SARFlow Explorer','location':'Prachin Buri search area, Thailand',
  'aoi_note':'Research search rectangle; not a hydrologically delineated catchment',
  'dates':[{'id':d,'label':f'{d[6:]} {"Sep" if d[4:6]=="09" else "Oct"} 2026'} for d in DATES],
  'bounds':spatial_bounds,'crs_source':'EPSG:32647','map_crs':'EPSG:4326','grid_resolution_m':10,
  'method_note':'NISAR L2 GCOV HH/HV candidate open-water states; no confirmed flood-onset classification',
  'optical_reference':'Automated high-confidence Sentinel-2 optical proxy for 30 Sep only, n=162. Not field truth.',
  'baseline_note':'06 Sep is a prior radar epoch, not established dry baseline',
  'classes':{'fusion':{'0':'Both noncandidate','1':'Both candidate','2':'Ascending only','3':'Descending only','4':'Ambiguous','255':'No observation'}},
  'area':{},'map_images':{}
 }

 def rgba_u8(arr, palette):
  # Default transparent. Map only targeted categorical classes.
  rgba=np.zeros((arr.shape[0],arr.shape[1],4),dtype=np.uint8)
  for code,color in palette.items():rgba[arr==code]=color
  return rgba
 def emit(name,layer,palette):
  dest=np.full((dh,dw),255,dtype=np.uint8)
  reproject(source=layer,destination=dest,src_transform=transform,src_crs=crs,src_nodata=255,
            dst_transform=destination_transform,dst_crs='EPSG:4326',dst_nodata=255,resampling=Resampling.nearest)
  rgba=rgba_u8(dest,palette)
  fn=f'{name}.png';Image.fromarray(rgba,'RGBA').save(maps/fn,optimize=True)
  metadata['map_images'][name]=f'assets/maps/{fn}'
  return rgba
 for i,d in enumerate(DATES):
  a=arrays['A'][i];de=arrays['D'][i];f=arrays['fusion'][i]
  valid=(f!=255)&(f!=4)
  # Guarantees all A/D/OR/AND come from consistent native categorical raster classes.
  a_binary=(a==1).astype(np.uint8);a_binary[a==255]=255
  d_binary=(de==1).astype(np.uint8);d_binary[de==255]=255
  or_binary=np.zeros(f.shape,dtype=np.uint8);or_binary[np.isin(f,[1,2,3])]=1;or_binary[~valid]=255
  and_binary=np.zeros(f.shape,dtype=np.uint8);and_binary[f==1]=1;and_binary[~valid]=255
  emit(f'{d}_asc',a_binary,{1:COLORS['ascending']})
  emit(f'{d}_desc',d_binary,{1:COLORS['descending']})
  emit(f'{d}_or',or_binary,{1:COLORS['or']})
  emit(f'{d}_and',and_binary,{1:COLORS['and']})
  emit(f'{d}_agreement',f,COLORS['agreement'])
  px=abs(transform.a*transform.e)/1e6
  metadata['area'][d]={
   'a_km2':round(int(np.sum(a==1))*px,4),'d_km2':round(int(np.sum(de==1))*px,4),
   'and_km2':round(int(np.sum(f==1))*px,4),'a_only_km2':round(int(np.sum(f==2))*px,4),
   'd_only_km2':round(int(np.sum(f==3))*px,4),'ambiguous_km2':round(int(np.sum(f==4))*px,4),
   'or_km2':round(int(np.isin(f,[1,2,3]).sum())*px,4)
  }
  if i:
   prev=arrays['fusion'][0]; now=f
   # A valid comparison needs valid pixels in both epochs.
   b=np.isin(prev,[1,2,3]);c=np.isin(now,[1,2,3]);m=(prev!=255)&(now!=255)&(prev!=4)&(now!=4)
   change=np.full(f.shape,255,dtype=np.uint8)
   change[m]=0;change[m&(~b)&c]=1;change[m&b&(~c)]=2;change[m&b&c]=3
   emit(f'{d}_transition',change,COLORS['change'])
   metadata['area'][d]['became_candidate_km2']=round(int(np.sum(change==1))*px,4)
   metadata['area'][d]['ceased_candidate_km2']=round(int(np.sum(change==2))*px,4)
   metadata['area'][d]['persistent_candidate_km2']=round(int(np.sum(change==3))*px,4)
 # scores from actual Stage 08C (frozen report CSV used in repo, recorded in provenance)
 p=out/'data'/'optical_proxy_scores.csv'
 if p.exists():
  with p.open(newline='',encoding='utf-8') as f:rows=list(csv.DictReader(f))
  metadata['optical_scores']=[{k:(float(v) if k in ('precision','recall','F1','F2','IoU','F1_CI95_low','F1_CI95_high') else v) for k,v in r.items() if k in ('model','precision','recall','F1','F2','IoU','F1_CI95_low','F1_CI95_high')} for r in rows]
 else:metadata['optical_scores']=[]
 (out/'data'/'site_data.json').write_text(json.dumps(metadata,indent=2),encoding='utf-8')
 print('Generated',len(metadata['map_images']),'real raster-derived WGS84 PNG overlays');print('Bounds',spatial_bounds,'size',dw,dh)
 print('Summary',json.dumps(metadata['area'],indent=1))
 for p in sorted(maps.iterdir()):print(p.name,p.stat().st_size)
if __name__=='__main__':main()
