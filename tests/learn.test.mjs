import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { concepts } from '../learn/concepts.js';
import { demoNames } from '../learn/demos.js';
import { books } from '../learn/books.js';
import { resources } from '../learn/resources.js';

const categories=new Set(['foundations','machine-learning','deep-learning','llms','systems']);
const external=url=>assert.ok(['http:','https:'].includes(new URL(url).protocol),url);
test('Concept graph has valid related ideas, actual demos or explanatory steps, and source reading',()=>{
  const ids=new Set(concepts.map(x=>x.id));
  assert.equal(ids.size,concepts.length);
  for(const idea of concepts) {
    assert.ok(categories.has(idea.category));
    for(const id of idea.related) assert.ok(ids.has(id),`${idea.id} refers to missing ${id}`);
    if(idea.demo) { assert.ok(demoNames.includes(idea.demo));assert.ok(idea.demoTitle&&idea.demoNote); }
    else assert.ok(idea.steps?.length>=3,idea.id);
    assert.ok(idea.explanation&&idea.example&&idea.takeaway,idea.id);
    external(idea.reading.url);
  }
  for(const name of demoNames) assert.ok(concepts.some(x=>x.demo===name),`Demo ${name} is discoverable`);
});

test('Every video has a local cover and traceable preview provenance',async()=>{
  const root=new URL('../learn/',import.meta.url);
  const [{items},{covers}]=await Promise.all(['catalogue/library.json','catalogue/video-covers.json'].map(async path=>JSON.parse(await readFile(new URL(path,root),'utf8'))));
  const previews=new Map(covers.map(item=>[item.url,item]));
  for(const item of [...items.filter(x=>x.type==='Video lectures'),...resources.filter(x=>/video/i.test(x.format))]) {
    const preview=previews.get(item.url);
    assert.ok(preview,`Missing video cover: ${item.title}`);
    if(item.type==='Video lectures') {
      assert.equal(item.cover,preview.cover);
      assert.equal(preview.kind,'source-thumbnail','Every video uses a thumbnail supplied by its original provider');
    }
    assert.match(preview.cover,/^covers\/[a-f0-9]{16}\.(jpg|png|webp|svg)$/);
    assert.ok((await stat(new URL(preview.cover,root))).size>500);
    assert.ok(['source-thumbnail','original-illustration'].includes(preview.kind));
    if(preview.kind==='source-thumbnail') external(preview.remoteImage);
    else assert.ok(preview.note,'Fallback artwork explains why no source preview was used');
  }
});
test('Curated books and courses have distinct IDs, valid outbound links, and honest format labels',()=>{
  for(const collection of [books,resources]) {
    assert.equal(new Set(collection.map(x=>x.id)).size,collection.length);
    for(const item of collection) {external(item.url);assert.ok(categories.has(item.category));assert.ok(item.title&&item.description&&item.level);}
  }
  for(const book of books) {external(book.sourceUrl);assert.ok(['PDF','PDF + notebooks','Online book'].includes(book.format));assert.ok(book.authors&&book.source);}
  assert.equal(books.find(x=>x.id==='deep-learning').format,'Online book','Goodfellow is linked to the authorized web edition');
});
test('Built open library is deduplicated, traceable, and agrees with its public counts',async()=>{
  const root=new URL('../learn/catalogue/',import.meta.url);
  const [{items},manifest]=await Promise.all(['library.json','manifest.json'].map(async path=>JSON.parse(await readFile(new URL(path,root),'utf8'))));
  assert.ok(items.length>=50000,'The published catalogue reaches the requested 50,000-resource milestone');
  const canonical=url=>{const parsed=new URL(url);parsed.hash='';return parsed.href.replace(/\/$/,'');};
  assert.equal(new Set(items.map(x=>x.id)).size,items.length);
  assert.equal(new Set(items.map(x=>canonical(x.url))).size,items.length);
  assert.equal(manifest.total,items.length);
  assert.equal(Object.values(manifest.byType).reduce((a,b)=>a+b,0),items.length);
  assert.equal(Object.values(manifest.byLevel).reduce((a,b)=>a+b,0),items.length);
  for(const level of ['Beginner','Intermediate','Advanced']) assert.ok(manifest.byLevel[level]>0);
  for(const item of items) {
    assert.ok(item.title.trim()&&item.provider&&item.type&&item.access,item.id);
    assert.ok(categories.has(item.category),item.title);
    external(item.url);external(item.sourceUrl);
    if(item.pdfUrl) external(item.pdfUrl);
    if(item.type==='Paper') assert.ok(item.date&&item.authors,`Paper metadata: ${item.title}`);
    assert.ok(Array.isArray(item.topics));
  }
});

