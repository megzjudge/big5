# The Big Five Aspects Scale

A static site that presents individual personality results from Jordan Peterson's **Big Ten** model on [Understand Myself](https://www.understandmyself.com/personality-assessment) — five OCEAN traits, ten measurable aspects, percentile scores, population benchmarks, and write-ups for what each score means.

## GitHub

**Topics:** `big-five`, `personality`, `ocean`, `psychology`, `static-site`, `understand-myself`, `plotly`

## What it is

This is a personal results page, not a test itself. Scores come from the official Understand Myself assessment. The site turns those percentiles into something easier to explore: progress bars, animated bell curves, trait profiles, trait-combination notes, and embedded Jordan Peterson clips matched to the results.

The layout follows standard **OCEAN** order:

**O**penness → **C**onscientiousness → **E**xtraversion → **A**greeableness → **N**euroticism

Each trait is its own section, with a stylised OCEAN header highlighting the active letter (e.g. **O**CEAN, o**C**ean).

## Features

- **My Results** — score overview pills linking to each trait
- **Per-trait sections** — aspect bars, men/women population comparison bars, Plotly bell curves
- **Trait profiles** — accordion write-ups with images, folded under each trait's curves
- **Combinations** — notes on how overlapping scores tend to show up together
- **Videos** — timestamped YouTube embeds related to specific trait patterns
- **About the test** — short intro to OCEAN, the Big Ten model, Understand Myself vs free alternatives, and how to read percentiles

## Tech stack

Plain static front end — no build step, no framework.

| File | Role |
|------|------|
| `index.html` | Content, scores, trait copy, embeds |
| `styles.css` | Layout, OCEAN theming, trait panels, accordions |
| `layout.js` | Groups raw sections into trait panels, score overview, profile accordions |
| `script.js` | Progress bar animation, bell curves (Plotly), scroll/reveal behaviour |
| `images/` | Trait and aspect artwork |

**Dependencies (CDN):** [Plotly.js](https://plotly.com/javascript/) for bell-curve charts.

Deployed as static files (e.g. Cloudflare Pages). See `_headers` for CSP.

## Customising for your own results

Most editable content lives in `index.html`:

1. Update percentile values on `.progress-bar`, `.progress-bar-men`, and `.progress-bar-women` elements (`data-progress`, labels).
2. Update matching `data-me`, `data-men`, and `data-women` on each `.bellCurve` div.
3. Swap trait profile copy and images under the hidden `#traits-stack` source block.
4. Adjust the About panel copy in the `#about` section if needed.

`layout.js` reads that markup at load time and assembles the finished layout automatically.

## Credits

- Trait descriptions and scoring framework from Jordan Peterson's [Big Five Aspects Scale](https://www.understandmyself.com/personality-assessment) on Understand Myself
- Big Five / Big Ten research background: DeYoung et al.; see the correlation diagram source linked on the site

## License

Personal project. Trait text and images are for illustrating one person's results; Understand Myself remains the rights holder for the images and report contents.
