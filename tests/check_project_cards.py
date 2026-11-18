"""Regression check for the project cards on projects.html.

Run from the repo root:  python tests/check_project_cards.py
Needs Node.js on PATH: it runs assets/js/project.js with a stub DOM and checks
the HTML that showCards() renders. Exits non-zero and prints each failure.
"""
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JS = ROOT / "assets/js/project.js"
PAGE = ROOT / "projects.html"
errors = []

# Expected links per card: label -> URL. A label missing here must not render.
EXPECTED = {
    "Operating System": {"Code": "https://github.com/tlamDson/Operating_System_OSV"},
    "Custom Shell": {"Code": "https://github.com/tlamDson/CustomShell"},
    "Dickinson Market": {},
    "PlanCare": {
        "Live demo": "https://plancare-web-omega.vercel.app",
        "Code": "https://github.com/tlamDson/plancare",
    },
}

RUNNER = r"""
let html = null;
global.AOS = { init() {} };
global.document = {
  querySelector: () => ({ set innerHTML(v) { html = v; } }),
  addEventListener: (_e, fn) => fn(),
};
require(process.argv[1]);
process.stdout.write(JSON.stringify({ html }));
"""
CSS = [ROOT / "assets/css/project.css", ROOT / "assets/css/style.css"]


def check(cond, msg):
    if not cond:
        errors.append(msg)


def strip(s):
    return re.sub(r"<[^>]+>", "", s).strip()


def render():
    node = shutil.which("node")
    if not node:
        print("FAIL: node is not on PATH; install Node.js to run this check")
        sys.exit(1)
    out = subprocess.run([node, "-e", RUNNER, str(JS)], capture_output=True, text=True)
    if out.returncode != 0:
        print("FAIL: project.js threw while rendering:\n" + out.stderr)
        sys.exit(1)
    return json.loads(out.stdout)


result = render()
html = result["html"] or ""
page = PAGE.read_text(encoding="utf-8")
js_src = JS.read_text(encoding="utf-8")

# B25: the dead search code (myFunction reading #myInput) stays deleted. Checked in
# the source text: require() runs project.js in module scope, so a global probe
# would never see it.
for name, src in ((JS.name, js_src), (PAGE.name, page)):
    for dead in ("myFunction", "myInput"):
        check(dead not in src, f"{name}: dead search code {dead!r} is back")
check("<h1" not in html, "cards: card titles must not be h1")
check("dickinson.edu" not in html, "cards: Dickinson Market 404 preview link is back")

cards = re.split(r'(?=<div class="column skill-card card")', html)[1:]
check(len(cards) == len(EXPECTED), f"cards: expected {len(EXPECTED)} cards, found {len(cards)}")

for card in cards:
    m = re.search(r'<h3 class="title">(.*?)</h3>', card, re.S)
    check(m is not None, "cards: a card has no h3 title")
    if not m:
        continue
    title = strip(m.group(1))
    check(title in EXPECTED, f"cards: unexpected card {title!r}")
    want = EXPECTED.get(title, {})

    # B02: the image comes first and is empty; all text sits in the block under it.
    order = re.match(
        r'<div class="column skill-card card"[^>]*>\s*'
        r'<div class="wrapper"[^>]*background: url\(([^)]+)\)[^>]*></div>\s*'
        r'<div class="card-body-text">',
        card,
    )
    check(order is not None, f"{title}: card text must sit under the image, not above or inside it")
    if order:
        check((ROOT / order.group(1)).is_file(), f"{title}: card image {order.group(1)} is missing")
    body = card.split('<div class="card-body-text">', 1)[-1]
    for part in ('class="title"', 'class="card-desc"', 'class="card-tags"', 'class="card-result"'):
        check(part in body, f"{title}: {part} must be inside the text block under the image")

    # Description, tags and one result line all render with text.
    for cls in ("card-desc", "card-result"):
        found = re.findall(rf'<p class="{cls}">(.*?)</p>', card, re.S)
        check(len(found) == 1 and strip(found[0]), f"{title}: needs exactly one non-empty {cls}")
    tags = re.search(r'<ul class="card-tags">(.*?)</ul>', card, re.S)
    check(tags and re.findall(r"<li>[^<]+</li>", tags.group(1)), f"{title}: needs tech tags")

    # Links: only non-empty URLs, labelled, new tab, noopener.
    links = re.findall(r"<a\b([^>]*)>(.*?)</a>", card, re.S)
    got = {}
    for attrs, label in links:
        label = strip(label)
        href = re.search(r'href="([^"]*)"', attrs)
        href = href.group(1) if href else ""
        check(href.strip() not in ("", "#"), f"{title}: link {label!r} has an empty href")
        check('target="_blank"' in attrs, f"{title}: link {label!r} must open in a new tab")
        check(re.search(r'rel="[^"]*noopener', attrs), f"{title}: link {label!r} needs rel=noopener")
        got[label] = href
    check(got == want, f"{title}: links {got} != expected {want}")

# B02: no stylesheet moves the text back above the image (reordering or overlaying).
for css in CSS:
    for sel, rules in re.findall(r"([^{}]+)\{([^{}]*)\}", css.read_text(encoding="utf-8")):
        if not re.search(r"\.card\b|skill-card|card-body-text|\.wrapper\b", sel):
            continue
        sel = " ".join(sel.split())
        check(not re.search(r"(^|[;\s])order\s*:|column-reverse", rules),
              f"{css.name}: '{sel}' reorders the card; text must stay under the image")
        if "card-body-text" in sel:
            check(not re.search(r"position\s*:\s*(absolute|fixed)", rules),
                  f"{css.name}: '{sel}' lifts the card text over the image")

# The page itself: one h1, no stray "add" text before the content.
check(len(re.findall(r"<h1\b", page, re.I)) == 1, "projects.html: needs exactly one h1")
check(not re.search(r"^\s*add\s*$", page, re.M), "projects.html: stray word 'add' is back")

if errors:
    print("\n".join("FAIL: " + e for e in errors))
    sys.exit(1)
print(f"OK: {len(cards)} project cards render text, tags, results and safe links")
