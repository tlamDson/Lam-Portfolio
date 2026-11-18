// Opens techstack.html in headless Chrome at 1366 px and 390 px wide and checks that every skill
// group's logo cards are actually visible and laid out as flex items of .skill-group-cards:
// several per row on desktop, one per row inside the screen on a phone, no horizontal page scroll.
// Catches the old bug where each card sat in its own full-width row with an AOS fade that never ran.
// The page loads jQuery and AOS from their CDNs, so this needs a network connection.
// Usage: node tests/check_skills_cards.js [site root]   (default: the repo root)
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

// Cards per group, in page order (same list as tests/check_research_skills.py).
const GROUPS = { Languages: 5, Backend: 4, Frontend: 2, "Infra & DevOps": 3, Data: 4, "ML & AI": 1 };
const TOTAL = Object.values(GROUPS).reduce((a, b) => a + b, 0);

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

// Layout of every card, after scrolling each one into view (so a scroll-triggered fade would have run).
const LAYOUT = `(async () => {
  const groups = [...document.querySelectorAll('.techstack-box .skill-group')];
  for (const c of document.querySelectorAll('.tech_card')) {
    c.scrollIntoView({ block: 'center', behavior: 'instant' });
    await new Promise((r) => setTimeout(r, 30));
  }
  await new Promise((r) => setTimeout(r, 800));
  return {
    vw: innerWidth,
    scrollW: document.documentElement.scrollWidth,
    groups: groups.map((g) => ({
      name: g.querySelector('.skill-group-name')?.textContent.trim(),
      list: (g.querySelector('.skill-group-list')?.textContent || '').trim().length,
      cards: [...g.querySelectorAll('.tech_card')].map((c) => {
        const r = c.getBoundingClientRect(), s = getComputedStyle(c);
        let opacity = 1, hidden = false;
        for (let el = c; el && el !== document.body; el = el.parentElement) {
          const es = getComputedStyle(el);
          opacity *= +es.opacity;
          if (es.visibility !== 'visible' || es.display === 'none') hidden = true;
        }
        const img = c.querySelector('img');
        return { name: c.querySelector('h4')?.textContent.trim(), left: Math.round(r.left), right: Math.round(r.right),
                 top: Math.round(r.top + scrollY), width: Math.round(r.width), height: Math.round(r.height),
                 opacity, hidden, directChild: c.parentElement.classList.contains('skill-group-cards'),
                 aos: !!c.closest('[data-aos]'), imgOk: !!img && img.complete && img.naturalWidth > 0 };
      }),
    })),
  };
})()`;

async function main() {
  if (!CHROME) throw new Error("no Chrome or Edge found; set CHROME_PATH");
  const port = 8600 + Math.floor(Math.random() * 300);
  const server = spawn("python", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], { cwd: ROOT, stdio: "ignore" });
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "skills-check-"));
  const chrome = spawn(CHROME, ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`,
    "--no-first-run", "--no-default-browser-check", "--window-size=1366,900", "about:blank"], { stdio: "ignore" });
  try {
    const portFile = path.join(profile, "DevToolsActivePort");
    const cdpPort = (await waitFor(() => fs.existsSync(portFile) && fs.readFileSync(portFile, "utf8").split("\n")[0], 15000, "Chrome")).trim();
    const url = `http://127.0.0.1:${port}/techstack.html`;
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
      if (r.result.exceptionDetails) throw new Error(`page error: ${r.result.exceptionDetails.text}`);
      return r.result.result.value;
    };
    await send("Runtime.enable");
    await send("Page.enable");

    for (const [width, mobile] of [[1366, false], [390, true]]) {
      const tag = `${width}px`;
      // Device emulation, because a desktop Chrome window cannot be made 390 px wide.
      await send("Emulation.setDeviceMetricsOverride", { width, height: mobile ? 844 : 900, deviceScaleFactor: 1, mobile });
      await send("Page.navigate", { url });
      await waitFor(() => evaluate("document.readyState === 'complete' && document.querySelectorAll('.tech_card').length > 0"),
        20000, `${tag}: the page and its cards to load`).catch((e) => check(false, e.message));
      const lay = await evaluate(LAYOUT);
      const names = lay.groups.map((g) => g.name);
      check(JSON.stringify(names) === JSON.stringify(Object.keys(GROUPS)), `${tag}: groups ${JSON.stringify(names)}`);
      const cards = lay.groups.flatMap((g) => g.cards);
      check(cards.length === TOTAL, `${tag}: ${cards.length} cards, expected ${TOTAL}`);
      check(lay.scrollW <= lay.vw, `${tag}: page scrolls sideways (scrollWidth ${lay.scrollW} > ${lay.vw})`);
      for (const g of lay.groups) {
        check(g.list > 0, `${tag}: group ${g.name} has no skill list`);
        check(g.cards.length === GROUPS[g.name], `${tag}: group ${g.name} has ${g.cards.length} cards, expected ${GROUPS[g.name]}`);
        for (const c of g.cards) {
          const who = `${tag}: card ${c.name}`;
          check(!c.hidden && c.opacity > 0.99, `${who} is not visible (opacity ${c.opacity}, hidden ${c.hidden})`);
          check(c.width > 0 && c.height > 0, `${who} has no size`);
          check(c.directChild, `${who} is not a direct flex item of .skill-group-cards`);
          check(!c.aos, `${who} sits inside a data-aos element (AOS.init runs before the cards exist)`);
          check(c.imgOk, `${who}: logo did not load`);
          check(c.left >= 0 && c.right <= lay.vw, `${who} spills out of the screen (${c.left}..${c.right} of ${lay.vw})`);
        }
        // Rows: cards sharing a top edge. Desktop must fit 3+ per row; a phone shows one per row.
        const rows = {};
        g.cards.forEach((c) => { rows[c.top] = (rows[c.top] || 0) + 1; });
        const perRow = Math.max(0, ...Object.values(rows));
        if (!mobile && g.cards.length >= 3) check(perRow >= 3, `${tag}: group ${g.name} shows only ${perRow} card(s) per row`);
        if (mobile) check(perRow === 1, `${tag}: group ${g.name} squeezes ${perRow} cards into one row`);
      }
      // No big empty gap: consecutive rows of cards sit close together.
      const tops = [...new Set(cards.map((c) => c.top))].sort((a, b) => a - b);
      for (let i = 1; i < tops.length; i++) {
        const prev = cards.filter((c) => c.top === tops[i - 1]);
        const gap = tops[i] - (tops[i - 1] + Math.max(...prev.map((c) => c.height)));
        check(gap < 300, `${tag}: ${gap}px empty gap above card row at y=${tops[i]}`);
      }
    }
    const own = consoleErrors.filter((e) => /techstack\.js/.test(e));
    check(own.length === 0, `techstack.js threw: ${own.join(" | ")}`);
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
  console.log("OK: every skill card is visible, several per row at 1366 px and one per row at 390 px");
}, (e) => { console.log(`FAIL: ${e.message}`); process.exit(1); });
