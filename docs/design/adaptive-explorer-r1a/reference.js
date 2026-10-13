/* R1-A/01: isolated visual reference. All content is a design sample, never live data. */
'use strict';
const paths = {
  mark:'M12 2v4m0 12v4M2 12h4m12 0h4M5 5l3 3m8 8 3 3M5 19l3-3m8-8 3-3 M12 7l1.5 3.5L17 12l-3.5 1.5L12 17l-1.5-3.5L7 12l3.5-1.5Z',
  search:'M20 20l-5-5 M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
  explore:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M15.5 8.5l-2 5-5 2 2-5Z',
  sky:'m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z',
  solar:'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M21 12a9 5 0 1 1-18 0 9 5 0 0 1 18 0 M12 3v2m0 14v2',
  earth:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M3 12h18 M12 3c-5 5-5 13 0 18 5-5 5-13 0-18',
  moon:'M20 13A8 8 0 0 1 11 4a8.5 8.5 0 1 0 9 9',
  constellation:'m4 17 5-9 7 5 4-8 M4 17h.01M9 8h.01M16 13h.01M20 5h.01',
  eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7 M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  layers:'m3 8 9-5 9 5-9 5Z M3 12l9 5 9-5 M3 16l9 5 9-5',
  weather:'M7 17H6a4 4 0 1 1 .4-8A6 6 0 0 1 18 9a4 4 0 0 1 0 8h-1 M9 17l-1 3m5-3-1 3',
  aircraft:'m21 3-5 10 1 6-2 2-3-6-4-1-3 2-2-2 3-3-1-4 2-2 6 3Z',
  satellite:'m10 8 6 6-4 4-6-6Z M14 4l6 6-3 3-6-6Z M4 14l6 6-3 3-6-6Z M9 7l2-2m6 10 2-2M4 7c0-2 1-3 3-3',
  location:'M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0 M14 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
  time:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M12 7v5l3 2',
  pause:'M9 6v12M15 6v12', play:'m9 5 10 7-10 7Z', back:'m14 6-6 6 6 6', chevron:'m9 6 6 6-6 6',
  plus:'M12 5v14M5 12h14', minus:'M5 12h14', close:'m6 6 12 12M18 6 6 18',
  target:'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5 M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  info:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M12 11v6m0-10h.01',
  terrain:'m2 19 7-13 5 9 3-5 5 9Z M6 12l3 2 3-2',
  orbit:'M20 4c3 3-1 9-6 13s-10 5-11 2 1-8 6-12 9-5 11-3 M14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
  landmark:'M5 21V3m0 1h13l-3 4 3 4H5', settings:'M4 7h16M4 17h16M8 4v6m8 4v6',
  return:'m8 5-5 5 5 5M3 10h12a5 5 0 0 1 0 10h-3', keyboard:'M3 6h18v12H3Z M6 9h.01M10 9h.01M14 9h.01M18 9h.01M7 14h10',
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.info}"/></svg>`;
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const configs = {
  sky: {name:'Sky', caption:'Observe the sky', search:'Search stars, planets, deep sky', icon:'sky', context:'Observing location', value:'ORAS · Pennsylvania', credit:'Stellarium · survey credits', tools:[['constellation','Constellations'],['eye','Observing tools'],['settings','Display']]},
  solar: {name:'Solar System', caption:'Explore our solar neighborhood', search:'Find a celestial body', icon:'solar', context:'Journey context', value:'Solar System · Overview', credit:'Ephemeris & time context', tools:[['orbit','Orbits'],['time','Simulation time'],['settings','Display']]},
  earth: {name:'Earth', caption:'Explore a place', search:'Search address, place or coordinates', icon:'earth', context:'Viewing', value:'Earth · Overview', credit:'Imagery · source information', tools:[['layers','Layers'],['weather','Weather'],['aircraft','Aircraft'],['satellite','Satellites']]},
  moon: {name:'Moon', caption:'Explore the lunar surface', search:'Search lunar landmarks', icon:'moon', context:'Body reference', value:'Moon · Surface overview', credit:'Lunar imagery · coverage & credits', tools:[['landmark','Landmarks'],['layers','Scientific layers'],['terrain','Terrain & navigation'],['info','About the Moon']]}
};
const params = new URLSearchParams(location.search);
// Return fixed literals, never a user-controlled string or inherited object key.
function readMode(value) {
 switch(value) { case 'solar': return 'solar'; case 'earth': return 'earth'; case 'moon': return 'moon'; default: return 'sky'; }
}
let mode = readMode(params.get('mode'));
const surface = params.get('surface') === 'bright' ? 'bright' : params.get('surface') === 'dark' ? 'dark' : 'neutral';
let noMotion = params.get('motion') === 'reduced' || matchMedia('(prefers-reduced-motion: reduce)').matches;
let solid = params.get('transparency') === 'reduced';
let lastTrigger = null, pendingDestination = null;
const modal = document.querySelector('#modal');
const app = document.querySelector('#app');
const announce = text => { document.querySelector('#announcement').textContent = text; };
const btn = (name,label,extra='') => `<button class="icon-button" aria-label="${label}" title="${label}" ${extra}>${icon(name)}</button>`;
const heading = (title,kicker='') => `<div class="panel-heading"><div><div class="eyebrow">${kicker}</div><h2 id="panel-title">${title}</h2></div>${btn('close','Dismiss panel','data-close-panel')}</div>`;
const row = (title,detail,ico='layers',state=false) => `<button class="control-row" data-toggle aria-pressed="${state}">${icon(ico)}<span class="row-copy"><strong>${title}</strong><small>${detail}</small></span><span class="switch" aria-hidden="true"></span></button>`;
function render() {
  const c = configs[mode];
  document.title = `${c.name} · Adaptive Explorer · R1-A/01`;
  document.body.classList.toggle('no-motion',noMotion);
  document.body.classList.toggle('solid',solid);
  app.innerHTML = `<section class="explorer ${solid?'solid':''}" data-mode="${mode}" data-surface="${surface}" aria-label="${c.name} visual design reference">
    <div class="scene" id="scene" tabindex="0" role="region" aria-label="Neutral ${c.name} canvas; no renderer or live data"><div class="scene-label">${c.caption}</div><small>Neutral canvas · UI study</small></div>
    <header class="topbar"><div class="identity glass">${icon('mark')}<div><div class="wordmark">ASTRONOMY HUB</div><div class="mode-name">${c.name}</div></div></div>
    <button class="search-launch glass" data-search>${icon('search')}<span>${c.search}</span><kbd>/</kbd></button>
    <button class="explore-button glass" data-explore>${icon('explore')}Explore</button></header>
    <nav class="toolrail glass" aria-label="${c.name} tools">${c.tools.map(([i,l])=>`<button class="tool" data-panel="${i}" aria-label="${l}" aria-expanded="false">${icon(i)}<span class="tip">${l}</span></button>`).join('')}</nav>
    <button class="bottom-context glass" data-panel="${mode==='sky'?'location':'context'}">${icon(mode==='sky'?'location':c.icon)}<span style="text-align:left"><span class="eyebrow">${c.context}</span><span class="context-value" style="display:block">${c.value}</span></span></button>
    ${mode==='solar'?`<nav class="body-strip glass" aria-label="Celestial bodies">${['Earth','Moon','Mars'].map(b=>`<button class="body-item" data-body="${b}"><span class="body-dot"></span>${b}</button>`).join('')}</nav>`:''}
    ${['sky','solar'].includes(mode)?`<div class="time-control glass">${btn('back','Step time backward','data-notice="Time-step interaction sample; scene time does not change."')}<button class="time-copy" data-panel="time"><strong>13 Oct 2026 · 02:10 UTC</strong><small>${mode==='sky'?'OBSERVING TIME':'SIMULATION TIME'} · SAMPLE</small></button>${btn('play','Play time demonstration','data-play')}</div>`:
    `<div class="time-control glass">${icon(mode==='earth'?'layers':'landmark')}<button class="time-copy" data-panel="${mode==='earth'?'layers':'landmark'}"><strong>${mode==='earth'?'Best available imagery':'Discover lunar landmarks'}</strong><small>${mode==='earth'?'AUTOMATIC · DESIGN SAMPLE':'BODY-SPECIFIC EXPLORATION'}</small></button></div>`}
    <nav class="nav-control glass" aria-label="View navigation">${btn('explore','Reset north','data-notice="North-up action preview; no camera is connected."')}${btn('plus','Zoom in','data-nav-extra data-notice="Zoom-in affordance preview; no renderer is connected."')}${btn('minus','Zoom out','data-nav-extra data-outward')}${mode==='earth'?btn('location','Locate me','data-notice="Location permission would be requested here. This reference never requests geolocation."'):''}</nav>
    <footer class="footer"><button class="source-link" data-panel="source">${icon('info')}${c.credit}</button><span class="design-note">Design sample · no live data</span></footer>
  </section>`;
}
function closePanel(restore=true) {
  document.querySelector('.panel')?.remove();
  document.querySelector('.explorer').classList.remove('panel-open');
  document.querySelectorAll('[aria-expanded="true"]').forEach(e=>e.setAttribute('aria-expanded','false'));
  if (restore && lastTrigger?.isConnected) lastTrigger.focus();
}
function panel(content, trigger) {
  closePanel(false);
  if (trigger?.isConnected) lastTrigger=trigger;
  trigger?.setAttribute('aria-expanded','true');
  const aside=document.createElement('aside'); aside.className='panel glass'; aside.setAttribute('aria-labelledby','panel-title');
  aside.innerHTML=content;
  document.querySelector('.explorer').append(aside);
  document.querySelector('.explorer').classList.add('panel-open');
  aside.querySelector('button')?.focus();
}
function showPanel(id,trigger) {
  let content='';
  if(id==='constellation') content=heading('Constellations','Sky · observing')+row('Lines','Trace familiar patterns','constellation',true)+row('Names','Identify constellations','sky')+row('Artwork','Illustrated figures','eye')+'<div class="rule"></div><p>Proposed controls use Stellarium’s own observing capabilities.</p>';
  else if(id==='eye') content=heading('Observing tools','Sky')+row('Horizon & ground','Keep the local horizon visible','terrain',true)+row('Atmosphere','Show atmospheric light','sky',true)+row('Equatorial grid','Celestial coordinate reference','orbit')+'<div class="rule"></div><p>Scene-dependent values are unavailable in this UI-only reference.</p>';
  else if(id==='settings') content=heading('Display','Shared preferences')+`<button class="control-row" data-solid aria-pressed="${solid}">${icon('layers')}<span class="row-copy"><strong>Reduce transparency</strong><small>Opaque panels for greater clarity</small></span><span class="switch"></span></button><button class="control-row" data-motion aria-pressed="${noMotion}">${icon('eye')}<span class="row-copy"><strong>Reduce motion</strong><small>Direct changes; no travel animation</small></span><span class="switch"></span></button><div class="rule"></div><p>Keyboard: Tab to move, Enter to activate, / to search, Escape to dismiss. Explore is always available without gestures.</p>`;
  else if(id==='time') content=heading(mode==='sky'?'Observing time':'Simulation time',mode==='sky'?'Sky':'Solar System')+'<p>Time belongs to this view. Live Earth feeds retain their own timestamps.</p><dl><div><dt>Date · sample</dt><dd>13 October 2026</dd></div><div><dt>Time · sample</dt><dd>02:10 UTC</dd></div></dl><div class="actions"><button class="action" data-notice="Date/time editor state is a design sample.">Choose time</button><button class="action primary" data-notice="Return-to-now action preview; no ephemeris or clock is running.">Return to now</button></div>';
  else if(id==='location') content=heading('Observing location','Sky')+'<p>ORAS · Pennsylvania</p><div class="rule"></div><p>Your observing location controls the local sky. This reference does not request device location or calculate visibility.</p><div class="actions"><button class="action primary" data-notice="Observing-location search would open here; this is a UI sample.">Change location</button></div>';
  else if(id==='layers' && mode==='earth') content=heading('Your Earth view','Earth · layers')+'<span class="tag">Automatic imagery</span><p style="margin-top:12px">The best eligible imagery for your view, with a safe overview when detailed coverage is unavailable.</p><div class="rule"></div>'+row('Place labels','Names without visual clutter','location',true)+row('Weather','Conditions and radar','weather')+row('Aircraft','Regional coverage varies','aircraft')+row('Satellites','Orbiting objects and source time','satellite')+'<div class="rule"></div><button class="control-row" data-panel="source">'+icon('info')+'<span class="row-copy"><strong>Imagery & sources</strong><small>Credits, coverage and detail status</small></span>'+icon('chevron')+'</button>';
  else if(['weather','aircraft','satellite'].includes(id)) {
    const title={weather:'Weather',aircraft:'Aircraft',satellite:'Satellites'}[id];
    content=heading(title,'Earth · contextual layer')+row(`Show ${title.toLowerCase()}`,'Design-state toggle only',id)+'<div class="rule"></div><span class="tag">Not connected in this reference</span><p style="margin-top:12px">Source freshness, coverage and selected-object information belong here. No positions, forecasts or tracking data are simulated.</p><div class="actions"><button class="action" data-unavailable="'+title+'">View unavailable state</button></div>';
  } else if(id==='orbit') content=heading('Orbit context','Solar System')+row('Orbital paths','Reference paths around the Sun','orbit',true)+row('Body labels','Names at the current scale','solar',true)+'<div class="rule"></div><p>Future geometry must use qualified ephemerides and frames. No orbital science is rendered in this reference.</p>';
  else if(id==='landmark') content=heading('Lunar landmarks','Moon')+'<p>Explore named places. Detail depends on the qualified source and its coverage.</p><div class="rule"></div>'+['Tycho','Copernicus','Mare Tranquillitatis'].map(n=>`<button class="control-row" data-landmark="${n}">${icon('landmark')}<span class="row-copy"><strong>${n}</strong><small>Landmark card · design sample</small></span>${icon('chevron')}</button>`).join('');
  else if(id==='layers' && mode==='moon') content=heading('Scientific layers','Moon')+'<p>Only qualified datasets would appear as usable layers.</p><div class="rule"></div>'+row('Landmark labels','Named-feature reference','landmark',true)+'<div class="control-row">'+icon('layers')+'<span class="row-copy"><strong>Geology</strong><small>Dataset not qualified</small></span><span class="tag">Unavailable</span></div><div class="control-row">'+icon('terrain')+'<span class="row-copy"><strong>Elevation</strong><small>Coverage and datum pending</small></span><span class="tag">Unavailable</span></div>';
  else if(id==='terrain') content=heading('Terrain & navigation','Moon')+'<p>Terrain availability and vertical datum must be qualified before terrain controls are enabled.</p><div class="rule"></div><span class="tag">Terrain unavailable · UI reference</span><div class="actions"><button class="action" data-notice="North-up navigation preview.">North up</button><button class="action" data-notice="Overview navigation preview.">Overview</button></div>';
  else if(id==='source') content=heading('Sources & detail',configs[mode].name)+`<span class="tag">UI reference · no imagery loaded</span><div class="rule"></div><p>${mode==='earth'?'Automatic selection chooses eligible detail where coverage allows. Source, acquisition date and resolution must describe the visible imagery.':'Attribution and source-specific coverage will describe the actual displayed content.'}</p><dl><div><dt>Visible source</dt><dd>None · neutral canvas</dd></div><div><dt>Detail / date</dt><dd>Not available</dd></div></dl>${mode==='earth'?'<p>Persistent imagery cache: not connected. Storage status and clear controls appear only when implemented and qualified.</p>':''}`;
  else content=heading(mode==='moon'?'About the Moon':configs[mode].name,'Exploration context')+`<p>${mode==='moon'?'Earth’s natural satellite. Surface exploration is a proposed experience; data coverage, coordinates and terrain remain qualification gates.':'Explore this context using the canvas and the compact Explore alternative.'}</p><div class="actions"><button class="action primary" data-explore>Explore elsewhere</button></div>`;
  panel(content,trigger);
}
function selected(name,kind,trigger) {
  const celestial=kind==='body';
  const title=celestial?'Celestial body':kind==='landmark'?'Lunar landmark':kind==='sky'?'Celestial selection':'Earth · search selection';
  const copy=celestial?`${name} · selection preview. Physical and orbital values will come from qualified sources.`:kind==='landmark'?`${name} · named lunar feature. Exact coordinates, imagery and terrain details are unavailable in this design reference.`:kind==='sky'?`${name} · Stellarium object selection preview. Visibility, coordinates and camera focus are not calculated here.`:`${name} · sample result. A real geocoder and camera destination must be qualified separately.`;
  panel(heading(name,title)+`<p>${esc(copy)}</p><div class="rule"></div><dl><div><dt>Source state</dt><dd>Design sample</dd></div><div><dt>${celestial?'Orbit / distance':'Position / detail'}</dt><dd>Not connected</dd></div></dl><div class="actions"><button class="action" data-notice="Focus affordance preview; no camera is connected.">Focus</button><button class="action primary" ${celestial?`data-approach="${name}"`:'data-notice="Selection detail preview; no live data is connected."'}>${celestial?'Approach':'Details'}</button></div><div class="hint">Dismiss closes the card without changing the view.</div>`,trigger);
}
function openDialog(html,trigger) { if(trigger)lastTrigger=trigger; modal.innerHTML=html; modal.showModal(); }
function closeDialog() { modal.close(); if(lastTrigger?.isConnected)lastTrigger.focus(); }
function explore(trigger) {
 openDialog(`<div class="dialog-shell"><div class="panel-heading"><div><div class="eyebrow">One universe · four contexts</div><h2 id="dialog-title">Explore</h2></div>${btn('close','Close Explore','data-close-modal')}</div><p>Move outward through the scene, or choose a destination here.</p><div style="margin-top:18px">${Object.entries(configs).map(([id,c])=>`<button class="destination" data-destination="${id}" ${id===mode?'aria-current="true"':''}>${icon(c.icon)}<span class="row-copy"><strong>${c.name}</strong><small>${id===mode?'Current view':c.caption}</small></span>${icon('chevron')}</button>`).join('')}</div><div class="rule"></div><p class="small">Context changes are a design demonstration. Renderers are not connected.</p></div>`,trigger);
}
function handoff(to,trigger) {
 if(to===mode) { if(modal.open)closeDialog(); return; }
 pendingDestination=to;
 if(modal.open)modal.close();
 openDialog(`<div class="dialog-shell"><div class="panel-heading"><div><div class="eyebrow">${configs[mode].name} → ${configs[to].name}</div><h2 id="dialog-title">Continue your journey</h2></div>${btn('close','Cancel transition','data-close-modal')}</div><div class="notice-icon">${icon(configs[to].icon)}</div><p>Your current view is kept so you can return. The next scene opens when ready.</p><div class="handoff-steps" aria-hidden="true"><span></span><span></span><span></span></div><p class="small">${noMotion?'Reduced motion: a direct context change, with no flight or zoom animation.':'Transition proposal: brief neutral handoff between independently owned views.'}</p><div class="actions"><button class="action" data-close-modal>Stay here</button><button class="action primary" data-continue>Open ${configs[to].name}</button></div><div class="hint">UI demonstration only · no renderer handoff</div></div>`,trigger);
}
function search(trigger) {
 const c=configs[mode];
 openDialog(`<h2 id="dialog-title" class="sr-only">${c.search}</h2><div class="dialog-search">${icon('search')}<input id="query" aria-label="${c.search}" placeholder="${c.search}" autocomplete="off">${btn('close','Close search','data-close-modal')}</div><div class="search-results" id="results"></div><div class="search-foot">Sample results only · Tab to choose · Enter to open · Esc to close</div>`,trigger);
 document.querySelector('#query').addEventListener('input', results);
 results(); document.querySelector('#query').focus();
}
function results() {
 const value=document.querySelector('#query').value.trim();
 let choices=[];
 if(mode==='earth') {
  if(!value) choices=[['Pittsburgh','Place · Pennsylvania'],['1 Allegheny Ave, Pittsburgh','Address · Pennsylvania'],['40.44, -80.00','Coordinates · sample destination']];
  else if(value.toLowerCase()==='offline') { document.querySelector('#results').innerHTML='<p class="search-feedback">Search is temporarily unavailable. Your current view is still available. Try again later.</p>'; return; }
  else if(value.includes(',')) {
   const nums=value.split(',').map(x=>x.trim());
   if(nums.length===2 && nums.every(n=>n!=='' && Number.isFinite(Number(n)))) {
    if(Math.abs(Number(nums[0]))>90||Math.abs(Number(nums[1]))>180) { document.querySelector('#results').innerHTML='<p class="search-feedback">Enter latitude from −90 to 90 and longitude from −180 to 180.</p>'; return; }
    choices=[[value,'Coordinate result · UI sample']];
   }
  }
  if(value && !choices.length) {
   const pool=[['Pittsburgh','Place · Pennsylvania'],['1 Allegheny Ave, Pittsburgh','Address · Pennsylvania'],['Springfield, Illinois','Ambiguous place · sample'],['Springfield, Massachusetts','Ambiguous place · sample']];
   choices=pool.filter(([n])=>n.toLowerCase().includes(value.toLowerCase()));
  }
 } else {
  const pool=mode==='sky'?['Vega','Saturn','Andromeda Galaxy']:mode==='solar'?['Earth','Moon','Mars']:['Tycho','Copernicus','Mare Tranquillitatis'];
  choices=pool.filter(n=>n.toLowerCase().includes(value.toLowerCase())).map(n=>[n,'Selection sample · no live coordinates']);
 }
 document.querySelector('#results').innerHTML=`<div class="eyebrow">${value?'Matching samples':'Try a sample'}</div>`+(choices.length?choices.map(([name,detail])=>`<button class="destination" data-result="${esc(name)}">${icon(mode==='earth'?'location':configs[mode].icon)}<span class="row-copy"><strong>${esc(name)}</strong><small>${detail}</small></span>${icon('chevron')}</button>`).join(''):'<p class="search-feedback">No matching sample. Try another name or, on Earth, latitude and longitude.</p>');
}
function unavailable(title='This view') {
 if(modal.open)modal.close();
 openDialog(`<div class="dialog-shell"><div class="panel-heading"><div><div class="eyebrow">Unavailable state · sample</div><h2 id="dialog-title">${esc(title)} is unavailable</h2></div>${btn('close','Close unavailable message','data-close-modal')}</div><p>Keep exploring your current view. You can try again when the source is available.</p><div class="actions"><button class="action" data-close-modal>Keep exploring</button><button class="action primary" data-retry>Try again</button></div><div class="hint">Failure-state demonstration · no provider request</div></div>`);
}
function toast(text) { document.querySelector('.toast')?.remove(); const el=document.createElement('div'); el.className='toast glass'; el.setAttribute('role','status'); el.textContent=text; document.querySelector('.explorer').append(el); setTimeout(()=>el.remove(),3800); }
document.addEventListener('click', e=>{
 const b=e.target.closest('button'); if(!b)return;
 if(b.hasAttribute('data-close-panel')) closePanel();
 else if(b.hasAttribute('data-close-modal')) closeDialog();
 else if(b.hasAttribute('data-explore')) explore(b);
 else if(b.hasAttribute('data-search')) search(b);
 else if(b.dataset.panel) showPanel(b.dataset.panel,b);
 else if(b.dataset.destination) handoff(b.dataset.destination,b);
 else if(b.hasAttribute('data-outward')) handoff(mode==='sky'?'earth':mode==='moon'?'solar':mode==='earth'?'solar':'sky',b);
 else if(b.hasAttribute('data-continue')) {
  modal.close(); mode=readMode(pendingDestination); params.set('mode',mode); params.delete('state');
  history.pushState({},'',`${location.pathname}?${params}`);render();document.querySelector('[data-explore]').focus();announce(`${configs[mode].name} design layout opened. No renderer is connected.`);
 }
 else if(b.dataset.body) selected(b.dataset.body,'body',b);
 else if(b.dataset.landmark) selected(b.dataset.landmark,'landmark',b);
 else if(b.dataset.approach) { if(b.dataset.approach==='Moon') handoff('moon',b); else if(b.dataset.approach==='Earth') handoff('earth',b); else unavailable('Mars surface'); }
 else if(b.dataset.result) { const name=b.dataset.result; modal.close(); selected(name,mode==='solar'?'body':mode==='moon'?'landmark':mode==='sky'?'sky':'place',document.querySelector('[data-search]')); }
 else if(b.hasAttribute('data-toggle')) { b.setAttribute('aria-pressed',b.getAttribute('aria-pressed')!=='true'); announce('Design-state toggle changed; no live layer is connected.'); }
 else if(b.hasAttribute('data-solid')) { solid=!solid; document.body.classList.toggle('solid',solid); document.querySelector('.explorer').classList.toggle('solid',solid); b.setAttribute('aria-pressed',solid); }
 else if(b.hasAttribute('data-motion')) { noMotion=!noMotion;document.body.classList.toggle('no-motion',noMotion);b.setAttribute('aria-pressed',noMotion); }
 else if(b.hasAttribute('data-play')) { const on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',on);b.innerHTML=icon(on?'pause':'play'); b.setAttribute('aria-label',on?'Pause time demonstration':'Play time demonstration');toast('Time-control design state only; no clock is running.'); }
 else if(b.dataset.unavailable) unavailable(b.dataset.unavailable);
 else if(b.hasAttribute('data-retry')) { const hint=modal.querySelector('.hint'); hint.setAttribute('role','status'); hint.textContent='Still unavailable in this design sample. No network request was sent.'; }
 else if(b.dataset.notice) toast(b.dataset.notice);
});
document.addEventListener('keydown',e=>{
 if(e.key==='/' && !modal.open && !['INPUT','TEXTAREA'].includes(e.target.tagName)){e.preventDefault();search(document.querySelector('[data-search]'));}
 if(e.key==='Escape' && !modal.open)closePanel();
});
modal.addEventListener('keydown',e=>{
 if(e.key!=='Tab')return;
 const items=[...modal.querySelectorAll('button:not([disabled]),input:not([disabled]),a[href]')].filter(el=>el.getClientRects().length);
 const first=items[0],last=items.at(-1);
 if(!first)return;
 if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
 else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
});
modal.addEventListener('cancel',e=>{e.preventDefault();closeDialog();});
window.addEventListener('popstate',()=>{if(modal.open)modal.close(); const m=new URLSearchParams(location.search).get('mode');mode=readMode(m); render();announce(`${configs[mode].name} layout restored.`);});
render();
const initial=params.get('state');
if(initial==='selected') selected(mode==='solar'?'Mars':mode==='moon'?'Tycho':mode==='sky'?'Vega':'Pittsburgh',mode==='solar'?'body':mode==='moon'?'landmark':mode==='sky'?'sky':'place',document.querySelector('[data-search]'));
else if(initial==='search')search(document.querySelector('[data-search]'));
else if(initial==='explore')explore(document.querySelector('[data-explore]'));
else if(initial==='loading')openDialog(`<div class="dialog-shell"><div class="eyebrow">Loading state · design sample</div><div class="notice-icon">${icon(configs[mode].icon)}</div><h2 id="dialog-title">Opening ${configs[mode].name}</h2><p style="margin-top:12px">Preparing your next view. Your previous context is kept until this view is ready.</p><div class="handoff-steps" aria-hidden="true"><span></span><span></span><span></span></div><div class="actions"><button class="action" data-close-modal>Cancel and return</button></div><div class="hint">Static loading example · no engine is loading</div></div>`,document.querySelector('[data-explore]'));
else if(initial==='unavailable')unavailable(configs[mode].name);
else if(initial && configs[mode].tools.some(([id])=>id===initial))showPanel(initial,document.querySelector(`[data-panel="${initial}"]`));
