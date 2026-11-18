"""Regression check for the education page (missing images, dead template code, card layout).

Run from the repo root:  python tests/check_education.py
Exits non-zero and prints each failure.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
errors = []


def check(cond, msg):
    if not cond:
        errors.append(msg)


def exists_exact(rel):
    """True only if the path exists with this exact letter case (Vercel is case-sensitive)."""
    path = ROOT
    for part in Path(rel).parts:
        if part not in {p.name for p in path.iterdir()}:
            return False
        path = path / part
    return path.exists()


html = (ROOT / "education.html").read_text(encoding="utf-8")
js = (ROOT / "assets/js/education.js").read_text(encoding="utf-8")
css = (ROOT / "assets/css/education.css").read_text(encoding="utf-8")

# B09: every local image referenced by the page and its script exists, with exact case.
refs = set(re.findall(r"""(?:url\(['"]?|src=["']?|cardImage:\s*["'])(assets/[^'")\s>]+)""", html + js))
check(refs, "education: found no local image references (check pattern)")
for ref in sorted(refs):
    check(exists_exact(ref), f"education: referenced file missing or wrong case: {ref}")
check("DataCamp.png" in js, "education.js: DataCamp card must use assets/images/education-page/DataCamp.png")

# B10: template carousel and badges code is gone; ScrollReveal is guarded.
for needle in ("showExperience", "setInterval", 'getElementById("image")', ".badges", "badgesection", "prevBtn", "nextBtn"):
    check(needle not in js, f"education.js: dead template code still present: {needle}")
check('document.querySelector(".moocs")' in js and 'class="row moocs"' in html,
      "education: .moocs container must exist in the HTML for the MOOC cards")
for sel in re.findall(r'document\.querySelector\("([^"]+)"\)', js):
    check(sel.lstrip(".#") in html, f"education.js: selector {sel} has no element in education.html")
for sel in re.findall(r'getElementById\("([^"]+)"\)', js):
    check(f'id="{sel}"' in html, f"education.js: #{sel} has no element in education.html")
if "ScrollReveal(" in js:
    check('typeof ScrollReveal === "undefined"' in js, "education.js: ScrollReveal call must be guarded")

# Timeline cards: no empty header blocks, and content must be in normal flow so the card has height
# (an absolutely positioned .alignment collapses the card when there is no header image).
check("timeline-img-header" not in html, "education.html: timeline-img-header blocks have no images; remove them")
m = re.search(r"nth-child\(even\)\s+\.timeline-content\s+\.alignment\s*\{([^}]*)\}", css)
check(m is not None and "position:absolute" not in re.sub(r"\s", "", m.group(1)),
      "education.css: even timeline card .alignment must not be position:absolute (card collapses)")

if errors:
    print("\n".join(errors))
    sys.exit(1)
print("education checks passed")
