"""Import English LLM teaching material and source-supplied video thumbnails.

Uses official documentation tables of contents, provider blog indexes and course
pages. Install requirements-resources.txt plus Pillow. Only successful page fetches
with English prose are included. Video titles come from YouTube oEmbed.
"""
import collections
import concurrent.futures
import datetime as dt
import hashlib
import importlib.util
import io
import json
import re
import sys
import urllib.parse
import xml.etree.ElementTree as ET
from pathlib import Path
import yaml
from bs4 import BeautifulSoup
from PIL import Image
from langdetect import detect_langs

sys.dont_write_bytecode=True
spec=importlib.util.spec_from_file_location('imports',Path(__file__).with_name('resource-import-utils.py'))
u=importlib.util.module_from_spec(spec);spec.loader.exec_module(u)
OUT=u.ROOT/'learn/catalogue'

def main():
    previous=OUT/'llm-learning.json'
    old_urls={u.canonical(x['url']) for x in json.loads(previous.read_text(encoding='utf-8'))['items']} if previous.exists() else set()
    baseline=[x for x in json.loads((OUT/'library.json').read_text(encoding='utf-8'))['items'] if u.canonical(x['url']) not in old_urls]
    seen={u.canonical(x['url']) for x in baseline};titles={u.title_key(x['title']) for x in baseline}
    candidates={};audit=[];items=[];videos={}
    def add(url,provider,type='Guide',level='Intermediate',source=None,**kwargs):
        if u.canonical(url) not in seen:
            candidates.setdefault(u.canonical(url),dict(url=url,provider=provider,type=type,level=level,sourceUrl=source or url,**kwargs))
    def walk(value):
        if isinstance(value,list):
            for x in value:yield from walk(x)
        elif isinstance(value,dict):
            if value.get('local'):yield value
            for k,v in value.items():
                if isinstance(v,(list,dict)):yield from walk(v)
    for project in ['transformers','peft','trl','accelerate','bitsandbytes']:
        for folder in ['en/','']:
            source=f'https://raw.githubusercontent.com/huggingface/{project}/main/docs/source/{folder}_toctree.yml'
            try:
                raw,ev=u.get(source);toc=yaml.safe_load(raw);audit.append(ev);break
            except Exception as error:
                if not folder:toc=[];audit.append(dict(url=source,error=str(error)))
        count=0
        for leaf in walk(toc):
            local=leaf['local']
            if any(part in local for part in ['model_doc/','main_classes/','package_reference/','internal/','contribut','testing','changelog']):continue
            if local in ['index','installation','README']:continue
            url=f'https://huggingface.co/docs/{project}/main/en/{local}'
            level='Beginner' if re.search('quick|tutorial|pipeline|load',local) else 'Advanced' if re.search('distributed|fsdp|deepspeed|tensor_parallel',local) else 'Intermediate'
            add(url,'Hugging Face',level=level,source=source)
            count+=1
            if count>=170:break
    blog_source='https://raw.githubusercontent.com/huggingface/blog/main/_blog.yml'
    raw,ev=u.get(blog_source);audit.append(ev)
    for post in reversed(yaml.safe_load(raw)):
        local=str(post.get('local',''));tags=post.get('tags',[])
        if '/' in local or not local:continue
        if 'nlp' in tags or re.search(r'llm|llama|fine.?tun|inference|gpt|quant|rag|token|agent|deepspeed|trl|peft|smol|training',local,re.I):
            add('https://huggingface.co/blog/'+local,'Hugging Face','Article',source=blog_source)
    source='https://docs.ollama.com/sitemap.xml'
    raw,ev=u.get(source);audit.append(ev)
    for location in ET.fromstring(raw).iter():
        if not location.tag.endswith('loc'):continue
        url=location.text
        if '/api-reference/' in url:continue
        add(url,'Ollama','Guide','Beginner',source=source)
    # Actual online books and practical books supplied by their authors.
    for title,url,provider,level in [
        ('The Ultra-Scale Playbook: Training LLMs on GPU Clusters','https://nanotron-ultrascale-playbook.hf.space/','Hugging Face','Advanced'),
        ('The Smol Training Playbook: The Secrets to Building World-Class LLMs','https://huggingfacetb-smol-training-playbook.hf.space/','Hugging Face','Advanced'),
        ('The Little Book of Maths for LLMs','https://little-book-of.github.io/maths-for-llms/books/en-US/book.html','Little Book of Maths for LLMs authors','Beginner'),
        ('Foundations of Large Language Models','https://arxiv.org/abs/2501.09223','Tong Xiao and Jingbo Zhu','Advanced'),
    ]:
        if u.title_key(title) not in titles:add(url,provider,'Book',level,preferredTitle=title)
    for url,provider,level in [
        ('https://karpathy.ai/zero-to-hero.html','Andrej Karpathy','Intermediate'),
        ('https://stanford-cs336.github.io/spring2025/','Stanford University','Advanced'),
        ('https://huggingface.co/learn/smol-course/en/unit0/1','Hugging Face','Intermediate'),
        ('https://huggingface.co/learn/llm-course/en/chapter1/1','Hugging Face','Beginner'),
        ('https://github.com/rasbt/LLMs-from-scratch','Sebastian Raschka','Intermediate'),
        ('https://github.com/mlabonne/llm-course','Maxime Labonne','Intermediate'),
        ('https://github.com/ggml-org/llama.cpp/tree/master/docs','llama.cpp contributors','Intermediate'),
        ('https://docs.vllm.ai/en/latest/getting_started/quickstart/','vLLM','Intermediate'),
        ('https://docs.unsloth.ai/get-started/fine-tuning-for-beginners','Unsloth','Beginner'),
    ]:add(url,provider,'Guide',level)
    # Discover English LLM course lessons from the official rendered course pages.
    for source in ['https://huggingface.co/learn/smol-course/en/unit0/1','https://huggingface.co/learn/llm-course/en/chapter1/1']:
        try:
            raw,ev=u.get(source);audit.append(ev)
            soup=BeautifulSoup(raw,'html.parser')
            for a in soup.select('a[href]'):
                url=urllib.parse.urljoin(source,a['href'])
                if re.match(r'https://huggingface.co/learn/(smol|llm)-course/(en/)?(chapter|unit)\d+/',url):
                    add(url.split('?')[0].split('#')[0],'Hugging Face','Course lesson','Intermediate',source=source)
        except Exception as error:audit.append(dict(url=source,error=str(error)))
    print(f'Checking {len(candidates)} LLM learning pages',flush=True)

    def check(item):
        try:
            raw,ev=u.get(item['url']);soup=BeautifulSoup(raw,'html.parser')
            main=soup.select_one('.prose-doc') or soup.find('article') or soup.find('main') or soup
            for tag in main.select('script,style,nav,footer,header,svg'):tag.decompose()
            prose=u.clean(main.get_text(' ',strip=True))
            lang=u.english(prose)
            if not lang:return None,dict(url=item['url'],reason='English prose not confirmed'),[]
            heading=main.find('h1') or soup.find('title')
            title=item.pop('preferredTitle',None) or u.clean(heading.get_text(' ',strip=True) if heading else '')
            if not title or re.search(r'^(404|page not found|access denied)',title,re.I):return None,dict(url=item['url'],reason='Missing resource title'),[]
            title=re.sub(r'^(GitHub - )','',title)
            if item['provider'] in ['Hugging Face','Ollama'] and item['type'] in ['Guide','Course lesson']:
                # Distinguish generic titles across different documentation sets.
                project=urllib.parse.urlsplit(item['url']).path.split('/')[2] if '/docs/' in item['url'] else item['provider']
                title=f'{title} ({project})'
            category,topics=u.classify(title+' '+prose[:12000])
            if item['provider']=='Ollama':topics=list(dict.fromkeys(['Local inference','Loading open models']+topics))[:8]
            if item['type']=='Book' and 'playbook' in item['url']:topics=list(dict.fromkeys(['LLM training','Distributed learning']+topics))[:8]
            item.update(title=title,url=ev['finalUrl'],category='llms',topics=topics,language='en',languageEvidence=lang,access='Free online reading' if item['type']=='Book' else 'Free learning material',metadataCheckedAt=dt.date.today().isoformat(),verification='HTTP-checked primary-source page; English prose detected',description='Practical reading on '+', '.join(t.lower() for t in topics[:4])+'. Follow the original source for instructions, prerequisites, and examples.')
            found=re.findall(r'(?:youtube(?:-nocookie)?\.com/(?:embed/|watch\?v=)|youtu\.be/)([A-Za-z0-9_-]{11})',raw.decode('utf-8','replace'))
            return item,ev,found
        except Exception as error:return None,dict(url=item['url'],error=str(error)),[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        for index,(item,ev,ids) in enumerate(pool.map(check,list(candidates.values())),1):
            audit.append(ev)
            if item:
                for video_id in ids:videos.setdefault(video_id,dict(sourceUrl=item['url'],level=item['level'],topics=item['topics']))
                if u.canonical(item['url']) not in seen and u.title_key(item['title']) not in titles:
                    items.append(item);seen.add(u.canonical(item['url']));titles.add(u.title_key(item['title']))
            if index%50==0:print(f'Checked {index}; accepted {len(items)}; discovered {len(videos)} videos',flush=True)
    covers_data=json.loads((OUT/'video-covers.json').read_text(encoding='utf-8'))
    covers={x['url']:x for x in covers_data['covers']}
    print(f'Checking {len(videos)} source-linked videos',flush=True)
    def video_check(pair):
        identifier,context=pair
        url='https://www.youtube.com/watch?v='+identifier
        try:
            if u.canonical(url) in seen:return None,None,None
            api='https://www.youtube.com/oembed?'+urllib.parse.urlencode(dict(url=url,format='json'))
            raw,ev=u.get(api);metadata=json.loads(raw);title=u.clean(metadata['title'])
            prediction=detect_langs(title)[0]
            if prediction.lang!='en' or prediction.prob<0.80:return None,None,dict(url=url,reason='Video title is not confidently English')
            image_url=metadata['thumbnail_url'];raw,image_ev=u.get(image_url)
            image=Image.open(io.BytesIO(raw));image.verify()
            image=Image.open(io.BytesIO(raw))
            if image.width<160 or image.height<90:raise ValueError('Thumbnail too small')
            ext={'JPEG':'jpg','PNG':'png','WEBP':'webp'}.get(image.format)
            if not ext:raise ValueError('Unsupported thumbnail')
            filename=hashlib.sha256(url.encode()).hexdigest()[:16]+'.'+ext
            (u.ROOT/'learn/covers'/filename).write_bytes(raw)
            cover=dict(url=url,title=title,checkedAt=dt.datetime.now(dt.timezone.utc).isoformat(),kind='source-thumbnail',cover='covers/'+filename,remoteImage=image_url,sourceTitle=title,width=image.width,height=image.height)
            category,topics=u.classify(title)
            item=dict(title=title,url=url,provider=metadata['author_name'],type='Video lectures',category='llms',level=context['level'],topics=list(dict.fromkeys(topics+context['topics']))[:8],sourceUrl=context['sourceUrl'],metadataUrl=api,language='en',languageEvidence=dict(method='English source lesson plus English video title; audio not individually reviewed',confidence=round(prediction.prob,6)),access='Free video',metadataCheckedAt=dt.date.today().isoformat(),verification='YouTube oEmbed metadata and image HTTP checked',description='Video linked by an English-language learning source. Watch the original lesson and follow its explanations and examples.')
            return item,cover,dict(metadata=ev,thumbnail=image_ev)
        except Exception as error:return None,None,dict(url=url,error=str(error))
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for item,cover,ev in pool.map(video_check,list(videos.items())[:160]):
            if ev:audit.append(ev)
            if item and u.canonical(item['url']) not in seen and u.title_key(item['title']) not in titles:
                items.append(item);seen.add(u.canonical(item['url']));titles.add(u.title_key(item['title']));covers[item['url']]=cover
    counts=dict(collections.Counter(x['type'] for x in items))
    if not all(counts.get(k,0)>0 for k in ['Book','Guide','Article','Video lectures']):raise RuntimeError(f'Missing requested learning formats: {counts}')
    u.write_json(OUT/'llm-learning.json',dict(collectedAt=dt.date.today().isoformat(),added=len(items),byType=counts,items=items))
    u.write_json(OUT/'llm-learning-audit.json',dict(sources=audit))
    u.write_json(OUT/'video-covers.json',dict(updatedAt=dt.datetime.now(dt.timezone.utc).isoformat(),covers=sorted(covers.values(),key=lambda x:x['url'])))
    print(json.dumps(dict(added=len(items),byType=counts,totalVideoCovers=len(covers)),indent=2),flush=True)

if __name__=='__main__':main()
