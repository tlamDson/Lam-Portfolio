"""Acceptance checks for the home hero (C02) and the Projects intro (B27).

Run from the repo root:  python tests/check_hero.py
Exits non-zero and prints each failure.
"""
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NUMBER = re.compile(r"\d+(?:[.,]\d+)*")
errors = []


def check(cond, msg):
    if not cond:
        errors.append(msg)


class Page(HTMLParser):
    """Collects h1 texts, the hero line, project tiles and the projects intro."""

    def __init__(self):
        super().__init__()
        self.stack, self.h1, self.line, self.tiles, self.intro = [], [], [], [], []
        self.tile = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        # Read every class attribute: the projects intro <p> has two.
        cls = " ".join(v or "" for k, v in attrs if k == "class").split()
        if tag in ("img", "br", "meta", "link", "input", "hr"):
            if tag == "img" and self.tile is not None:
                self.tile["text"].append(a.get("alt") or "")
            return
        self.stack.append((tag, cls))
        if tag == "a" and any("hero-projects" in c for _, c in self.stack[:-1]):
            self.tile = {"href": a.get("href"), "name": [], "stat": [], "note": [], "text": []}

    def handle_endtag(self, tag):
        while self.stack:
            t, _ = self.stack.pop()
            if t == tag:
                break
        if tag == "a" and self.tile is not None:
            self.tiles.append(self.tile)
            self.tile = None

    def inside(self, tag=None, cls=None):
        return any((tag is None or t == tag) and (cls is None or cls in c) for t, c in self.stack)

    def handle_data(self, data):
        if self.inside("h1"):
            self.h1.append(data)
        if self.inside(cls="hero-line"):
            self.line.append(data)
        if self.inside(cls="pre-heading"):
            self.intro.append(data)
        if self.tile is not None:
            self.tile["text"].append(data)
            for key in ("name", "stat", "note"):
                if self.inside(cls=f"hero-project-{key}"):
                    self.tile[key].append(data)


def parse(name):
    p = Page()
    p.feed((ROOT / name).read_text(encoding="utf-8"))
    return p


def squash(parts):
    return " ".join(" ".join(parts).split())


# Home: the h1 is the name, and it is the only h1.
home = parse("index.html")
check(home.h1 and squash(home.h1) == "Liam Pham", f"index.html h1 must be 'Liam Pham', got {squash(home.h1)!r}")
check(len(re.findall(r"<h1\b", (ROOT / "index.html").read_text(encoding="utf-8"), re.I)) == 1, "index.html must have exactly one <h1>")

# Home: one line saying who he is and what he is looking for. The exact text is
# pinned so that no word of it (e.g. "software engineering") can drift unnoticed.
HERO_LINE = (
    "CS and Math student at Dickinson College, seeking software engineering "
    "internships in backend, data and AI infrastructure."
)
line = squash(home.line)
check(line == HERO_LINE, f"hero line must be exactly {HERO_LINE!r}, got {line!r}")

# Home: three featured projects, in order, each linking to projects.html with exactly
# one number. Stat and note text are pinned, and each number must appear in that
# project's card data in assets/js/project.js.
TILES = [
    ("RepoPulse", "80% less data scanned", "Hourly ELT pipeline on GitHub event data"),
    ("TravelPlan", "61.6% backend test coverage", "Gemini-powered travel planner, web and mobile"),
    ("Operating System", "500 fork/exit cycles", "Process table back to its exact baseline"),
]
cards = (ROOT / "assets/js/project.js").read_text(encoding="utf-8")
names = [squash(t["name"]) for t in home.tiles]
check(names == [n for n, _, _ in TILES], f"featured projects must be {[n for n, _, _ in TILES]}; got {names}")
for t, (name, stat, note) in zip(home.tiles, TILES):
    check(t["href"] == "/projects", f"{name} tile must link to /projects, got {t['href']!r}")
    check(squash(t["stat"]) == stat, f"{name} tile stat must be {stat!r}, got {squash(t['stat'])!r}")
    check(squash(t["note"]) == note, f"{name} tile note must be {note!r}, got {squash(t['note'])!r}")
    rest = squash(t["text"]).replace(name, "", 1)
    nums = NUMBER.findall(rest)
    check(len(nums) == 1, f"{name} tile must show exactly one number, found {nums} in {rest!r}")
    start = cards.find(f'title: "{name}"')
    end = cards.find("title:", start + 1)
    card = cards[start:end if end != -1 else len(cards)]
    check(start != -1 and all(n in card for n in nums), f"{name} tile number {nums} is not in its project.js card")

# Projects page: the intro is two plain sentences and the old copy is gone.
intro = squash(parse("projects.html").intro)
sentences = [s for s in re.split(r"(?<=[.!?])\s+", intro) if s]
check(len(sentences) == 2, f"projects.html intro must be two sentences, got {len(sentences)}: {intro!r}")
check("vast variety" not in intro and "Data Science" not in intro, "projects.html intro still has the old copy")

if errors:
    print("\n".join(errors))
    sys.exit(1)
print("hero and projects intro: ok")
