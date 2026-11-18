"""Regression check for the experience cards (content from the master resume + accessibility).

Run from the repo root:  python tests/check_experience.py
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


js = (ROOT / "assets/js/experience.js").read_text(encoding="utf-8")
app = (ROOT / "assets/js/app.js").read_text(encoding="utf-8")

# Parse the `exp` array: one object per card.
block = js[js.index("const exp = ["): js.index("const showCards2")]
cards = {}
for m in re.finditer(r"\{\s*title:\s*\"(.*?)\",\s*cardImage:\s*\"(.*?)\",\s*alt:\s*\"(.*?)\",\s*place:\s*\"(.*?)\",\s*time:\s*\"(.*?)\",\s*desp:\s*\"(.*?)\",\s*\}", block, re.S):
    title, image, alt, place, time, desp = m.groups()
    cards[place] = dict(title=title, image=image, alt=alt, time=time, desp=desp,
                        bullets=re.findall(r"<li>(.*?)</li>", desp))
check(len(re.findall(r"cardImage:", block)) == len(cards),
      "experience.js: a card is missing title/cardImage/alt/place/time/desp")

# Expected content: the master resume's EXPERIENCE section, word for word
# (LaTeX bold dropped, \% -> %, $\rightarrow$ -> &rarr;). Whole bullets are compared, so a
# changed verb ("Cut" -> "Raised"), number or qualifier ("over", "+", "under") fails.
EXPECTED = {
    'HBC Nexus': dict(title='AI Engineer Intern', time='(June 2026 - August 2026)', bullets=[
        "Scaled a B2B computer vision backend from 10,000 to 50,000 daily images by moving from single-tenant to multi-tenant, reworking tenant routing and authentication, and authoring the Expand &rarr; Backfill &rarr; Contract schema migration that cut the database over without downtime, improving the efficiency of the retail service.",
        "Cut the full agent test cycle 83% (12 minutes to 2 minutes) across 12 AI agents by parallelizing tests with a GitHub Actions matrix and mocking Kafka, MinIO, and Qdrant to unblock backend work while agents were still in progress.",
        "Owned the GitHub Actions CI/CD pipeline, identifying failures in 12% of PR runs before they reached production by gating merges on unit and integration tests with an 80% coverage floor against Dockerized staging builds.",
        "Cut production query time by 60% across 9 FastAPI and PostgreSQL endpoints by designing them to store 3 variable-shape pipeline fields in native JSONB as indexed, queryable columns instead of fully normalizing the schema.",
    ]),
    'Pal AI': dict(title='Software Engineer Intern', time='(January 2026 - May 2026)', bullets=[
        "Owned backend infrastructure as the sole engineer on Supabase for an AI college advising platform serving 1,500 students, designing the database schemas behind essay analysis and chat.",
        "Cut chat API latency 70% (400ms to 120ms) with cursor-based pagination and lazy loading, and primary-database queries 60% with a Redis layer caching the context every chat session reloads.",
        "Held a 97%+ pass rate in production by hardening the chat pipeline against provider outages with queue-paced retries and typed error classification, falling back to prepared responses when the model API failed.",
        "Improved AI context awareness across over 1,000 PDFs and 5,000+ images by embedding student uploads into pgvector via LlamaParse, letting GPT-4o mini reference them instead of summarizing each file once.",
    ]),
    'USTechBridge': dict(title='Software Engineer Intern', time='(September 2025 - December 2025)', bullets=[
        "Built a voice-controlled AI agent reaching 95%+ success rate across 5 intent types, integrating Alexa and AWS Bedrock with Lambda and DynamoDB.",
        "Cut AI usage cost by 57% across 200K monthly requests by benchmarking and shipping tiered model routing that sends booking and rescheduling to Sonnet and 70% of read-only queries to Haiku while holding success rate over 95%.",
        "Cut intent-recognition error rate from 50% to 1% on a 500-case golden set by adding a pre-parsing step that segments raw transcribed speech before Sonnet synthesizes intent, validated across 5 iterations before deploying.",
    ]),
    'FPT Software': dict(title='Software Engineer Intern', time='(May 2025 - September 2025)', bullets=[
        "Built an AI-assisted travel planner for 3,000+ users in React, Node.js/Express, and MongoDB, grounding Gemini-generated itineraries in real place data.",
        "Cut hallucinated place suggestions from 20% to under 1% across 50,000+ generated trips by seeding the RAG corpus with Serper-scraped place data across 64 cities (850+ place insights).",
    ]),
}
# Numbers from older, unsupported text that must not come back.
STALE = ["500+ applicants", "99.9%", "by 40%", "80+ unit tests", "sub-200ms", "Present"]

check(list(cards) == list(EXPECTED), f"experience.js: cards are {list(cards)}, expected {list(EXPECTED)} in that order")
for place, want in EXPECTED.items():
    c = cards.get(place)
    if not c:
        errors.append(f"experience.js: missing card {place}")
        continue
    check(c["title"] == want["title"], f"{place}: title {c['title']!r} != {want['title']!r}")
    check(c["time"] == want["time"], f"{place}: time {c['time']!r} != {want['time']!r}")
    check(len(c["bullets"]) == len(want["bullets"]),
          f"{place}: {len(c['bullets'])} bullets, expected {len(want['bullets'])}")
    for i, (got, exp_b) in enumerate(zip(c["bullets"], want["bullets"]), 1):
        check(got == exp_b, f"{place}: bullet {i} differs from the resume:\n  got  {got!r}\n  want {exp_b!r}")
    check(c["desp"] == "".join(f"<li>{b}</li>" for b in want["bullets"]),
          f"{place}: desp has text outside the resume bullets")
    for s in STALE:
        check(s not in c["desp"] and s not in c["time"], f"{place}: stale text {s!r} is back")
    check(c["alt"].strip() != "", f"{place}: logo alt text is empty")
    check((ROOT / c["image"]).is_file(), f"{place}: logo {c['image']} does not exist")

# Every <img> the page script generates has an alt attribute (the Hackathon template uses alt="").
for m in re.finditer(r"<img\b[^>]*>", js):
    check(re.search(r"\balt=", m.group(0)) is not None, f"experience.js: <img> without alt: {m.group(0)[:60]}")
check('class="featured-image" alt="${alt}"' in js, "experience.js: card logo must use the card's alt text")

# Icon-only links and buttons rendered on the page (shared footer in app.js) carry an aria-label.
for name, cls in (("LinkedIn", "social-button linkedin"), ("GitHub", "social-button github")):
    m = re.search(r'<a class="%s"([^>]*)>' % re.escape(cls), app)
    check(m is not None and f'aria-label="{name} profile"' in m.group(1), f"app.js: {name} icon link needs aria-label")
    check(m is not None and "noopener" in m.group(1), f"app.js: {name} icon link needs rel=noopener")
m = re.search(r'<button id="btnScrollToTop"([^>]*)>', app)
check(m is not None and 'aria-label="Scroll to top"' in m.group(1), "app.js: scroll-to-top button needs aria-label")

# Self-test: the bullet comparison rejects a reversed claim and a dropped qualifier.
def bullets_match(place, desp):
    return re.findall(r"<li>(.*?)</li>", desp) == EXPECTED[place]["bullets"]

for place, old, new in (("HBC Nexus", "Cut production query time by 60%", "Raised production query time by 60%"),
                        ("Pal AI", "over 1,000 PDFs", "1,000 PDFs"),
                        ("Pal AI", "97%+ pass rate", "97% pass rate")):
    desp = cards.get(place, {}).get("desp", "")
    mutated = desp.replace(old, new)
    check(mutated != desp and not bullets_match(place, mutated),
          f"self-test: changing {old!r} to {new!r} in {place} would go unnoticed")

if errors:
    print("\n".join("FAIL: " + e for e in errors))
    sys.exit(1)
print("OK: experience cards match the resume; logos have alt text; icon links have aria-labels")
