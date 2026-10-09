/**
 * Refresh the learning garden's broad catalogue from public source collections.
 * Run: node scripts/collect-open-books.mjs
 * Uses Node 18+ built-ins. No API keys, accounts, or local packages required.
 * This is an editorially restricted import, not a claim that every GitHub link
 * is licensed. Third-party PDF mirrors and paid/login-only destinations are
 * excluded. Failed checks are recorded, never published as working resources.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const base = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(base, 'learn', 'catalogue');
const checkedAt = new Date().toISOString();
const sources = [
  { id: 'ebook-foundation', kind: 'books', url: 'https://raw.githubusercontent.com/EbookFoundation/free-programming-books/main/books/free-programming-books-subjects.md', page: 'https://github.com/EbookFoundation/free-programming-books/blob/main/books/free-programming-books-subjects.md' },
  { id: 'dair-courses', kind: 'courses', url: 'https://raw.githubusercontent.com/dair-ai/ML-YouTube-Courses/master/README.md', page: 'https://github.com/dair-ai/ML-YouTube-Courses' },
  { id: 'project-based-learning', kind: 'projects', url: 'https://raw.githubusercontent.com/practical-tutorials/project-based-learning/master/README.md', page: 'https://github.com/practical-tutorials/project-based-learning' },
  { id: 'awesome-deep-learning', kind: 'deep-learning', url: 'https://raw.githubusercontent.com/ChristosChristofidis/awesome-deep-learning/master/README.md', page: 'https://github.com/ChristosChristofidis/awesome-deep-learning' },
  { id: 'mit-opencourseware', kind: 'ocw', url: 'https://ocw.mit.edu/sitemap.xml', page: 'https://ocw.mit.edu/search/' },
];

const selectedBookSections = new Set(['Algorithms & Data Structures', 'Artificial Intelligence', 'Computer Vision', 'Data Science', 'Information Retrieval', 'Machine Learning', 'Mathematics', 'Algebra', 'Calculus', 'Mathematics For Computer Science', 'Prompt Engineering', 'Parallel Programming']);
const selectedProjectSections = new Set(['Data Science:', 'Machine Learning:', 'OpenCV:', 'Deep Learning:']);
const deniedHosts = [
  'archive.org', 'web.archive.org', 'us.archive.org', 'wordpress.com', 'weebly.com',
  'knowledgeisle.com', 'boente.eti.br', 'inis.jinr.ru', 'core.ac.uk', 'docs.google.com',
  'drive.google.com', 'coursera.org', 'edx.org', 'udacity.com', 'udemy.com', 'manning.com',
  'oreilly.com', 'packtpub.com', 'amazon.com', 'syncfusion.com', 'dezyre.com', 'projectpro.io',
  'medium.com', 'towardsdatascience.com', 'deeplearning.ai', 'wandb.ai', 'app.wandb.ai',
  'skillshare.com', 'datacamp.com', 'linkedin.com', 'facebook.com', 'twitter.com', 'x.com',
  'pimbook.org', 'mitpress.ublish.com', 'textbookequity.org', 'tools.yiteai.com',
];
const allowedBookGithubOwners = new Set(['mdipierro', 'liuxinyu95', 'correll', 'norvig', 'camdavidsonpilon', 'bartek-890', 'abhishekkrthakur', 'fastai', 'microsoft', 'probml', 'rlabbe', 'holdenlee', 'akmmusai', 'udlbook', 'harvard-edge']);
const authorizedPdfPrefixes = [
  'https://jeffe.cs.illinois.edu/', 'https://www.math.upenn.edu/~wilf/', 'https://people.cs.vt.edu/~shaffer/',
  'https://www.jjj.de/', 'https://www.cs.cmu.edu/~rwh/students/okasaki.pdf', 'http://igm.univ-mlv.fr/~mac/',
  'https://courses.csail.mit.edu/', 'https://www2.ed.gov/', 'https://www.cs.cornell.edu/jeh/',
  'https://book-wright-ma.github.io/', 'http://infolab.stanford.edu/~ullman/', 'https://ai.stanford.edu/~nilsson/',
  'http://vision.stanford.edu/teaching/', 'https://arxiv.org/', 'https://www.eecs189.org/', 'http://ciml.info/',
  'https://sites.ualberta.ca/~szepesva/', 'https://mlsysbook.ai/', 'https://mila.quebec/',
  'https://gwthomas.github.io/', 'https://hagan.okstate.edu/', 'https://www.microsoft.com/en-us/research/',
  'https://mlstory.org/', 'https://services.google.com/', 'https://github.com/probml/',
  'http://incompleteideas.net/', 'https://web.stanford.edu/~jurafsky/', 'https://intelligent-optimization.org/',
  'https://fleuret.org/', 'https://www.cs.utexas.edu/users/boyer/', 'http://stephendavies.org/',
  'https://matthbeck.github.io/', 'https://infinitedescent.xyz/', 'https://richardhammack.github.io/',
  'https://math.mit.edu/~dspivak/', 'https://math.dartmouth.edu/~prob/', 'https://www.poritz.net/',
  'https://www.ii.uib.no/~michal/', 'https://builds.openlogicproject.org/', 'https://www.math.stonybrook.edu/~aknapp/',
  'https://www.cis.upenn.edu/~jean/', 'https://home.iitk.ac.in/', 'https://www.math.ucdavis.edu/~linear/',
  'https://www.lix.polytechnique.fr/Labo/Samuel.Mimram/', 'https://dallery.gallery/', 'https://www.dkriesel.com/',
  'https://www.tutorialspoint.com/', 'https://d2l.ai/', 'https://mml-book.github.io/',
];

const clean = value => value.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/[\u2014\u2013]/g, ': ').replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim();
const hostOf = url => new URL(url).hostname.toLowerCase().replace(/^www\./, '');
const denied = url => deniedHosts.some(host => hostOf(url) === host || hostOf(url).endsWith(`.${host}`));
const idFor = url => `open-${createHash('sha256').update(url).digest('hex').slice(0, 12)}`;
function canonical(url) {
  const u = new URL(url.replace(/&amp;/g, '&'));
  u.hash = '';
  for (const k of [...u.searchParams.keys()]) if (/^(utm_|ref$|feature$)/.test(k)) u.searchParams.delete(k);
  return u.href.replace(/\/$/, '').replace(/^http:/, 'https:').replace(/\/index\.html$/, '');
}
function links(line) {
  const result = [];
  const re = /\[([^\]]+)\]\((https?:\/\/[^\s]+?)(?:\s+"[^"]*")?\)/g;
  for (const m of line.matchAll(re)) result.push({ title: clean(m[1]), url: m[2].replace(/&amp;/g, '&') });
  return result;
}
function categoryFor(title, section = '') {
  const t = `${title} ${section}`.toLowerCase();
  if (/language model|\bllm\b|\brag\b|prompt|natural language|\bnlp\b|transformer|agentic|ai agent/.test(t)) return 'llms';
  if (/mlops|production|systems|distributed|parallel|deployment|data engineering|inference fleet/.test(t)) return 'systems';
  if (/deep learning|neural|computer vision|opencv|generative|convolution|reinforcement/.test(t)) return 'deep-learning';
  if (/machine learning|artificial intelligence|data science|data mining|statistical learning/.test(t)) return 'machine-learning';
  return 'foundations';
}
function topicsFor(title, section) {
  const text = `${title} ${section}`.toLowerCase();
  const tags = [
    ['Linear algebra', /linear algebra|matrix|matrices/], ['Probability', /probab|bayesian|stochastic/],
    ['Statistics', /statistic|inference/], ['Calculus', /calculus|differential/], ['Algorithms', /algorithm|data structure|combinator/],
    ['Optimization', /optimiz/], ['Computer vision', /vision|opencv|image|visual recognition/],
    ['Neural networks', /neural|deep learning/], ['Language models', /language|llm|transformer|nlp/],
    ['RAG', /retrieval|\brag\b/], ['Agents', /agent/], ['ML systems', /mlops|systems|distributed|parallel|production/],
    ['Data science', /data science|mining|data analysis|visualization/], ['Reinforcement learning', /reinforcement/],
    ['Machine learning', /machine learning|artificial intelligence/], ['Mathematics', /mathemat|algebra|calculus|geometry|analysis/],
  ];
  return tags.filter(([, re]) => re.test(text)).map(([tag]) => tag).slice(0, 4);
}
function providerFor(url, source) {
  const host = hostOf(url);
  const mapping = {'ocw.mit.edu':'MIT OpenCourseWare','youtube.com':'YouTube course creator','youtu.be':'YouTube course creator','huggingface.co':'Hugging Face','developers.google.com':'Google for Developers','en.wikibooks.org':'Wikibooks','openstax.org':'OpenStax','freecodecamp.org':'freeCodeCamp','cs50.harvard.edu':'Harvard CS50','course.fast.ai':'fast.ai','github.com':'GitHub author project','arxiv.org':'Author manuscript on arXiv'};
  if (mapping[host]) return mapping[host];
  if (host.endsWith('stanford.edu')) return 'Stanford University';
  if (host.endsWith('mit.edu')) return 'MIT';
  if (host.endsWith('cmu.edu')) return 'Carnegie Mellon University';
  if (host.endsWith('berkeley.edu')) return 'UC Berkeley';
  return host;
}
function bookPolicy(item, line) {
  if (denied(item.url)) return 'Excluded paid, gated, archive, or unreviewed mirror host';
  if (/email.*required|registration|sign.?up|use form|preview/i.test(line)) return 'Registration or preview-only restriction';
  if (hostOf(item.url) === 'github.com' && !allowedBookGithubOwners.has(new URL(item.url).pathname.split('/')[1].toLowerCase())) return 'Unreviewed GitHub book owner';
  if (/\.pdf(?:$|[?#])/i.test(item.url) && !authorizedPdfPrefixes.some(prefix => item.url.startsWith(prefix))) return 'Direct PDF without reviewed author or institution provenance';
  return '';
}
function createItem(link, source, section, type, lineNumber) {
  const category = categoryFor(link.title, section);
  return { id: idFor(canonical(link.url)), title: link.title, url: link.url,
    provider: providerFor(link.url, source), type, category, topics: topicsFor(link.title, section),
    sourceUrl: source.kind === 'ocw' ? source.url : `${source.page}${source.kind === 'books' ? `#L${lineNumber}` : ''}`,
    access: 'Free materials', level: 'All levels', _source: source.id, _section: section, _line: lineNumber };
}

const rejected = [];
const sourceEvidence = [];
const candidates = [];
function parseMarkdown(raw, source) {
  let section = '';
  for (const [i, line] of raw.split(/\r?\n/).entries()) {
    if (/^#{1,5}\s/.test(line)) section = clean(line.replace(/^#+\s*/, ''));
    let include = source.kind === 'books' ? selectedBookSections.has(section) :
      source.kind === 'projects' ? selectedProjectSections.has(section) :
      source.kind === 'deep-learning' ? ['Courses', 'Tutorials'].includes(section) : /^###?\s/.test(line) === false;
    if (!include) continue;
    const found = links(line);
    if (!found.length) continue;
    if (source.kind === 'books' || source.kind === 'projects') found.splice(1);
    for (const link of found) {
      if (!link.title || /^(image|badge|license|contribut|pdf|slides|notebooks|code|here)$/i.test(link.title)) continue;
      if (source.kind === 'courses') {
        if (!section || /^ML YouTube|Table of/.test(section)) continue;
        if (!/youtube\.com|youtu\.be/.test(link.url)) continue;
        link.title = section;
      }
      const reason = source.kind === 'books' ? bookPolicy(link, line) : denied(link.url) ? 'Excluded paid, gated, or mirror host' : '';
      if (reason) { rejected.push({ ...link, source: source.id, reason }); continue; }
      let type = source.kind === 'books' ? 'Book' : source.kind === 'projects' || section === 'Tutorials' ? 'Tutorial' : 'Course';
      if (/youtube\.com|youtu\.be|course|cs50|crash-course/i.test(link.url + ' ' + link.title)) type = 'Course';
      else if (/guide|handbook|notes|whitepaper|report/i.test(link.title)) type = 'Guide';
      candidates.push(createItem(link, source, section, type, i + 1));
    }
  }
}
function parseOcw(raw, source) {
  const latest = new Map();
  for (const [, url] of raw.matchAll(/<loc>(https:\/\/ocw\.mit\.edu\/courses\/[^<]+\/sitemap\.xml)<\/loc>/g)) {
    const courseUrl = url.replace(/sitemap\.xml$/, '');
    const slug = new URL(courseUrl).pathname.split('/')[2];
    if (!/(?:machine-learning|deep-learning|artificial-intelligence|neural|language-processing|computer-vision|reinforcement|data-science|data-analysis|statistic|probability|stochastic|linear-algebra|calculus|optimization|numerical|algorithms|data-structures|discrete-math|information-theory|computational|computation|parallel|distributed|database|software|programming|mathematics-for|matrix|random|inference|decision|convex|graph-theory)/.test(slug)) continue;
    if (/biology|geology|chemical|fluid|structural|astrophys|finance|economics|accounting|nuclear|urban|mechanics|quantum|aerospace|business|geophys|molecular/.test(slug) && !/machine-learning|data-science|neural|artificial-intelligence/.test(slug)) continue;
    const stem = slug.replace(/-(?:fall|spring|summer|winter|january-iap)-\d{4}$/, '');
    const year = Number(slug.match(/(\d{4})$/)?.[1] || 0);
    const titleKey = stem.replace(/^(?:res-)?[\d]+-[\d\w]+(?:j)?-/, '');
    if (!latest.has(titleKey) || latest.get(titleKey).year < year) latest.set(titleKey, { courseUrl, slug, year });
  }
  for (const { courseUrl, slug } of latest.values()) {
    const title = slug.replace(/^(?:res-)?[\d]+-[\d\w]+(?:j)?-/, '').replace(/-(?:fall|spring|summer|winter|january-iap)-\d{4}$/, '').replace(/-/g, ' ').replace(/\b\w/g, x => x.toUpperCase());
    const item = createItem({title, url:courseUrl}, source, title, 'Course', null);
    item.description = 'Open course materials from MIT, including the syllabus and available lecture notes, assignments, readings, or videos.';
    candidates.push(item);
  }
}

