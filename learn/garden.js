import { concepts } from './concepts.js';
import { books } from './books.js';
import { resources } from './resources.js';
import { mountDemo } from './demos.js';
import { initLibrary } from './library.js';

const $ = (id) => document.getElementById(id);
const escape = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const labels = { foundations:'The foundations', 'machine-learning':'Machine learning', 'deep-learning':'Deep learning', llms:'Language & LLMs', systems:'AI in practice' };
const tones = { foundations:'sage', 'machine-learning':'blue', 'deep-learning':'lavender', llms:'peach', systems:'amber' };
const coverTitles={foundations:'Math & models','machine-learning':'Learning from data','deep-learning':'Deep learning',llms:'Language & meaning',systems:'Systems that learn'};
const allKeys = new Set([...concepts.map(x=>`concept:${x.id}`), ...books.map(x=>`book:${x.id}`), ...resources.map(x=>`resource:${x.id}`)]);
let saved = new Set();
try { const data = JSON.parse(localStorage.getItem('sa_learning_shelf') || '[]'); if(Array.isArray(data)) saved = new Set(data.filter(x=>typeof x==='string' && (allKeys.has(x) || /^library:[a-f0-9]{16}$/.test(x)))); } catch {}
const state = { query:new URL(location.href).searchParams.get('q') || '', category:'all', format:'all', type:'all', savedOnly:false, conceptsExpanded:false, booksExpanded:false, resourcesExpanded:false };
const media = matchMedia('(prefers-reduced-motion: reduce)');
let savedMotion;
try { savedMotion = localStorage.getItem('sa_motion'); } catch {}
let motionOff = savedMotion ? savedMotion === 'off' : media.matches;
let cleanupDemo = () => {};
let activeConcept = null;
let library;

function setMotion(off) {
  motionOff = off;
  document.body.classList.toggle('motion-off', off);
  $('gardenMotion').textContent = `Motion: ${off ? 'off' : 'on'} ◉`;
  $('gardenMotion').setAttribute('aria-pressed', String(off));
  dispatchEvent(new CustomEvent('portfolio-motion', { detail:off }));
}
setMotion(motionOff);
$('gardenMotion').addEventListener('click', () => { setMotion(!motionOff); try { localStorage.setItem('sa_motion', motionOff ? 'off' : 'on'); } catch {} });
media.addEventListener('change', event => setMotion(event.matches));
const syncVisibility = () => document.body.classList.toggle('page-hidden', document.hidden);
document.addEventListener('visibilitychange', syncVisibility);
syncVisibility();
if ('IntersectionObserver' in window) new IntersectionObserver(([entry])=>document.querySelector('.hero-garden').classList.toggle('hero-offscreen', !entry.isIntersecting)).observe(document.querySelector('.hero-garden'));

