# Official tutorial and course lesson catalogue

Generated 2026-10-09T12:05:45.021Z by `scripts/collect-tutorials.mjs`.

1180 distinct English educational pages were retained from 1687 discovered candidate URLs. Each retained page returned HTTP 200 during collection and supplied its actual page heading or title. Titles are source metadata, normalized for readability. No URLs or descriptions were invented.

## Provider totals

| Provider | Verified pages |
| --- | ---: |
| Dive into Deep Learning | 185 |
| Google Machine Learning | 168 |
| Hugging Face | 175 |
| PyTorch | 241 |
| TensorFlow | 411 |

## Collection method

- PyTorch: official stable tutorials sitemap, limited to beginner, intermediate, advanced, and recipe pages.
- TensorFlow: official current sitemap shards, limited to English tutorial and guide paths. API references, version trees, and migration pages are excluded. English is requested explicitly.
- Dive into Deep Learning: actual chapter links from the official table of contents. Preface, installation, references, and contributor utility pages are excluded.
- Hugging Face: actual English lesson URLs in the server-rendered sidebars of courses published in its documentation sitemap, plus its official LLM course. Translations, events, Discord onboarding, and certificate administration are excluded. Course context is appended where helpful to distinguish generic lesson headings.
- Google ML: actual links published in course and guide navigation, with English requested explicitly. Glossary and support links are excluded.
- Up to four simultaneous requests, a 25-second timeout, one retry for transient failures, and a local one-day metadata cache. Use `--refresh` to ignore cached page checks.
- Canonical and redirected URLs are normalized and deduplicated. Redirects away from selected providers, non-English pages, missing titles, and non-200 responses are rejected.
- Category/topic labels are editorial classifications inferred from page titles and course paths. Level is intentionally `All levels`; consult the source for prerequisites.
- Free materials means the learning page is publicly readable. Hosted notebooks, model APIs, GPUs, and platform services can require accounts or have separate costs. HTTP checks do not execute every notebook or verify every embedded dependency.

## Source indexes checked

| Original index | HTTP status | Checked |
| --- | ---: | --- |
| https://docs.pytorch.org/tutorials/sitemap.xml | 200 | 2026-10-09 |
| https://www.tensorflow.org/sitemap.xml | 200 | 2026-10-09 |
| https://www.tensorflow.org/sitemap_0_of_1.xml | 200 | 2026-10-09 |
| https://d2l.ai/ | 200 | 2026-10-09 |
| https://huggingface.co/sitemap-doc.xml | 200 | 2026-10-09 |
| https://huggingface.co/learn/audio-course | 200 | 2026-10-09 |
| https://huggingface.co/learn/agents-course | 200 | 2026-10-09 |
| https://huggingface.co/learn/context-course | 200 | 2026-10-09 |
| https://huggingface.co/learn/computer-vision-course | 200 | 2026-10-09 |
| https://huggingface.co/learn/deep-rl-course | 200 | 2026-10-09 |
| https://huggingface.co/learn/cookbook | 200 | 2026-10-09 |
| https://huggingface.co/learn/diffusion-course | 200 | 2026-10-09 |
| https://huggingface.co/learn/mcp-course | 200 | 2026-10-09 |
| https://huggingface.co/learn/ml-games-course | 200 | 2026-10-09 |
| https://huggingface.co/learn/ml-for-3d-course | 200 | 2026-10-09 |
| https://huggingface.co/learn/robotics-course | 200 | 2026-10-09 |
| https://huggingface.co/learn/smol-course | 200 | 2026-10-09 |
| https://huggingface.co/learn/llm-course/chapter1/1 | 200 | 2026-10-09 |
| https://developers.google.com/machine-learning?hl=en | 200 | 2026-10-09 |
| https://developers.google.com/machine-learning/foundational-courses?hl=en | 200 | 2026-10-09 |
| https://developers.google.com/machine-learning/advanced-courses?hl=en | 200 | 2026-10-09 |
| https://developers.google.com/machine-learning/guides?hl=en | 200 | 2026-10-09 |
| https://developers.google.com/machine-learning/glossary/clustering?hl=en | 200 | 2026-10-09 |
| https://developers.google.com/machine-learning/glossary/agent?hl=en | 200 | 2026-10-09 |
| https://developers.google.com/machine-learning/glossary?hl=en | 200 | 2026-10-09 |
| https://developers.google.com/machine-learning/glossary/df?hl=en | 200 | 2026-10-09 |
| https://developers.google.com/machine-learning/glossary/fundamentals?hl=en | 200 | 2026-10-09 |
| https://developers.google.com/machine-learning/glossary/googlecloud?hl=en | 200 | 2026-10-09 |
| https://developers.google.com/machine-learning/glossary/metrics?hl=en | 200 | 2026-10-09 |
| https://developers.google.com/machine-learning/glossary/generative?hl=en | 200 | 2026-10-09 |
| https://developers.google.com/machine-learning/glossary/tensorflow?hl=en | 200 | 2026-10-09 |
| https://developers.google.com/machine-learning/glossary/responsible-ai?hl=en | 200 | 2026-10-09 |
| https://developers.google.com/machine-learning/intro-to-ml?hl=en | 200 | 2026-10-09 |
| https://developers.google.com/machine-learning/decision-forests?hl=en | 200 | 2026-10-09 |
| https://developers.google.com/machine-learning/managing-ml-projects?hl=en | 200 | 2026-10-09 |
| https://developers.google.com/machine-learning/crash-course?hl=en | 200 | 2026-10-09 |
| https://developers.google.com/machine-learning/problem-framing?hl=en | 200 | 2026-10-09 |
| https://developers.google.com/machine-learning/clustering?hl=en | 200 | 2026-10-09 |
| https://developers.google.com/machine-learning/recommendation?hl=en | 200 | 2026-10-09 |
| https://developers.google.com/machine-learning/gan?hl=en | 200 | 2026-10-09 |
| https://developers.google.com/machine-learning/guides/text-classification?hl=en | 200 | 2026-10-09 |
| https://developers.google.com/machine-learning/guides/good-data-analysis?hl=en | 200 | 2026-10-09 |
| https://developers.google.com/machine-learning/guides/rules-of-ml?hl=en | 200 | 2026-10-09 |
| https://developers.google.com/machine-learning/guides/deep-learning-tuning-playbook?hl=en | 200 | 2026-10-09 |
| https://developers.google.com/machine-learning/guides/data-traps?hl=en | 200 | 2026-10-09 |
| https://developers.google.com/machine-learning/guides/intro-responsible-ai?hl=en | 200 | 2026-10-09 |
| https://developers.google.com/machine-learning/guides/adv-testing?hl=en | 200 | 2026-10-09 |
| https://developers.google.com/machine-learning/crash-course?hl=en | 200 | 2026-10-09 |
| https://developers.google.com/machine-learning/recommendation?hl=en | 200 | 2026-10-09 |

