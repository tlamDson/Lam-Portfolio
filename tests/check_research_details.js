// Opens research.html in headless Chrome, clicks each DETAILS button with a real mouse click and
// checks that its panel opens and shows the resume bullets, while the other panel stays closed.
// The page loads jQuery and Bootstrap from their CDNs, so this needs a network connection.
// Usage: node tests/check_research_details.js [site root]   (default: the repo root)
// Exits non-zero and prints each failure.
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = path.resolve(process.argv[2] || path.join(__dirname, ".."));
const CHROME = process.env.CHROME_PATH || [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].find((p) => fs.existsSync(p));

// One needle per bullet, from the master resume.
const EXPECTED = [
  ["URPC2020 (7,543 images, 4 classes)", "3.3 points in mAP50 (to 84.3%)"],
  ["up to 100-digit addition and multiplication", "from 20 to 5 minutes at 100% accuracy"],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [];
const check = (cond, msg) => cond || errors.push(msg);

async function waitFor(fn, ms, label) {
  const end = Date.now() + ms;
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() > end) throw new Error(`timed out waiting for ${label}`);
    await sleep(100);
  }
}

async function main() {
  if (!CHROME) throw new Error("no Chrome or Edge found; set CHROME_PATH");
  const port = 8600 + Math.floor(Math.random() * 300);
  const server = spawn("python", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], { cwd: ROOT, stdio: "ignore" });
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "research-check-"));
  const chrome = spawn(CHROME, ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`,
    "--no-first-run", "--no-default-browser-check", "--window-size=1280,900", "about:blank"], { stdio: "ignore" });
  try {
    const portFile = path.join(profile, "DevToolsActivePort");
    const cdpPort = (await waitFor(() => fs.existsSync(portFile) && fs.readFileSync(portFile, "utf8").split("\n")[0], 15000, "Chrome")).trim();
    const url = `http://127.0.0.1:${port}/research.html`;
    await waitFor(() => fetch(url).then((r) => r.ok, () => false), 10000, "the local server");
    const tab = await (await fetch(`http://127.0.0.1:${cdpPort}/json/new?about:blank`, { method: "PUT" })).json();
    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    let id = 0;
    const pending = new Map();
    const consoleErrors = [];
    ws.onmessage = (m) => {
      const msg = JSON.parse(m.data);
      if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
      if (msg.method === "Runtime.exceptionThrown") consoleErrors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
    };
    const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
    const evaluate = async (expr) => {
      const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
      if (r.result.exceptionDetails) throw new Error(`page error in ${expr}: ${r.result.exceptionDetails.text}`);
      return r.result.result.value;
    };

    await send("Runtime.enable");
    await send("Page.enable");
    await send("Page.navigate", { url });
    await waitFor(() => evaluate("document.readyState === 'complete' && !!window.jQuery && !!jQuery.fn.collapse"), 20000,
      "the page, jQuery and Bootstrap to load");
    const buttons = await evaluate("document.querySelectorAll('.main button[data-toggle=collapse]').length");
    check(buttons === EXPECTED.length, `expected ${EXPECTED.length} DETAILS buttons, found ${buttons}`);

    // State of every panel: open, height, and the text of each bullet that is actually visible.
    const panels = () => evaluate(`[...document.querySelectorAll('.main button[data-toggle=collapse]')].map(b => {
      const p = document.querySelector(b.dataset.target);
      if (!p) return null;
      const visible = (el) => { const r = el.getBoundingClientRect(), s = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && s.visibility === 'visible' && s.display !== 'none' && +s.opacity > 0; };
      return { open: p.classList.contains('show') && !p.classList.contains('collapsing'), height: p.offsetHeight,
               expanded: b.getAttribute('aria-expanded'),
               bullets: [...p.querySelectorAll('li')].filter(visible).map(li => li.textContent.replace(/\\s+/g, ' ')) };
    })`);

    const before = await panels();
    before.forEach((p, i) => {
      check(p, `button ${i + 1}: its data-target matches no panel`);
      check(p && !p.open && p.height === 0 && p.bullets.length === 0, `panel ${i + 1} is open before any click`);
    });

    for (let i = 0; i < buttons; i++) {
      // Real mouse click at the button's centre, so a button that is covered or not clickable fails.
      // The page has AOS entrance animations and `scroll-behavior: smooth`, so scroll instantly and
      // click only once the button sits at the same spot on two reads 150 ms apart.
      let last = null;
      const pt = await waitFor(async () => {
        const cur = await evaluate(`(() => {
          const b = document.querySelectorAll('.main button[data-toggle=collapse]')[${i}];
          const r0 = b.getBoundingClientRect();
          if (r0.top < 0 || r0.bottom > innerHeight) b.scrollIntoView({ block: 'center', behavior: 'instant' });
          const r = b.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
          const hit = document.elementFromPoint(x, y);
          const ok = hit && (hit === b || b.contains(hit)) && getComputedStyle(b).opacity === '1';
          return { x, y, ok: !!ok, scrollY };
        })()`);
        const stable = last && cur.ok && last.ok && cur.x === last.x && cur.y === last.y && cur.scrollY === last.scrollY;
        last = cur;
        if (!stable) { await sleep(50); return null; }
        return { x: cur.x, y: cur.y };
      }, 10000, `DETAILS button ${i + 1} to be clickable and still`).catch((e) => { check(false, e.message); return null; });
      if (!pt) continue;
      for (const type of ["mousePressed", "mouseReleased"]) {
        await send("Input.dispatchMouseEvent", { type, x: pt.x, y: pt.y, button: "left", clickCount: 1 });
      }
      await sleep(800); // Bootstrap's collapse transition is 350 ms
      const after = await panels();
      const p = after[i];
      if (!p) continue; // already reported: no panel matches this button
      check(p.open && p.height > 0 && p.expanded === "true", `DETAILS ${i + 1}: panel did not open (${JSON.stringify(p)})`);
      check(p.bullets.length === EXPECTED[i].length, `DETAILS ${i + 1}: ${p.bullets.length} visible bullets, expected ${EXPECTED[i].length}`);
      EXPECTED[i].forEach((needle) => check(p.bullets.some((b) => b.includes(needle)), `DETAILS ${i + 1}: no visible bullet contains ${JSON.stringify(needle)}`));
      after.forEach((o, j) => j > i && o && check(!o.open, `DETAILS ${i + 1} also opened panel ${j + 1}`));
    }
    // research.html loads the slim jQuery build, so app.js's preloader fadeOut throws on main too;
    // only errors from the research script fail this check.
    const own = consoleErrors.filter((e) => /research\.js/.test(e));
    check(own.length === 0, `research.js threw: ${own.join(" | ")}`);
    ws.close();
  } finally {
    chrome.kill();
    server.kill();
    await sleep(500);
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
  }
}

main().then(() => {
  if (errors.length) { console.log(errors.join("\n")); process.exit(1); }
  console.log("OK: each DETAILS button opens its own panel with the resume bullets visible");
}, (e) => { console.log(`FAIL: ${e.message}`); process.exit(1); });
