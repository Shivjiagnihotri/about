import { initNeural } from "./scene.js";

const $ = (id) => document.getElementById(id);
$("year").textContent = new Date().getFullYear();
const media = matchMedia("(prefers-reduced-motion: reduce)");
let savedMotion;
try {
  savedMotion = localStorage.getItem("sa_motion");
} catch {}
let motionOff =
  savedMotion === null || savedMotion === undefined
    ? media.matches
    : savedMotion === "off";
function setMotion(off) {
  motionOff = off;
  document.body.classList.toggle("motion-off", off);
  $("motionToggle").innerHTML =
    "Motion: " + (off ? "off" : "on") + ' <span aria-hidden="true">◉</span>';
  $("motionToggle").setAttribute("aria-pressed", String(off));
  dispatchEvent(new CustomEvent("portfolio-motion", { detail: off }));
}
setMotion(motionOff);
$("motionToggle").addEventListener("click", () => {
  setMotion(!motionOff);
  try {
    localStorage.setItem("sa_motion", motionOff ? "off" : "on");
  } catch {}
});
media.addEventListener("change", (e) => setMotion(e.matches));
initNeural($("neuralCanvas"), motionOff);

const menu = $("menuToggle");
function closeMenu() {
  $("navLinks").classList.remove("open");
  menu.setAttribute("aria-expanded", "false");
  menu.setAttribute("aria-label", "Open navigation");
}
menu.addEventListener("click", () => {
  const open = $("navLinks").classList.toggle("open");
  menu.setAttribute("aria-expanded", String(open));
  menu.setAttribute(
    "aria-label",
    open ? "Close navigation" : "Open navigation",
  );
});
$("navLinks").addEventListener("click", (e) => {
  if (e.target.closest("a")) closeMenu();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeMenu();
});
document.addEventListener("click", (e) => {
  if (!e.target.closest(".site-header")) closeMenu();
});
matchMedia("(min-width:761px)").addEventListener("change", closeMenu);

if ("IntersectionObserver" in window && !motionOff) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.remove("pending");
          observer.unobserve(e.target);
        }
      });
    },
    { threshold: 0.07 },
  );
  document.querySelectorAll(".reveal").forEach((el) => {
    if (el.getBoundingClientRect().top > innerHeight)
      el.classList.add("pending");
    observer.observe(el);
  });
  addEventListener("portfolio-motion", () => {
    if (motionOff)
      document
        .querySelectorAll(".pending")
        .forEach((el) => el.classList.remove("pending"));
  });
}

