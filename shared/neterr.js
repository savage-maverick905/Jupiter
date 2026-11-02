// "No connection" screen. Shown when the device is offline or a request to the server fails to connect.
// Loaded before the app so it also covers sign-in and first load. Retry reloads; "Use downloads" just closes it.
const ID = 'neterr';
let shown = false, dismissed = false;
function css() {
  if (document.getElementById(ID + '-css')) return;
  const s = document.createElement('style'); s.id = ID + '-css';
  s.textContent = `#${ID}{position:fixed;inset:0;z-index:2147483000;background:#121212;color:#F2F2F2;font-family:Poppins,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:2rem calc(1.5rem + env(safe-area-inset-right)) calc(2rem + env(safe-area-inset-bottom)) calc(1.5rem + env(safe-area-inset-left));animation:${ID}in .25s ease}
#${ID} .ring{width:96px;height:96px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#FFAD80,#ED6627 62%);display:grid;place-items:center;box-shadow:0 0 0 10px rgba(237,102,39,.12),0 0 0 22px rgba(0,173,239,.07);margin-bottom:1.8rem}
#${ID} svg{width:44px;height:44px;stroke:#1E1E1E;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
#${ID} h2{margin:0 0 .45rem;font-size:1.35rem;font-weight:600}
#${ID} p{margin:0;max-width:20rem;color:#a7a7b0;font-size:.95rem;line-height:1.5}
#${ID} .row{display:flex;gap:.7rem;margin-top:1.8rem;flex-wrap:wrap;justify-content:center}
#${ID} button{font:inherit;font-weight:600;border:0;border-radius:14px;padding:.8rem 1.5rem;min-width:8.5rem;cursor:pointer;background:#ED6627;color:#fff}
#${ID} button.alt{background:#262629;color:#F2F2F2;border:1px solid #38383d}
#${ID} button:focus-visible{outline:2px solid #00ADEF;outline-offset:2px}
#${ID} small{position:absolute;bottom:calc(1rem + env(safe-area-inset-bottom));color:#6f6f78;font-size:.75rem}
@keyframes ${ID}in{from{opacity:0;transform:scale(.98)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){#${ID}{animation:none}}`;
  document.head.append(s);
}
function show() {
  if (shown || dismissed || !document.body) return; shown = true; css();
  const d = document.createElement('div'); d.id = ID; d.setAttribute('role', 'alert');
  d.innerHTML = `<div class="ring"><svg viewBox="0 0 24 24"><path d="M2 8.8a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><path d="M12 20h.01"/><path d="M3 3l18 18"/></svg></div>
<h2>No connection</h2><p>Jupiter needs the internet to load your music. Check your network and try again.</p>
<div class="row"><button type="button" data-a="retry">Try again</button><button type="button" class="alt" data-a="close">Use downloads</button></div><small>Built by Hie</small>`;
  d.addEventListener('click', (e) => {
    const a = e.target?.dataset?.a;
    if (a === 'retry') { if (navigator.onLine === false) return; location.reload(); }
    if (a === 'close') { dismissed = true; hide(); }
  });
  document.body.append(d); d.querySelector('button')?.focus();
}
function hide() { document.getElementById(ID)?.remove(); shown = false; }
addEventListener('offline', show);
addEventListener('online', () => { dismissed = false; if (shown) location.reload(); });
if (navigator.onLine === false) { if (document.body) show(); else addEventListener('DOMContentLoaded', show); }
// Any request to our own server that cannot connect (TypeError) shows the screen.
const realFetch = window.fetch.bind(window);
window.fetch = async (...a) => {
  try { return await realFetch(...a); }
  catch (e) {
    const u = new URL(typeof a[0] === 'string' ? a[0] : a[0]?.url || '', location.href);
    if (e?.name !== 'AbortError' && u.origin === location.origin && u.pathname.startsWith('/api/')) show();
    throw e;
  }
};
