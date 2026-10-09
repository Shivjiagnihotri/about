# Open research-paper catalogue

The records in `papers.json` come from the official Hugging Face Papers API,
which supplies arXiv identifiers, titles, author metadata, publication dates,
and abstracts. The catalogue links each returned identifier to its canonical
arXiv abstract and PDF destinations. It does not generate or guess paper IDs.

Source documentation:

- [Hugging Face HfApi: list_daily_papers](https://huggingface.co/docs/huggingface_hub/en/package_reference/hf_api#huggingface_hub.HfApi.list_daily_papers)
- [Official Hub API documentation](https://huggingface.co/docs/hub/en/api)
- [Example monthly metadata endpoint](https://huggingface.co/api/daily_papers?month=2025-01&p=0&limit=100&sort=publishedAt)
- [Example individual paper metadata](https://huggingface.co/api/papers/1706.03762)
- [arXiv API documentation](https://info.arxiv.org/help/api/user-manual.html)

## Collection and scope

Run from the repository root:

```console
python scripts/collect-papers.py --target 3500 --as-of 2026-10-09
```

The script requests an explicit set of established foundational papers and
monthly research listings spanning May 2023 to October 2026. The current
month is bounded by the explicit collection date. Records are retained only
when the official response supplies an arXiv ID, title, authors, and valid
publication date. Title and abstract keywords select relevant machine
learning, deep learning, language, vision, statistics, and AI systems topics.
Categories are editorial heuristics, not author-assigned arXiv classifications.
Hugging Face community selection influences which papers appear in its daily
listings; this is a discovery catalogue, not a comprehensive scholarly index.

Requests are sequential, separated by at least one second. HTTP 429 and
temporary server errors trigger retries with backoff and `Retry-After` support.
No authentication, access-control workaround, or TLS verification bypass is
used. Direct arXiv retrieval had a local TLS certificate validation failure in
the collection environment, so the official Hugging Face metadata was used.

The abstract is used to identify topics but is not republished in this
catalogue. Descriptions are original short discovery text based on those
topic labels. The original abstract and complete paper are available at the
linked source. Long author lists are displayed using the first eight names
and the remaining count. Open access does not imply that every paper has
the same redistribution license. PDFs stay with their original host.

## Verification boundaries

Every catalogue entry was returned by a successful request to the official
metadata API. Versions are deduplicated by the base arXiv identifier. Canonical
abstract and PDF URLs are derived from that real identifier using arXiv's
standard URL format. They have **not all been individually requested or
confirmed to return HTTP 200**. A small number of papers may later be
withdrawn, moved, revised, or temporarily unavailable.

Each record preserves `sourceUrl`, `metadataUrl`, `metadataCheckedAt`, and an
explicit `verification` field. `papers-audit.json` records the collection
date, successful requests, observed counts, category distribution, and
publication-date range. This separates verified metadata provenance from
live destination-link checking and makes the import reproducible.