## Exclusions during this run

- https://docs.pytorch.org/tutorials/beginner/dcgan_faces_tutorial.html: The operation was aborted due to timeout
- https://huggingface.co/learn/agents-course/unit2/smolagents/final_quiz: HTTP 429
- https://huggingface.co/learn/agents-course/unit2/smolagents/conclusion: HTTP 429
- https://huggingface.co/learn/agents-course/unit2/llama-index/introduction: HTTP 429
- https://huggingface.co/learn/agents-course/unit2/smolagents/vision_agents: HTTP 429
- https://huggingface.co/learn/agents-course/unit2/llama-index/llama-hub: HTTP 429
- https://huggingface.co/learn/agents-course/unit2/llama-index/tools: HTTP 429
- https://huggingface.co/learn/agents-course/unit2/llama-index/components: HTTP 429
- https://huggingface.co/learn/agents-course/unit2/llama-index/quiz1: HTTP 429
- https://huggingface.co/learn/agents-course/unit2/llama-index/agents: HTTP 429
- https://huggingface.co/learn/agents-course/unit2/llama-index/quiz2: HTTP 429
- https://huggingface.co/learn/agents-course/unit2/llama-index/workflows: HTTP 429
- https://huggingface.co/learn/agents-course/unit2/llama-index/conclusion: HTTP 429
- https://huggingface.co/learn/agents-course/unit2/langgraph/building_blocks: HTTP 429
- https://huggingface.co/learn/agents-course/unit2/langgraph/introduction: HTTP 429
- https://huggingface.co/learn/agents-course/unit2/langgraph/when_to_use_langgraph: HTTP 429
- https://huggingface.co/learn/agents-course/unit2/langgraph/first_graph: HTTP 429
- https://huggingface.co/learn/agents-course/unit2/langgraph/document_analysis_agent: HTTP 429
- https://huggingface.co/learn/agents-course/unit2/langgraph/conclusion: HTTP 429
- https://huggingface.co/learn/agents-course/unit2/langgraph/quiz1: HTTP 429
- https://huggingface.co/learn/agents-course/unit3/agentic-rag/introduction: HTTP 429
- https://huggingface.co/learn/agents-course/unit3/agentic-rag/agentic-rag: HTTP 429
- https://huggingface.co/learn/agents-course/unit3/agentic-rag/tools: HTTP 429
- https://huggingface.co/learn/agents-course/unit3/agentic-rag/invitees: HTTP 429
- https://huggingface.co/learn/agents-course/unit3/agentic-rag/agent: HTTP 429
- https://huggingface.co/learn/agents-course/unit4/introduction: HTTP 429
- https://huggingface.co/learn/agents-course/unit4/what-is-gaia: HTTP 429
- https://huggingface.co/learn/agents-course/unit3/agentic-rag/conclusion: HTTP 429
- https://huggingface.co/learn/agents-course/unit4/hands-on: HTTP 429
- https://huggingface.co/learn/agents-course/unit4/additional-readings: HTTP 429
- https://huggingface.co/learn/agents-course/unit4/get-your-certificate: HTTP 429
- https://huggingface.co/learn/agents-course/unit4/conclusion: HTTP 429
- https://huggingface.co/learn/agents-course/bonus-unit1/introduction: HTTP 429
- https://huggingface.co/learn/agents-course/bonus-unit1/conclusion: HTTP 429
- https://huggingface.co/learn/agents-course/bonus-unit1/fine-tuning: HTTP 429
- https://huggingface.co/learn/agents-course/bonus-unit2/introduction: HTTP 429
- https://huggingface.co/learn/agents-course/bonus-unit1/what-is-function-calling: HTTP 429
- https://huggingface.co/learn/agents-course/bonus-unit2/what-is-agent-observability-and-evaluation: HTTP 429
- https://huggingface.co/learn/agents-course/bonus-unit2/monitoring-and-evaluating-agents-notebook: HTTP 429
- https://huggingface.co/learn/agents-course/bonus-unit2/quiz: HTTP 429
- https://huggingface.co/learn/agents-course/bonus-unit3/introduction: HTTP 429
- https://huggingface.co/learn/agents-course/bonus-unit3/state-of-art: HTTP 429
- https://huggingface.co/learn/agents-course/bonus-unit3/from-llm-to-agents: HTTP 429
- https://huggingface.co/learn/agents-course/bonus-unit3/building_your_pokemon_agent: HTTP 429
- https://huggingface.co/learn/agents-course/bonus-unit3/launching_agent_battle: HTTP 429
- https://huggingface.co/learn/agents-course/bonus-unit3/conclusion: HTTP 429
- https://huggingface.co/learn/context-course/unit0/introduction: HTTP 429
- https://huggingface.co/learn/context-course/unit1/introduction: HTTP 429
- https://huggingface.co/learn/context-course/unit1/what-are-skills: HTTP 429
- https://huggingface.co/learn/context-course/unit1/skill-format: HTTP 429
- https://huggingface.co/learn/context-course/unit1/using-skills: HTTP 429
- https://huggingface.co/learn/context-course/unit1/building-skills: HTTP 429
- https://huggingface.co/learn/context-course/unit1/quiz1: HTTP 429
- https://huggingface.co/learn/context-course/unit2/introduction: HTTP 429
- https://huggingface.co/learn/context-course/unit1/quiz2: HTTP 429
- https://huggingface.co/learn/context-course/unit2/key-concepts: HTTP 429
- https://huggingface.co/learn/context-course/unit2/building-servers: HTTP 429
- https://huggingface.co/learn/context-course/unit2/mcp-clients: HTTP 429
- https://huggingface.co/learn/context-course/unit2/quiz1: HTTP 429
- https://huggingface.co/learn/context-course/unit2/hands-on: HTTP 429
- https://huggingface.co/learn/context-course/unit2/gradio-mcp: HTTP 429
- https://huggingface.co/learn/context-course/unit3/building-plugins: HTTP 429
- https://huggingface.co/learn/context-course/unit2/quiz2: HTTP 429
- https://huggingface.co/learn/context-course/unit3/anatomy: HTTP 429
- https://huggingface.co/learn/context-course/unit3/introduction: HTTP 429
- https://huggingface.co/learn/context-course/unit3/quiz2: HTTP 429
- https://huggingface.co/learn/context-course/unit3/quiz1: HTTP 429
- https://huggingface.co/learn/context-course/unit3/using-plugins: HTTP 429
- https://huggingface.co/learn/context-course/unit4/introduction: HTTP 429
- https://huggingface.co/learn/context-course/unit4/using-subagents: HTTP 429
- https://huggingface.co/learn/context-course/unit4/patterns: HTTP 429
- https://huggingface.co/learn/context-course/unit4/quiz1: HTTP 429
- https://huggingface.co/learn/context-course/unit4/hands-on: HTTP 429
- https://huggingface.co/learn/context-course/unit4/quiz2: HTTP 429
- https://huggingface.co/learn/context-course/unit5/introduction: HTTP 429
- https://huggingface.co/learn/context-course/unit5/hook-events: HTTP 429
- https://huggingface.co/learn/context-course/unit5/quiz1: HTTP 429
- https://huggingface.co/learn/context-course/unit5/hands-on: HTTP 429
- https://huggingface.co/learn/context-course/unit5/quiz2: HTTP 429
- https://huggingface.co/learn/context-course/unit6/introduction: HTTP 429
- https://huggingface.co/learn/context-course/unit6/agent-loop: HTTP 429
- https://huggingface.co/learn/context-course/unit6/tools-and-sandboxing: HTTP 429
- https://huggingface.co/learn/context-course/unit6/quiz1: HTTP 429
- https://huggingface.co/learn/context-course/unit6/hands-on: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit0/welcome/welcome: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit0/welcome/TableOfContents: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit1/chapter1/motivation: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit1/image_and_imaging/imaging: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit1/image_and_imaging/image: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit1/image_and_imaging/extension-image: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit1/chapter1/applications: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit1/chapter1/definition: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit1/image_and_imaging/examples-preprocess: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit1/feature-extraction/feature_description: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit1/feature-extraction/feature-matching: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit1/feature-extraction/real-world-applications: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit2/cnns/introduction: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit2/cnns/vgg: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit2/cnns/mobilenet: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit2/cnns/googlenet: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit2/cnns/convnext: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit2/cnns/intro-transfer-learning: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit2/cnns/mobilenetextra: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit2/cnns/yolo: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit2/cnns/resnet: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit3/vision-transformers/vision-transformers-for-image-classification: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit3/vision-transformers/swin-transformer: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit3/vision-transformers/cvt: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit3/vision-transformers/dinat: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit3/vision-transformers/mobilevit: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit3/vision-transformers/detr: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit3/vision-transformers/vision-transformer-for-object-detection: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit3/vision-transformers/vision-transformers-for-image-segmentation: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit3/vision-transformers/oneformer: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit3/vision-transformers/knowledge-distillation: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit4/multimodal-models/a_multimodal_world: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit4/multimodal-models/pre-intro: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit4/multimodal-models/vlm-intro: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit4/multimodal-models/tasks-models-part1: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit4/multimodal-models/clip-and-relatives/losses: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit4/multimodal-models/clip-and-relatives/Introduction: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit4/multimodal-models/clip-and-relatives/clip: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit4/multimodal-models/clip-and-relatives/blip: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit4/multimodal-models/clip-and-relatives/owl_vit: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit4/multimodal-models/transfer_learning: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit4/multimodal-models/supplementary-material: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit5/generative-models/introduction/introduction: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit5/generative-models/variational_autoencoders: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit5/generative-models/gans: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit5/generative-models/gans-vaes/stylegan: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit5/generative-models/practical-applications/cycle_gan: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit5/generative-models/diffusion-models/introduction: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit5/generative-models/diffusion-models/stable-diffusion: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit5/generative-models/practical-applications/ethical-issues: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit5/generative-models/diffusion-models/simple-explanation: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit6/basic-cv-tasks/introduction: HTTP 429
- https://huggingface.co/learn/computer-vision-course/unit6/basic-cv-tasks/object_detection: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unit5/curiosity: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unit5/hands-on: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unit5/bonus: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unit5/quiz: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unit5/conclusion: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unit6/introduction: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unit6/variance-problem: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unit6/advantage-actor-critic: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unit6/hands-on: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unit6/quiz: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unit6/conclusion: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unit6/additional-readings: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unit7/introduction: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unit7/introduction-to-marl: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unit7/multi-agent-setting: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unit7/self-play: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unit7/hands-on: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unit7/quiz: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unit7/conclusion: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unit7/additional-readings: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unit8/introduction: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unit8/intuition-behind-ppo: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unit8/clipped-surrogate-objective: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unit8/visualize: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unit8/hands-on-cleanrl: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unit8/conclusion: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unit8/introduction-sf: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unit8/additional-readings: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unit8/conclusion-sf: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unit8/hands-on-sf: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unitbonus3/introduction: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unitbonus3/model-based: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unitbonus3/generalisation: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unitbonus3/offline-online: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unitbonus3/decision-transformers: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unitbonus3/rlhf: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unitbonus3/curriculum-learning: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unitbonus3/language-models: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unitbonus3/envs-to-try: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unitbonus3/learning-agents: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unitbonus3/godotrl: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unitbonus3/student-works: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unitbonus3/rl-documentation: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unitbonus5/introduction: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unitbonus5/getting-started: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unitbonus5/the-environment: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unitbonus5/train-our-robot: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unitbonus5/customize-the-environment: HTTP 429
- https://huggingface.co/learn/deep-rl-course/unitbonus5/conclusion: HTTP 429
- https://huggingface.co/learn/cookbook/index: HTTP 429
- https://huggingface.co/learn/cookbook/mlflow_ray_serve: HTTP 429
- https://huggingface.co/learn/cookbook/automatic_embedding_tei_inference_endpoints: HTTP 429
- https://huggingface.co/learn/cookbook/tgi_messages_api_demo: HTTP 429
- https://huggingface.co/learn/cookbook/advanced_rag: HTTP 429
- https://huggingface.co/learn/cookbook/labelling_feedback_setfit: HTTP 429
- https://huggingface.co/learn/cookbook/fine_tuning_code_llm_on_single_gpu: HTTP 429
- https://huggingface.co/learn/cookbook/prompt_tuning_peft: HTTP 429
- https://huggingface.co/learn/cookbook/rag_with_hf_and_milvus: HTTP 429
- https://huggingface.co/learn/cookbook/rag_evaluation: HTTP 429
- https://huggingface.co/learn/cookbook/llm_judge: HTTP 429
- https://huggingface.co/learn/cookbook/llm_judge_evaluating_ai_search_engines_with_judges_library: HTTP 429
- https://huggingface.co/learn/cookbook/issues_in_text_dataset: HTTP 429
- https://huggingface.co/learn/cookbook/annotate_text_data_transformers_via_active_learning: HTTP 429
- https://huggingface.co/learn/cookbook/rag_with_hugging_face_gemma_elasticsearch: HTTP 429
- https://huggingface.co/learn/cookbook/rag_with_hugging_face_gemma_mongodb: HTTP 429
- https://huggingface.co/learn/cookbook/rag_zephyr_langchain: HTTP 429
- https://huggingface.co/learn/cookbook/rag_llamaindex_librarian: HTTP 429
- https://huggingface.co/learn/cookbook/semantic_cache_chroma_vector_database: HTTP 429
- https://huggingface.co/learn/cookbook/structured_generation: HTTP 429
- https://huggingface.co/learn/cookbook/rag_with_unstructured_data: HTTP 429
- https://huggingface.co/learn/cookbook/fine_tuning_llm_to_generate_persian_product_catalogs_in_json_format: HTTP 429
- https://huggingface.co/learn/cookbook/finetune_t5_for_search_tag_generation: HTTP 429
- https://huggingface.co/learn/cookbook/llm_gateway_pii_detection: HTTP 429
- https://huggingface.co/learn/cookbook/information_extraction_haystack_nuextract: HTTP 429
- https://huggingface.co/learn/cookbook/code_search: HTTP 429
- https://huggingface.co/learn/cookbook/rag_with_sql_reranker: HTTP 429
- https://huggingface.co/learn/cookbook/generate_preference_dataset_distilabel: HTTP 429
- https://huggingface.co/learn/cookbook/clean_dataset_judges_distilabel: HTTP 429
- https://huggingface.co/learn/cookbook/rag_with_knowledge_graphs_neo4j: HTTP 429
- https://huggingface.co/learn/cookbook/benchmarking_tgi: HTTP 429
- https://huggingface.co/learn/cookbook/phoenix_observability_on_hf_spaces: HTTP 429
- https://huggingface.co/learn/cookbook/search_and_learn: HTTP 429
- https://huggingface.co/learn/cookbook/fine_tuning_llm_grpo_trl: HTTP 429
- https://huggingface.co/learn/cookbook/trl_grpo_reasoning_advanced_reward: HTTP 429
- https://huggingface.co/learn/cookbook/fine_tune_chatbot_docs_synthetic: HTTP 429
- https://huggingface.co/learn/cookbook/medical_rag_and_reasoning: HTTP 429
- https://huggingface.co/learn/cookbook/optuna_hpo_with_transformers: HTTP 429
- https://huggingface.co/learn/cookbook/function_calling_fine_tuning_llms_on_xlam: HTTP 429
- https://huggingface.co/learn/cookbook/dspy_gepa: HTTP 429
- https://huggingface.co/learn/cookbook/grpo_vllm_online_training: HTTP 429
- https://huggingface.co/learn/cookbook/rapidfire_sft_multiconfig_training: HTTP 429
- https://huggingface.co/learn/cookbook/fine_tuning_vit_custom_dataset: HTTP 429
- https://huggingface.co/learn/cookbook/fine_tuning_detr_custom_dataset: HTTP 429
- https://huggingface.co/learn/cookbook/semantic_segmentation_fine_tuning_inference: HTTP 429
- https://huggingface.co/learn/cookbook/stable_diffusion_interpolation: HTTP 429
- https://huggingface.co/learn/cookbook/analyzing_art_with_hf_and_fiftyone: HTTP 429
- https://huggingface.co/learn/cookbook/faiss_with_hf_datasets_and_clip: HTTP 429
- https://huggingface.co/learn/cookbook/multimodal_rag_using_document_retrieval_and_vlms: HTTP 429
- https://huggingface.co/learn/cookbook/fine_tuning_vlm_trl: HTTP 429
- https://huggingface.co/learn/cookbook/multimodal_rag_using_document_retrieval_and_reranker_and_vlms: HTTP 429
- https://huggingface.co/learn/cookbook/fine_tuning_smol_vlm_sft_trl: HTTP 429
- https://huggingface.co/learn/cookbook/multimodal_rag_using_document_retrieval_and_smol_vlm: HTTP 429
- https://huggingface.co/learn/cookbook/fine_tuning_vlm_dpo_smolvlm_instruct: HTTP 429
- https://huggingface.co/learn/cookbook/structured_generation_vision_language_models: HTTP 429
- https://huggingface.co/learn/cookbook/fine_tuning_granite_vision_sft_trl: HTTP 429
- https://huggingface.co/learn/cookbook/fine_tuning_vlm_object_detection_grounding: HTTP 429
- https://huggingface.co/learn/cookbook/fine_tuning_vlm_grpo_trl: HTTP 429
- https://huggingface.co/learn/cookbook/fine_tuning_vlm_mpo: HTTP 429
- https://huggingface.co/learn/cookbook/semantic_reranking_elasticsearch: HTTP 429
- https://huggingface.co/learn/cookbook/vector_search_with_hub_as_backend: HTTP 429
- https://huggingface.co/learn/cookbook/agents: HTTP 429
- https://huggingface.co/learn/cookbook/agent_rag: HTTP 429
- https://huggingface.co/learn/cookbook/agent_text_to_sql: HTTP 429
- https://huggingface.co/learn/cookbook/multiagent_web_assistant: HTTP 429
- https://huggingface.co/learn/cookbook/multiagent_rag_system: HTTP 429
- https://huggingface.co/learn/cookbook/agent_data_analyst: HTTP 429
- https://huggingface.co/learn/cookbook/grpo_agent_wordle_hf_jobs: HTTP 429
- https://huggingface.co/learn/cookbook/mongodb_smolagents_multi_micro_agents: HTTP 429
- https://huggingface.co/learn/cookbook/enterprise_cookbook_dev_spaces: HTTP 429
- https://huggingface.co/learn/cookbook/enterprise_cookbook_overview: HTTP 429
- https://huggingface.co/learn/cookbook/enterprise_cookbook_argilla: HTTP 429
- https://huggingface.co/learn/cookbook/enterprise_cookbook_gradio: HTTP 429
- https://huggingface.co/learn/cookbook/enterprise_hub_serverless_inference_api: HTTP 429
- https://huggingface.co/learn/cookbook/enterprise_dedicated_endpoints: HTTP 429
- https://huggingface.co/learn/diffusion-course/unit0/1: HTTP 429
- https://huggingface.co/learn/diffusion-course/unit1/1: HTTP 429
- https://huggingface.co/learn/diffusion-course/unit1/2: HTTP 429
- https://huggingface.co/learn/diffusion-course/unit1/3: HTTP 429
- https://huggingface.co/learn/diffusion-course/unit2/2: HTTP 429
- https://huggingface.co/learn/diffusion-course/unit2/1: HTTP 429
- https://huggingface.co/learn/diffusion-course/unit2/3: HTTP 429
- https://huggingface.co/learn/diffusion-course/unit3/1: HTTP 429
- https://huggingface.co/learn/diffusion-course/unit3/2: HTTP 429
- https://huggingface.co/learn/diffusion-course/unit4/1: HTTP 429
- https://huggingface.co/learn/diffusion-course/unit4/2: HTTP 429
- https://huggingface.co/learn/diffusion-course/unit4/3: HTTP 429
- https://huggingface.co/learn/diffusion-course/hackathon/introduction: HTTP 429
- https://huggingface.co/learn/diffusion-course/hackathon/dreambooth: HTTP 429
- https://huggingface.co/learn/mcp-course/unit0/introduction: HTTP 429
- https://huggingface.co/learn/mcp-course/unit1/introduction: HTTP 429
- https://huggingface.co/learn/mcp-course/unit1/key-concepts: HTTP 429
- https://huggingface.co/learn/mcp-course/unit1/architectural-components: HTTP 429
- https://huggingface.co/learn/mcp-course/unit1/quiz1: HTTP 429
- https://huggingface.co/learn/mcp-course/unit1/communication-protocol: HTTP 429
- https://huggingface.co/learn/mcp-course/unit1/sdk: HTTP 429
- https://huggingface.co/learn/mcp-course/unit1/quiz2: HTTP 429
- https://huggingface.co/learn/mcp-course/unit1/capabilities: HTTP 429
- https://huggingface.co/learn/mcp-course/unit1/mcp-clients: HTTP 429
- https://huggingface.co/learn/mcp-course/unit1/gradio-mcp: HTTP 429
- https://huggingface.co/learn/mcp-course/unit1/hf-mcp-server: HTTP 429
- https://huggingface.co/learn/mcp-course/unit1/unit1-recap: HTTP 429
- https://huggingface.co/learn/mcp-course/unit2/introduction: HTTP 429
- https://huggingface.co/learn/mcp-course/unit2/gradio-server: HTTP 429
- https://huggingface.co/learn/mcp-course/unit2/clients: HTTP 429
- https://huggingface.co/learn/mcp-course/unit2/continue-client: HTTP 429
- https://huggingface.co/learn/mcp-course/unit2/gradio-client: HTTP 429
- https://huggingface.co/learn/mcp-course/unit2/lemonade-server: HTTP 429
- https://huggingface.co/learn/mcp-course/unit2/tiny-agents: HTTP 429
- https://huggingface.co/learn/mcp-course/unit3/introduction: HTTP 429
- https://huggingface.co/learn/mcp-course/unit3/build-mcp-server: HTTP 429
- https://huggingface.co/learn/mcp-course/unit3/github-actions-integration: HTTP 429
- https://huggingface.co/learn/mcp-course/unit3/slack-notification: HTTP 429
- https://huggingface.co/learn/mcp-course/unit3/build-mcp-server-solution-walkthrough: HTTP 429
- https://huggingface.co/learn/mcp-course/unit3/conclusion: HTTP 429
- https://huggingface.co/learn/mcp-course/unit3_1/introduction: HTTP 429
- https://huggingface.co/learn/mcp-course/unit3_1/setting-up-the-project: HTTP 429
- https://huggingface.co/learn/mcp-course/unit3_1/creating-the-mcp-server: HTTP 429
- https://huggingface.co/learn/mcp-course/unit3_1/quiz1: HTTP 429
- https://huggingface.co/learn/mcp-course/unit3_1/webhook-listener: HTTP 429
- https://huggingface.co/learn/mcp-course/unit3_1/quiz2: HTTP 429
- https://huggingface.co/learn/mcp-course/unit3_1/mcp-client: HTTP 429
- https://huggingface.co/learn/mcp-course/unit3_1/conclusion: HTTP 429
- https://huggingface.co/learn/ml-games-course/unit0/introduction: HTTP 429
- https://huggingface.co/learn/ml-games-course/unit0/game-demo: HTTP 429
- https://huggingface.co/learn/ml-games-course/unit0/syllabus: HTTP 429
- https://huggingface.co/learn/ml-games-course/unit0/who-are-we: HTTP 429
- https://huggingface.co/learn/ml-games-course/unit0/setup: HTTP 429
- https://huggingface.co/learn/ml-games-course/unit0/how-to-get-most: HTTP 429
- https://huggingface.co/learn/ml-games-course/unit0/conclusion: HTTP 429
- https://huggingface.co/learn/ml-games-course/unit1/introduction: HTTP 429
- https://huggingface.co/learn/ml-games-course/unit1/sentence-similarity-explained: HTTP 429
- https://huggingface.co/learn/ml-games-course/unit1/local-vs-api: HTTP 429
- https://huggingface.co/learn/ml-games-course/unit1/what-is-hf: HTTP 429
- https://huggingface.co/learn/ml-games-course/unit1/make-demo: HTTP 429
- https://huggingface.co/learn/ml-games-course/unit1/next-steps: HTTP 429
- https://huggingface.co/learn/ml-games-course/unit1/conclusion: HTTP 429
- https://huggingface.co/learn/ml-games-course/demo1/introduction: HTTP 429
- https://huggingface.co/learn/ml-games-course/demo1/first-game: HTTP 429
- https://huggingface.co/learn/ml-games-course/demo1/game-design-document: HTTP 429
- https://huggingface.co/learn/ml-games-course/demo1/game-idea: HTTP 429
- https://huggingface.co/learn/ml-games-course/demo1/conclusion: HTTP 429
- https://huggingface.co/learn/ml-games-course/unitbonus1/introduction: HTTP 429
- https://huggingface.co/learn/ml-games-course/unitbonus1/ai-gmtk: HTTP 429
- https://huggingface.co/learn/ml-games-course/unitbonus1/ai-and-games: HTTP 429
- https://huggingface.co/learn/ml-games-course/unitbonus1/ai-in-unity: HTTP 429
- https://huggingface.co/learn/ml-games-course/unitbonus1/ai-in-unreal: HTTP 429
- https://huggingface.co/learn/ml-games-course/unitbonus1/additional-readings: HTTP 429
- https://huggingface.co/learn/ml-games-course/unitbonus1/conclusion: HTTP 429
- https://huggingface.co/learn/ml-games-course/unit2/introduction: HTTP 429
- https://huggingface.co/learn/ml-games-course/unit2/code-assistants: HTTP 429
- https://huggingface.co/learn/ml-games-course/unit2/ai-voice-actors: HTTP 429
- https://huggingface.co/learn/ml-games-course/unit2/music-generation: HTTP 429
- https://huggingface.co/learn/ml-games-course/unit2/animation-generation: HTTP 429
- https://huggingface.co/learn/ml-games-course/unit2/texture-generation: HTTP 429
- https://huggingface.co/learn/ml-games-course/unit2/2d-generation: HTTP 429
- https://huggingface.co/learn/ml-games-course/unit2/conclusion: HTTP 429
- https://huggingface.co/learn/ml-games-course/unit2/sound-generation: HTTP 429
- https://huggingface.co/learn/ml-games-course/unit3/introduction: HTTP 429
- https://huggingface.co/learn/ml-games-course/unit3/demo: HTTP 429
- https://huggingface.co/learn/ml-games-course/unit3/customize: HTTP 429
- https://huggingface.co/learn/ml-games-course/unit3/conclusion: HTTP 429
- https://huggingface.co/learn/ml-for-3d-course/unit0/introduction: HTTP 429
- https://huggingface.co/learn/ml-for-3d-course/unit0/whats-going-on: HTTP 429
- https://huggingface.co/learn/ml-for-3d-course/unit0/why-does-it-matter: HTTP 429
- https://huggingface.co/learn/ml-for-3d-course/unit0/how-to-do-it-yourself: HTTP 429
- https://huggingface.co/learn/ml-for-3d-course/unit1/introduction: HTTP 429
- https://huggingface.co/learn/ml-for-3d-course/unit1/meshes: HTTP 429
- https://huggingface.co/learn/ml-for-3d-course/unit1/non-meshes: HTTP 429
- https://huggingface.co/learn/ml-for-3d-course/unit1/pipelines: HTTP 429
- https://huggingface.co/learn/ml-for-3d-course/unit2/introduction: HTTP 429
- https://huggingface.co/learn/ml-for-3d-course/unit2/setup: HTTP 429
- https://huggingface.co/learn/ml-for-3d-course/unit2/pipeline: HTTP 429
- https://huggingface.co/learn/ml-for-3d-course/unit2/what-is-it: HTTP 429
- https://huggingface.co/learn/ml-for-3d-course/unit2/hands-on-1: HTTP 429
- https://huggingface.co/learn/ml-for-3d-course/unit2/hands-on-2: HTTP 429
- https://huggingface.co/learn/ml-for-3d-course/unit2/bonus: HTTP 429
- https://huggingface.co/learn/ml-for-3d-course/unit3/introduction: HTTP 429
- https://huggingface.co/learn/ml-for-3d-course/unit3/what-is-it: HTTP 429
- https://huggingface.co/learn/ml-for-3d-course/unit3/hands-on: HTTP 429
- https://huggingface.co/learn/ml-for-3d-course/unit3/bonus: HTTP 429
- https://huggingface.co/learn/ml-for-3d-course/unit4/introduction: HTTP 429
- https://huggingface.co/learn/ml-for-3d-course/unit4/marching-cubes: HTTP 429
- https://huggingface.co/learn/ml-for-3d-course/unit4/mesh-generation: HTTP 429
- https://huggingface.co/learn/ml-for-3d-course/unit4/hands-on: HTTP 429
- https://huggingface.co/learn/ml-for-3d-course/unit5/introduction: HTTP 429
- https://huggingface.co/learn/ml-for-3d-course/unit5/walkthrough: HTTP 429
- https://huggingface.co/learn/ml-for-3d-course/unit5/run-in-notebook: HTTP 429
- https://huggingface.co/learn/ml-for-3d-course/unit5/run-locally: HTTP 429
- https://huggingface.co/learn/ml-for-3d-course/unit5/run-via-api: HTTP 429
- https://huggingface.co/learn/ml-for-3d-course/conclusion/conclusion: HTTP 429
- https://huggingface.co/learn/robotics-course/unit0/2: HTTP 429
- https://huggingface.co/learn/robotics-course/unit1/1: HTTP 429
- https://huggingface.co/learn/robotics-course/unit0/1: HTTP 429
- https://huggingface.co/learn/robotics-course/unit1/2: HTTP 429
- https://huggingface.co/learn/robotics-course/unit1/3: HTTP 429
- https://huggingface.co/learn/robotics-course/unit1/4: HTTP 429
- https://huggingface.co/learn/robotics-course/unit2/1: HTTP 429
- https://huggingface.co/learn/robotics-course/unit2/2: HTTP 429
- https://huggingface.co/learn/robotics-course/unit2/3: HTTP 429
- https://huggingface.co/learn/robotics-course/unit2/4: HTTP 429
- https://huggingface.co/learn/robotics-course/unit2/5: HTTP 429
- https://huggingface.co/learn/smol-course/unit1/2: HTTP 429
- https://huggingface.co/learn/smol-course/unit1/1: HTTP 429
- https://huggingface.co/learn/smol-course/unit1/3: HTTP 429
- https://huggingface.co/learn/smol-course/unit0/1: HTTP 429
- https://huggingface.co/learn/smol-course/unit1/3a: HTTP 429
- https://huggingface.co/learn/smol-course/unit1/4: HTTP 429
- https://huggingface.co/learn/smol-course/unit1/5: HTTP 429
- https://huggingface.co/learn/smol-course/unit1/6: HTTP 429
- https://huggingface.co/learn/smol-course/unit2/1: HTTP 429
- https://huggingface.co/learn/smol-course/unit2/2: HTTP 429
- https://huggingface.co/learn/smol-course/unit2/3: HTTP 429
- https://huggingface.co/learn/smol-course/unit2/4: HTTP 429
- https://huggingface.co/learn/smol-course/unit3/1: HTTP 429
- https://huggingface.co/learn/smol-course/unit3/2: HTTP 429
- https://huggingface.co/learn/smol-course/unit3/3: HTTP 429
- https://huggingface.co/learn/smol-course/unit3/4: HTTP 429
- https://huggingface.co/learn/smol-course/unit4/1: HTTP 429
- https://huggingface.co/learn/llm-course/chapter0/1: HTTP 429
- https://huggingface.co/learn/llm-course/chapter1/2: HTTP 429
- https://huggingface.co/learn/llm-course/chapter1/1: HTTP 429
- https://huggingface.co/learn/llm-course/chapter1/4: HTTP 429
- https://huggingface.co/learn/llm-course/chapter1/3: HTTP 429
- https://huggingface.co/learn/llm-course/chapter1/5: HTTP 429
- https://huggingface.co/learn/llm-course/chapter1/6: HTTP 429
- https://huggingface.co/learn/llm-course/chapter1/7: HTTP 429
- https://huggingface.co/learn/llm-course/chapter1/8: HTTP 429
- https://huggingface.co/learn/llm-course/chapter1/9: HTTP 429
- https://huggingface.co/learn/llm-course/chapter1/10: HTTP 429
- https://huggingface.co/learn/llm-course/chapter2/1: HTTP 429
- https://huggingface.co/learn/llm-course/chapter1/11: HTTP 429
- https://huggingface.co/learn/llm-course/chapter2/2: HTTP 429
- https://huggingface.co/learn/llm-course/chapter2/3: HTTP 429
- https://huggingface.co/learn/llm-course/chapter2/4: HTTP 429
- https://huggingface.co/learn/llm-course/chapter2/5: HTTP 429
- https://huggingface.co/learn/llm-course/chapter2/7: HTTP 429
- https://huggingface.co/learn/llm-course/chapter2/6: HTTP 429
- https://huggingface.co/learn/llm-course/chapter2/8: HTTP 429
- https://huggingface.co/learn/llm-course/chapter2/9: HTTP 429
- https://huggingface.co/learn/llm-course/chapter3/1: HTTP 429
- https://huggingface.co/learn/llm-course/chapter3/2: HTTP 429
- https://huggingface.co/learn/llm-course/chapter3/3: HTTP 429
- https://huggingface.co/learn/llm-course/chapter3/4: HTTP 429
- https://huggingface.co/learn/llm-course/chapter3/5: HTTP 429
- https://huggingface.co/learn/llm-course/chapter3/6: HTTP 429
- https://huggingface.co/learn/llm-course/chapter4/1: HTTP 429
- https://huggingface.co/learn/llm-course/chapter3/7: HTTP 429
- https://huggingface.co/learn/llm-course/chapter4/2: HTTP 429
- https://huggingface.co/learn/llm-course/chapter4/3: HTTP 429
- https://huggingface.co/learn/llm-course/chapter4/4: HTTP 429
- https://huggingface.co/learn/llm-course/chapter4/5: HTTP 429
- https://huggingface.co/learn/llm-course/chapter4/6: HTTP 429
- https://huggingface.co/learn/llm-course/chapter5/1: HTTP 429
- https://huggingface.co/learn/llm-course/chapter5/2: HTTP 429
- https://huggingface.co/learn/llm-course/chapter5/4: HTTP 429
- https://huggingface.co/learn/llm-course/chapter5/3: HTTP 429
- https://huggingface.co/learn/llm-course/chapter5/5: HTTP 429
- https://huggingface.co/learn/llm-course/chapter5/6: HTTP 429
- https://huggingface.co/learn/llm-course/chapter5/7: HTTP 429
- https://huggingface.co/learn/llm-course/chapter5/8: HTTP 429
- https://huggingface.co/learn/llm-course/chapter6/1: HTTP 429
- https://huggingface.co/learn/llm-course/chapter6/2: HTTP 429
- https://huggingface.co/learn/llm-course/chapter6/3b: HTTP 429
- https://huggingface.co/learn/llm-course/chapter6/3: HTTP 429
- https://huggingface.co/learn/llm-course/chapter6/4: HTTP 429
- https://huggingface.co/learn/llm-course/chapter6/5: HTTP 429
- https://huggingface.co/learn/llm-course/chapter6/6: HTTP 429
- https://huggingface.co/learn/llm-course/chapter6/7: HTTP 429
- https://huggingface.co/learn/llm-course/chapter6/8: HTTP 429
- https://huggingface.co/learn/llm-course/chapter6/9: HTTP 429
- https://huggingface.co/learn/llm-course/chapter6/10: HTTP 429
- https://huggingface.co/learn/llm-course/chapter7/1: HTTP 429
- https://huggingface.co/learn/llm-course/chapter7/2: HTTP 429
- https://huggingface.co/learn/llm-course/chapter7/3: HTTP 429
- https://huggingface.co/learn/llm-course/chapter7/4: HTTP 429
- https://huggingface.co/learn/llm-course/chapter7/5: HTTP 429
- https://huggingface.co/learn/llm-course/chapter7/6: HTTP 429
- https://huggingface.co/learn/llm-course/chapter7/7: HTTP 429
- https://huggingface.co/learn/llm-course/chapter7/8: HTTP 429
- https://huggingface.co/learn/llm-course/chapter7/9: HTTP 429
- https://huggingface.co/learn/llm-course/chapter8/1: HTTP 429
- https://huggingface.co/learn/llm-course/chapter8/2: HTTP 429
- https://huggingface.co/learn/llm-course/chapter8/3: HTTP 429
- https://huggingface.co/learn/llm-course/chapter8/4: HTTP 429
- https://huggingface.co/learn/llm-course/chapter8/5: HTTP 429
- https://huggingface.co/learn/llm-course/chapter8/7: HTTP 429
- https://huggingface.co/learn/llm-course/chapter8/6: HTTP 429
- https://huggingface.co/learn/llm-course/chapter9/1: HTTP 429
- https://huggingface.co/learn/llm-course/chapter9/2: HTTP 429
- https://huggingface.co/learn/llm-course/chapter9/4: HTTP 429
- https://huggingface.co/learn/llm-course/chapter9/3: HTTP 429
- https://huggingface.co/learn/llm-course/chapter9/5: HTTP 429
- https://huggingface.co/learn/llm-course/chapter9/6: HTTP 429
- https://huggingface.co/learn/llm-course/chapter9/8: HTTP 429
- https://huggingface.co/learn/llm-course/chapter9/7: HTTP 429
- https://huggingface.co/learn/llm-course/chapter9/9: HTTP 429
- https://huggingface.co/learn/llm-course/chapter10/1: HTTP 429
- https://huggingface.co/learn/llm-course/chapter10/2: HTTP 429
- https://huggingface.co/learn/llm-course/chapter10/3: HTTP 429
- https://huggingface.co/learn/llm-course/chapter10/4: HTTP 429
- https://huggingface.co/learn/llm-course/chapter10/5: HTTP 429
- https://huggingface.co/learn/llm-course/chapter10/6: HTTP 429
- https://huggingface.co/learn/llm-course/chapter10/7: HTTP 429
- https://huggingface.co/learn/llm-course/chapter11/1: HTTP 429
- https://huggingface.co/learn/llm-course/chapter11/2: HTTP 429
- https://huggingface.co/learn/llm-course/chapter11/3: HTTP 429
- https://huggingface.co/learn/llm-course/chapter11/4: HTTP 429
- https://huggingface.co/learn/llm-course/chapter11/5: HTTP 429
- https://huggingface.co/learn/llm-course/chapter11/6: HTTP 429
- https://huggingface.co/learn/llm-course/chapter11/7: HTTP 429
- https://huggingface.co/learn/llm-course/chapter12/1: HTTP 429
- https://huggingface.co/learn/llm-course/chapter12/2: HTTP 429
- https://huggingface.co/learn/llm-course/chapter12/3: HTTP 429
- https://huggingface.co/learn/llm-course/chapter12/3b: HTTP 429
- https://huggingface.co/learn/llm-course/chapter12/4: HTTP 429
- https://huggingface.co/learn/llm-course/chapter12/5: HTTP 429
- https://huggingface.co/learn/llm-course/chapter12/6: HTTP 429
- https://huggingface.co/learn/llm-course/chapter12/7: HTTP 429
- https://developers.google.com/machine-learning/guides/rules-of-ml/rule_5_test_the_infrastructure_independently_from_the_machine_learning: HTTP 404

This catalogue links to original providers. It does not reproduce their teaching text, mirror course materials, imply partnerships, or claim that all providers offer free compute or certificates.
