import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { books } from '../learn/books.js';
import { resources } from '../learn/resources.js';

const root=new URL('../learn/catalogue/',import.meta.url);
await mkdir(root,{recursive:true});
const inputs=['tutorials.json','collections.json','papers.json'];
const lists=await Promise.all(inputs.map(async file=>{
  const data=JSON.parse(await readFile(new URL(file,root),'utf8'));
  return Array.isArray(data)?data:data.items || data.resources;
}));
const curatedBooks=books.map(book=>({...book,type:'Book',provider:book.source,access:'Free materials',sourceUrl:book.sourceUrl,...(book.format.includes('PDF')?{pdfUrl:book.url}:{})}));
const curatedResources=resources.map(item=>({...item,sourceUrl:item.url}));
const seen=new Set(),items=[];
const allowedCategories=new Set(['foundations','machine-learning','deep-learning','llms','systems']);
const allowedTypes=new Set(['Book','Guide','Course','Tutorial','Course lesson','Collection','Paper','Interactive','Documentation']);
function canonical(url) {const parsed=new URL(url);parsed.hash='';['utm_source','utm_medium','utm_campaign','ref'].forEach(key=>parsed.searchParams.delete(key));return parsed.href.replace(/\/$/,'');}
const uiText=value=>String(value).replace(/\s*\u2014\s*/g,': ').replace(/\s+/g,' ').trim();
const review=JSON.parse(await readFile(new URL('review-overrides.json',root),'utf8'));
const excluded=new Set(review.exclusions.map(item=>canonical(item.url)));
const overrides=new Map(review.overrides.map(item=>[canonical(item.url),item]));
let coverData={covers:[]};
try { coverData=JSON.parse(await readFile(new URL('video-covers.json',root),'utf8')); }
catch(error) { if(error.code!=='ENOENT') throw error; }
const videoCovers=new Map(coverData.covers.map(item=>[canonical(item.url),item]));
for(const item of [...curatedBooks,...curatedResources,...lists.flat()]) {
  if(!item || !item.title || !item.url) throw new Error('Entry missing title or URL');
  const url=canonical(item.url);
  if(excluded.has(url)) continue;
  if(overrides.has(url)) Object.assign(item,overrides.get(url));
  if(!/^https?:\/\//.test(url)) throw new Error(`Invalid protocol: ${url}`);
  if(seen.has(url)) continue;
  if(!allowedCategories.has(item.category)) throw new Error(`Invalid category ${item.category}: ${item.title}`);
  if(!allowedTypes.has(item.type)) throw new Error(`Invalid type ${item.type}: ${item.title}`);
  seen.add(url);
  const record={id:createHash('sha256').update(url).digest('hex').slice(0,16),title:uiText(item.title),url:item.url,provider:item.provider || new URL(url).hostname,type:item.type,category:item.category,level:item.level||'All levels',topics:[...new Set(item.topics||[])].map(uiText),access:item.access||'Free materials',sourceUrl:item.sourceUrl||item.url};
  if(/^(www\.)?(youtube\.com|youtu\.be)$/.test(new URL(url).hostname)) record.type='Video lectures';
  const preview=videoCovers.get(url);
  if(preview) { record.cover=preview.cover;record.coverKind=preview.kind; }
  for(const key of ['pdfUrl','date','authors']) if(item[key]) record[key]=item[key];
  if(item.format==='PDF' && !record.pdfUrl) record.pdfUrl=item.url;
  if(record.authors) record.authors=uiText(record.authors);
  if(item.description) { const text=uiText(item.description); record.description=text.length>320?text.slice(0,317).trimEnd()+'…':text; }
  items.push(record);
}
const countBy=key=>Object.fromEntries([...new Set(items.map(x=>x[key]))].sort().map(value=>[value,items.filter(x=>x[key]===value).length]));
const manifest={builtAt:new Date().toISOString(),total:items.length,byType:countBy('type'),byCategory:countBy('category'),byProvider:countBy('provider'),inputs};
await writeFile(new URL('library.json',root),JSON.stringify({builtAt:manifest.builtAt,items}));
await writeFile(new URL('manifest.json',root),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({total:manifest.total,byType:manifest.byType,byCategory:manifest.byCategory,providerCount:Object.keys(manifest.byProvider).length},null,2));