function motif(kind = 'network') {
  let drawing = '';
  if (['regression','classification'].includes(kind)) {
    drawing = '<path d="M31 16V108H254" stroke="currentColor" opacity=".2"/><path d="M48 95L233 29" stroke="currentColor" stroke-width="2"/>' + [[55,90],[78,89],[103,67],[132,76],[153,45],[181,49],[202,37],[226,20]].map(([x,y],i)=>`<path d="M${x} ${y}V${111-x*.35}" stroke="currentColor" opacity=".25"/><circle cx="${x}" cy="${y}" r="${i%3===0?5:4}" fill="currentColor" opacity="${.45+i*.06}"/>`).join('');
  } else if (['gradient','overfit'].includes(kind)) {
    drawing = '<path d="M30 103H254" stroke="currentColor" opacity=".2"/><path d="M40 21C72 105 132 125 231 20" stroke="currentColor" stroke-width="2"/><path d="M60 48L85 74L105 91L126 95" stroke="currentColor" opacity=".4" stroke-dasharray="3 4"/><circle cx="60" cy="48" r="6" fill="currentColor" opacity=".25"/><circle cx="85" cy="74" r="5" fill="currentColor" opacity=".45"/><circle cx="105" cy="91" r="5" fill="currentColor" opacity=".7"/><circle cx="126" cy="95" r="6" fill="currentColor"/>';
  } else if (['attention','convolution'].includes(kind)) {
    drawing = Array.from({length:24},(_,i)=>`<rect x="${53+(i%6)*28}" y="${13+Math.floor(i/6)*25}" width="21" height="18" rx="4" fill="currentColor" opacity="${[.18,.3,.5,.75,.4,.88][(i*7+Math.floor(i/6)*3)%6]}"/>`).join('');
  } else if (['embeddings','clustering'].includes(kind)) {
    drawing = '<ellipse cx="92" cy="61" rx="43" ry="39" stroke="currentColor" stroke-dasharray="3 5" opacity=".35"/><ellipse cx="191" cy="65" rx="40" ry="32" stroke="currentColor" stroke-dasharray="3 5" opacity=".35"/>' + Array.from({length:18},(_,i)=>`<circle cx="${(i<9?92:191)+Math.sin(i*3)*28}" cy="${63+Math.cos(i*5)*25}" r="${i%4===0?5:3}" fill="currentColor" opacity="${i<9?.7:.35}"/>`).join('');
  } else if (kind === 'retrieval') {
    drawing = '<path d="M82 62H126M157 62H205" stroke="currentColor" stroke-dasharray="3 5"/><rect x="44" y="32" width="40" height="60" rx="5" stroke="currentColor"/><path d="M53 45H74M53 57H74M53 69H67" stroke="currentColor"/><circle cx="143" cy="62" r="24" stroke="currentColor"/><circle cx="143" cy="62" r="12" fill="currentColor" opacity=".2"/><path d="M219 40H247V83H231L218 95V83H207V40Z" stroke="currentColor"/><path d="M215 52H239M215 63H239M215 74H232" stroke="currentColor"/>';
  } else {
    drawing = '<g stroke="currentColor" opacity=".4"><path d="M61 36L139 24L219 62L139 63L61 91L139 102L219 62M61 36L139 63M61 91L139 24M61 36L139 102"/></g>' + [[61,36],[61,91],[139,24],[139,63],[139,102],[219,62]].map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="${i===5?12:8}" fill="currentColor" fill-opacity="${i===5?.7:.15}" stroke="currentColor"/>`).join('');
  }
  return `<svg viewBox="0 0 280 125" fill="none" aria-hidden="true">${drawing}</svg>`;
}

function saveButton(kind, item) {
  const key = `${kind}:${item.id}`, on = saved.has(key);
  return `<button class="save-button" data-save="${escape(key)}" aria-label="${on?'Unsave':'Save'} ${escape(item.title)}" aria-pressed="${on}">${on?'♥':'♡'}</button>`;
}
function matches(item, kind) {
  if(state.savedOnly && !saved.has(`${kind}:${item.id}`)) return false;
  const haystack = [item.title,item.summary,item.description,item.authors,item.provider,labels[item.category],item.level,...(item.topics || [])].filter(Boolean).join(' ').toLocaleLowerCase();
  return state.query.toLocaleLowerCase().trim().split(/\s+/).every(word=>haystack.includes(word));
}
function empty(collection) {
  return `<div class="empty-state"><strong>${state.savedOnly ? `Your saved ${collection} will grow here.` : `No ${collection} match these filters.`}</strong><p>${state.savedOnly ? 'Tap a heart on anything you want to revisit.' : 'Try a broader search or explore another topic.'}</p><button data-clear-filters>Show the whole garden</button></div>`;
}
function updateCollectionButton(id, expanded, count, initial, noun) {
  const button=$(id);
  button.hidden = count <= initial || Boolean(state.query.trim()) || state.savedOnly;
  button.textContent = expanded ? `Show fewer ${noun} ↑` : `Explore all ${count} ${noun} ↓`;
  button.setAttribute('aria-expanded', String(expanded));
}
function renderConcepts() {
  const found = concepts.filter(x=>matches(x,'concept') && (state.category==='all'||x.category===state.category));
  const shown = state.conceptsExpanded || state.query.trim() || state.savedOnly ? found : found.slice(0,9);
  $('conceptResults').textContent = `${found.length} ideas to explore${shown.length<found.length?` · showing ${shown.length}`:''}`;
  $('conceptGrid').innerHTML = shown.map(item=>`<article class="concept-card tone-${tones[item.category]}">${saveButton('concept',item)}<button class="concept-open" data-open-concept="${item.id}" aria-label="Explore ${escape(item.title)}"><div class="concept-art"><span class="concept-category">${escape(labels[item.category])}</span>${motif(item.demo || ({foundations:'embeddings',llms:'attention',systems:'retrieval'}[item.category] || 'network'))}</div><div class="concept-body"><h3>${escape(item.title)}</h3><p>${escape(item.summary)}</p><div class="concept-bottom"><span>${item.level} · ${item.demo?'Interactive experiment':'Visual field note'}</span><span aria-hidden="true">↗</span></div></div></button></article>`).join('') || empty('concepts');
  updateCollectionButton('moreConcepts',state.conceptsExpanded,found.length,9,'concepts');
  return found.length;
}
function renderBooks() {
  const found = books.filter(x=>matches(x,'book') && (state.format==='all'||(state.format==='pdf'?x.format.includes('PDF'):!x.format.includes('PDF'))));
  const shown = state.booksExpanded || state.query.trim() || state.savedOnly ? found : found.slice(0,6);
  $('bookResults').textContent = `${found.length} free books${shown.length<found.length?` · showing ${shown.length}`:''}`;
  $('bookGrid').innerHTML = shown.map((item,index)=>`<article class="book-card tone-${escape(item.color || tones[item.category])}">${saveButton('book',item)}<div class="book-top"><div class="book-cover" aria-hidden="true"><small>OPEN KNOWLEDGE / ${String(index+1).padStart(2,'0')}</small><strong>${escape(coverTitles[item.category])}</strong>${motif(['network','gradient','attention','embeddings'][index%4])}</div><div class="book-top-meta"><span>${escape(labels[item.category])}</span><h3>${escape(item.title)}</h3><p class="book-authors">${escape(item.authors)}</p></div></div><p class="book-description">${escape(item.description)}</p><div class="book-meta"><span class="meta-pill">${item.level}</span><span class="meta-pill">${escape(item.format)}</span>${item.editionLabel?`<span class="meta-pill">${escape(item.editionLabel)}</span>`:''}</div><div class="book-links"><a class="resource-link" href="${escape(item.url)}" target="_blank" rel="noopener noreferrer" ${item.accessNote?`title="${escape(item.accessNote)}"`:''}>${item.format.includes('PDF')?'Open PDF':'Read online'} <span aria-hidden="true">↗</span><span class="sr-only">: ${escape(item.title)}, opens in a new tab</span></a><a class="source-link" href="${escape(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escape(item.source)}<span class="sr-only">, source for ${escape(item.title)}</span></a></div></article>`).join('') || empty('books');
  updateCollectionButton('moreBooks',state.booksExpanded,found.length,6,'books');
  return found.length;
}
function renderResources() {
  const found = resources.filter(x=>matches(x,'resource') && (state.type==='all'||x.type===state.type));
  const shown = state.resourcesExpanded || state.query.trim() || state.savedOnly ? found : found.slice(0,6);
  $('resourceResults').textContent = `${found.length} resources${shown.length<found.length?` · showing ${shown.length}`:''}`;
  $('resourceGrid').innerHTML = shown.map(item=>`<article class="resource-card tone-${tones[item.category]}">${saveButton('resource',item)}<div class="resource-provider"><span class="provider-icon" aria-hidden="true">${escape(item.provider[0])}</span><span>${escape(item.provider)}</span></div><h3>${escape(item.title)}</h3><p>${escape(item.description)}</p><div class="resource-tags"><span class="meta-pill">${item.type}</span><span class="meta-pill">${item.level}</span><span class="meta-pill">${escape(item.format)}</span></div><div class="resource-footer"><a class="resource-link" href="${escape(item.url)}" target="_blank" rel="noopener noreferrer">${item.type==='Course'?'Explore the course':item.type==='Interactive'?'Try it yourself':'Open the guide'} <span aria-hidden="true">↗</span><span class="sr-only">: ${escape(item.title)}, opens in a new tab</span></a><span>${escape(item.access)}</span></div></article>`).join('') || empty('resources');
  updateCollectionButton('moreResources',state.resourcesExpanded,found.length,6,'resources');
  return found.length;
}
function renderCollections() {
  const counts=[renderConcepts(),renderBooks(),renderResources()];
  $('searchSummary').textContent = state.query || state.savedOnly ? `${counts[0]} concepts · ${counts[1]} books · ${counts[2]} courses & guides${state.savedOnly?' on your saved shelf':''}` : 'Pick an idea. Follow your curiosity.';
  updateSavedIndicators();
  library?.setSavedOnly(state.savedOnly);
}
function updateSavedIndicators() {
  $('savedCount').textContent = saved.size;
  $('savedToggle').setAttribute('aria-pressed',String(state.savedOnly));
  document.querySelectorAll('[data-save]').forEach(button=>{
    const on = saved.has(button.dataset.save);
    button.setAttribute('aria-pressed',String(on));
    if(button.classList.contains('detail-save')) button.textContent = on ? '♥ Saved to your shelf' : '♡ Save this idea';
    else {
      button.textContent = on?'♥':'♡';
      button.setAttribute('aria-label',button.getAttribute('aria-label').replace(/^(Unsave|Save) /,on?'Unsave ':'Save '));
    }
  });
}

const paths = [
  {title:'Start from the roots.',tone:'sage',description:'Build comfort with numbers, uncertainty, and how a model learns.',steps:[['Vectors & similarity','concept','vectors'],['Probability & uncertainty','concept','probability'],['Essence of Linear Algebra','resource','linear-algebra'],['Machine Learning Crash Course','resource','ml-crash-course']]},
  {title:'Train your first model.',tone:'blue',description:'Connect a prediction to its errors, then learn how to trust the result.',steps:[['Linear regression','concept','linear-regression'],['Overfitting & generalization','concept','overfitting'],['Precision, recall & F1','concept','metrics'],['CS229: the foundations','resource','cs229']]},
  {title:'Go a little deeper.',tone:'lavender',description:'From a single neuron to networks that recognize complex patterns.',steps:[['Neurons & networks','concept','neurons'],['Convolutions','concept','convolutions'],['Practical Deep Learning','resource','fastai'],['Build with PyTorch','resource','pytorch-basics']]},
  {title:'Give language a shape.',tone:'peach',description:'Explore representations, attention, retrieval, and useful AI products.',steps:[['Embeddings','concept','embeddings'],['Attention','concept','attention'],['Retrieval-augmented generation','concept','rag'],['The Hugging Face LLM Course','resource','hf-llm']]},
];
$('pathGrid').innerHTML=paths.map((path,index)=>`<article class="path-card tone-${path.tone}"><span class="path-number">0${index+1}</span><h3>${path.title}</h3><p>${path.description}</p><ol class="path-steps">${path.steps.map(([title,kind,id])=>{
  const resource=kind==='resource'?resources.find(x=>x.id===id):null;
  return `<li><a href="${resource?escape(resource.url):`#concept/${id}`}" ${resource?'target="_blank" rel="noopener noreferrer"':''}>${escape(title)}${resource?' ↗':''}</a></li>`;
}).join('')}</ol></article>`).join('');

function openConcept(id, updateHistory=true) {
  const item=concepts.find(x=>x.id===id);
  if(!item) return;
  cleanupDemo();
  cleanupDemo=()=>{};
  activeConcept=id;
  const related=item.related.map(id=>concepts.find(x=>x.id===id)).filter(Boolean);
  const reading=item.reading || resources.find(x=>x.category===item.category);
  $('conceptDetail').className=`tone-${tones[item.category]}`;
  $('conceptDetail').innerHTML=`<p class="eyebrow">${escape(labels[item.category])} / ${item.level}</p><h2 id="conceptTitle">${escape(item.title)}</h2><p class="concept-lede">${escape(item.summary)}</p><div class="detail-demo"><h3>${escape(item.demoTitle || 'Trace the idea')}</h3>${item.demoNote?`<p class="demo-context">${escape(item.demoNote)}</p>`:''}${item.demo?'<div id="activeDemo"></div>':`<ol class="idea-steps">${(item.steps||[]).map(step=>`<li>${escape(step)}</li>`).join('')}</ol>`}</div><p class="detail-explanation">${escape(item.explanation)}</p>${item.formula?`<div class="concept-formula">${escape(item.formula)}</div>`:''}<div class="detail-notes"><div><h3>A concrete example</h3><p>${escape(item.example)}</p></div><div><h3>Keep this in mind</h3><p>${escape(item.takeaway)}</p></div></div><div class="concept-related"><p>LET ONE IDEA LEAD TO ANOTHER</p><div>${related.map(x=>`<button data-open-concept="${x.id}">${escape(x.title)} ↗</button>`).join('')}</div></div><div class="detail-reading">${reading?`<a href="${escape(reading.url)}" target="_blank" rel="noopener noreferrer">Read further: ${escape(reading.title)} ↗</a>`:''}<button class="detail-save" data-save="concept:${id}" aria-pressed="${saved.has(`concept:${id}`)}">♡ Save this idea</button></div>`;
  if(!$('conceptDialog').open) $('conceptDialog').showModal();
  $('conceptDialog').scrollTop=0;
  if(item.demo) cleanupDemo=mountDemo($('activeDemo'),item.demo,{reducedMotion:motionOff || media.matches}) || (()=>{});
  updateSavedIndicators();
  if(updateHistory && location.hash!==`#concept/${id}`) history.pushState(null,'',`#concept/${id}`);
}
function syncHash() {
  const id=location.hash.startsWith('#concept/')?location.hash.slice(9):null;
  if(id && concepts.some(x=>x.id===id)) { if(activeConcept!==id) openConcept(id,false); }
  else if($('conceptDialog').open) $('conceptDialog').close();
}
$('closeConcept').addEventListener('click',()=>$('conceptDialog').close());
$('conceptDialog').addEventListener('click',event=>{
  if(event.target!==$('conceptDialog')) return;
  const rect=event.target.getBoundingClientRect();
  if(event.clientX<rect.left || event.clientX>rect.right || event.clientY<rect.top || event.clientY>rect.bottom) event.target.close();
});
$('conceptDialog').addEventListener('close',()=>{
  cleanupDemo(); cleanupDemo=()=>{}; activeConcept=null;
  if(location.hash.startsWith('#concept/')) history.replaceState(null,'',`${location.pathname}${location.search}#concepts`);
});
addEventListener('hashchange',syncHash);
addEventListener('popstate',syncHash);

document.addEventListener('click',event=>{
  const save=event.target.closest('[data-save]');
  if(save) {
    const key=save.dataset.save;
    if(!allKeys.has(key)) return;
    const removing=saved.has(key);
    removing?saved.delete(key):saved.add(key);
    try { localStorage.setItem('sa_learning_shelf',JSON.stringify([...saved])); } catch {}
    $('gardenNotice').textContent=removing?'Removed from your saved shelf.':'Added to your saved shelf on this device.';
    if(state.savedOnly) { renderCollections(); if(!save.isConnected && !$('conceptDialog').open) $('savedToggle').focus({preventScroll:true}); }
    else updateSavedIndicators();
    return;
  }
  const concept=event.target.closest('[data-open-concept]');
  if(concept) { openConcept(concept.dataset.openConcept); return; }
  if(event.target.closest('[data-clear-filters]')) {
    state.query=''; state.savedOnly=false; state.category=state.format=state.type='all';
    $('gardenSearch').value='';
    document.querySelectorAll('.filter-row button').forEach(button=>button.setAttribute('aria-pressed',String(Object.values(button.dataset).includes('all'))));
    const url=new URL(location.href); url.searchParams.delete('q'); history.replaceState(null,'',url);
    renderCollections(); library?.setSearch(''); $('gardenSearch').focus({preventScroll:true});
  }
});
[['conceptFilters','category','category'],['bookFilters','format','format'],['resourceFilters','type','type']].forEach(([id,field,data])=>{
  $(id).addEventListener('click',event=>{
    const button=event.target.closest('button'); if(!button) return;
    state[field]=button.dataset[data];
    $(id).querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===button)));
    renderCollections();
  });
});
[['moreConcepts','conceptsExpanded','concepts'],['moreBooks','booksExpanded','books'],['moreResources','resourcesExpanded','resources']].forEach(([id,field,section])=>{
  $(id).addEventListener('click',()=>{ state[field]=!state[field]; renderCollections(); if(!state[field]) $(section).scrollIntoView({behavior:motionOff?'instant':'smooth'}); });
});
$('savedToggle').addEventListener('click',()=>{state.savedOnly=!state.savedOnly;renderCollections();});
$('gardenSearch').value=state.query;
$('gardenSearch').addEventListener('input',event=>{
  state.query=event.target.value;
  const url=new URL(location.href);
  state.query.trim()?url.searchParams.set('q',state.query.trim()):url.searchParams.delete('q');
  history.replaceState(null,'',url);
  renderCollections();
  library?.setSearch(state.query);
});
document.addEventListener('keydown',event=>{
  if(event.key==='/' && !$('conceptDialog').open && !event.ctrlKey && !event.metaKey && !event.altKey && !event.target.closest('input,textarea,select,[contenteditable="true"]')) {event.preventDefault();$('gardenSearch').focus();}
});
$('conceptCount').textContent=concepts.length;
$('bookCount').textContent=books.length;
$('resourceCount').textContent=resources.length;
$('year').textContent=new Date().getFullYear();
renderCollections();
syncHash();
library=initLibrary({
  isSaved:key=>saved.has(key),
  onReady:keys=>{keys.forEach(key=>allKeys.add(key));updateSavedIndicators();},
  onTotal:count=>{if(!Number.isFinite(count))return;$('libraryTotal').textContent=count.toLocaleString();$('libraryTotalIntro').textContent=`of ${count.toLocaleString()} resources`;},
  onToggleSaved:()=>{state.savedOnly=!state.savedOnly;renderCollections();},
});
