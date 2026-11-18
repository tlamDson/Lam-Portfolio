"""Page-speed regression checks (B12, B13, B14). Stdlib only: python tests/check_page_speed.py"""
import re
import struct
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
errors = []


def err(msg):
    errors.append(msg)


pages = sorted(ROOT.glob("*.html"))
app_js = (ROOT / "assets/js/app.js").read_text(encoding="utf-8")
all_text = {p.name: p.read_text(encoding="utf-8") for p in pages}

for name, text in all_text.items():
    # B14: dead kit, duplicate includes, pinned AOS, deferred scripts.
    if "kit.fontawesome.com" in text:
        err(f"{name}: kit.fontawesome.com script (403) must be removed")
    if "aos@next" in text or re.search(r"aos@(?!2\.3\.1)", text):
        err(f"{name}: AOS must be pinned to aos@2.3.1")
    if len(re.findall(r"iconify\.min\.js", text)) > 1:
        err(f"{name}: Iconify is included more than once")
    fa = re.findall(r"font-awesome/([\d.]+)/", text)
    if len(fa) > 1:
        err(f"{name}: Font Awesome is included more than once: {fa}")
    for tag in re.findall(r"<script\b[^>]*>", text):
        if re.search(r"\bsrc\s*=\s*[\"'][^\"']+", tag) and not re.search(r"\b(defer|async)\b", tag):
            err(f"{name}: blocking script without defer: {' '.join(tag.split())[:90]}")
    # Inline code that calls a deferred library must wait for DOMContentLoaded.
    for body in re.findall(r"<script>(.*?)</script>", text, re.S):
        if "new Swiper(" in body and "DOMContentLoaded" not in body:
            err(f"{name}: inline Swiper setup runs before the deferred Swiper script")

    # B12: no heavy or GIF images referenced.
    for ref in re.findall(r"""(?:src|href)\s*=\s*["']([^"']+\.(?:gif|png|jpe?g|webp))["']""", text):
        if ref.startswith("http"):
            continue
        f = ROOT / ref.lstrip("./")
        if f.is_file() and f.stat().st_size > 300_000:
            err(f"{name}: {ref} is over 300 KB")
        if ref.lower().endswith(".gif"):
            err(f"{name}: {ref} is a GIF; use a small WebP")

# B12: avatar and project images.
index = all_text["index.html"]
m = re.search(r'<img\s[^>]*src="(assets/avatar\.[^"]+)"', index)
if not m or not m.group(1).endswith(".webp"):
    err("index.html: avatar must be a WebP")
elif (ROOT / m.group(1)).stat().st_size > 40_000:
    err(f"{m.group(1)} must be about 30 KB (<= 40 KB)")
for f in (ROOT / "assets/images/project-page").glob("*"):
    if f.suffix in (".png", ".jpg", ".jpeg") and f.stem in ("os", "shell", "plancare", "dsonmarket-site"):
        err(f"{f.name}: project image must be WebP only")
project_js = (ROOT / "assets/js/project.js").read_text(encoding="utf-8")
for img in re.findall(r'cardImage:\s*"([^"]+)"', project_js):
    if not img.endswith(".webp") or not (ROOT / img).is_file():
        err(f"project.js: {img} must be an existing .webp")
    elif (ROOT / img).stat().st_size > 100_000:
        err(f"{img} is over 100 KB for an 800 px card image")
if 'loading="lazy"' not in project_js:
    err("project.js: project card images need loading=lazy")
if "Hand.gif" in "".join(all_text.values()):
    err("Hand.gif is still referenced")



def webp_size(path):
    """(width, height) from a WebP header, or None if the file is not WebP."""
    b = Path(path).read_bytes()[:30]
    if len(b) < 30 or b[:4] != b"RIFF" or b[8:12] != b"WEBP":
        return None
    kind = b[12:16]
    if kind == b"VP8 ":
        w, h = struct.unpack("<HH", b[26:30])
        return w & 0x3FFF, h & 0x3FFF
    if kind == b"VP8L":
        v = int.from_bytes(b[21:25], "little")
        return (v & 0x3FFF) + 1, ((v >> 14) & 0x3FFF) + 1
    if kind == b"VP8X":
        return int.from_bytes(b[24:27], "little") + 1, int.from_bytes(b[27:30], "little") + 1
    return None


# B12: real pixel sizes. Avatar 400 x 400, project cards 800 px wide.
if m and m.group(1).endswith(".webp"):
    if webp_size(ROOT / m.group(1)) != (400, 400):
        err(f"{m.group(1)} must be 400 x 400, is {webp_size(ROOT / m.group(1))}")
for img in re.findall(r'cardImage:\s*"([^"]+)"', project_js):
    size = webp_size(ROOT / img) if (ROOT / img).is_file() else None
    if not size or size[0] != 800:
        err(f"{img} must be an 800 px wide WebP, is {size}")
for f in (ROOT / "assets/images/project-page").glob("*.webp"):
    size = webp_size(f)
    if not size or size[0] > 800:
        err(f"{f.name} must be a WebP at most 800 px wide, is {size}")

# B13: the preloader hides in <= 200 ms, without jQuery effects. research.html
# loads jQuery slim, which has no fadeOut/animate, so a jQuery fade leaves the
# loader on screen forever there.
if re.search(r"\.(fadeOut|fadeIn|fadeTo|fadeToggle|slideUp|slideDown|animate)\(", app_js):
    err("app.js: jQuery effects are not in jQuery slim (research.html); use plain DOM")
if "disappear" in app_js or re.search(r"fadeOut\(\s*\d{4}", app_js):
    err("app.js: the 1 s / 2.5 s preloader wait is back")
handlers = re.findall(r'addEventListener\("load",\s*function\s*\(\)\s*\{(.*?)\n\}\);', app_js.replace("\r", ""), re.S)
body = next((h for h in handlers if ".loader-container" in h), None)
if body is None:
    err("app.js: no window load handler hides .loader-container")
else:
    ms = [int(x) for x in re.findall(r"(\d+)\s*(?:ms\b|\)\s*;)", body)]
    if not ms or max(ms) > 200:
        err(f"app.js: preloader fade must be <= 200 ms, found {ms}")
    if "display" not in body or "none" not in body:
        err("app.js: the loader must end with display:none")
for name, text in all_text.items():
    if "loader-container" in text and "assets/js/app.js" not in text:
        err(f"{name}: has a loader but does not load app.js")

if errors:
    print("\n".join("FAIL: " + e for e in errors))
    sys.exit(1)
print(f"OK: {len(pages)} pages pass the page-speed checks")
