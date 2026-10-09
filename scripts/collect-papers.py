"""Collect real open-paper metadata from the official Hugging Face Papers API.

Usage: python scripts/collect-papers.py --target 2500
No credentials or dependencies are required. Existing entries are replaced only
after metadata has been collected and validated. Paper IDs are never invented.
"""

import argparse
import collections
import datetime as dt
import json
import pathlib
import re
import time
import urllib.error
import urllib.parse
import urllib.request


ROOT = pathlib.Path(__file__).resolve().parents[1]
API = "https://huggingface.co/api/"
USER_AGENT = "ShivjiLearningGarden/1.0 (open educational paper metadata catalogue)"
# These established IDs are looked up in the API, not converted into records
# unless a valid title, author list and matching identifier are actually returned.
SEMINAL = [
    "1706.03762", "1810.04805", "2005.14165", "2005.11401", "2106.09685",
    "1406.2661", "1312.6114", "1506.02142", "1409.0473", "1301.3781",
    "1406.1078", "1412.6980", "1502.03167", "1512.03385", "1409.1556",
    "1505.04597", "1605.08803", "2006.11239", "2010.02502", "2112.10752",
    "2103.00020", "1910.10683", "2201.11903", "2203.02155", "2203.15556",
    "2303.08774", "2302.13971", "2307.09288", "2210.03629", "2305.18290",
    "2102.04306", "2012.12877", "1802.05365", "1905.11946", "2004.04906",
    "1703.10593", "1807.03748", "1606.04838", "1603.02754", "1812.05905",
]

TOPIC_RULES = [
    ("RAG & retrieval", r"retrieval|retriev|\brag\b|dense passage|search engine"),
    ("AI agents", r"\bagent\b|\bagents\b|tool.use|tool learning"),
    ("Language models", r"language model|\bllms?\b|\bgpt\b|\bbert\b|\bllama\b"),
    ("Transformers", r"transformer|self.attention|attention mechanism"),
    ("Reasoning", r"reasoning|chain.of.thought|mathematical problem"),
    ("Alignment & safety", r"alignment|\brlhf\b|harmless|safety|jailbreak|red.team"),
    ("Evaluation", r"benchmark|evaluat|leaderboard|assessment"),
    ("Computer vision", r"computer vision|image|visual|object detection|segmentation"),
    ("Diffusion models", r"diffusion|score.based generat|denoising"),
    ("Generative modeling", r"generative|\bgan\b|variational autoencoder"),
    ("Multimodal learning", r"multimodal|multi.modal|vision.language|cross.modal"),
    ("Reinforcement learning", r"reinforcement learning|policy gradient|q.learning"),
    ("Robotics & control", r"robot|robotic|embodied|autonomous driving|control polic"),
    ("Efficient inference", r"inference|quantization|kv.cache|speculative decod|model compression"),
    ("Training & optimization", r"optimiz|gradient|training|fine.tun|lora|low.rank adap"),
    ("Distributed learning", r"distributed|federated|parallel training|decentralized"),
    ("Representation learning", r"embedding|representation learning|contrastive|self.supervised"),
    ("Learning theory", r"generalization bound|learning theory|sample complexity|pac.bayes|statistical learning"),
    ("Probability & statistics", r"bayesian|gaussian process|probab|uncertainty|causal|statistic"),
    ("Graph learning", r"graph neural|graph learning|knowledge graph|graph convolution"),
    ("Audio & speech", r"speech|audio|music|voice"),
    ("Time series", r"time.series|forecast|temporal predict"),
    ("Natural language processing", r"natural language|translation|summarization|tokeniz"),
    ("Neural networks", r"neural network|deep learning|convolution|backpropagation"),
]


def clean(text):
    return re.sub(r"\s+", " ", str(text or "")).replace("\u2014", "; ").strip()


class Fetcher:
    def __init__(self, delay):
        self.delay = delay
        self.last_request = 0
        self.requests = []

    def get(self, path, params=None):
        url = API + path + ("?" + urllib.parse.urlencode(params) if params else "")
        for attempt in range(4):
            pause = self.delay - (time.monotonic() - self.last_request)
            if pause > 0:
                time.sleep(pause)
            request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
            self.last_request = time.monotonic()
            try:
                with urllib.request.urlopen(request, timeout=45) as response:
                    data = json.load(response)
                self.requests.append({"url": url, "status": 200, "records": len(data) if isinstance(data, list) else 1})
                return data, url
            except urllib.error.HTTPError as error:
                if error.code == 404:
                    self.requests.append({"url": url, "status": 404, "records": 0})
                    return None, url
                if error.code not in (429, 500, 502, 503, 504) or attempt == 3:
                    raise
                retry_after = error.headers.get("Retry-After", "")
                delay = int(retry_after) if retry_after.isdigit() else min(45, 5 * 2**attempt)
                print(f"HTTP {error.code}, backing off {delay}s", flush=True)
                time.sleep(delay)
            except (urllib.error.URLError, TimeoutError):
                if attempt == 3:
                    raise
                time.sleep(5 * (attempt + 1))
        raise RuntimeError("Unreachable fetch state")


