# Worldwide English resources and practical LLM learning

Collected on 15 October 2026. The catalogue now contains **50,348 resources**.
The previous 15,277 entries are retained. This expansion adds:

- **34,723 research articles**, using official Proceedings of Machine Learning
  Research metadata from 256 conference/workshop volumes.
- **348 LLM learning resources**: 267 guides, 31 articles, 11 course lessons,
  3 books and 36 videos. All 106 videos in the complete catalogue have local,
  source-provided thumbnails.

Most resources in the complete collection are advanced research articles. Use
the format and difficulty filters to find teaching material. The six LLM skill
shortcuts cover loading open models, training, fine-tuning, running locally,
quantization and deployment. Teaching resources appear before bulk research
imports in the recommended order.

## International sources and English checks

[PMLR](https://proceedings.mlr.press/) publishes structured bibliographic metadata
linked from each volume's own page. Titles, authors, publication dates, abstract
text and PDF URLs are read directly from the publisher's `citeproc.yaml` files.
We omit front matter, incomplete records, future dates, existing canonical URLs,
and normalized titles already in the catalogue. No paper identifiers or PDF URLs
are invented. Abstracts are used for classification but are not republished here.

For each new research record, the source page declares English and deterministic
language detection identifies the title and abstract as English with confidence
of at least 0.95. This verifies the language of published metadata; individual
PDFs were not downloaded and language-audited. The source link and metadata URL
remain available for inspection. Metadata confirms identity and publication,
not quality, reproducibility, or current link availability.

Geographic coverage refers to **conference venue locations**, not author
nationalities or affiliations. The source heading is retained in every research
record. New additions include Africa (635), Asia (8,218), Europe (7,216),
North America (10,533), South America (229), Oceania (664), Turkey across
Europe/Asia (113), and online or unspecified venues (7,115). There are 30
named countries/territories after normalizing country aliases.

Examples include [AI for African Languages in Uganda](https://proceedings.mlr.press/v314/),
[AISTATS in Morocco](https://proceedings.mlr.press/v300/),
[UAI in Brazil](https://proceedings.mlr.press/v286/),
[ACML in Vietnam](https://proceedings.mlr.press/v260/),
[ICML in Australia](https://proceedings.mlr.press/v70/),
[ICML in Austria](https://proceedings.mlr.press/v235/), and
[ICML in Canada](https://proceedings.mlr.press/v267/).

## Practical LLM sources

Official English documentation tables of contents supply Hugging Face
Transformers, PEFT, TRL and Accelerate pages. The
[Hugging Face blog index](https://github.com/huggingface/blog/blob/main/_blog.yml)
and [Ollama documentation](https://docs.ollama.com/) supply additional articles
and guides. Titles come from each page's content heading. Included pages were
successfully fetched and their prose passed English-language detection. Failed,
rate-limited, duplicate and non-English candidates are omitted; the import audit
records their disposition. The collector supports `--cached-only` to reparse
previous successful responses without making further network requests.

Books added:

- [The Smol Training Playbook](https://huggingfacetb-smol-training-playbook.hf.space/)
- [The Little Book of Maths for LLMs](https://little-book-of.github.io/maths-for-llms/books/en-US/book.html)
- [Foundations of Large Language Models](https://arxiv.org/abs/2501.09223)

Video links are discovered in original English course/guide pages, including
Hugging Face and Andrej Karpathy's teaching material. YouTube oEmbed supplies the
title, creator and thumbnail. Titles are checked for English; audio has not been
individually reviewed. New thumbnails are fetched successfully, decoded, checked
for usable dimensions, and saved locally. Thumbnail ownership remains with the
creators. `video-covers.json` records each original image URL.

Levels are editorial estimates. Research is Advanced; documentation levels
reflect prerequisites. Topic labels are automated browsing aids and can be
corrected through the repository's issue tracker.

## Reproduce and inspect

Install Python dependencies with:

```sh
python -m pip install -r scripts/requirements-resources.txt
npm run catalogue:llm
npm run catalogue:world
npm run catalogue:build
npm test
```

Sources are cached outside the repository in `../.work/resource-source-cache`.
The world collector checkpoints progress and never replaces published output
before its count and geographic checks pass. Refreshing source imports can
change counts as providers add, move or remove material.

Inspect `world-expansion.json`, `world-expansion-audit.json`, `llm-learning.json`
and `llm-learning-audit.json` for per-resource provenance, language evidence,
source hashes, fetch dates and failures. `manifest.json` reports the final merged
counts. `library.json.gz` contains exactly the same data as `library.json`,
reducing the initial catalogue transfer from about 55 MB to 5.8 MB; browsers
without decompression support use the JSON fallback. Only 24 cards render at once.
