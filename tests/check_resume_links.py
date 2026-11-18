"""Regression check: the resume is not public on the site.

The owner removed the resume PDF and every link to it (navbar + home hero).
Run from the repo root:  python tests/check_resume_links.py
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


# No PDF is published anywhere in the site.
pdfs = [p.relative_to(ROOT).as_posix() for p in ROOT.rglob("*.pdf")
        if ".git" not in p.parts and ".claude" not in p.parts]
check(not pdfs, f"PDF files are published: {pdfs}")

# No page, script, sitemap or README links to a PDF or shows a Resume link.
files = [p for p in ROOT.rglob("*")
         if p.suffix in (".html", ".js", ".xml", ".md", ".json") and p.is_file()
         and not {".git", ".claude", "tests"} & set(p.parts) and not p.name.endswith(".min.js")]
for p in files:
    text = p.read_text(encoding="utf-8", errors="replace")
    rel = p.relative_to(ROOT).as_posix()
    check(not re.search(r"\.pdf\b", text, re.I), f"{rel}: references a .pdf")
    check(not re.search(r">\s*Resume\s*</a", text), f"{rel}: has a Resume link")
    check("resume-btn" not in text, f"{rel}: still uses resume-btn")

# Every other navbar item stays.
nav = (ROOT / "assets/js/app.js").read_text(encoding="utf-8")
for href in ("/", "/experience", "/projects", "/research", "/education", "/techstack"):
    check(f'class="nav-link" href="{href}"' in nav, f"app.js: nav link {href} missing")
check('href="/techstack"">' not in nav, 'app.js: href="/techstack"" double quote is back')

if errors:
    print("\n".join("FAIL: " + e for e in errors))
    sys.exit(1)
print("OK: no resume PDF or Resume link on the site; other nav items present")
