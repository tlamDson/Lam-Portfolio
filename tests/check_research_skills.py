"""Regression check for research entries and skill groups (content from the master resume).

Runs research.js and techstack.js with node against a stub DOM and checks the HTML they render,
plus that each page has the mount point and loads the libraries the script needs. Then runs
tests/check_research_details.js, which clicks each DETAILS button in headless Chrome (needs network
for the page's CDN libraries).

Run from the repo root:  python tests/check_research_skills.py
Exits non-zero and prints each failure.
"""
import re
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
errors = []


def check(cond, msg):
    if not cond:
        errors.append(msg)


def render(script, selector):
    out = subprocess.run(["node", str(ROOT / "tests/render_page_script.js"), str(ROOT / script), selector],
                         capture_output=True, text=True, encoding="utf-8")
    check(out.returncode == 0, f"{script}: node failed: {out.stderr.strip()}")
    return out.stdout


class Tree(HTMLParser):
    """Collects every tag with its attributes and the text inside each element."""

    def __init__(self):
        super().__init__()
        self.tags, self.stack, self.texts = [], [], []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        self.tags.append((tag, a))
        if tag not in ("img", "br"):
            self.stack.append((tag, len(self.texts)))
            self.texts.append([tag, a, ""])

    def handle_endtag(self, tag):
        while self.stack:
            if self.stack.pop()[0] == tag:
                break

    def handle_data(self, data):
        for _, i in self.stack:
            self.texts[i][2] += data


def parse(html):
    t = Tree()
    t.feed(html)
    return t


def text_of(tree, tag, cls=None):
    return [" ".join(s.split()) for g, a, s in tree.texts
            if g == tag and (cls is None or cls in a.get("class", "").split())]


def page_has(page, *needles):
    html = (ROOT / page).read_text(encoding="utf-8")
    for n in needles:
        check(n in html, f"{page}: missing {n!r}")


def check_images(tree, label):
    for g, a in tree.tags:
        if g == "img":
            check(a.get("alt"), f"{label}: image without alt: {a.get('src')}")
            check((ROOT / a.get("src", "")).is_file(), f"{label}: missing image {a.get('src')}")


# ---------- research page ----------
page_has("research.html", '<tbody class="main">', "aos.js", "jquery", "bootstrap", 'src="assets/js/research.js"')
r = parse(render("assets/js/research.js", ".main"))
rows = [a for g, a in r.tags if g == "tr"]
check(len(rows) == 2, f"research: expected 2 rendered entries, got {len(rows)}")
check(text_of(r, "a", "paperTitle") == ["Underwater Object Detection", "Hyperbot AutoResearch"],
      f"research: titles {text_of(r, 'a', 'paperTitle')}")
check(text_of(r, "div", "authors") == ["With Water Resources University", "With Dickinson College"],
      f"research: organisations {text_of(r, 'div', 'authors')}")
check(text_of(r, "div", "researchY") == ["May 2026 – Aug 2026", "Jan 2026 – May 2026"],
      f"research: dates {text_of(r, 'div', 'researchY')}")
conf = text_of(r, "div", "rConferences")
check(len(conf) == 2 and conf[0].startswith("Machine Learning Researcher | YOLOv8, PyTorch, OpenCV, Python")
      and conf[1].startswith("Machine Learning Researcher | Python, PyTorch"), f"research: role lines {conf}")

# Each DETAILS button targets its own panel, and the panels hold the resume bullets.
# tests/check_research_details.js (run at the end) clicks them in a real browser.
targets = [a["data-target"].lstrip("#") for g, a in r.tags if g == "button" and "data-target" in a]
panels = [a["id"] for g, a in r.tags if g == "div" and "collapse" in a.get("class", "").split()]
check(targets == panels and len(set(panels)) == 2, f"research: buttons {targets} vs panels {panels}")
check(not any(g == "button" and "CITE" in s for g, _, s in r.texts), "research: CITE button still rendered")
bullets = text_of(r, "li")
check(len(bullets) == 4, f"research: expected 4 bullets, got {len(bullets)}")
for needle in ["URPC2020 (7,543 images, 4 classes) under a 7:2:1 train/val/test split",
               "3.3 points in mAP50 (to 84.3%)", "5.9 points in mAP50-95 (to 47.9%)",
               "Precision to 82.1% (+6.1)", "Recall to 75.9% (+5.9)",
               "up to 100-digit addition and multiplication",
               "from 20 to 5 minutes at 100% accuracy", "50 configurations across 4 rounds"]:
    check(any(needle in b for b in bullets), f"research: no rendered bullet contains {needle!r}")
