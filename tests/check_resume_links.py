"""Regression check for the Resume links (navbar + home hero).

Run from the repo root:  python tests/check_resume_links.py
Exits non-zero and prints each failure.
"""
import hashlib
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PDF = "assets/docs/Liam_Pham_Resume.pdf"
# The owner chose this exact file (AutoApply/templates/SWE/Liam_Pham_SWE.pdf).
# It is published byte-for-byte; any edit, re-export or swap must fail here.
PDF_SHA256 = "1bbd6e8d287f297eb5c883366bff8a08429c912f41c4591d1f74dde8c6cc4156"
PDF_SIZE = 63979
errors = []


def check(cond, msg):
    if not cond:
        errors.append(msg)


def anchors(text):
    """Yield (attrs, label) for every <a ...>label</a>."""
    for m in re.finditer(r"<a\b([^>]*)>(.*?)</a\s*>", text, re.S | re.I):
        yield m.group(1), re.sub(r"<[^>]+>", "", m.group(2)).strip()


def resume_anchors(path):
    text = (ROOT / path).read_text(encoding="utf-8")
    return text, [a for a, label in anchors(text) if label == "Resume"]


# The PDF exists and is exactly the owner-selected file.
pdf = ROOT / PDF
check(pdf.is_file(), f"{PDF} is missing")
if pdf.is_file():
    data = pdf.read_bytes()
    check(data[:5] == b"%PDF-", f"{PDF} is not a PDF")
    check(len(data) == PDF_SIZE, f"{PDF} size changed: {len(data)} != {PDF_SIZE}")
    digest = hashlib.sha256(data).hexdigest()
    check(digest == PDF_SHA256, f"{PDF} is not the owner-selected file (sha256 {digest})")
check(not (ROOT / "assets/docs/john_doe.pdf").exists(), "john_doe.pdf must stay removed")

for page, where in (("assets/js/app.js", "navbar"), ("index.html", "home hero")):
    text, found = resume_anchors(page)
    check(len(found) == 1, f"{page}: expected exactly one Resume link ({where}), found {len(found)}")
    for attrs in found:
        check(f'href="{PDF}"' in attrs, f"{page}: Resume link must point to {PDF}")
        check('target="_blank"' in attrs, f"{page}: Resume link must open in a new tab")
        check("noopener" in attrs, f"{page}: Resume link needs rel=noopener")
    check("john_doe" not in text, f"{page}: still references john_doe.pdf")

# The navbar's Skills link had a doubled closing quote.
nav = (ROOT / "assets/js/app.js").read_text(encoding="utf-8")
check('href="/techstack"">' not in nav, 'app.js: href="/techstack"" double quote is back')
check('href="/techstack"' in nav, "app.js: Skills link missing")

if errors:
    print("\n".join("FAIL: " + e for e in errors))
    sys.exit(1)
print("OK: Resume links present in navbar and home hero")
