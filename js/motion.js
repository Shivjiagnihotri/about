// Native scrolling with a small spring on arrival. No scroll interception.
export function initMotion(initialOff = false) {
  let off = initialOff;
  const reveals = [...document.querySelectorAll(".reveal")];
  const surfaces = [...document.querySelectorAll("main > section")];
  const clearPending = () => reveals.forEach((el) => {
    el.classList.remove("pending", "arriving");
  });

  if (!("IntersectionObserver" in window)) return;

  const revealObserver = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      if (target.classList.contains("pending") && !off) {
        target.classList.add("arriving");
      }
      target.classList.remove("pending");
      revealObserver.unobserve(target);
    }
  }, { threshold: 0, rootMargin: "0px 0px -28px 0px" });

  reveals.forEach((el) => {
    const siblings = [...el.parentElement.children].filter((child) => child.matches(".reveal"));
    el.style.setProperty("--reveal-delay", `${Math.min(siblings.indexOf(el), 3) * 65}ms`);
    if (!off && el.getBoundingClientRect().top > innerHeight) el.classList.add("pending");
    el.addEventListener("animationend", (event) => {
      if (event.animationName === "spring-arrival") el.classList.remove("arriving");
    });
    // Keyboard navigation must never land in hidden content.
    el.addEventListener("focusin", () => el.classList.remove("pending"));
    revealObserver.observe(el);
  });

  const surfaceObserver = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      target.classList.toggle("flow-in-view", isIntersecting);
    });
  }, { rootMargin: "80px" });
  surfaces.forEach((el) => surfaceObserver.observe(el));

  const syncVisibility = () => document.body.classList.toggle("page-hidden", document.hidden);
  document.addEventListener("visibilitychange", syncVisibility);
  syncVisibility();
  addEventListener("portfolio-motion", ({ detail }) => {
    off = detail;
    if (off) clearPending();
  });
}
