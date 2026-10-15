"""Shared primary-source import helpers. Dependencies: requirements-resources.txt."""
import hashlib
import html
import json
import pathlib
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from langdetect import DetectorFactory, detect_langs

DetectorFactory.seed = 0
ROOT = pathlib.Path(__file__).resolve().parents[1]
CACHE = ROOT.parent / '.work' / 'resource-source-cache'
CACHE.mkdir(parents=True, exist_ok=True)

def clean(value):
    return re.sub(r'\s+', ' ', html.unescape(str(value or ''))).strip()

def title_key(value):
    return re.sub(r'[^\w]', '', unicodedata.normalize('NFKD', clean(value)).casefold())

def canonical(value):
    p = urllib.parse.urlsplit(value)
    query = urllib.parse.parse_qsl(p.query)
    query = [(k,v) for k,v in query if not k.startswith('utm_') and k not in ('ref','feature')]
    return urllib.parse.urlunsplit((p.scheme.lower(), p.netloc.lower().removeprefix('www.'), p.path.rstrip('/'), urllib.parse.urlencode(query), ''))

def get(url):
    key = hashlib.sha256(url.encode()).hexdigest()
    dest = CACHE / (key + '.bin')
    info = CACHE / (key + '.json')
    if dest.exists() and info.exists():
        return dest.read_bytes(), json.loads(info.read_text())
    if '--cached-only' in sys.argv:
        raise OSError('No cached successful response; omitted without requesting the provider')
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={'User-Agent':'LearningGarden/3.0 (public educational resource index)', 'Accept-Language':'en'})
            with urllib.request.urlopen(req, timeout=50) as response:
                raw = response.read()
                evidence = dict(url=url, finalUrl=response.url, status=response.status, sha256=hashlib.sha256(raw).hexdigest(), fetchedAt=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()))
            dest.write_bytes(raw)
            info.write_text(json.dumps(evidence),encoding='utf-8')
            return raw, evidence
        except urllib.error.HTTPError as error:
            if error.code not in (429,500,502,503,504) or attempt==2:
                raise
            retry_after=error.headers.get('Retry-After','')
            pause=int(retry_after) if retry_after.isdigit() else (30 if error.code==429 else 2 ** (attempt+1))
            time.sleep(min(60,pause))
        except (urllib.error.URLError, TimeoutError):
            if attempt==2:
                raise
            time.sleep(2 ** (attempt+1))

def english(value):
    value=clean(value)
    if len(value)<100:
        return None
    predictions=detect_langs(value[:7000])
    first=predictions[0]
    if first.lang!='en' or first.prob<0.95:
        return None
    return dict(method='langdetect 1.0.9, deterministic seed 0, title and English abstract/page text', confidence=round(first.prob,6), textSha256=hashlib.sha256(value[:7000].encode()).hexdigest())

TOPICS=[
 ('Loading open models',r'from_pretrained|load(?:ing)? (?:a |the |pretrained |pre-trained |large language |quantized )*model|model loading|open.weight'),
 ('LLM training',r'pre.?train|training.*(?:language model|llm)|(?:language model|llm).*training'),
 ('Fine-tuning',r'fine.?tun|\blora\b|\bqlora\b|supervised fine'),
 ('Local inference',r'ollama|llama.cpp|local inference|run.*locally'),
 ('Quantization',r'quantiz|quantis|bitsandbytes|\bgguf\b'),
 ('Deployment',r'deploy|serving|vllm|inference engine'),
 ('RAG & retrieval',r'\brag\b|retriev|information retrieval'),
 ('Language models',r'language model|\bllms?\b|\bgpt\b|\bbert\b|\bllama\b'),
 ('Transformers',r'transformer|attention mechanism'),
 ('AI agents',r'\bagents?\b|tool.use'),
 ('Reasoning',r'reasoning|chain.of.thought'),
 ('Alignment & safety',r'alignment|\brlhf\b|\bdpo\b|safety|jailbreak'),
 ('Evaluation',r'evaluat|benchmark|assessment'),
 ('Computer vision',r'image|visual|vision|segmentation'),
 ('Diffusion models',r'diffusion|score.based generat'),
 ('Multimodal learning',r'multimodal|multi.modal|vision.language'),
 ('Reinforcement learning',r'reinforcement learning|policy gradient|bandit'),
 ('Robotics & control',r'robot|embodied|control polic'),
 ('Training & optimization',r'optimiz|gradient|training'),
 ('Distributed learning',r'distributed|federated|parallel training'),
 ('Representation learning',r'embedding|representation learning|contrastive'),
 ('Learning theory',r'generalization|learning theory|sample complexity'),
 ('Probability & statistics',r'bayesian|gaussian|probab|uncertainty|statistic'),
 ('Causal inference',r'causal|causality'),
 ('Graph learning',r'graph neural|graph learning|knowledge graph'),
 ('Audio & speech',r'speech|audio|voice'),
 ('Time series',r'time.series|forecast'),
 ('Natural language processing',r'natural language|translation|summariz|tokeniz'),
 ('Neural networks',r'neural|deep learning|backpropagation'),
]

def classify(value):
    topics=[name for name,pattern in TOPICS if re.search(pattern,value,re.I)]
    if any(t in topics for t in ['Language models','Natural language processing','RAG & retrieval','Loading open models','LLM training']):
        category='llms'
    elif any(t in topics for t in ['Deployment','Local inference','Distributed learning','Quantization']):
        category='systems'
    elif any(t in topics for t in ['Computer vision','Neural networks','Diffusion models','Robotics & control','Multimodal learning']):
        category='deep-learning'
    elif any(t in topics for t in ['Learning theory','Probability & statistics','Causal inference']):
        category='foundations'
    else:
        category='machine-learning'
    return category,(topics or ['Machine learning'])[:8]

def write_json(path,data):
    tmp=path.with_suffix(path.suffix+'.tmp')
    tmp.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    tmp.replace(path)
