# Liam Pham — Portfolio

Live site: https://lamportfolio.vercel.app

Personal portfolio of Liam Pham, software engineer and Computer Science and Mathematics student at Dickinson College. Pages: Home, Experience, Projects, Research, Education, Skills.

## Stack

- Static HTML, CSS and jQuery 3.5 (no build step)
- Bootstrap 4, Font Awesome and particles.js, loaded from CDNs
- Hosted on Vercel (`vercel.json` turns on clean URLs such as `/projects` and sets cache headers)

## Run locally

Needs [Node.js](https://nodejs.org/). From the repo root:

```powershell
npx serve .
```

Then open the address it prints. `serve` handles clean URLs the same way Vercel does, so the nav links work. A plain `python -m http.server` also serves the pages, but links without `.html` (like `/projects`) will 404 there.

Checks (Python 3, standard library only):

```powershell
python tests/check_seo.py
```

The other scripts in `tests/` check the hero, project cards, experience entries, that the resume stays off the site, and page speed.

## License

MIT, see [LICENSE](LICENSE).
