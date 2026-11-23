"""T-0001: a visitor never keeps an old stylesheet or script after the site changes.

vercel.json serves /assets/* as "max-age=31536000, immutable", so a browser reuses a
cached file for a year without asking again. Every local .css/.js reference in a page
(href/src) or stylesheet (@import) must therefore carry ?v=<hash of the file>, so a
changed file gets a new URL. Before this check, a browser that had cached the old
home.css showed the home page with the avatar below the first screen.

Run from the repo root:  python tests/check_asset_versions.py
Exits non-zero and prints each reference to fix, with the value it must have.
"""
import hashlib
import posixpath
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REF = re.compile(r"""(?:\b(?:href|src)\s*=\s*["']|@import\s+(?:url\()?\s*["']?)([^"'()\s>]+\.(?:css|js)(?:\?[^"'()\s>]*)?)""", re.I)
COMMENTS = re.compile(r"<!--.*?-->|/\*.*?\*/", re.S)
# Same fault, not fixed here: check_education.py and check_research_skills.py pin these
# pages' unversioned references, and changing those assertions is a separate task.
KNOWN_UNVERSIONED = {"education.html", "research.html", "techstack.html", "assets/css/education.css"}


def version(path):
    """First 8 hex of sha256 over the file with LF line ends (as Git stores and Vercel serves it)."""
    return hashlib.sha256(path.read_bytes().replace(b"\r\n", b"\n")).hexdigest()[:8]


tracked = subprocess.check_output(["git", "ls-files"], cwd=ROOT, text=True).splitlines()
errors, checked = [], 0
for f in tracked:
    if not f.endswith((".html", ".css")) or ".min." in f or f in KNOWN_UNVERSIONED:
        continue
    text = COMMENTS.sub("", (ROOT / f).read_text(encoding="utf-8", errors="ignore"))
    for ref in REF.findall(text):
        if re.match(r"(https?:)?//|data:", ref):
            continue
        path, _, query = ref.partition("?")
        base = posixpath.dirname(f) if f.endswith(".css") and not path.startswith("/") else ""
        target = posixpath.normpath(posixpath.join(base, path.lstrip("/")))
        checked += 1
        if target not in tracked:
            errors.append(f"{f}: {ref!r} -> {target} is not a tracked file")
            continue
        want = f"v={version(ROOT / target)}"
        if query != want:
            errors.append(f"{f}: {ref!r} must be '{path}?{want}' (immutable cache: an unchanged URL keeps the old file)")

if checked < 20:
    errors.append(f"found only {checked} local .css/.js references; the pattern is broken")
if errors:
    print("\n".join(errors))
    sys.exit(1)
print(f"OK: {checked} local .css/.js references carry the current ?v= hash of their file")
