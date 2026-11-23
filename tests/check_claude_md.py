"""T-0015 / docs-01: CLAUDE.md is tracked in the repo and points sessions to the orchestrator rules.
Stdlib only: python tests/check_claude_md.py"""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
errors = []


def git(*args):
    return subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True)


if git("check-ignore", "-q", "CLAUDE.md").returncode == 0:
    errors.append("CLAUDE.md is ignored by .gitignore")
if not git("ls-files", "--error-unmatch", "CLAUDE.md").returncode == 0:
    errors.append("CLAUDE.md is not tracked by git")
path = ROOT / "CLAUDE.md"
text = path.read_text(encoding="utf-8") if path.is_file() else ""
for needle in ("docs/authority.md", "30 minutes", "English"):
    if needle not in text:
        errors.append(f"CLAUDE.md has no orchestrator pointer text {needle!r}")

for e in errors:
    print("FAIL:", e)
print("PASS: CLAUDE.md tracked with orchestrator pointer" if not errors else f"{len(errors)} failure(s)")
sys.exit(1 if errors else 0)
