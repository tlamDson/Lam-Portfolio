"""SEO/sharing regression checks (B01, B06, B07, B17). Stdlib only: python tests/check_seo.py"""
import json
import re
import sys
import xml.etree.ElementTree as ET
from urllib.parse import urlsplit
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = "https://lamportfolio.vercel.app"
BAD = re.compile(r"xeventech|free and beautiful|portfolio template|user-scalable", re.I)
VIEWPORT = "width=device-width, initial-scale=1.0"
errors = []


def err(msg):
    errors.append(msg)


class Head(HTMLParser):
    def __init__(self):
        super().__init__()
        self.meta, self.links = {}, {}

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "meta":
            key = a.get("name") or a.get("property")
            if key:
                self.meta.setdefault(key, []).append(a.get("content") or "")
        elif tag == "link" and a.get("rel"):
            self.links.setdefault(a["rel"], []).append(a.get("href") or "")


page_urls, image_urls = {}, set()
pages = sorted(p.name for p in ROOT.glob("*.html"))
if "404.html" not in pages:
    err("404.html missing")

for name in pages:
    text = (ROOT / name).read_text(encoding="utf-8")
    h = Head()
    h.feed(text)
    head = text.split("</head>")[0]
    if BAD.search(head):
        err(f"{name}: template text or user-scalable in <head>: {BAD.search(head).group(0)}")
    one = lambda k: h.meta.get(k, [None]) if len(h.meta.get(k, [])) == 1 else [None]
    if h.meta.get("viewport") != [VIEWPORT]:
        err(f"{name}: viewport must be exactly '{VIEWPORT}', got {h.meta.get('viewport')}")
    desc = one("description")[0]
    if not desc or len(desc) < 40 or "Liam Pham" not in desc:
        err(f"{name}: missing or generic meta description")
    path = "" if name == "index.html" else name[:-5]  # cleanUrls: /projects, not /projects.html
    url = f"{BASE}/{path}"
    if h.links.get("canonical") != [url]:
        err(f"{name}: canonical should be {url}, got {h.links.get('canonical')}")
    if one("og:url")[0] != url:
        err(f"{name}: og:url should be {url}")
    for k in ("og:title", "og:description", "og:image", "twitter:card"):
        if not one(k)[0]:
            err(f"{name}: missing {k}")
    if one("og:site_name")[0] != "Liam Pham Portfolio":
        err(f"{name}: og:site_name should be 'Liam Pham Portfolio'")
    if "twitter:site" in h.meta:
        err(f"{name}: twitter:site must not be a page URL")
    img = one("og:image")[0] or ""
    if img.startswith(BASE + "/"):
        if not (ROOT / img[len(BASE) + 1:]).is_file():
            err(f"{name}: og:image file not found: {img}")
    elif img:
        err(f"{name}: og:image should be on {BASE}")
    robots = one("robots")[0] or ""
    if name == "404.html" and "noindex" not in robots:
        err("404.html must stay noindex")
    if name != "404.html":
        for k in ("robots", "googlebot", "bingbot", "googlebot-news"):
            for v in h.meta.get(k, []):
                if re.search(r"noindex|none", v, re.I):
                    err(f"{name}: meta {k}='{v}' blocks indexing")
    page_urls[name] = url
    if img:
        image_urls.add(img)

robots = (ROOT / "robots.txt").read_text(encoding="utf-8")
# Directives only count outside comments; field names are case-insensitive (RFC 9309).
sitemaps = [m.group(1) for line in robots.splitlines()
            if (m := re.fullmatch(r"(?i)\s*sitemap\s*:\s*(\S+)\s*", line.split("#", 1)[0]))]
if f"{BASE}/sitemap.xml" not in sitemaps:
    err(f"robots.txt has no active 'Sitemap: {BASE}/sitemap.xml' line (found {sitemaps})")


def robot_groups(txt):
    """Parse robots.txt into {agent_lower: [(allow, pattern)]} (RFC 9309 grouping)."""
    groups, cur, in_rules = {}, [], False
    for line in txt.splitlines():
        line = line.split("#", 1)[0].strip()
        if ":" not in line:
            continue
        k, v = (x.strip() for x in line.split(":", 1))
        k = k.lower()
        if k == "user-agent":
            if in_rules:
                cur, in_rules = [], False
            cur.append(v.lower())
            groups.setdefault(v.lower(), [])
        elif k in ("allow", "disallow"):
            in_rules = True
            if v or k == "allow":
                for a in cur:
                    groups[a].append((k == "allow", v))
    return groups


def can_fetch(groups, agent, url):
    """Google semantics: most specific group, longest matching rule wins, Allow wins ties."""
    a = agent.lower()
    rules = groups.get(a, groups.get(a.split("-")[0], groups.get("*", [])))
    path = urlsplit(url).path or "/"
    best = (-1, True)
    for allow, pat in rules:
        rx = "^" + re.escape(pat).replace(r"\*", ".*")
        rx = rx[:-2] + "$" if rx.endswith(r"\$") else rx
        if pat and re.match(rx, path):
            if len(pat) > best[0] or (len(pat) == best[0] and allow):
                best = (len(pat), allow)
    return best[1]


rp = robot_groups(robots)
agents = {"*", "Googlebot", "Googlebot-Image", "Bingbot", "Twitterbot", "facebookexternalhit", "LinkedInBot"}
agents |= {a for a in robot_groups(robots) if a != "*"}
crawlable = [u for n, u in page_urls.items() if n != "404.html"] + sorted(image_urls) + [f"{BASE}/sitemap.xml"]
for agent in sorted(agents):
    for u in crawlable:
        if not can_fetch(rp, agent, u):
            err(f"robots.txt blocks {agent} from {u}")

# vercel.json must not send X-Robots-Tag noindex on any route
for route in json.loads((ROOT / "vercel.json").read_text(encoding="utf-8")).get("routes", []):
    for k, v in (route.get("headers") or {}).items():
        if k.lower() == "x-robots-tag" and re.search(r"noindex|none", v, re.I):
            err(f"vercel.json sends X-Robots-Tag '{v}' on {route.get('src')}")

NS = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
locs = []
try:
    tree = ET.parse(ROOT / "sitemap.xml").getroot()
    if tree.tag != NS + "urlset":
        err(f"sitemap.xml root must be <urlset> in the sitemap 0.9 namespace, got {tree.tag}")
    for u in tree:
        if u.tag != NS + "url":
            err(f"sitemap.xml: unexpected element {u.tag}")
            continue
        loc = u.find(NS + "loc")
        if loc is None or not (loc.text or "").strip():
            err("sitemap.xml: <url> without <loc>")
        else:
            locs.append(loc.text.strip())
except ET.ParseError as e:
    err(f"sitemap.xml is not well-formed XML: {e}")
expected = {u for n, u in page_urls.items() if n != "404.html"}
if set(locs) != expected or len(locs) != len(expected):
    err(f"sitemap.xml mismatch: missing {sorted(expected - set(locs))}, extra {sorted(set(locs) - expected)}, duplicates {len(locs) - len(set(locs))}")

if errors:
    print("\n".join("FAIL " + e for e in errors))
    sys.exit(1)
print(f"OK: {len(pages)} pages, robots.txt and sitemap.xml pass")
