# AI library expansion

The expansion adds 10,000 unique resources to the existing 5,277-record library.
Run `python scripts/expand-ai-library.py`, then `npm run catalogue:build` to refresh.
The collector excludes existing normalized URLs and titles; duplicate titles within
the expansion are also excluded. Publication metadata is preserved; abstracts are
used locally for topic classification and are not republished.

## Primary sources

- [ACL Anthology metadata documentation](https://aclanthology.org/info/development/)
  and [official XML repository](https://github.com/acl-org/acl-anthology/tree/master/data/xml):
  individual research articles from ACL, EMNLP, NAACL, Findings and COLING.
  Front matter, whole proceedings, entries without authors or PDFs, and future
  publications are excluded. Each collection contributes at most 1,800 articles.
  Titles, authors, dates and identifiers come from the source records. PDF and
  landing links follow the Anthology's identifier scheme. They are source-indexed,
  not individually HTTP-checked. Research articles are marked Advanced.
- [scikit-learn examples](https://scikit-learn.org/stable/auto_examples/index.html):
  practical tutorials from the official examples gallery. Each included page is
  fetched successfully and its HTML title is extracted. Beginner labels identify
  application, classification and introductory linear regression/clustering examples;
  other examples are Intermediate. These are editorial estimates of prerequisites.
- Author or publisher reading pages for books, including
  [Garnett](https://bayesoptbook.com/),
  [Hernán and Robins](https://miguelhernan.org/whatifbook), and
  [Facure](https://matheusfacure.github.io/python-causality-handbook/landing-page.html).
  Books already present under their title or URL are skipped. Only successfully
  fetched reading pages are included.

`ai-expansion.json` records every addition and its provenance.
`ai-expansion-audit.json` records fetched metadata URLs, source hashes, counts and
failures. `manifest.json` reports the final merged counts by format, category,
provider and difficulty. Metadata confirms identity, not educational quality;
topic labels are automated browsing aids. Existing records retain their levels.