const projects = {
  supply: {
    label: "MERCK GROUP / ENTERPRISE AI",
    title: "Supply chain intelligence, at scale.",
    problem:
      "Supply chain teams needed answers hidden across more than 30 million data records. Finding those answers manually consumed time and delayed decisions.",
    solution:
      "A multi-agent assistant built on Palantir AIP connects enterprise data with conversational reasoning and real-time insight. Business users can ask questions directly instead of assembling data by hand.",
    result:
      "Approximately €1.2M saved in time and opportunity cost, with 30M+ records available to the system.",
    tags: [
      "Multi-agent AI",
      "Palantir AIP",
      "Supply chain",
      "Conversational analytics",
    ],
  },
  documents: {
    label: "MERCK GROUP / DOCUMENT INTELLIGENCE",
    title: "A more efficient way to understand documents.",
    problem:
      "Document understanding through hosted intelligence services introduced substantial processing costs.",
    solution:
      "A self-hosted pipeline built with MLflow, vLLM, DeepSeek OCR V2, and Docling extracts and structures document information using open-source vision models.",
    result:
      "Approximately 80% lower costs versus Palantir AIP Intelligence and 74%+ cost avoidance versus the Mistral OCR API.",
    tags: ["MLflow", "vLLM", "DeepSeek OCR V2", "Docling"],
  },
  recommend: {
    label: "SELECTED PROJECT / RECOMMENDATIONS",
    title: "Find the product behind the intent.",
    problem:
      "Keyword-only recommendations miss the relationships between people, products, and the language they use.",
    solution:
      "Semantic understanding and graph databases combine entities and relationships to recommend relevant products. REST endpoints and an automated Docker CI/CD pipeline bring the system into production.",
    result: "70% improvement in product visibility.",
    tags: ["Semantic search", "Graph DB", "TensorFlow", "Docker", "REST APIs"],
  },
  search: {
    label: "SELECTED PROJECT / HYBRID SEARCH",
    title: "Search that understands context.",
    problem:
      "Finding relevant information across large collections required a faster and more accurate approach.",
    solution:
      "A Weaviate platform combines vector embeddings with traditional keyword retrieval, bringing semantic understanding to information discovery.",
    result:
      "70% faster discovery and more than 40% improvement in search accuracy.",
    tags: ["Weaviate", "Hybrid search", "Vector embeddings", "AWS"],
  },
  birthday: {
    label: "PERSONAL PROJECT / LIVE PRODUCT",
    title: "Make a little wish mean a lot.",
    problem:
      "A generic birthday message rarely captures what makes a relationship special.",
    solution:
      "A personal product models relationships as a graph in Neo4j and uses OpenAI to help write more thoughtful wishes. Firebase verifies the phone number of the person sending a message.",
    result:
      "An independently built, publicly available product at wishyoubirthday.com.",
    tags: ["Next.js", "React", "TypeScript", "Neo4j", "OpenAI", "Firebase"],
    link: "https://wishyoubirthday.com",
    linkText: "Visit the live project",
  },
  content: {
    label: "SELECTED PROJECT / GENERATIVE AI",
    title: "Useful content, grounded in documents.",
    problem:
      "Writing product descriptions from scattered PDFs, Word documents, and text files takes significant manual effort.",
    solution:
      "A retrieval-augmented generation pipeline extracts source material, retrieves relevant context, and uses GPT-4 to generate product descriptions grounded in those documents.",
    result:
      "Makes unstructured information actionable and reduces manual writing effort.",
    tags: ["RAG", "GPT-4", "Python", "PyPDF2", "Semantic search"],
  },
  analytics: {
    label: "SELECTED PROJECT / DATA INFRASTRUCTURE",
    title: "Keep pace with live data.",
    problem:
      "Large streams of incoming data require infrastructure that can ingest, process, and surface useful information continuously.",
    solution:
      "A scalable pipeline connects Python, MongoDB, and cloud infrastructure with machine learning models, using LangFlow and LangFuse in the AI stack.",
    result:
      "40% higher throughput and continuously available business insights.",
    tags: ["Python", "MongoDB", "LangFlow", "LangFuse", "AWS", "Azure"],
  },
  sahitatkal: {
    label: "SELECTED PROJECT / RAIL RESERVATIONS",
    title: "SahiTatkal. A clearer way to reserve.",
    problem:
      "Travellers face friction, opaque processes, and high cognitive load when reserving railway seats.",
    solution:
      "SahiTatkal is an intelligent, citizen-first reservation layer built on top of Indian Railways’ core ticketing infrastructure. It complements IRCTC, simplifying the experience around the existing reservation system.",
    resultLabel: "The purpose",
    result:
      "Make seat reservation clearer and easier for travellers by removing friction, opacity, and the mental effort involved in booking a journey.",
    tags: ["Rail reservations", "Citizen-first design", "Travel technology"],
    link: "https://sahitatkal.com",
    linkText: "Explore SahiTatkal",
  },
};
const projectDialog = $("projectDialog");
document.querySelectorAll("[data-project]").forEach((button) =>
  button.addEventListener("click", () => {
    const p = projects[button.dataset.project];
    $("projectDialogContent").innerHTML =
      '<span class="eyebrow">' +
      p.label +
      '</span><h2 id="projectDialogTitle">' +
      p.title +
      "</h2><h3>The challenge</h3><p>" +
      p.problem +
      "</p><h3>The approach</h3><p>" +
      p.solution +
      "</p><h3>" +
      (p.resultLabel || "The outcome") +
      "</h3><p>" +
      p.result +
      '</p><div class="project-tags">' +
      p.tags.map((t) => "<span>" + t + "</span>").join("") +
      "</div>" +
      (p.link
        ? '<a class="button button-dark" href="' +
          p.link +
          '" target="_blank" rel="noopener noreferrer">' +
          p.linkText +
          " ↗</a>"
        : "");
    projectDialog.showModal();
  }),
);
document
  .querySelector("[data-close-project]")
  .addEventListener("click", () => projectDialog.close());
projectDialog.addEventListener("click", (e) => {
  if (e.target === projectDialog) {
    const r = projectDialog.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      projectDialog.close();
  }
});
$("copyEmail").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText("shivjiagnihotri@outlook.com");
    $("copyEmail").textContent = "Copied ✓";
    $("copyStatus").textContent = "Email address copied.";
  } catch {
    $("copyStatus").textContent =
      "Clipboard unavailable. Select and copy the email link.";
    $("copyEmail").textContent = "Select email to copy";
  }
  setTimeout(() => {
    $("copyEmail").textContent = "Copy ↗";
  }, 3000);
});

// Load the 3D engine only when someone chooses to play.
let arcadePromise;
document.querySelectorAll("[data-launch]").forEach((button) =>
  button.addEventListener("click", async () => {
    const original = button.innerHTML;
    button.disabled = true;
    button.textContent = "Preparing the world…";
    let arcade;
    try {
      arcadePromise ||= import("./games.js")
        .then((module) => module.initArcade())
        .catch((error) => {
          arcadePromise = null;
          throw error;
        });
      arcade = await arcadePromise;
      await arcade.open(button.dataset.launch, button);
    } catch (error) {
      console.error("Unable to start arcade:", error);
      arcade?.close();
      $("gameDialog").dataset.state = "error";
      $("gameTitle").textContent = "Unable to open 3D experience";
      $("gameScreen").hidden = false;
      $("gameScreenLabel").textContent = "EXPERIENCE UNAVAILABLE";
      $("gameScreenTitle").textContent = "The world could not load.";
      $("gameScreenDescription").textContent =
        "Check your connection and use a browser with WebGL 2 and hardware acceleration enabled, then try again.";
      $("gameScreenNote").textContent =
        "Close this window to return to the portfolio.";
      $("controlGuide").replaceChildren();
      [
        "startGame",
        "restartGame",
        "gameHud",
        "touchControls",
        "pauseGame",
      ].forEach((id) => ($(id).hidden = true));
      $("gameDialog").showModal();
      if (!arcade) $("closeGame").onclick = () => $("gameDialog").close();
    } finally {
      button.disabled = false;
      button.innerHTML = original;
    }
  }),
);
