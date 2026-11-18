"""Regression checks for the template cleanup (B18, B20, B21, B23, B24). Stdlib only: python tests/check_clean_urls.py"""
import json
import posixpath
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
errors = []


def err(msg):
    errors.append(msg)


pages = sorted(ROOT.glob("*.html"))
texts = {p.name: p.read_text(encoding="utf-8") for p in pages}

# B18/B21: template leftovers stay deleted
for gone in ("design.html", "Readme.txt", "assets/css/design.css", "assets/css/travel_temp.css",
             "assets/css/sem_temp.css", "assets/css/event.css", "assets/css/references.css"):
    if (ROOT / gone).exists():
        err(f"{gone} is back")
for name, text in texts.items():
    for m in re.findall(r'href="([^"#?]+\.css)"', text):
        if not m.startswith("http") and not (ROOT / m).is_file():
            err(f"{name}: stylesheet {m} does not exist")
readme = (ROOT / "README.md").read_text(encoding="utf-8")
if "lamportfolio.vercel.app" not in readme or re.search(r"xeventech|debugginghuman|youtube", readme, re.I):
    err("README.md must link the live site and carry no template text")
if len(readme.splitlines()) > 60:
    err("README.md should stay short")
for heading in ("## Stack", "## Run locally"):
    if heading not in readme:
        err(f"README.md: section {heading!r} missing")
stack = re.split(r"^## ", readme.split("## Stack", 1)[-1], maxsplit=1, flags=re.M)[0]
for word in ("HTML", "CSS", "jQuery", "Vercel"):
    if word not in stack:
        err(f"README.md: Stack section should name {word}")
run = re.split(r"^## ", readme.split("## Run locally", 1)[-1], maxsplit=1, flags=re.M)[0]
# The setup command must serve clean URLs (/projects) like Vercel; python -m http.server 404s on them
run_cmds = "\n".join(re.findall(r"```[^\n]*\n(.*?)```", run, re.S))
if not re.search(r"^\s*npx serve\b", run_cmds, re.M):
    err("README.md: Run locally needs a code block with `npx serve .` (it serves clean URLs like Vercel)")
if re.search(r"http\.server|^\s*(start|open|xdg-open|invoke-item)\b|\.html\s*$", run_cmds, re.M | re.I):
    err("README.md: Run locally code block has a command that breaks clean nav links (/projects)")
if "http.server" in run and not re.search(r"http\.server[^\n]*\n?[^\n]*404", run):
    err("README.md: if python -m http.server is mentioned, say that clean links 404 there")

# B23: no empty analytics tags
for name, text in texts.items():
    if re.search(r'<script[^>]*\bsrc=""', text):
        err(f"{name}: empty <script src=\"\"> is back")
    if re.search(r"gtag\(\s*['\"]config['\"]\s*,\s*['\"]{2}", text) or "dataLayer" in text:
        err(f"{name}: empty gtag/dataLayer analytics stub is back")

# B24: every image in assets/ is referenced somewhere (case-insensitive file name match)
tracked = subprocess.check_output(["git", "ls-files"], cwd=ROOT, text=True).splitlines()
blob = ""
for f in tracked:
    p = ROOT / f
    if p.suffix in {".html", ".js", ".css", ".json", ".xml", ".svg"} and p.is_file():
        blob += p.read_text(encoding="utf-8", errors="ignore").lower() + "\n"
for f in tracked:
    p = Path(f)
    if f.startswith("assets/") and p.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"}:
        if p.name.lower() not in blob:
            err(f"{f} is not referenced by any HTML, JS, CSS or SVG file")

# B24: every local image path written in a page, script, stylesheet or config resolves to a tracked
# file with the exact case (Vercel is case-sensitive), so nothing still points at a deleted image.
# Paths in CSS files resolve from the CSS file; everything else resolves from the site root.
tracked_set = set(tracked)
IMG_REF = re.compile(r"""(?:^|[\s"'(,=])((?:https?:)?[^\s"'()<>,]*?\.(?:png|jpe?g|webp|gif|svg|ico|avif))(?=$|[\s"')?#,])""",
                     re.I | re.M)
