# Open books, courses, and project learning

`collections.json` was produced by `scripts/collect-open-books.mjs` from actual fetched source lists and official MIT OpenCourseWare URLs. The first run retained 574 distinct reachable resources: 197 books, 309 courses, 15 guides, and 53 tutorials. Source discovery and destination verification are recorded in `collections-provenance.json`.

## Primary discovery sources

- EbookFoundation's free programming books, limited to mathematics, algorithms, artificial intelligence, computer vision, data science, information retrieval, machine learning, and related foundations.
- DAIR.AI's machine learning YouTube course collection.
- Practical Tutorials' project-based learning collection, limited to data science, machine learning, computer vision, and deep learning.
- Awesome Deep Learning's course and tutorial lists.
- MIT OpenCourseWare's official sitemap, filtered for relevant mathematics, statistics, computing, and AI subjects; repeated course editions are reduced to the latest discovered edition of each course.

The exact fetched source URLs, SHA-256 source hashes, response dates, and source positions are in the provenance JSON. Records retain their original destination and discovery source. Provider and topic names are editorial labels inferred from the source URL, section, and title.

## Access checks and exclusions

Every retained destination returned a successful HTTP response during this run. A bounded response was inspected for its document title, content type, and common login, error, or video-unavailable messages. Direct PDF links additionally required a PDF signature. Author and institutional PDF prefixes, plus reviewed GitHub book owners, constrain book imports; unreviewed PDF mirrors, known paid and registration-gated providers, archive mirrors, and unavailable pages are excluded.

These checks establish reachability and source provenance, not an independent legal opinion about every linked page or a guarantee that every embedded video or exercise remains available. Course hosts may offer optional paid services or require accounts for compute. Videos can have geographic availability differences. The collection links to the original hosts and does not mirror books or course contents.

Run the collector again to refresh its verification results, then run `npm run catalogue:build`. The build also applies `review-overrides.json`: manual exclusions for retired or mixed-access destinations, a correction for the Agentic AI resource hub, and separate video-lecture labels for YouTube links. Generated totals may change as sources update. The merged manifest is the source of truth for the website's displayed count.