async function fetchSource(source) {
  const response = await fetch(source.url, { signal: AbortSignal.timeout(25000) });
  if (!response.ok) throw new Error(`${source.id}: HTTP ${response.status}`);
  const raw = await response.text();
  sourceEvidence.push({id:source.id,url:source.url,sourceUrl:source.page,bytes:Buffer.byteLength(raw),sha256:createHash('sha256').update(raw).digest('hex'),status:response.status,checkedAt:new Date().toISOString()});
  source.kind === 'ocw' ? parseOcw(raw, source) : parseMarkdown(raw, source);
  console.log(`${source.id}: parsed source (${Buffer.byteLength(raw)} bytes)`);
}
for (const source of sources) {
  try { await fetchSource(source); }
  catch (error) { sourceEvidence.push({id:source.id,url:source.url,error:error.message}); console.error(error.message); }
}

const unique = new Map();
for (const item of candidates) {
  const key = canonical(item.url);
  if (!unique.has(key)) unique.set(key, item);
}
console.log(`Found ${candidates.length} candidates, ${unique.size} unique destinations. Checking actual HTTP responses.`);
const queue = [...unique.values()];
const accepted = [];
const evidence = [];
let completed = 0;
async function verify(item) {
  try {
    const response = await fetch(item.url, { headers: { 'User-Agent': 'LearningGardenLinkCheck/1.0 (public educational catalogue)', Range: 'bytes=0-98303' }, signal: AbortSignal.timeout(18000), redirect:'follow' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (denied(response.url)) throw new Error('Redirected to excluded destination');
    const reader = response.body.getReader();
    const parts = []; let total = 0;
    while (total < 98304) { const { done, value } = await reader.read(); if (done) break; parts.push(value); total += value.length; }
    await reader.cancel();
    const bytes = Buffer.concat(parts.map(p=>Buffer.from(p)));
    const pdf = bytes.subarray(0,5).toString() === '%PDF-';
    const contentType = response.headers.get('content-type') || '';
    const html = bytes.toString('utf8');
    const documentTitle = clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
    if (!pdf && /^(Access denied|Just a moment|403|404|Page not found|Sign in|Log in|Robot Check|Attention Required)/i.test(documentTitle)) throw new Error(`Unavailable document: ${documentTitle}`);
    if (!pdf && /(?:this video is unavailable|this playlist does not exist)/i.test(html)) throw new Error('Unavailable video or playlist');
    if (/\.pdf(?:$|[?#])/i.test(item.url) && !pdf) throw new Error(`Expected PDF but received ${contentType || 'unknown content'}`);
    if (!pdf && !/text|html|json|xml/.test(contentType)) throw new Error(`Unexpected content type: ${contentType}`);
    if (item._source === 'mit-opencourseware' && documentTitle) item.title = documentTitle.split('|')[0].trim();
    const { _source, _section, _line, ...publicItem } = item;
    publicItem.format = pdf ? 'PDF' : 'Online resource';
    publicItem.checkedAt = checkedAt.slice(0,10);
    accepted.push(publicItem);
    evidence.push({id:item.id,source:_source,section:_section,line:_line,url:item.url,status:response.status,finalUrl:response.url,contentType,pdfSignature:pdf ? bytes.subarray(0,8).toString() : null,documentTitle,checkedAt:new Date().toISOString()});
  } catch(error) { rejected.push({id:item.id,title:item.title,url:item.url,source:item._source,reason:error.message}); }
  completed++;
  if (completed % 40 === 0) console.log(`Checked ${completed}/${queue.length}: ${accepted.length} accepted so far`);
}
let index = 0;
await Promise.all(Array.from({length:12}, async()=> { while(index < queue.length) await verify(queue[index++]); }));
accepted.sort((a,b)=>a.title.localeCompare(b.title));
evidence.sort((a,b)=>a.id.localeCompare(b.id));
const counts = accepted.reduce((acc,item)=> { acc.byCategory[item.category]=(acc.byCategory[item.category]||0)+1;acc.byType[item.type]=(acc.byType[item.type]||0)+1;return acc; }, {byCategory:{},byType:{}});
await mkdir(output,{recursive:true});
await writeFile(path.join(output,'collections.json'),JSON.stringify(accepted,null,2)+'\n');
await writeFile(path.join(output,'collections-provenance.json'),JSON.stringify({checkedAt,policy:'Public educational source links only; author/institution PDF allowlist; paid, registration-only, archived, and unreviewed PDF mirrors excluded. HTTP response checks establish reachability, not future availability or independent license certification.',counts:{accepted:accepted.length,rejected:rejected.length,...counts},sources:sourceEvidence,accepted:evidence,rejected},null,2)+'\n');
console.log(JSON.stringify({accepted:accepted.length,rejected:rejected.length,...counts},null,2));
