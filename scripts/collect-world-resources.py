"""Collect additional English AI research from worldwide official proceedings.

python -m pip install -r scripts/requirements-resources.txt
python scripts/collect-world-resources.py --target 34723
Source caches live outside the repository in ../.work/resource-source-cache.
"""
import argparse
import collections
import concurrent.futures
import datetime as dt
import hashlib
import importlib.util
import json
import re
import sys
import urllib.parse
import yaml
from bs4 import BeautifulSoup
from pathlib import Path

sys.dont_write_bytecode=True
spec=importlib.util.spec_from_file_location('imports',Path(__file__).with_name('resource-import-utils.py'))
u=importlib.util.module_from_spec(spec);spec.loader.exec_module(u)
OUT=u.ROOT/'learn/catalogue'
REGIONS={
 'Uganda':'Africa','Morocco':'Africa','Kenya':'Africa','South Africa':'Africa','Tunisia':'Africa',
 'Brazil':'South America','Chile':'South America','Argentina':'South America','Colombia':'South America',
 'Australia':'Oceania','New Zealand':'Oceania',
 'Vietnam':'Asia','Viet Nam':'Asia','India':'Asia','Japan':'Asia','China':'Asia','South Korea':'Asia','Korea':'Asia','Singapore':'Asia','Taiwan':'Asia','Thailand':'Asia',
 'Austria':'Europe','Spain':'Europe','France':'Europe','Germany':'Europe','Italy':'Europe','United Kingdom':'Europe','UK':'Europe','Greece':'Europe','Netherlands':'Europe','Switzerland':'Europe','Belgium':'Europe','Finland':'Europe','Sweden':'Europe','Denmark':'Europe','Norway':'Europe','Portugal':'Europe','Iceland':'Europe','Czech Republic':'Europe',
 'Turkey':'Europe / Asia','Türkiye':'Europe / Asia','USA':'North America','United States':'North America','Canada':'North America','Mexico':'North America','Puerto Rico':'North America','Panama':'North America','Costa Rica':'North America',
}

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--target',type=int,default=34723);parser.add_argument('--cached-only',action='store_true');args=parser.parse_args()
    previous=OUT/'world-expansion.json'
    previous_urls={u.canonical(x['url']) for x in json.loads(previous.read_text(encoding='utf-8'))['items']} if previous.exists() else set()
    teaching=OUT/'llm-learning.json'
    teaching_items=json.loads(teaching.read_text(encoding='utf-8'))['items'] if teaching.exists() else []
    teaching_urls={u.canonical(x['url']) for x in teaching_items}
    excluded_urls=previous_urls|teaching_urls
    baseline=[x for x in json.loads((OUT/'library.json').read_text(encoding='utf-8'))['items'] if u.canonical(x['url']) not in excluded_urls]
    urls={u.canonical(x['url']) for x in baseline};titles={u.title_key(x['title']) for x in baseline}
    # Also prevent overlap with a separately collected teaching-material expansion.
    for item in teaching_items:
        urls.add(u.canonical(item['url']));titles.add(u.title_key(item['title']))
    raw,root_evidence=u.get('https://proceedings.mlr.press/')
    root=BeautifulSoup(raw,'html.parser')
    volumes=sorted({int(m.group(1)) for a in root.select('a[href]') if (m:=re.search(r'(?:^|/)v(\d+)/?$',a['href'])) and int(m.group(1))<=314},reverse=True)
    # Start with all six inhabited continents, then current international venues.
    priority=[314,300,286,260,189,222,101,70,235,202,267,306,238,247,217]
    volumes=list(dict.fromkeys(priority+volumes))
    audit=[root_evidence];items=[];rejected=collections.Counter()
    checkpoint=u.CACHE/'world-checkpoint.json'
    baseline_hash=hashlib.sha256('\n'.join(sorted(x['id'] for x in baseline)).encode()).hexdigest()
    if checkpoint.exists():
        saved=json.loads(checkpoint.read_text(encoding='utf-8'))
        if saved.get('baselineHash')==baseline_hash:
            for item in saved['items']:
                if u.canonical(item['url']) not in urls and u.title_key(item['title']) not in titles:
                    items.append(item);urls.add(u.canonical(item['url']));titles.add(u.title_key(item['title']))
            audit=saved['audit'];rejected.update(saved['rejected'])
            completed={x['volume'] for x in audit if 'volume' in x}
            volumes=[v for v in volumes if v not in completed]
            print(f'Resumed {len(items)} verified records across {len(completed)} volumes',flush=True)
    if len(items)>=args.target:
        items=items[:args.target]
        volumes=[]
    def volume_data(number):
        source=f'https://proceedings.mlr.press/v{number}/'
        try:
            raw,index_ev=u.get(source)
            soup=BeautifulSoup(raw,'html.parser')
            heading=u.clean(soup.h2.get_text(' ',strip=True))
            bib=next((urllib.parse.urljoin(source,a['href']) for a in soup.select('a[href]') if a['href'].endswith('/citeproc.yaml')),None)
            if not bib:
                return dict(number=number,error='No source-published structured metadata link',url=source)
            raw,metadata_ev=u.get(bib)
            data=yaml.load(raw,Loader=yaml.CSafeLoader)
            return dict(number=number,source=source,bib=bib,heading=heading,data=data,evidence=[index_ev,metadata_ev],pageLanguage=soup.html.get('lang',''))
        except Exception as error:
            return dict(number=number,url=source,error=str(error))
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for start in range(0,len(volumes),4):
            for volume in pool.map(volume_data,volumes[start:start+4]):
                if 'error' in volume:
                    audit.append(volume);print(f"v{volume['number']}: {volume['error']}",flush=True);continue
                heading=volume['heading']
                country=next((c for c in sorted(REGIONS,key=len,reverse=True) if re.search(r'\b'+re.escape(c)+r'\b',heading,re.I)),'Unspecified / online')
                region=REGIONS.get(country,'Unspecified / online')
                added=0
                for record in volume['data']:
                    title=u.clean(record.get('title'));abstract=u.clean(record.get('abstract'));url=record.get('URL','');pdf=record.get('PDF','')
                    if re.search(r'\b(preface|foreword|front matter|organizing committee|editorial)\b',title,re.I):rejected['frontMatter']+=1;continue
                    if not url or not pdf or not record.get('author') or len(abstract)<100:rejected['incompleteMetadata']+=1;continue
                    if u.canonical(url) in urls or u.title_key(title) in titles:rejected['duplicate']+=1;continue
                    date=str(record.get('published',''))[:10]
                    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}',date) or date>dt.date.today().isoformat():rejected['invalidOrFutureDate']+=1;continue
                    lang=u.english(title+' '+abstract)
                    if not lang or volume['pageLanguage']!='en':rejected['unconfirmedEnglish']+=1;continue
                    category,topics=u.classify(title+' '+abstract)
                    authors=', '.join(u.clean(str(a.get('given',''))+' '+str(a.get('family',''))) for a in record['author'])
                    item=dict(title=title,url=url,pdfUrl=pdf,authors=authors,date=date,provider='PMLR',type='Paper',category=category,level='Advanced',topics=topics,access='Open access',language='en',languageEvidence=lang,sourceUrl=volume['source'],metadataUrl=volume['bib'],metadataCheckedAt=dt.date.today().isoformat(),verification='Official publisher metadata; English abstract checked; individual destinations source-indexed',venue=record.get('container-title',''),venueLocation=heading,region=region,country=country,description='Research on '+', '.join(t.lower() for t in topics[:3])+'. Read the original article for its methods, evidence, and limitations.')
                    items.append(item);urls.add(u.canonical(url));titles.add(u.title_key(title));added+=1
                    if len(items)>=args.target:break
                audit.append(dict(volume=volume['number'],heading=heading,country=country,region=region,added=added,records=len(volume['data']),sources=volume['evidence']))
                print(f"v{volume['number']} {country}: +{added}; {len(items)}/{args.target}",flush=True)
                # A resumable, inspectable checkpoint; never replaces published data early.
                u.write_json(u.CACHE/'world-progress.json',dict(total=len(items),target=args.target,lastVolume=volume['number']))
                u.write_json(checkpoint,dict(baselineHash=baseline_hash,items=items,audit=audit,rejected=dict(rejected)))
                if len(items)>=args.target:break
            if len(items)>=args.target:break
    if len(items)<args.target:raise RuntimeError(f'Only {len(items)} eligible resources; previous output preserved')
    aliases={'USA':'United States','UK':'United Kingdom','Korea':'South Korea','Viet Nam':'Vietnam','Türkiye':'Turkey'}
    for item in items:item['country']=aliases.get(item['country'],item['country'])
    for entry in audit:
        if 'country' in entry:entry['country']=aliases.get(entry['country'],entry['country'])
    regions=dict(collections.Counter(x['region'] for x in items))
    if not all(regions.get(r,0)>0 for r in ['Africa','Asia','Europe','North America','South America','Oceania']):raise RuntimeError(f'Incomplete geographic coverage: {regions}')
    payload=dict(collectedAt=dt.date.today().isoformat(),baselineTotal=len(baseline),baselineIdsSha256=hashlib.sha256('\n'.join(sorted(x['id'] for x in baseline)).encode()).hexdigest(),added=len(items),byRegion=regions,byCountry=dict(collections.Counter(x['country'] for x in items)),rejected=dict(rejected),items=items)
    u.write_json(OUT/'world-expansion.json',payload)
    u.write_json(OUT/'world-expansion-audit.json',dict(sources=audit,rejected=dict(rejected),languageMethod='English-language publisher pages plus title/abstract language detection >= 0.95; full PDFs not individually language-audited',geography='Conference venue location, not author nationality'))
    print(json.dumps({k:v for k,v in payload.items() if k!='items'},indent=2),flush=True)

if __name__=='__main__':main()