def normalize(paper, source_url, imported):
    if not isinstance(paper, dict):
        return None
    identifier = re.sub(r"v\d+$", "", str(paper.get("id", "")))
    # Only actual modern arXiv IDs supplied by the API are allowed.
    if not re.fullmatch(r"\d{4}\.\d{4,5}", identifier):
        return None
    title = clean(paper.get("title"))
    names = [clean(a.get("name")) for a in paper.get("authors", []) if isinstance(a, dict) and a.get("name")]
    date = str(paper.get("publishedAt", ""))[:10]
    if not title or not names or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date):
        return None
    # Reject impossible or future dates relative to the explicit collection date.
    if date > imported:
        return None
    text = (title + " " + clean(paper.get("summary"))).lower()
    topics = [name for name, pattern in TOPIC_RULES if re.search(pattern, text)]
    if not topics:
        return None  # Do not inflate the learning catalogue with unrelated work.
    if any(t in topics for t in ["Language models", "Natural language processing", "RAG & retrieval", "Reasoning"]):
        category = "llms"
    elif any(t in topics for t in ["AI agents", "Efficient inference", "Distributed learning", "Alignment & safety"]):
        category = "systems"
    elif any(t in topics for t in ["Computer vision", "Diffusion models", "Generative modeling", "Neural networks", "Transformers", "Multimodal learning", "Audio & speech"]):
        category = "deep-learning"
    elif any(t in topics for t in ["Learning theory", "Probability & statistics"]):
        category = "foundations"
    else:
        category = "machine-learning"
    # Use original catalogue prose based on topic labels, not copied abstracts.
    # The full abstract remains available at its original arXiv/HF source.
    topic_text = ", ".join(t.lower() for t in topics[:3])
    description = f"Research connecting {topic_text}. Explore the authors' methods, evidence, and limitations in the original abstract and open paper."
    return {
        "id": "arxiv-" + identifier,
        "arxivId": identifier,
        "title": title,
        "url": "https://arxiv.org/abs/" + identifier,
        "pdfUrl": "https://arxiv.org/pdf/" + identifier,
        "provider": "arXiv",
        "type": "Paper",
        "category": category,
        "topics": topics[:6],
        "description": description,
        "sourceUrl": source_url,
        "metadataUrl": "https://huggingface.co/api/papers/" + identifier,
        "access": "Open access",
        "level": "Advanced",
        "date": date,
        "authors": ", ".join(names[:8]) + (f" and {len(names) - 8} more" if len(names) > 8 else ""),
        "authorCount": len(names),
        "metadataCheckedAt": imported,
        "verification": "Official API metadata; destination links not individually checked",
    }


def month_range(start, end):
    year, month = map(int, start.split("-"))
    while f"{year:04d}-{month:02d}" <= end:
        yield f"{year:04d}-{month:02d}"
        month += 1
        if month == 13:
            year, month = year + 1, 1


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--target", type=int, default=2500)
    parser.add_argument("--start-month", default="2023-05")
    parser.add_argument("--end-month", default="2026-10")
    parser.add_argument("--as-of", default="2026-10-09")
    parser.add_argument("--delay", type=float, default=1.1)
    args = parser.parse_args()
    if args.target < 1 or args.target > 10000:
        parser.error("target must be between 1 and 10000")
    fetcher = Fetcher(max(1.0, args.delay))
    records = {}
    for identifier in SEMINAL:
        paper, source = fetcher.get("papers/" + identifier)
        item = normalize(paper, source, args.as_of)
        if item:
            item["topics"] = list(dict.fromkeys(["Foundational reading", *item["topics"]]))[:6]
            records[item["id"]] = item
    print(f"Seminal metadata records: {len(records)}", flush=True)
    months = list(month_range(args.start_month, args.end_month))
    # Spread records over the date range so one recent month cannot consume the
    # catalogue. Fetch additional monthly pages only if needed to reach target.
    page_size = min(100, max(25, (args.target - len(records)) // max(1, len(months)) + 8))
    for page in range(5):
        for month in months:
            payload, source = fetcher.get("daily_papers", {"month": month, "p": page, "limit": page_size, "sort": "publishedAt"})
            added = 0
            for entry in payload or []:
                item = normalize(entry.get("paper", entry), source, args.as_of)
                if item and item["id"] not in records:
                    records[item["id"]] = item
                    added += 1
            print(f"{month} page {page}: +{added}, total {len(records)}", flush=True)
        if len(records) >= args.target:
            break
    items = list(records.values())
    # Keep the requested count, preserving the foundational seed papers and
    # proportionally sampling the rest across the complete publication span.
    if len(items) > args.target:
        seeds = [item for item in items if "Foundational reading" in item["topics"]]
        others = sorted((item for item in items if "Foundational reading" not in item["topics"]), key=lambda item: (item["date"], item["id"]))
        count = max(0, args.target - len(seeds))
        chosen = [others[min(len(others) - 1, int(i * len(others) / count))] for i in range(count)] if count else []
        items = seeds[:args.target] + chosen
    items.sort(key=lambda item: (item["date"], item["id"]), reverse=True)
    assert len({item["id"] for item in items}) == len(items)
    assert all(item["url"].endswith(item["arxivId"]) and item["pdfUrl"].endswith(item["arxivId"]) for item in items)
    directory = ROOT / "learn" / "catalogue"
    directory.mkdir(parents=True, exist_ok=True)
    destination = directory / "papers.json"
    destination.write_text(json.dumps(items, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    audit = {
        "collectedAt": args.as_of,
        "provider": "Official Hugging Face Papers API; canonical arXiv destinations",
        "method": "Seminal ID lookups plus monthly listings, title/abstract topic classification and version-normalized ID deduplication",
        "individualDestinationLinksChecked": False,
        "count": len(items),
        "categoryCounts": dict(collections.Counter(item["category"] for item in items)),
        "earliestPublication": min(item["date"] for item in items),
        "latestPublication": max(item["date"] for item in items),
        "requests": fetcher.requests,
    }
    (directory / "papers-audit.json").write_text(json.dumps(audit, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({key: value for key, value in audit.items() if key != "requests"}, indent=2), flush=True)
    print(f"Saved {destination} ({destination.stat().st_size:,} bytes)", flush=True)


if __name__ == "__main__":
    main()