SITE = "https://lamportfolio.vercel.app/"
KNOWN_MISSING = set()
COMMENTS = re.compile(r"/\*.*?\*/|<!--.*?-->|^\s*//[^\n]*", re.S | re.M)
img_refs = 0
for f in tracked:
    p = ROOT / f
    if p.suffix not in {".html", ".js", ".css", ".json", ".xml", ".webmanifest"} or ".min." in p.name:
        continue
    for ref in IMG_REF.findall(COMMENTS.sub("", p.read_text(encoding="utf-8", errors="ignore"))):
        if ref.startswith(SITE):
            ref = "/" + ref[len(SITE):]
        if re.match(r"(https?:)?//|data:", ref):
            continue
        base = posixpath.dirname(f) if p.suffix == ".css" and not ref.startswith("/") else ""
        target = posixpath.normpath(posixpath.join(base, ref.lstrip("/")))
        img_refs += 1
        if target not in tracked_set and target not in KNOWN_MISSING:
            err(f"{f}: image {ref!r} -> {target} is not a tracked file (deleted or wrong case)")
if img_refs < 30:
    err(f"image reference scan found only {img_refs} references; the pattern is broken")

# B20: cleanUrls with the cache headers; no legacy builds/routes (Vercel rejects routes + cleanUrls)
cfg = json.loads((ROOT / "vercel.json").read_text(encoding="utf-8"))
if cfg.get("cleanUrls") is not True:
    err("vercel.json: cleanUrls must be true")
for k in ("routes", "builds", "rewrites", "redirects"):
    if k in cfg:
        err(f"vercel.json: '{k}' must not be set (conflicts with cleanUrls or hides it)")


def cache_for(path):
    """Cache-Control of every header rule whose source matches the request path."""
    found = []
    for rule in cfg.get("headers", []):
        if re.fullmatch(rule["source"], path):
            found += [h["value"] for h in rule["headers"] if h["key"].lower() == "cache-control"]
    return found


REVALIDATE = "public, max-age=0, must-revalidate"
IMMUTABLE = "public, max-age=31536000, immutable"
for path in ("/", "/projects", "/experience", "/research", "/education", "/techstack", "/projects.html"):
    if cache_for(path) != [REVALIDATE]:
        err(f"vercel.json: {path} should get exactly [{REVALIDATE}], got {cache_for(path)}")
for path in ("/assets/css/style.css", "/assets/images/avatar.webp"):
    if cache_for(path) != [IMMUTABLE]:
        err(f"vercel.json: {path} should get exactly [{IMMUTABLE}], got {cache_for(path)}")
for rule in cfg.get("headers", []):
    for h in rule["headers"]:
        if h["key"].lower() == "x-robots-tag":
            err("vercel.json: X-Robots-Tag must not be set")

# Nav and in-page links use clean URLs that match a page, so the current-page highlight works
slug = {p.stem for p in pages if p.name not in ("index.html", "404.html")}
sources = {"assets/js/app.js": (ROOT / "assets/js/app.js").read_text(encoding="utf-8"), **texts}
for name, text in sources.items():
    for href in re.findall(r'<a\b[^>]*\bhref="([^"]*)"', text):
        if re.match(r"(index|experience|projects|research|education|techstack)\.html", href):
            err(f"{name}: link {href!r} should be the clean URL")
        if href.startswith("/") and not href.startswith("//") and href != "/" and href.lstrip("/") not in slug \
                and not href.startswith("/assets/"):
            err(f"{name}: link {href!r} points to no page")
nav = sources["assets/js/app.js"]
for s in sorted(slug) + [""]:
    if f'class="nav-link" href="/{s}"' not in nav:
        err(f"app.js: nav link /{s} missing")

if errors:
    print("\n".join("FAIL " + e for e in errors))
    sys.exit(1)
print(f"OK: clean URLs, cache headers, no analytics stubs, no unreferenced images ({len(pages)} pages)")
