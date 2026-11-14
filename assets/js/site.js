/* Govision Earth | SARFlow Explorer — static, reproducible display of archived NISAR results. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const names = {or:'Fusion · Either orbit',and:'Fusion · Both orbits',asc:'Ascending',desc:'Descending',agreement:'Orbit agreement',transition:'Water-state change'};
  const labels = {'20260906':'06 September 2026','20260930':'30 September 2026','20261012':'12 October 2026'};
  const pal = {asc:'#1889e7',desc:'#f18d39',or:'#14b8a6',and:'#6a65df'};
  const legends = {
    or:[['#14c1a1','Detected by either orbit']],and:[['#746bdf','Detected by both orbits']],
    asc:[['#159fe8','Ascending detections']],desc:[['#f49340','Descending detections']],
    agreement:[['#746bdf','Both orbits'],['#159fe8','Ascending only'],['#f49340','Descending only'],['#a3abb4','Complex response']],
    transition:[['#17b995','Added candidate'],['#eb7056','No longer a candidate'],['#7473e1','Detected at both dates']]
  };
  const state = {date:'20260930',view:'or',right:'desc',basemap:'satellite',layout:'single',opacity:.74,labels:true,metric:'F1',trend:'or',theme:'light'};
  const maps={left:null,right:null},overlays={left:null,right:null},baselayers={left:null,right:null},labelLayers={left:null,right:null};
  let app=null,lock=false;
  const num = x => Number(x ?? 0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  function area(){return app.area[state.date]}
  function resolved(view){return view==='transition' && state.date==='20260906'?'agreement':view}
  function mapImage(view){return app.map_images[state.date+'_'+resolved(view)]}
  function isAvailable(view){return !!mapImage(view)}
  function selectActive(selector,attribute,value){$$(selector).forEach(el=>{let on=el.dataset[attribute]===value;el.classList.toggle('active',on);el.setAttribute('aria-pressed',String(on))})}
  function makeBasemap(which){
    if(!maps[which])return;
    if(baselayers[which]){maps[which].removeLayer(baselayers[which]);baselayers[which]=null}
    if(labelLayers[which]){maps[which].removeLayer(labelLayers[which]);labelLayers[which]=null}
    let tile,attrs;
    if(state.basemap==='satellite'){
      tile='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attrs='Tiles © Esri, Maxar, Earthstar Geographics, and GIS User Community';
    }else{
      tile='https://tile.openstreetmap.org/{z}/{x}/{y}.png';attrs='© OpenStreetMap contributors';
    }
    baselayers[which]=L.tileLayer(tile,{maxZoom:19,maxNativeZoom:18,attribution:attrs,detectRetina:false,keepBuffer:2,updateWhenIdle:true}).addTo(maps[which]);
    if(state.basemap==='satellite' && state.labels){
      labelLayers[which]=L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',{attribution:'Place labels © Esri',maxZoom:19,maxNativeZoom:17,pane:'overlayPane',opacity:.9}).addTo(maps[which]);
    }
    // Thematic rasters always appear above basemap and place labels.
    if(overlays[which])overlays[which].bringToFront();
    $('overlay-credit').textContent = state.basemap==='satellite'?'Imagery © Esri and imagery providers · Labels © Esri':'© OpenStreetMap contributors';
  }
  function drawOverlay(which,view){
    const map=maps[which];if(!map)return;
    if(overlays[which]){map.removeLayer(overlays[which]);overlays[which]=null}
    if(!isAvailable(view))return;
    overlays[which]=L.imageOverlay(mapImage(view),app.bounds,{opacity:state.opacity,interactive:false,className:'thematic-overlay'}).addTo(map);
  }
  function renderMap(){drawOverlay('left',state.view);if(state.layout==='split')drawOverlay('right',state.right)}
  function sync(source,target){if(lock||!maps[target])return;lock=true;maps[target].setView(maps[source].getCenter(),maps[source].getZoom(),{animate:false});lock=false}
  function createMap(which){
    if(maps[which]||typeof L==='undefined')return;
    const map=L.map('map-'+which,{zoomControl:which==='left',scrollWheelZoom:true,attributionControl:true,zoomSnap:.25,preferCanvas:true});
    maps[which]=map;
    if(which==='left')L.control.scale({imperial:false,metric:true,position:'bottomleft'}).addTo(map);
    map.fitBounds(app.bounds,{padding:[12,12]});
    makeBasemap(which);drawOverlay(which,which==='left'?state.view:state.right);
    map.on('mousemove',e=>{$('map-coords').textContent=`${Math.abs(e.latlng.lat).toFixed(4)}° ${e.latlng.lat>=0?'N':'S'} · ${Math.abs(e.latlng.lng).toFixed(4)}° ${e.latlng.lng>=0?'E':'W'}`});
    map.on('move',()=>sync(which,which==='left'?'right':'left'));
  }
  function updateLegend(){const t=resolved(state.view);$('map-legend').innerHTML=(legends[t]||[]).map(([c,l])=>`<span><i style="background:${c}"></i>${l}</span>`).join('')}
  function updateSummary(){
    const a=area(),view=resolved(state.view);
    let value=view==='asc'?a.asc:view==='desc'?a.desc:view==='and'?a.and:view==='transition'?a.new_observed:a.or;
    const descriptions={or:'Areas detected by at least one viewing direction.',and:'Water candidates identified by both viewing directions.',asc:'Water candidates detected in the ascending pass.',desc:'Water candidates detected in the descending pass.',agreement:'Comparison of shared detections and single-orbit differences.',transition:'New detections relative to the 06 September observation.'};
    if(!Number.isFinite(value))value=a.or;
    $('metric-value').textContent=num(value);$('metric-label').textContent=view==='agreement'?'Combined water candidate area':view==='transition'?'Newly observed candidates':'Water candidates · '+names[view];
    $('metric-hint').textContent=descriptions[view];$('stat-date').textContent=labels[state.date].toUpperCase();
    $('map-heading').textContent=names[view];$('map-epoch').textContent=labels[state.date];
    $('stat-shared').textContent=num(a.and)+' km²';$('stat-asc').textContent=num(a.asc_only)+' km²';$('stat-desc').textContent=num(a.desc_only)+' km²';
    const text={
      or:'Fusion OR combines detections from the ascending and descending views. It has the highest optical-reference F1 on the selected 30 September test.',
      and:'Fusion AND retains detections shared by both directions, giving the highest precision in the 30 September optical comparison.',
      asc:'The ascending observation presents one radar view of the same landscape. Compare its detections with the descending view.',
      desc:'The descending observation records the study area from another geometry and identifies a different spatial pattern.',
      agreement:'Purple shows shared detections; blue and orange highlight where the two viewing directions differ.',
      transition:'These pixels changed their mapped water state relative to 06 September. The earlier date is a previous observation, not an established dry reference.'
    };
    $('stat-insight').textContent=text[view];
    selectActive('[data-date]','date',state.date);selectActive('[data-view]','view',state.view);selectActive('[data-basemap]','basemap',state.basemap);selectActive('[data-layout]','layout',state.layout);
    $('opacity-range').value=Math.round(state.opacity*100);$('opacity-value').textContent=Math.round(state.opacity*100)+'%';$('labels-toggle').checked=state.labels;
    $('right-view').value=state.right;
    updateLegend();
  }
  function setTheme(mode){state.theme=mode;document.body.dataset.theme=mode;const btn=$('theme-btn');btn.setAttribute('aria-pressed',String(mode==='dark'));btn.innerHTML=`<span aria-hidden="true">${mode==='dark'?'☀':'◐'}</span><span>${mode==='dark'?'Light mode':'Dark mode'}</span>`;try{localStorage.setItem('govision-theme',mode)}catch(e){}}
  function updateLayout(){
    $('map-frame').classList.toggle('split',state.layout==='split');
    if(state.layout==='split'){
      createMap('right');setTimeout(()=>{maps.left?.invalidateSize();maps.right?.invalidateSize();sync('left','right');drawOverlay('right',state.right)},160)
    }else{setTimeout(()=>maps.left?.invalidateSize(),80)}
    updateSummary();
  }
  function scoreChart(){
    if(!app?.scores)return;const metric=state.metric;
    const order=['Ascending','Descending','Fusion AND','Fusion OR'];
    $('score-chart').innerHTML=order.map(name=>{
      const m=app.scores.find(r=>r.model===name);if(!m)return'';
      const value=m[metric],color=pal[name==='Fusion OR'?'or':name==='Fusion AND'?'and':name==='Ascending'?'asc':'desc'];
      const l=metric==='F1'?`<i class="interval" style="left:${m.F1_CI95_low*100}%"></i><i class="interval upper" style="left:${m.F1_CI95_high*100}%"></i>`:'';
      return `<div class="score-row" title="${name}: ${metric} ${value.toFixed(3)}"><span class="name">${name}</span><div class="score-track"><div class="score-fill" style="width:${value*100}%;background:${color}"></div>${l}</div><strong class="val">${value.toFixed(3)}</strong></div>`
    }).join('');
    $('score-caption').textContent=metric==='F1'?'F1 · 95% spatial-block bootstrap intervals · n = 162':`${metric.toUpperCase()} · Same 162 selected Sentinel-2 optical-reference samples`;
    selectActive('[data-metric]','metric',state.metric)
  }
  function trendChart(){
    if(!app?.area)return;const field=state.trend,points=app.dates.map(d=>app.area[d][field]);
    const width=850,height=270,left=65,right=33,top=28,bottom=41;
    const ymin=0,ymax=510;
    const x=i=>left+i*(width-left-right)/2;
    const y=v=>height-bottom-(v-ymin)/(ymax-ymin)*(height-top-bottom);
    let svg=`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Detected water candidate areas in square kilometers for the three observation dates"><title>Radar water candidates through time</title>`;
    [0,100,200,300,400,500].forEach(t=>{svg+=`<line class="gridline" x1="${left}" y1="${y(t)}" x2="${width-right}" y2="${y(t)}" stroke-width="1"/><text x="${left-13}" y="${y(t)+4}" text-anchor="end" font-size="12">${t}</text>`});
    svg+=`<polygon points="${x(0)},${y(0)} ${points.map((v,i)=>`${x(i)},${y(v)}`).join(' ')} ${x(2)},${y(0)}" fill="var(--teal)" fill-opacity="0.07"/>`;
    svg+=`<polyline class="trendline" points="${points.map((v,i)=>`${x(i)},${y(v)}`).join(' ')}" fill="none" stroke-width="3.5" stroke-linecap="round"/>`;
    points.forEach((v,i)=>{svg+=`<circle class="trenddot" cx="${x(i)}" cy="${y(v)}" r="7" stroke="var(--panel)" stroke-width="3"><title>${num(v)} km²</title></circle><text x="${x(i)}" y="${y(v)-18}" text-anchor="middle" font-size="15" font-weight="750">${num(v)}</text><text x="${x(i)}" y="${height-9}" text-anchor="middle" font-size="12">${['06 Sep','30 Sep','12 Oct'][i]}</text>`});
    $('trend-chart').innerHTML=svg+'</svg>';
    selectActive('[data-trend]','trend',field)
  }
  function downloadCSV(){
    const lines=['Date,Ascending_km2,Descending_km2,Fusion_OR_km2,Fusion_AND_km2,Ascending_only_km2,Descending_only_km2'];
    for(const d of app.dates){const a=app.area[d];lines.push([d,a.asc,a.desc,a.or,a.and,a.asc_only,a.desc_only].join(','))}
    const blob=new Blob([lines.join('\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Govision_Earth_NISAR_Areas.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)
  }
  function listen(){
    $$('[data-date]').forEach(b=>b.addEventListener('click',()=>{state.date=b.dataset.date;if(state.date==='20260906'&&state.view==='transition')state.view='agreement';updateSummary();renderMap()}));
    $$('[data-view]').forEach(b=>b.addEventListener('click',()=>{state.view=b.dataset.view;if(state.view==='transition'&&state.date==='20260906')state.date='20260930';updateSummary();renderMap()}));
    $$('[data-layout]').forEach(b=>b.addEventListener('click',()=>{state.layout=b.dataset.layout;updateLayout()}));
    $$('[data-basemap]').forEach(b=>b.addEventListener('click',()=>{state.basemap=b.dataset.basemap;for(const k of Object.keys(maps))makeBasemap(k);updateSummary()}));
    $('labels-toggle').addEventListener('change',e=>{state.labels=e.target.checked;for(const k of Object.keys(maps))makeBasemap(k)});
    $('opacity-range').addEventListener('input',e=>{state.opacity=+e.target.value/100;$('opacity-value').textContent=e.target.value+'%';for(const k of Object.keys(overlays)){overlays[k]?.setOpacity(state.opacity)}});
    $('reset-view').addEventListener('click',()=>maps.left?.fitBounds(app.bounds,{padding:[13,13]}));
    $('right-view').addEventListener('change',e=>{state.right=e.target.value;drawOverlay('right',state.right)});
    $('theme-btn').addEventListener('click',()=>setTheme(state.theme==='light'?'dark':'light'));
    $$('[data-metric]').forEach(b=>b.addEventListener('click',()=>{state.metric=b.dataset.metric;scoreChart()}));
    $$('[data-trend]').forEach(b=>b.addEventListener('click',()=>{state.trend=b.dataset.trend;trendChart()}));
    $('download-summary').addEventListener('click',downloadCSV)
  }
  async function start(){
    try{
      const response=await fetch('data/app_data.json');if(!response.ok)throw Error('Missing data/app_data.json');app=await response.json();
      if(!app.bounds||!app.area||!app.map_images||!app.scores)throw Error('Dataset incomplete');
      listen();try{setTheme(localStorage.getItem('govision-theme')==='dark'?'dark':'light')}catch(e){setTheme('light')}
      updateSummary();scoreChart();trendChart();
      if(typeof L==='undefined')throw Error('Leaflet library failed to load. Verify CDN connectivity.');
      createMap('left');
    }catch(error){console.error('[Govision Earth]',error);const m=$('map-heading');if(m)m.textContent='Map service temporarily unavailable';const s=$('stat-insight');if(s)s.textContent='Check the site connection and refresh the page.'}
  }
  start();
})();