check_images(r, "research")

# ---------- tech stack page ----------
page_has("techstack.html", 'class="techstack-box"', "aos.js", 'src="assets/js/techstack.js"',
         'href="assets/css/techstack.css"')
html = render("assets/js/techstack.js", ".techstack-box")
t = parse(html)
resume = {
    "Languages": ("Python, TypeScript, JavaScript, C, C++, Java", ["Python", "TypeScript", "JavaScript", "C", "C++"]),
    "Backend": ("Node.js, Express.js, NestJS, FastAPI, Supabase, Zod, SQLAlchemy, RESTful APIs",
                ["Node.js", "Express.js", "FastAPI", "Supabase"]),
    "Frontend": ("React, React Native, Next.js, Tailwind", ["React", "Next.js"]),
    "Infra & DevOps": ("Docker, AWS (Lambda, DynamoDB, S3), Cloudflare R2, Railway, Vercel, Git, GitHub Actions, "
                       "Kafka, MinIO, BullMQ, QEMU, POSIX System Calls", ["Docker", "AWS", "Git"]),
    "Data": ("PostgreSQL, MongoDB, Redis, Prisma, pgvector, SQL, dbt, PySpark, Delta Lake, DuckDB, MotherDuck, "
             "Snowflake, Tableau", ["PostgreSQL", "MongoDB", "Redis", "SQL"]),
    "ML & AI": ("PyTorch, YOLO, OpenCV, OpenAI, Gemini, Claude (Sonnet, Haiku), AWS Bedrock, LlamaParse, Qdrant, "
                "RAG, LangChain, MCP", ["PyTorch"]),
}
check(text_of(t, "h3", "skill-group-name") == list(resume),
      f"techstack: rendered groups {text_of(t, 'h3', 'skill-group-name')} do not follow the resume")
check(text_of(t, "p", "skill-group-list") == [v[0] for v in resume.values()],
      "techstack: rendered skill lines differ from the resume")
sections = html.split('<section class="skill-group">')[1:]
check(len(sections) == len(resume), f"techstack: {len(sections)} group sections rendered")
for (name, (_, cards)), sec in zip(resume.items(), sections):
    got = [" ".join(s.split()) for s in re.findall(r"<h4>(.*?)</h4>", sec, re.S)]
    check(got == cards, f"techstack: group {name} renders cards {got}, expected {cards}")
for name in ["Firebase", "Socket.io"]:
    check(name not in text_of(t, "h4"), f"techstack: {name} is not in the resume")
check_images(t, "techstack")

css = (ROOT / "assets/css/techstack.css").read_text(encoding="utf-8")
for cls in [".skill-group {", ".skill-group-name", ".skill-group-list", ".skill-group-cards"]:
    check(cls in css, f"techstack.css: no rule for {cls.rstrip(' {')}")

# ---------- tech stack page in a real browser: cards visible and laid out at 1366 and 390 px ----------
out = subprocess.run(["node", str(ROOT / "tests/check_skills_cards.js")], capture_output=True, text=True,
                     encoding="utf-8", timeout=180)
check(out.returncode == 0, f"techstack (browser): {(out.stdout + out.stderr).strip()}")

# ---------- research page in a real browser: DETAILS reveals the bullets ----------
out = subprocess.run(["node", str(ROOT / "tests/check_research_details.js")], capture_output=True, text=True,
                     encoding="utf-8", timeout=180)
check(out.returncode == 0, f"research (browser): {(out.stdout + out.stderr).strip()}")

if errors:
    print("\n".join(errors))
    sys.exit(1)
print("OK: research entries and resume skill groups render with resume facts")
