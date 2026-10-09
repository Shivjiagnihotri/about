/** Lightweight, keyboard-accessible concept maps. No model calls or simulations. */
export function initAILab() {
  const section = document.getElementById("ai-lab");
  if (!section || section.dataset.aiInitialized === "true") return;
  section.dataset.aiInitialized = "true";

  const tabs = [...section.querySelectorAll("[data-ai-tab]")];
  const tablist = section.querySelector('[role="tablist"]');
  const panels = [...section.querySelectorAll('[role="tabpanel"]')];
  function selectTab(tab, moveFocus = false) {
    tabs.forEach((item) => {
      const selected = item === tab;
      item.setAttribute("aria-selected", String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    panels.forEach((panel) => {
      panel.hidden = panel.id !== tab.getAttribute("aria-controls");
    });
    if (moveFocus) tab.focus();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectTab(tab));
    tab.addEventListener("keydown", (event) => {
      let nextIndex;
      if (event.key === "ArrowDown" || event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
      else if (event.key === "ArrowUp" || event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = tabs.length - 1;
      else return;
      event.preventDefault();
      selectTab(tabs[nextIndex], true);
    });
  });

  const compactLayout = matchMedia("(max-width: 760px)");
  const updateOrientation = () => tablist.setAttribute("aria-orientation", compactLayout.matches ? "horizontal" : "vertical");
  updateOrientation();
  compactLayout.addEventListener("change", updateOrientation);

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(([entry]) => {
      section.dataset.aiVisible = String(entry.isIntersecting);
    }, { rootMargin: "60px", threshold: 0 });
    observer.observe(section);
  } else {
    section.dataset.aiVisible = "true";
  }
}
