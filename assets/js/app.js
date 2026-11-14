/* SARFlow Explorer — client-side, read-only visualization of frozen Results_2 products.
 * No precision/recall/flood status is estimated in the browser. Data source: site_data.json.
 */
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const dateNames = {20260906: '06 Sep 2026', 20260930:'30 Sep 2026', 20261012:'12 Oct 2026'};
  const niceMode = {asc:'Ascending',desc:'Descending',or:'Fusion OR',and:'Fusion AND',agreement:'Orbit agreement',transition:'Observed transition'};
  const palette = {asc:'#50c2e8',desc:'#e7ad80',or:'#31cdae',and:'#a69af2'};
  const legends={
    asc:[['#50c2e8','Ascending water candidate']],
    desc:[['#e7ad80','Descending water candidate']],
    or:[['#31cdae','Detected by either orbit']],
    and:[['#a69af2','Detected by both orbits']],
    agreement:[['#9d8cf2','Both orbits'],['#3dc0eb','Ascending only'],['#f5af69','Descending only'],['#7c889b','Ambiguous / incomplete']],
    transition:[['#2dd3aa','Became candidate'],['#e49a5a','Ceased candidate'],['#938ff4','Candidate at both dates']]
  };
  const $safe=(name, fallback='—') => document.getElementById(name) || {textContent:fallback};
  const n=(value)=>Number(value||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  const state = {date:'20260930',mode:'agreement',opacity:0.85,compare:false,split:0.5};
  let map, current, baseline, data;
  function mapPath(date,mode){return data?.map_images?.[`${date}_${mode}`] || null}
  function getArea(){return data.area[state.date]}
  function viewConfig(){
    if(state.mode==='transition' && state.date==='20260906')return {mode:'agreement',note:'Transition is measured against the 06 Sep observation; select a later date to view a change map.'};
    return {mode:state.mode,note:null};
  }
  function buildLegend(){const key=viewConfig().mode;const root=$('#map-legend');root.innerHTML='';(legends[key]||[]).forEach(([color,text])=>{
    const div=document.createElement('div'); const s=document.createElement('i');s.className='swatch';s.style.background=color;div.append(s,document.createTextNode(text));root.append(div);
  });}
  function updateButtons(){
    $$('[data-date]').forEach(b=>{const on=b.dataset.date===state.date;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});
    $$('[data-mode]').forEach(b=>{const on=b.dataset.mode===state.mode;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});
    $('#compare-toggle').checked=state.compare;
    $('#opacity-label').textContent=Math.round(state.opacity*100)+'%';
    $('#layer-opacity').value=Math.round(state.opacity*100);
    $('#swipe-ui').hidden=!state.compare;
    $('#swipe-current').textContent=dateNames[state.date].toUpperCase()+' / SELECTED';
    $('#swipe-range').value=state.split*100;
  }
  function updateInsights(){
    const a=getArea(),cfg=viewConfig();
    $('#map-title').textContent=niceMode[state.mode];$('#map-subtitle').textContent=dateNames[state.date];
    $('#insight-date').textContent=dateNames[state.date].toUpperCase();
    $('#metric-feature-label').textContent=state.mode==='asc'?'Ascending candidate area':state.mode==='desc'?'Descending candidate area':state.mode==='and'?'Dual-orbit consensus area':state.mode==='transition'?'Became candidate since 06 Sep':'Union candidate area';
    const val=state.mode==='asc'?a.a_km2:state.mode==='desc'?a.d_km2:state.mode==='and'?a.and_km2:state.mode==='transition'&&a.became_candidate_km2!=null?a.became_candidate_km2:a.or_km2;
    $('#metric-feature-value').textContent=n(val);
    $('#metric-feature-note').textContent=state.mode==='transition'?'Pixels that changed from noncandidate on 06 Sep to candidate on this date; not an identified flood onset.':state.mode==='agreement'?'Candidate surface water recorded by either orbit; ambiguous pixels excluded.':`Candidate open water in the ${niceMode[cfg.mode].toLowerCase()} view.`;
    $('#metric-agreement').innerHTML=`${n(a.and_km2)} <small>km²</small>`;
    $('#metric-asc-only').innerHTML=`${n(a.a_only_km2)} <small>km²</small>`;
    $('#metric-desc-only').innerHTML=`${n(a.d_only_km2)} <small>km²</small>`;
    const notes={
      asc:'Ascending captures water-like low-backscatter features from one viewing geometry. Compare it with descending to see spatial differences.',
      desc:'Descending samples the same landscape from a different geometry, about 11 hours apart. Its detected water candidates differ spatially.',
      or:'Fusion OR includes candidates seen by at least one orbit. It achieved the strongest F1 against the available optical-proxy sample on 30 Sep.',
      and:'Fusion AND keeps candidates observed by both orbits. It gives higher precision on the proxy sample at the cost of lower recall.',
      agreement:'Agreement identifies where both radar views recognize a water candidate; blue and amber pixels reveal their different detections.',
      transition:'This transition compares two radar observations. Because 06 Sep is not established as a dry baseline, it does not date the start of a flood.'
    };
    $('#dynamic-insight').textContent=cfg.note||notes[state.mode];
    buildLegend();updateButtons();
  }
  function redrawMap(){
    if(!map||!data)return; const cfg=viewConfig();
    if(current){map.removeLayer(current);current=null}if(baseline){map.removeLayer(baseline);baseline=null}
    const bounds=data.bounds;
    const path=mapPath(state.date,cfg.mode);
    if(!path)return;
    // Each PNG is a real raster-derived EPSG:4326 rectified overlay, not a decorative figure.
    if(state.compare && state.date!=='20260906'){
      const bpath=mapPath('20260906',cfg.mode==='transition'?'agreement':cfg.mode);
      if(bpath)baseline=L.imageOverlay(bpath,bounds,{opacity:state.opacity,interactive:false}).addTo(map);
      current=L.imageOverlay(path,bounds,{opacity:state.opacity,interactive:false}).addTo(map);
      current.once('load',clipCurrent);
      requestAnimationFrame(clipCurrent);
    } else {
      current=L.imageOverlay(path,bounds,{opacity:state.opacity,interactive:false}).addTo(map);
      $('#swipe-ui').hidden=true;
    }
  }
  function clipCurrent(){
    if(!map||!current||!state.compare||state.date==='20260906')return;
    const img=current.getElement();if(!img)return;
    const mapRect=map.getContainer().getBoundingClientRect(),rect=img.getBoundingClientRect();
    if(rect.width===0)return;
    const splitX=mapRect.left+mapRect.width*state.split;
    const pct=Math.min(100,Math.max(0,(splitX-rect.left)/rect.width*100));
    img.style.clipPath=`inset(0 0 0 ${pct}%)`;
    $('#swipe-marker').style.left=`${state.split*100}%`;
    $('#swipe-ui').hidden=false;
  }
  function initializeMap(){
    if(typeof L==='undefined'){
      console.warn('Leaflet could not load. Local quicklook is still available.');return;
    }
    const place=$('#map');place.innerHTML='';
    map=L.map(place,{zoomControl:false,scrollWheelZoom:true,attributionControl:true,zoomSnap:.25});
    L.control.zoom({position:'bottomright'}).addTo(map);
    L.control.scale({imperial:false,metric:true,position:'bottomleft'}).addTo(map);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{
      attribution:'© OpenStreetMap contributors · © CARTO',subdomains:'abcd',maxZoom:19,
      opacity:0.82
    }).addTo(map);
    map.fitBounds(data.bounds,{padding:[12,12]});
    map.on('mousemove',ev=>{$('#mouse-coords').textContent=`${ev.latlng.lat.toFixed(4)}°N · ${ev.latlng.lng.toFixed(4)}°E`});
    map.on('zoom move resize viewreset',()=>requestAnimationFrame(clipCurrent));
    redrawMap();
  }
  function buildScores(){
    const root=$('#score-rows');root.innerHTML='';
    const order=['Ascending','Descending','Fusion AND','Fusion OR'];
    const colors={'Ascending':'#5ca6c7','Descending':'#d89d74','Fusion AND':'#918ad1','Fusion OR':'#1f9f8c'};
    order.forEach(name=>{
      const r=data.optical_scores.find(x=>x.model===name);if(!r)return;
      const row=document.createElement('div');row.className='score-row';row.innerHTML=`<span class="score-name">${name}</span><div class="score-track"><div class="score-fill" style="width:${r.F1*100}%;background:${colors[name]}"></div><div class="score-whisker" style="left:${r.F1_CI95_low*100}%" title="95% interval lower"></div><div class="score-whisker-right" style="left:${r.F1_CI95_high*100}%" title="95% interval upper"></div></div><strong class="score-val">${r.F1.toFixed(3)}</strong>`;
      row.title=`${name}: F1 ${r.F1.toFixed(3)}, 95% interval ${r.F1_CI95_low.toFixed(3)}–${r.F1_CI95_high.toFixed(3)}, precision ${r.precision.toFixed(3)}, recall ${r.recall.toFixed(3)}`;
      root.append(row);
    });
  }
  function buildTrend(){
    const rows=['20260906','20260930','20261012'].map(date=>data.area[date]);
    const series=[['or_km2','#1eaa94'],['and_km2','#8e81d4'],['a_km2','#58aed3'],['d_km2','#dd9a65']];
    const xs=[100,360,620];const ymin=250,ymax=510;const y=(v)=>235-(v-ymin)/(ymax-ymin)*184;
    let svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 725 295" role="img" aria-label="Area chart of radar-derived candidate water across three dates"><title>Water candidate area by NISAR strategy</title>';
    [300,350,400,450,500].forEach(v=>{svg+=`<line x1="75" x2="680" y1="${y(v)}" y2="${y(v)}" stroke="#dfe9eb"/><text x="65" y="${y(v)+3}" fill="#6c8994" font-size="11" text-anchor="end">${v}</text>`;});
    svg+='<text x="20" y="140" transform="rotate(-90 20 140)" font-size="11" fill="#69828c">Area (km²)</text>';
    xs.forEach((x,i)=>{svg+=`<text x="${x}" y="263" font-size="12" fill="#4f6874" text-anchor="middle">${['06 Sep','30 Sep','12 Oct'][i]}</text>`});
    for(const [field,color] of series){const values=rows.map(x=>x[field]);svg+=`<polyline points="${values.map((v,i)=>`${xs[i]},${y(v)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round"/>`;values.forEach((v,i)=>{svg+=`<circle cx="${xs[i]}" cy="${y(v)}" r="5" fill="${color}" stroke="#fff" stroke-width="2"><title>${field}: ${v.toFixed(2)} km²</title></circle>`})}
    svg+='</svg>';$('#trend-chart').innerHTML=svg;
  }
  function listen(){
    $$('[data-date]').forEach(b=>b.addEventListener('click',()=>{state.date=b.dataset.date;if(state.mode==='transition'&&state.date==='20260906')state.mode='agreement';if(state.date==='20260906')state.compare=false;updateInsights();redrawMap()}));
    $$('[data-mode]').forEach(b=>b.addEventListener('click',()=>{state.mode=b.dataset.mode;if(state.mode==='transition'&&state.date==='20260906')state.date='20260930';updateInsights();redrawMap()}));
    $('#compare-toggle').addEventListener('change',ev=>{state.compare=ev.target.checked;if(state.date==='20260906'&&state.compare)state.date='20260930';if(state.mode==='transition'&&state.compare)state.mode='or';updateInsights();redrawMap()});
    $('#layer-opacity').addEventListener('input',ev=>{state.opacity=Number(ev.target.value)/100;$('#opacity-label').textContent=ev.target.value+'%';if(current)current.setOpacity(state.opacity);if(baseline)baseline.setOpacity(state.opacity);clipCurrent()});
    $('#swipe-range').addEventListener('input',ev=>{state.split=Number(ev.target.value)/100;clipCurrent()});
    $('#reset-map').addEventListener('click',()=>{if(map)map.fitBounds(data.bounds,{padding:[12,12]})});
    $$('[data-tour]').forEach(b=>b.addEventListener('click',()=>{const t=b.dataset.tour;if(t==='1'){state.date='20260906';state.mode='asc';state.compare=false}else if(t==='2'){state.date='20260930';state.mode='agreement';state.compare=false}else{state.date='20260930';state.mode='or';state.compare=true}updateInsights();redrawMap();document.querySelector('#explorer').scrollIntoView({behavior:'smooth',block:'start'})}));
  }
  async function init(){
    try{const response=await fetch('data/site_data.json');if(!response.ok)throw new Error(`HTTP ${response.status}`);data=await response.json();
      if(!data?.bounds||!data?.area||!data?.map_images)throw new Error('Incomplete site data');
      updateInsights();buildScores();buildTrend();listen();initializeMap();
    }catch(error){console.error('SARFlow data loading failed:',error);$('#map-title').textContent='Dataset unavailable';$('#dynamic-insight').textContent='Please serve the project from a local web server or GitHub Pages to load its data files.';}
  }
  init();
})();
