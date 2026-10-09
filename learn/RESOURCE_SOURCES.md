# Learning garden: course and guide sources

Reviewed on 2026-10-09. This file documents the provenance of the 24 entries in `resources.js`.

The catalogue links to the original universities, authors, research groups, and documentation publishers. Descriptions are original summaries. It does not mirror third-party course content, use affiliate links, or claim that a paid certificate is free.

## What was checked

- Reviewed the official landing pages, course introductions, public syllabi, or the authors' project repositories to check subject coverage and access.
- Performed an unauthenticated HTTP GET for every catalogue URL on 2026-10-09. All 24 returned HTTP 200 after redirects.
- Updated the Google ML Crash Course URL with `hl=en` after a locale-dependent redirect was observed. The explicit English URL returned HTTP 200.
- Checked imports, unique IDs, and the data schema by importing the JavaScript module in Node. There are 24 records and 24 unique IDs.
- Level labels and recommended sequencing are editorial guidance, not credentials or official prerequisites. The source sites give full prerequisites.

HTTP success confirms that the linked landing page responded. It does not validate every exercise, notebook, GPU session, or embedded video. Some optional exercises require an account or locally installed software. Free learning material does not imply free hosted inference, unlimited compute, academic enrollment, or a paid provider's platform license.

## Sources and access evidence

