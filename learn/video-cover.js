// Shared preview markup for selected courses and the full video catalogue.
const escape = value => String(value || '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function videoCover(item) {
  if (!/^covers\/[a-f0-9]{16}\.(jpg|png|webp|svg)$/.test(item.cover || '')) return '';
  return `<a class="video-cover" href="${escape(item.url)}" target="_blank" rel="noopener noreferrer" aria-label="Watch ${escape(item.title)}, opens in a new tab"><img src="${escape(item.cover)}" alt="" width="800" height="450" loading="lazy" decoding="async"/><span class="video-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 5v14l11-7z"/></svg></span><span class="video-cover-label" aria-hidden="true">${item.coverKind==='original-illustration'?'VIDEO LESSONS':'WATCH & LEARN'} <span>↗</span></span></a>`;
}
