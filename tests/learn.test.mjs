import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
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
    if(item.type==='Video lectures') assert.equal(item.cover,preview.cover);
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
  assert.ok(items.length>=5000,'The published catalogue retains the requested minimum of 5,000 resources');
  const canonical=url=>{const parsed=new URL(url);parsed.hash='';return parsed.href.replace(/\/$/,'');};
  assert.equal(new Set(items.map(x=>x.id)).size,items.length);
  assert.equal(new Set(items.map(x=>canonical(x.url))).size,items.length);
  assert.equal(manifest.total,items.length);
  assert.equal(Object.values(manifest.byType).reduce((a,b)=>a+b,0),items.length);
  for(const item of items) {
    assert.ok(item.title.trim()&&item.provider&&item.type&&item.access,item.id);
    assert.ok(categories.has(item.category),item.title);
    external(item.url);external(item.sourceUrl);
    if(item.pdfUrl) external(item.pdfUrl);
    if(item.type==='Paper') assert.ok(item.date&&item.authors,`Paper metadata: ${item.title}`);
    assert.ok(Array.isArray(item.topics));
  }
});
