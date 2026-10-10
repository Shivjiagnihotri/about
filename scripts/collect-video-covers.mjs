// Source-provided preview art, saved locally so video cards do not depend on a remote image request.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resources } from '../learn/resources.js';
const root=new URL('../learn/',import.meta.url);
const {items}=JSON.parse(await readFile(new URL('catalogue/library.json',root),'utf8'));
const candidates=[...new Map([...items.filter(x=>x.type==='Video lectures'),...resources.filter(x=>/video/i.test(x.format))].map(item=>[item.url,item])).values()];
const covers=[];
const unavailable=[];
const decode=text=>text.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)));
const xml=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
await mkdir(new URL('covers/',root),{recursive:true});
function illustration(title) {
  const words=title.split(/\s+/),lines=[];let line='';
  for(const word of words){if((line+' '+word).length>29){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450"><rect width="800" height="450" fill="#e3ead9"/><circle cx="663" cy="201" r="186" fill="#ceddc1"/><g fill="none" stroke="#8fab82" stroke-width="2"><circle cx="663" cy="201" r="123"/><circle cx="663" cy="201" r="89"/><path d="M605 155L713 209L622 258Z"/></g><text x="48" y="58" font-family="Arial,sans-serif" font-size="13" fill="#5e784d" letter-spacing="3">THE LEARNING GARDEN / VIDEO</text>${lines.slice(0,4).map((line,i)=>`<text x="48" y="${145+i*47}" font-family="Georgia,serif" font-size="37" fill="#324b2d">${xml(line)}</text>`).join('')}<text x="48" y="411" font-family="Arial,sans-serif" font-size="13" fill="#6d825d">${lines.length>4?'Explore the complete lesson':'One idea. A little more understanding.'}</text></svg>`;
}
let cursor=0;
await Promise.all(Array.from({length:4},async()=>{
  while(cursor<candidates.length){
    const item=candidates[cursor++],id=createHash('sha256').update(item.url).digest('hex').slice(0,16);
    const record={url:item.url,title:item.title,checkedAt:new Date().toISOString(),kind:'source-thumbnail'};
    try {
      const response=await fetch(item.url,{signal:AbortSignal.timeout(22000),headers:{'Accept-Language':'en'}});
      if(!response.ok)throw new Error(`Source HTTP ${response.status}`);
      const html=await response.text();
      const videoHost=/^(www\.)?(youtube\.com|youtu\.be)$/.test(new URL(item.url).hostname);
      if(videoHost && (/"reason"\s*:\s*"This video is unavailable"/.test(html) || html.includes('There are no videos in this playlist yet'))) {
        unavailable.push({url:item.url,title:item.title,reason:'The source reports no available video.'});
        continue;
      }
      const tags=[...html.matchAll(/<meta\b[^>]*>/gi)].map(x=>x[0]);
      const tag=tags.find(x=>/(?:property|name)=["']og:image["']/i.test(x))||tags.find(x=>/(?:property|name)=["']twitter:image["']/i.test(x));
      const imageValue=tag?.match(/content=["']([^"']+)/i)?.[1];
      if(!imageValue)throw new Error('No source preview image');
      const imageURL=new URL(decode(imageValue),response.url).href;
      if(!imageURL.startsWith('https://'))throw new Error('No secure preview image');
      const image=await fetch(imageURL,{signal:AbortSignal.timeout(22000)});
      if(!image.ok)throw new Error(`Image HTTP ${image.status}`);
      const contentType=image.headers.get('content-type')||'';
      const extension=contentType.includes('jpeg')?'jpg':contentType.includes('png')?'png':contentType.includes('webp')?'webp':null;
      if(!extension)throw new Error(`Unsupported source image ${contentType}`);
      const bytes=Buffer.from(await image.arrayBuffer());
      if(bytes.length<500 || bytes.length>5_000_000)throw new Error('Preview size outside image bounds');
      record.cover=`covers/${id}.${extension}`;
      record.remoteImage=imageURL;
      record.sourceTitle=decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || item.title).replace(/\s*- YouTube\s*$/,'').trim();
      await writeFile(new URL(record.cover,root),bytes);
    }catch(error){
      record.kind='original-illustration';record.note=error.message;record.cover=`covers/${id}.svg`;
      await writeFile(new URL(record.cover,root),illustration(item.title));
    }
    covers.push(record);
    console.log(`${covers.length}/${candidates.length} ${record.kind}: ${item.title}`);
  }
}));
covers.sort((a,b)=>a.url.localeCompare(b.url));
if(unavailable.length) throw new Error(`Review unavailable videos before publishing covers: ${JSON.stringify(unavailable)}`);
await writeFile(new URL('catalogue/video-covers.json',root),JSON.stringify({updatedAt:new Date().toISOString(),covers},null,2)+'\n');
console.log(JSON.stringify({total:covers.length,sourceThumbnails:covers.filter(x=>x.kind==='source-thumbnail').length,originalCovers:covers.filter(x=>x.kind==='original-illustration').length}));
