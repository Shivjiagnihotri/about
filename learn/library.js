// The large catalogue loads on approach. Only one page of results enters the DOM.
export function initLibrary({ isSaved, onReady, onTotal, onToggleSaved }) {
  const $=id=>document.getElementById(id);
  const esc=value=>String(value || '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const params=new URL(location.href).searchParams;
  const state={q:params.get('library') || params.get('q') || '',topic:params.get('topic') || 'all',type:params.get('kind') || 'all',provider:params.get('source') || 'all',level:params.get('level') || 'all',sort:params.get('sort') || 'relevance',page:Math.max(1,Number(params.get('page')) || 1),savedOnly:false};
  const size=24;
  let records=[], loading=null, ready=false, debounce;
  const selectors=[['libraryTopic','topic'],['libraryType','type'],['libraryProvider','provider'],['libraryLevel','level'],['librarySort','sort']];
  function syncURL() {
    const url=new URL(location.href);
    for(const [key,value,defaultValue] of [['library',state.q,''],['topic',state.topic,'all'],['kind',state.type,'all'],['source',state.provider,'all'],['level',state.level,'all'],['sort',state.sort,'relevance'],['page',String(state.page),'1']]) {
      value===defaultValue?url.searchParams.delete(key):url.searchParams.set(key,value);
    }
    history.replaceState(null,'',url);
  }
  function fillOptions(id,values,label) {
    $(id).innerHTML=`<option value="all">${label}</option>`+values.map(value=>`<option value="${esc(value)}">${esc(value)}</option>`).join('');
  }
  function render() {
    $('librarySaved').setAttribute('aria-pressed',String(state.savedOnly));
    if(!ready) return;
    const words=state.q.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    let found=records.filter(item=>(state.topic==='all'||item.category===state.topic)&&(state.type==='all'||item.type===state.type)&&(state.provider==='all'||item.provider===state.provider)&&(state.level==='all'||item.level===state.level)&&(!state.savedOnly||isSaved(`library:${item.id}`))&&words.every(word=>item.searchText.includes(word)));
    if(state.sort==='title') found.sort((a,b)=>a.title.localeCompare(b.title));
    if(state.sort==='newest') found.sort((a,b)=>(b.date||'').localeCompare(a.date||'')||a.title.localeCompare(b.title));
    const pages=Math.max(1,Math.ceil(found.length/size));
    state.page=Math.min(state.page,pages);
    const start=(state.page-1)*size;
    $('libraryStatus').textContent=`${found.length.toLocaleString()} matching resources${found.length?` · ${start+1} to ${Math.min(start+size,found.length)}`:''}${state.savedOnly?' · saved only':''}`;
    $('libraryGrid').innerHTML=found.slice(start,start+size).map(item=>{
      const key=`library:${item.id}`, saved=isSaved(key);
      const openLabel=item.type==='Paper'?'Read paper':item.type==='Book'?'Open book':item.type==='Video lectures'?'Watch lectures':item.type==='Course lesson'?'Open lesson':item.type==='Course'?'Open course':'Explore resource';
      return `<article class="library-item"><button class="save-button" data-save="${esc(key)}" aria-label="${saved?'Unsave':'Save'} ${esc(item.title)}" aria-pressed="${saved}">${saved?'♥':'♡'}</button><div class="library-item-top"><span class="library-item-type">${esc(item.type)}</span><span>· ${esc(item.provider)}</span>${item.date?`<span>· ${esc(item.date.slice(0,4))}</span>`:''}</div><h3>${esc(item.title)}</h3>${item.authors?`<p class="library-authors">${esc(item.authors)}</p>`:''}${item.description?`<p>${esc(item.description)}</p>`:''}<div class="library-topic-tags">${(item.topics||[]).slice(0,3).map(topic=>`<span>${esc(topic)}</span>`).join('')}<span>${item.level==='All levels'?'Not level-specific':esc(item.level)}</span></div><div class="library-item-links"><a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${openLabel} ↗<span class="sr-only">: ${esc(item.title)}, opens in a new tab</span></a>${item.pdfUrl?`<a href="${esc(item.pdfUrl)}" target="_blank" rel="noopener noreferrer">PDF<span class="sr-only">: ${esc(item.title)}</span></a>`:''}${item.sourceUrl&&item.sourceUrl!==item.url?`<a href="${esc(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">Source<span class="sr-only"> for ${esc(item.title)}</span></a>`:''}</div></article>`;
    }).join('') || `<div class="library-error"><h3>${state.savedOnly?'Your saved shelf is ready to grow.':'No resources match this combination.'}</h3><p>${state.savedOnly?'Tap the heart beside a resource to keep it for later.':'Try fewer search words, a different format, or reset the filters.'}</p><button data-library-reset>Reset filters</button></div>`;
    $('libraryPagination').hidden=found.length<=size;
    $('libraryPrev').disabled=state.page<=1;
    $('libraryNext').disabled=state.page>=pages;
    $('libraryPageLabel').textContent=`Page ${state.page.toLocaleString()} of ${pages.toLocaleString()}`;
  }
  async function load() {
    if(loading) return loading;
    loading=(async()=>{
      try {
        const response=await fetch('catalogue/library.json');
        if(!response.ok) throw new Error(`Catalogue response ${response.status}`);
        const data=await response.json();
        if(!Array.isArray(data.items)) throw new Error('Catalogue is not a collection');
        records=data.items.map(item=>({...item,searchText:[item.title,item.description,item.authors,item.provider,item.category,...(item.topics||[])].filter(Boolean).join(' ').toLocaleLowerCase()}));
        fillOptions('libraryType',[...new Set(records.map(x=>x.type))].sort(),'All formats');
        fillOptions('libraryProvider',[...new Set(records.map(x=>x.provider))].sort(),'Every provider');
        selectors.forEach(([id,key])=>{ if(![...$(id).options].some(x=>x.value===state[key])) state[key]=key==='sort'?'relevance':'all'; $(id).value=state[key]; });
        ready=true;
        onReady(records.map(x=>`library:${x.id}`));
        onTotal(records.length);
        render();
      } catch(error) {
        loading=null;
        $('libraryStatus').textContent='The collection could not load.';
        $('libraryGrid').innerHTML='<div class="library-error"><h3>The library needs another moment.</h3><p>Please retry the collection. The selected books and courses above remain available.</p><button data-library-retry>Try again</button></div>';
        console.error(error);
      }
    })();
    return loading;
  }
  function reset() {
    Object.assign(state,{q:'',topic:'all',type:'all',provider:'all',level:'all',sort:'relevance',page:1});
    $('librarySearch').value='';
    selectors.forEach(([id,key])=>$(id).value=state[key]);
    if(state.savedOnly) onToggleSaved();
    syncURL();render();
  }
  selectors.forEach(([id,key])=>$(id).addEventListener('change',()=>{state[key]=$(id).value;state.page=1;syncURL();render();}));
  $('librarySearch').value=state.q;
  $('librarySearch').addEventListener('input',()=>{clearTimeout(debounce);debounce=setTimeout(()=>{state.q=$('librarySearch').value;state.page=1;syncURL();load().then(render);},140);});
  $('resetLibrary').addEventListener('click',reset);
  $('libraryGrid').addEventListener('click',event=>{if(event.target.closest('[data-library-reset]'))reset();if(event.target.closest('[data-library-retry]'))load();});
  for(const [id,increment] of [['libraryPrev',-1],['libraryNext',1]]) $(id).addEventListener('click',()=>{state.page+=increment;render();syncURL();$('libraryStatus').scrollIntoView({behavior:document.body.classList.contains('motion-off')?'instant':'smooth',block:'start'});});
  $('librarySaved').addEventListener('click',onToggleSaved);
  $('shareLibrary').addEventListener('click',async()=>{
    syncURL();
    const url=new URL(location.href);url.hash='library';
    try {await navigator.clipboard.writeText(url.href);$('shareLibrary').textContent='Link copied ✓';$('gardenNotice').textContent='Filtered collection link copied. Anyone with the link can open these filters.';}
    catch { $('gardenNotice').textContent='Copy the page address from your browser to share this collection.'; $('shareLibrary').textContent='Copy the browser address'; }
    setTimeout(()=>$('shareLibrary').innerHTML='Copy this collection link <span aria-hidden="true">↗</span>',2500);
  });
  fetch('catalogue/manifest.json').then(response=>{if(!response.ok)throw new Error();return response.json();}).then(manifest=>onTotal(manifest.total)).catch(()=>{});
  if('IntersectionObserver' in window) {
    const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){load();observer.disconnect();}},{rootMargin:'1200px'});
    observer.observe($('library'));
  } else load();
  if(state.q || location.hash==='#library') load();
  return {
    setSearch(q) { if(state.q===q) return; state.q=q;state.page=1;$('librarySearch').value=q;if(q)load().then(render);else render(); },
    setSavedOnly(value) { const changed=state.savedOnly!==value;state.savedOnly=value;if(changed)state.page=1;if(value)load().then(render);else render(); },
  };
}
