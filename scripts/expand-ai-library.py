"""Import 10,000 additional, traceable AI resources from primary sources.

Run from any directory: python scripts/expand-ai-library.py
No dependencies. Metadata is source-indexed; paper destinations are not individually checked.
Existing catalogue URLs and normalized titles are excluded. Outputs are atomic.
"""
import concurrent.futures
import datetime as dt
import hashlib
import importlib.util
import json
import pathlib
import re
import sys
import time
import urllib.error
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'learn/catalogue'
TODAY = dt.date.today().isoformat()
TARGET = 10000
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('papers', ROOT / 'scripts/collect-papers.py')
papers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(papers)

def fetch(url):
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'LearningGarden/2.0 (educational metadata index)'}), timeout=45) as response:
                return response.read()
        except urllib.error.HTTPError as error:
            if error.code == 404:
                return None
            if error.code not in (429, 500, 502, 503, 504) or attempt == 2:
                raise
            time.sleep(2 ** (attempt + 1))

def text(element):
    return re.sub(r'\s+', ' ', ''.join(element.itertext())).strip() if element is not None else ''

def title_key(title):
    return re.sub(r'[^\w]+', '', title.casefold())

def main():
    existing = json.loads((OUT / 'library.json').read_text(encoding='utf-8'))['items']
    # Exclude our own previous expansion to make a repeated collection reproducible.
    previous = OUT / 'ai-expansion.json'
    previous_urls = {x['url'].rstrip('/') for x in json.loads(previous.read_text(encoding='utf-8'))['items']} if previous.exists() else set()
    baseline = [x for x in existing if x['url'].rstrip('/') not in previous_urls]
    seen_urls = {x['url'].rstrip('/') for x in baseline}
    seen_titles = {title_key(x['title']) for x in baseline}
    items, audit = [], []

    def add(item):
        key, url = title_key(item['title']), item['url'].rstrip('/')
        if not key or key in seen_titles or url in seen_urls:
            return False
        seen_titles.add(key)
        seen_urls.add(url)
        item['metadataCheckedAt'] = TODAY
        items.append(item)
        return True

    # Author/publisher-hosted books: exact destinations are HTTP-checked.
    books = [
        ('Deep Learning: Foundations and Concepts', 'https://www.bishopbook.com/', 'Christopher Bishop and Hugh Bishop', 'Intermediate', 'deep-learning', ['Neural networks', 'Probability & statistics']),
        ('Bayesian Optimization', 'https://bayesoptbook.com/', 'Roman Garnett', 'Advanced', 'machine-learning', ['Bayesian optimization', 'Probability & statistics']),
        ('Introduction to Information Retrieval', 'https://nlp.stanford.edu/IR-book/html/htmledition/irbook.html', 'Christopher Manning, Prabhakar Raghavan and Hinrich Schütze', 'Intermediate', 'llms', ['RAG & retrieval', 'Natural language processing']),
        ('Neural Networks and Deep Learning', 'http://neuralnetworksanddeeplearning.com/', 'Michael Nielsen', 'Beginner', 'deep-learning', ['Neural networks', 'Backpropagation']),
        ('Reinforcement Learning: An Introduction', 'http://incompleteideas.net/book/the-book-2nd.html', 'Richard Sutton and Andrew Barto', 'Intermediate', 'machine-learning', ['Reinforcement learning']),
        ('Interpretable Machine Learning', 'https://christophm.github.io/interpretable-ml-book/', 'Christoph Molnar', 'Intermediate', 'machine-learning', ['Interpretability', 'Evaluation']),
        ('Causal Inference: What If', 'https://miguelhernan.org/whatifbook', 'Miguel Hernán and James Robins', 'Advanced', 'foundations', ['Causal inference', 'Probability & statistics']),
        ('Causal Inference for the Brave and True', 'https://matheusfacure.github.io/python-causality-handbook/landing-page.html', 'Matheus Facure', 'Intermediate', 'foundations', ['Causal inference', 'Python']),
    ]
    for title, url, authors, level, category, topics in books:
        if title_key(title) in seen_titles or url.rstrip('/') in seen_urls:
            continue
        try:
            body = fetch(url)
            if not body:
                continue
            add(dict(title=title, url=url, authors=authors, level=level, category=category, topics=topics, type='Book', provider=authors, access='Free online reading', sourceUrl=url, verification='HTTP checked author or publisher page'))
            audit.append(dict(url=url, status=200, kind='Book'))
        except Exception as error:
            audit.append(dict(url=url, error=str(error)))

    # Official scikit-learn examples are practical articles, separately levelled.
    sitemap_url = 'https://scikit-learn.org/stable/auto_examples/index.html'
    try:
        body = fetch(sitemap_url)
        links = [urllib.parse.urljoin(sitemap_url, href) for href in re.findall(r'href="([^"]+)"', body.decode('utf-8')) if '/plot_' in href and href.endswith('.html')]
        links = sorted(set(links) - seen_urls)[:120]
        def tutorial(url):
            try:
                page = fetch(url).decode('utf-8')
                match = re.search(r'<title>(.*?)</title>', page, re.S)
                if not match:
                    return None
                import html
                title = html.unescape(re.split(r' — | &#8212; | &mdash; ', match[1])[0]).strip()
                level = 'Beginner' if any(x in url for x in ['/applications/', '/classification/', '/linear_model/plot_ols', '/cluster/plot_kmeans']) else 'Intermediate'
                topics = ['Machine learning', url.split('/auto_examples/')[1].split('/')[0].replace('_', ' ').title()]
                return dict(title=title, url=url, provider='scikit-learn', type='Tutorial', level=level, category='machine-learning', topics=topics, access='Free tutorial', sourceUrl=sitemap_url, verification='HTTP checked official example page')
            except Exception as error:
                return dict(error=str(error), url=url)
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            for item in pool.map(tutorial, links):
                if item and 'error' not in item:
                    add(item)
                elif item:
                    audit.append(item)
        audit.append(dict(url=sitemap_url, examples=len(links)))
    except Exception as error:
        audit.append(dict(url=sitemap_url, error=str(error)))
    print(f'Added {len(items)} books and practical tutorials', flush=True)

    # ACL's authoritative XML contains titles, identifiers, authors and publication dates.
    # Use completed years, skip front matter, whole proceedings and entries without PDFs.
    for year in range(2025, 2019, -1):
        for venue in ['acl', 'emnlp', 'naacl', 'findings', 'eacl', 'coling']:
            if len(items) >= TARGET:
                break
            collection = f'{year}.{venue}'
            url = f'https://raw.githubusercontent.com/acl-org/acl-anthology/master/data/xml/{collection}.xml'
            raw = fetch(url)
            if raw is None:
                audit.append(dict(url=url, status=404))
                continue
            root = ET.fromstring(raw)
            added = 0
            for volume in root.findall('volume'):
                meta = volume.find('meta')
                published_year = text(meta.find('year'))
                month = text(meta.find('month'))
                month_numbers = {name: f'{i:02}' for i, name in enumerate(['January','February','March','April','May','June','July','August','September','October','November','December'], 1)}
                date = published_year + ('-' + month_numbers[month] if month in month_numbers else '')
                if not published_year.isdigit() or date > TODAY:
                    continue
                for paper in volume.findall('paper'):
                    title = text(paper.find('title'))
                    names = [' '.join(filter(None, [text(a.find('first')), text(a.find('last'))])) for a in paper.findall('author')]
                    if not title or not names or paper.find('pdf') is None:
                        continue
                    identifier = f"{collection}-{volume.attrib['id']}.{paper.attrib['id']}"
                    abstract = text(paper.find('abstract'))
                    topics = [name for name, pattern in papers.TOPIC_RULES if re.search(pattern, title + ' ' + abstract, re.I)]
                    topics = (topics or ['Natural language processing'])[:6]
                    category = 'systems' if 'Efficient inference' in topics or 'Distributed learning' in topics else 'deep-learning' if 'Computer vision' in topics or 'Multimodal learning' in topics else 'llms'
                    item = dict(title=title, url=f'https://aclanthology.org/{identifier}/', pdfUrl=f'https://aclanthology.org/{identifier}.pdf', authors=', '.join(names), date=date, provider='ACL Anthology', type='Paper', category=category, level='Advanced', topics=topics, access='Open access', sourceUrl=url, metadataUrl=url, verification='Official XML metadata; destination links not individually checked', description='Research on ' + ', '.join(t.lower() for t in topics[:3]) + '. Read the original article for methods, experiments, and limitations.')
                    added += add(item)
                    if len(items) >= TARGET or added >= 1800:
                        break
                if len(items) >= TARGET or added >= 1800:
                    break
            audit.append(dict(url=url, status=200, sha256=hashlib.sha256(raw).hexdigest(), added=added))
            print(f'{collection}: +{added}; total new {len(items)}', flush=True)
        if len(items) >= TARGET:
            break
    if len(items) < TARGET:
        raise RuntimeError(f'Only {len(items)} unique additions; existing output preserved')
    payload = dict(collectedAt=TODAY, baselineTotal=len(baseline), added=len(items), items=items)
    for name, data in [('ai-expansion.json', payload), ('ai-expansion-audit.json', dict(collectedAt=TODAY, sources=audit))]:
        temp = OUT / (name + '.tmp')
        temp.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
        temp.replace(OUT / name)
    print(json.dumps(dict(baseline=len(baseline), added=len(items), byType=dict(__import__('collections').Counter(x['type'] for x in items))), indent=2))

if __name__ == '__main__':
    main()