| Catalogue entry | Primary source | Access and selection notes |
| --- | --- | --- |
| Essence of Linear Algebra | [3Blue1Brown topic collection](https://www.3blue1brown.com/?topic=linear-algebra), [series conclusion](https://www.3blue1brown.com/lessons/abstract-vector-spaces/) | Public visual lessons and videos. Optional creator support is separate. The canonical topic query replaces the older `/topics/linear-algebra` redirect. |
| Seeing Theory | [Brown University project](https://seeing-theory.brown.edu/) | Public probability and statistics interactives. The site explicitly says it is archived for reference, which the catalogue description preserves. |
| Neural Networks, Visually | [3Blue1Brown topic collection](https://www.3blue1brown.com/?topic=neural-networks), [backpropagation lesson](https://www.3blue1brown.com/lessons/backpropagation/) | Public explanations cover neural networks, gradients, backpropagation, transformers, and attention. Optional creator support is separate. |
| Machine Learning Crash Course | [Google course](https://developers.google.com/machine-learning/crash-course?hl=en), [Google announcement](https://developers.googleblog.com/machine-learning-crash-course/) | Public modular lessons, diagrams, and exercises. Google's announcement explicitly states that the course is free. |
| CS229: Machine Learning | [Stanford Engineering Everywhere archive](https://see.stanford.edu/Course/CS229) | Public archived lectures and course materials. Deliberately avoids the current [CS229 homepage](https://cs229.stanford.edu/), which says its current-quarter documents require a Stanford login. |
| CS50: AI with Python | [Harvard OpenCourseWare](https://cs50.harvard.edu/ai/) | The welcome page explicitly permits free study through OpenCourseWare. Optional edX verified credentials and university credit are separate. Project submission services may require an account. |
| Practical Deep Learning for Coders | [fast.ai course](https://course.fast.ai/), [companion notebooks](https://course.fast.ai/Resources/book.html) | The course describes itself as free. Its companion book can be read online in notebook form. Printed books and optional paid compute are separate. |
| MIT 6.S191 | [Official MIT course site](https://introtodeeplearning.com/) | Public recordings, slides, and labs. The site states that course materials are open-sourced. MIT academic enrollment is distinct from access to the published materials. |
| CS231n | [Official Stanford course](https://cs231n.stanford.edu/) | Public course notes, slides, and assignments, plus links to published lecture recordings. Stanford enrollment, feedback, and professional programs are separate. |
| PyTorch: Learn the Basics | [Official PyTorch tutorial](https://docs.pytorch.org/tutorials/beginner/basics/intro.html) | Public training workflow and notebooks covering tensors, datasets, autograd, optimization, and model saving. Local execution and linked Colab options are documented. |
| The LLM Course | [Hugging Face introduction](https://huggingface.co/learn/llm-course/chapter1/1) | The introduction explicitly describes the course as free and without ads. Covers transformers, datasets, tokenizers, fine-tuning, and reasoning models. |
| AI Agents Course | [Hugging Face introduction](https://huggingface.co/learn/agents-course/unit0/introduction) | Explicitly free course, with self-study and certification paths described as free. Publishing agents or participating in activities may require a Hugging Face account. |
| Deep Reinforcement Learning Course | [Hugging Face introduction](https://huggingface.co/learn/deep-rl-course/unit0/introduction) | The source explicitly describes the course as free and open source. Hands-on activities use notebooks and environments; an account is required for some sharing features. |
| CS224N | [Official Stanford course](https://web.stanford.edu/class/cs224n/) | Public notes and assignments, with free archived lecture recordings. The site distinguishes those from restricted current-class recordings and fee-based professional enrollment. |
| Neural Network Playground | [TensorFlow interactive](https://playground.tensorflow.org/) | Public browser simulation exposes learning rate, architecture, regularization, data, train/test split, and loss. |
| CNN Explainer | [Live tool](https://poloclub.github.io/cnn-explainer/), [authors' GitHub repository](https://github.com/poloclub/cnn-explainer) | Public interactive visualization. The authors' README confirms the live URL and research provenance; the client-rendered demo has little extractable static text. |
| Transformer Explainer | [Authors' live tool and explanation](https://poloclub.github.io/transformer-explainer/) | Public interactive demonstration built around GPT-2 small. The catalogue identifies GPT-2 and does not claim to show the internals of newer proprietary models. |
| Feature Visualization | [Original Distill article](https://distill.pub/2017/feature-visualization/) | Public visual research article by Chris Olah, Alexander Mordvintsev, and Ludwig Schubert. The catalogue describes the method and acknowledges its limits. |
| The Illustrated Transformer | [Jay Alammar's original article](https://jalammar.github.io/illustrated-transformer/) | Public illustrated guide to the original encoder-decoder transformer, self-attention, and query/key/value calculations. |
| Full Stack Deep Learning | [Official 2022 course](https://fullstackdeeplearning.com/course/2022/) | The landing page explicitly states that lecture and lab materials are free. The catalogue preserves the 2022 edition so it is not mistaken for a newly updated course. |
| Made With ML | [Author's course](https://madewithml.com/), [author's GitHub repository](https://github.com/GokuMohandas/Made-With-ML) | Public written lessons and source code. Optional live cohorts, cloud compute, and hosted services are separate from the learning materials. |
| People + AI Guidebook | [Google PAIR guidebook](https://pair.withgoogle.com/guidebook-v2/), [Google companion codelab](https://codelabs.developers.google.com/codelabs/pair-guidebook) | Public AI design patterns, chapters, worksheets, and case studies. Selected for product judgment, calibrated trust, user control, and recovery from mistakes. |
| Recommendation Systems | [Official Google course](https://developers.google.com/machine-learning/recommendation) | Public lessons covering recommendation architecture, matrix factorization, and neural recommenders. Extends the catalogue beyond neural networks and LLMs. |
| Palantir AIP: From Data to Actions | [Official AIP documentation](https://www.palantir.com/docs/foundry/aip/overview) | Documentation is publicly readable. Platform usage requires an appropriate enrollment; the catalogue makes that distinction explicit. |

## Palantir terminology for the portfolio

Verified against current primary documentation:

- [AI FDE](https://www.palantir.com/docs/foundry/ai-fde/overview) is the official spelling for the AI-powered forward deployed engineer. It requires AIP on a Palantir enrollment.
- [AIP Logic](https://www.palantir.com/docs/foundry/logic) is the visual environment for building and evaluating LLM-powered functions.
- [AIP Analyst](https://www.palantir.com/docs/foundry/aip-analyst/overview) supports agentic analysis over Ontology data.
- [AIP Chatbot Studio](https://www.palantir.com/docs/foundry/chatbot-studio/overview) is the current name for the product previously called AIP Agent Studio. The official overview explicitly describes the rename.
- [AIP overview](https://www.palantir.com/docs/foundry/aip/overview) also names AIP Evals and explains the relationship to the Ontology.

Suggested concise portfolio wording: `Palantir AIP · AI FDE`, `AIP Logic · AIP Analyst`, and `AIP Evals · Ontology`.

## Editorial boundaries

This is a curated collection, not an automatically synchronized resource feed. It does not claim certificates, completion estimates, partner relationships, or endorsements. Links remain on the original publishers' sites and may change after the review date. The separate book catalogue has its own source and PDF access checks.
