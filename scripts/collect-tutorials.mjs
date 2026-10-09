/**
 * Collect real English educational pages from provider-published indexes.
 * Run: node scripts/collect-tutorials.mjs
 * Run with --refresh to recheck all pages, or --discover-only to list candidates.
 * No API keys, browser automation, generated URLs, or third-party aggregators.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'learn/catalogue/tutorials.json');
const manifest = join(root, 'learn/catalogue/TUTORIAL_SOURCES.md');
const cacheDir = join(tmpdir(), 'aboutme-official-learning-pages-v1');
const refresh = process.argv.includes('--refresh');
const concurrency = 4;
const candidates = new Map();
const evidence = [];
const rejected = [];
await mkdir(cacheDir, { recursive: true });

const digest = value => createHash('sha256').update(value).digest('hex').slice(0, 16);
const decode = value => String(value).replace(/&#x([0-9a-f]+);/gi, (_, x) => String.fromCodePoint(parseInt(x, 16)))
  .replace(/&#(\d+);/g, (_, x) => String.fromCodePoint(Number(x)))
  .replace(/&(amp|quot|apos|lt|gt|nbsp|ndash|mdash|rsquo|lsquo|rdquo|ldquo|hellip);/g, (_, x) => ({ amp:'&', quot:'"', apos:"'", lt:'<', gt:'>', nbsp:' ', ndash:'-', mdash:':', rsquo:'\u2019', lsquo:'\u2018', rdquo:'\u201d', ldquo:'\u201c', hellip:'...' })[x]);
const plain = value => decode(value.replace(/<[^>]*>/g, ' ')).replace(/[\u2013\u2014]/g, ':').replace(/\s+/g, ' ').replace(/[¶#]+\s*$/, '').trim();
const normalized = value => { const url = new URL(decode(value)); url.hash=''; url.search=''; url.pathname=url.pathname.replace(/\/$/, ''); return url.href; };
const hrefs = (html, base) => [...html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)].map(x=>{try{return new URL(decode(x[1]),base).href;}catch{return null;}}).filter(Boolean);
const locations = xml => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>decode(x[1]));

async function pool(items, work) {
  let next=0;
  await Promise.all(Array.from({length:concurrency}, async()=>{while(next<items.length) await work(items[next++]);}));
}
async function get(url) {
  let last;
  for(let attempt=0;attempt<2;attempt++) {
    try {
      const response=await fetch(url,{signal:AbortSignal.timeout(25000),headers:{'User-Agent':'AboutMe-Learning-Catalogue/1.0 (public educational link verification)','Accept-Language':'en'}});
      if((response.status===429 || response.status>=500) && attempt===0) { await response.body?.cancel(); await new Promise(resolve=>setTimeout(resolve,1000)); continue; }
      return { status:response.status, url:response.url, html:await response.text(), checkedAt:new Date().toISOString() };
    } catch(error) { last=error; }
  }
  throw last;
}
async function index(url) {
  const response=await get(url);
  if(response.status!==200) throw new Error(`Index returned ${response.status}: ${url}`);
  evidence.push({url,finalUrl:response.url,status:response.status,checkedAt:response.checkedAt});
  return response;
}
function add(url, details) {
  try {
    const clean=normalized(url);
    if(!candidates.has(clean)) candidates.set(clean,{url:clean,...details});
  } catch {}
}

// Stable, English PyTorch tutorials, rather than API references or version trees.
const torchSource='https://docs.pytorch.org/tutorials/sitemap.xml';
const torch=await index(torchSource);
for(const url of locations(torch.html)) {
  if(/\/tutorials\/(beginner|intermediate|advanced|recipes)\/.+\.html$/.test(url) && !/\/(index|genindex|search)\.html$/.test(url)) add(url,{provider:'PyTorch',type:'Tutorial',sourceUrl:torchSource});
}
console.log(`PyTorch candidates: ${[...candidates.values()].filter(x=>x.provider==='PyTorch').length}`);

// Read the current TensorFlow sitemap index, rather than assume a fixed shard.
const tfSource='https://www.tensorflow.org/sitemap.xml';
const tfIndex=await index(tfSource);
for(const shard of locations(tfIndex.html)) {
  if(!shard.startsWith('https://www.tensorflow.org/')) continue;
  const sitemap=await index(shard);
  for(const url of locations(sitemap.html)) {
    if(!url.startsWith('https://www.tensorflow.org/')) continue;
    if(/\/(tutorials|guide)\/.+/.test(url) && !new URL(url).search && !/\/(migrate|r1|v1|api_docs|versions|community)\//.test(url) && !/\/(index|overview)$/.test(url)) add(url,{provider:'TensorFlow',type:url.includes('/tutorials/')?'Tutorial':'Guide',sourceUrl:shard});
  }
}
console.log(`TensorFlow candidates: ${[...candidates.values()].filter(x=>x.provider==='TensorFlow').length}`);

// D2L publishes a complete linked table of contents on its official home page.
const d2lSource='https://d2l.ai/';
const d2l=await index(d2lSource);
for(const url of hrefs(d2l.html,d2lSource)) {
  if(/^https:\/\/d2l\.ai\/chapter_[^?#]+\.html$/.test(url) && !/chapter_(preface|installation|references)|\/(contributing|utils|d2l)\.html$/.test(url)) add(url,{provider:'Dive into Deep Learning',type:'Course lesson',sourceUrl:d2lSource});
}
console.log(`D2L candidates: ${[...candidates.values()].filter(x=>x.provider==='Dive into Deep Learning').length}`);

// HF publishes every course's English sidebar inside its server-rendered page.
const hfDirectory='https://huggingface.co/sitemap-doc.xml';
const hfIndex=await index(hfDirectory);
const hfCourses=[...new Set([...locations(hfIndex.html).filter(url=>url.startsWith('https://huggingface.co/learn/')),'https://huggingface.co/learn/llm-course/chapter1/1'])];
await pool(hfCourses,async sourceUrl=>{
  try {
    const response=await index(sourceUrl);
    const sourcePath=new URL(response.url).pathname.split('/').slice(0,3).join('/');
    const expanded=decode(response.html);
    const paths=[...expanded.matchAll(/"url"\s*:\s*"(\/learn\/[^"\s]+)"/g)].map(x=>x[1]);
    for(const path of paths) {
      if(!path.startsWith(sourcePath+'/')) continue;
      const rest=path.slice(sourcePath.length+1);
      if(/^(?:[a-z]{2}(?:-[A-Z]{2})?|v\d+)\//.test(rest) && !rest.startsWith('en/')) continue;
      if(/(?:\.md$|\/communication\/|\/events\/|discord101|\/certification|\/certificate|\/contributors|\/acknowledg)/.test(path)) continue;
      add(new URL(path,'https://huggingface.co').href,{provider:'Hugging Face',type:'Course lesson',sourceUrl:response.url,course:sourcePath.split('/').at(-1)});
    }
  }catch(error){rejected.push({url:sourceUrl,reason:`Course index: ${error.message}`});}
});
console.log(`Hugging Face candidates: ${[...candidates.values()].filter(x=>x.provider==='Hugging Face').length}`);

// Google's ML course sidebars give real lesson URLs, including nested lessons.
const googleRoot='https://developers.google.com/machine-learning?hl=en';
const google=await index(googleRoot);
const googleIndexes=new Set(hrefs(google.html,googleRoot).filter(url=>/^https:\/\/developers\.google\.com\/machine-learning\//.test(url)&&!new URL(url).search&&!url.includes('#')));
for(const url of ['https://developers.google.com/machine-learning/crash-course?hl=en','https://developers.google.com/machine-learning/recommendation?hl=en']) googleIndexes.add(url);
await pool([...googleIndexes],async source=>{
  try {
    const response=await index(source+(source.includes('?')?'':'?hl=en'));
    for(const url of hrefs(response.html,response.url)) {
      if(/^https:\/\/developers\.google\.com\/machine-learning\//.test(url)&&!new URL(url).search&&!url.includes('#')&&!/\/(glossary|resources|help|faq|check-your-understanding)(?:\/|$)/.test(url)) add(url,{provider:'Google Machine Learning',type:url.includes('/guides/')?'Guide':'Course lesson',sourceUrl:response.url});
    }
  }catch(error){rejected.push({url:source,reason:`Course index: ${error.message}`});}
});
console.log(`Google ML candidates: ${[...candidates.values()].filter(x=>x.provider==='Google Machine Learning').length}`);
console.log(`Total distinct candidate URLs: ${candidates.size}`);
if(process.argv.includes('--discover-only')) process.exit(0);

function classify(title,url) {
  const text=`${title} ${url}`.toLowerCase();
  if(/\b(llm|language model|tokeniz|transformer|attention|rag|retrieval|agent|prompt|mcp|fine.tun|text generation|smol-course|context-course)/.test(text)) return {category:'llms',topics:[/agent|mcp/.test(text)?'AI agents':/attention|transformer/.test(text)?'Transformers':'Language models']};
  if(/deploy|serving|monitor|performance|distribut|quantiz|prun|tfx\/|federated|privacy|profil|compiler|torch.compile|export|parallel|optimization|onnx|cuda|accelerat/.test(text)) return {category:'systems',topics:[/deploy|serving|export/.test(text)?'Deployment':/privacy|federated/.test(text)?'Privacy and federation':'ML engineering']};
  if(/probability|statistics|linear.algebra|calculus|preliminar|mathematics|tensor basics|data manipulation|data preprocessing|random.variable/.test(text)) return {category:'foundations',topics:[/probability|statistics|random/.test(text)?'Probability and statistics':'Math and data']};
  if(/regression|classif|cluster|recommend|decision.forest|overfit|fairness|reinforcement|deep-rl|bandit|metric|numerical.data|categorical.data|problem.framing/.test(text)) return {category:'machine-learning',topics:[/reinforcement|deep-rl/.test(text)?'Reinforcement learning':/recommend/.test(text)?'Recommendation systems':'Machine learning']};
  return {category:'deep-learning',topics:[/vision|image|cnn|convolut/.test(text)?'Computer vision':/audio|speech/.test(text)?'Audio learning':/diffus|generative/.test(text)?'Generative models':'Neural networks']};
}
function extract(response,candidate) {
  const html=response.html;
  const language=html.match(/<html[^>]*\blang=["']([^"']+)/i)?.[1];
  if(language&&!/^en(?:-|$)/i.test(language)) throw new Error(`Non-English page: ${language}`);
  if(!/^https:\/\/(docs\.pytorch\.org|www\.tensorflow\.org|huggingface\.co|d2l\.ai|developers\.google\.com)\//.test(response.url)) throw new Error(`Moved outside selected providers: ${response.url}`);
  const heads=[...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(x=>plain(x[1])).filter(Boolean);
  let title=(candidate.provider==='Hugging Face'?heads.at(-1):heads[0]) || plain(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
  title=title.replace(/\s*Stay organized with collections[\s\S]*$/,'').replace(/\s*Save and categorize content[\s\S]*$/,'').replace(/\s*[|:]\s*(TensorFlow Core|Google for Developers|PyTorch Tutorials|Dive into Deep Learning|Hugging Face).*$/,'').trim();
  if(!title || /^(404|not found|page not found|access denied|error|redirect)/i.test(title)) throw new Error('Missing or error-page title');
  if(candidate.course) {
    const courses={'llm-course':'LLM Course','agents-course':'AI Agents Course','audio-course':'Audio Course','computer-vision-course':'Computer Vision Course','context-course':'Context Course','cookbook':'Open-Source AI Cookbook','deep-rl-course':'Deep RL Course','diffusion-course':'Diffusion Course','mcp-course':'MCP Course','ml-for-3d-course':'ML for 3D Course','ml-games-course':'ML Games Course','robotics-course':'Robotics Course','smol-course':'Smol Course'};
    const course=courses[candidate.course];
    if(course && !title.toLowerCase().includes(course.toLowerCase())) title=`${title} (${course})`;
  }
  const canonicalTag=[...html.matchAll(/<link\b[^>]*>/gi)].map(x=>x[0]).find(x=>/rel=["']canonical["']/i.test(x));
  const canonical=canonicalTag?.match(/href=["']([^"']+)/i)?.[1];
  const url=normalized(canonical ? new URL(decode(canonical),response.url).href : response.url);
  if(!new URL(url).hostname.endsWith(new URL(candidate.url).hostname.replace(/^www\./,''))) throw new Error('Canonical moved to a different provider');
  return {title,url,checkedAt:response.checkedAt,status:response.status};
}

const records=[];
let checked=0;
await pool([...candidates.values()],async candidate=>{
  const cacheFile=join(cacheDir,digest(candidate.url)+'.json');
  try {
    let result;
    if(!refresh) {try{const cached=JSON.parse(await readFile(cacheFile,'utf8'));if(Date.now()-Date.parse(cached.checkedAt)<86400000) result=cached;}catch{}}
    if(!result) {
      const fetchUrl=/^https:\/\/(www\.tensorflow\.org|developers\.google\.com)\//.test(candidate.url)?candidate.url+'?hl=en':candidate.url;
      const response=await get(fetchUrl);
      if(response.status!==200) throw new Error(`HTTP ${response.status}`);
      result=extract(response,candidate);
      await writeFile(cacheFile,JSON.stringify(result),'utf8');
    }
    const url=/^https:\/\/(www\.tensorflow\.org|developers\.google\.com)\//.test(result.url)?result.url+'?hl=en':result.url;
    records.push({id:`tutorial-${digest(result.url)}`,title:result.title,url,provider:candidate.provider,type:candidate.type,...classify(result.title,result.url),sourceUrl:candidate.sourceUrl,access:'Free materials',level:'All levels',verifiedAt:result.checkedAt.slice(0,10),verifiedStatus:result.status});
  }catch(error){rejected.push({url:candidate.url,reason:error.message});}
  checked++;
  if(checked%100===0||checked===candidates.size) console.log(`Checked ${checked}/${candidates.size}; ${records.length} valid; ${rejected.length} excluded`);
});

const unique=new Map();
for(const record of records) if(!unique.has(normalized(record.url))) unique.set(normalized(record.url),record);
const items=[...unique.values()].sort((a,b)=>a.provider.localeCompare(b.provider)||a.title.localeCompare(b.title));
await mkdir(dirname(output),{recursive:true});
await writeFile(output,JSON.stringify(items,null,2)+'\n','utf8');
const counts={};
for(const item of items) counts[item.provider]=(counts[item.provider]||0)+1;
const now=new Date().toISOString();
const sourceLines=evidence.map(item=>`| ${item.url} | ${item.status} | ${item.checkedAt.slice(0,10)} |`).join('\n');
const text=`# Official tutorial and course lesson catalogue\n\nGenerated ${now} by \`scripts/collect-tutorials.mjs\`.\n\n${items.length} distinct English educational pages were retained from ${candidates.size} discovered candidate URLs. Each retained page returned HTTP 200 during collection and supplied its actual page heading or title. Titles are source metadata, normalized for readability. No URLs or descriptions were invented.\n\n## Provider totals\n\n| Provider | Verified pages |\n| --- | ---: |\n${Object.entries(counts).map(([name,count])=>`| ${name} | ${count} |`).join('\n')}\n\n## Collection method\n\n- PyTorch: official stable tutorials sitemap, limited to beginner, intermediate, advanced, and recipe pages.\n- TensorFlow: official current sitemap shards, limited to English tutorial and guide paths. API references, version trees, and migration pages are excluded. English is requested explicitly.\n- Dive into Deep Learning: actual chapter links from the official table of contents. Preface, installation, references, and contributor utility pages are excluded.\n- Hugging Face: actual English lesson URLs in the server-rendered sidebars of courses published in its documentation sitemap, plus its official LLM course. Translations, events, Discord onboarding, and certificate administration are excluded. Course context is appended where helpful to distinguish generic lesson headings.\n- Google ML: actual links published in course and guide navigation, with English requested explicitly. Glossary and support links are excluded.\n- Up to four simultaneous requests, a 25-second timeout, one retry for transient failures, and a local one-day metadata cache. Use \`--refresh\` to ignore cached page checks.\n- Canonical and redirected URLs are normalized and deduplicated. Redirects away from selected providers, non-English pages, missing titles, and non-200 responses are rejected.\n- Category/topic labels are editorial classifications inferred from page titles and course paths. Level is intentionally \`All levels\`; consult the source for prerequisites.\n- Free materials means the learning page is publicly readable. Hosted notebooks, model APIs, GPUs, and platform services can require accounts or have separate costs. HTTP checks do not execute every notebook or verify every embedded dependency.\n\n## Source indexes checked\n\n| Original index | HTTP status | Checked |\n| --- | ---: | --- |\n${sourceLines}\n\n## Exclusions during this run\n\n${rejected.length ? rejected.map(item=>`- ${item.url}: ${item.reason.replace(/[\r\n]/g,' ')}`).join('\n') : 'No candidate fetch failures.'}\n\nThis catalogue links to original providers. It does not reproduce their teaching text, mirror course materials, imply partnerships, or claim that all providers offer free compute or certificates.\n`;
await writeFile(manifest,text,'utf8');
console.log(JSON.stringify({output,total:items.length,counts,excluded:rejected.length},null,2));