test('Worldwide additions are new English resources with evidence across six continents',async()=>{
  const root=new URL('../learn/catalogue/',import.meta.url);
  const [{items},world,learning]=await Promise.all(['library.json','world-expansion.json','llm-learning.json'].map(async path=>JSON.parse(await readFile(new URL(path,root),'utf8'))));
  assert.ok(world.items.length>=10000);
  const key=title=>title.normalize('NFKD').toLowerCase().replace(/[^\p{L}\p{N}_]+/gu,'');
  assert.equal(new Set(world.items.map(x=>key(x.title))).size,world.items.length);
  const worldUrls=new Set(world.items.map(x=>x.url));
  const teachingUrls=new Set(learning.items.map(x=>x.url));
  const baseline=items.filter(x=>!worldUrls.has(x.url)&&!teachingUrls.has(x.url));
  assert.equal(baseline.length,world.baselineTotal,'All resources from the 15,277 baseline survive');
  const digest=createHash('sha256').update(baseline.map(x=>x.id).sort().join('\n')).digest('hex');
  assert.equal(digest,world.baselineIdsSha256,'The existing collection has not been replaced to inflate the total');
  const existingTitles=new Set(baseline.map(x=>key(x.title)));
  for(const item of world.items) {
    assert.ok(!existingTitles.has(key(item.title)),`Repeated title: ${item.title}`);
    assert.equal(item.language,'en');
    assert.ok(item.languageEvidence.confidence>=0.95);
    assert.ok(item.languageEvidence.textSha256);
    assert.equal(new URL(item.url).hostname,'proceedings.mlr.press');
    assert.ok(item.metadataUrl&&item.venue&&item.venueLocation&&item.date&&item.authors&&item.pdfUrl);
    assert.ok(item.date<=world.collectedAt);
  }
  for(const region of ['Africa','Asia','Europe','North America','South America','Oceania']) assert.ok(world.byRegion[region]>0,region);
  for(const type of ['Guide','Article','Book','Video lectures']) assert.ok(learning.items.some(x=>x.type===type&&x.language==='en'),type);
  for(const topic of ['Loading open models','LLM training','Fine-tuning','Local inference','Quantization','Deployment']) {
    assert.ok(learning.items.some(x=>x.topics.includes(topic)&&x.type!=='Video lectures'),`Missing practical topic: ${topic}`);
  }
});

test('Compressed delivery contains exactly the published catalogue',async()=>{
  const root=new URL('../learn/catalogue/',import.meta.url);
  const [json,gzip]=await Promise.all(['library.json','library.json.gz'].map(path=>readFile(new URL(path,root))));
  assert.deepEqual(gunzipSync(gzip),json);
  assert.ok(gzip.length<json.length/3,'Compressed catalogue should materially reduce the network transfer');
});

test('AI expansion contains 10,000 unique, sourced additions with research metadata',async()=>{
  const root=new URL('../learn/catalogue/',import.meta.url);
  const expansion=JSON.parse(await readFile(new URL('ai-expansion.json',root),'utf8'));
  assert.ok(expansion.items.length>=10000);
  const key=title=>title.toLowerCase().replace(/[^\p{L}\p{N}_]+/gu,'');
  assert.equal(new Set(expansion.items.map(x=>key(x.title))).size,expansion.items.length);
  for(const item of expansion.items) {
    assert.ok(item.metadataCheckedAt&&item.verification&&item.sourceUrl);
    assert.ok(['Beginner','Intermediate','Advanced'].includes(item.level));
    if(item.type==='Paper') {
      assert.ok(item.pdfUrl&&item.authors&&item.date);
      assert.equal(new URL(item.url).hostname,'aclanthology.org');
      assert.equal(item.level,'Advanced');
    }
  }
});
