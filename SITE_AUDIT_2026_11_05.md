# Site audit, 2026-11-05

Automated audit of https://ncue-ee-aial.github.io, built locally from `main` at `341dd1a`.

## How it was run

- **Build:** the repository's own pipeline. It is an Astro site, not Jekyll: `npm ci`, then `npm run build` (`astro check && astro build && pagefind --site dist`). The build produced **41 pages**: 20 English, 20 Traditional Chinese and `404.html`.
- **Crawl:** each page was served with `astro preview` and loaded in headless Chromium (Playwright):
  - light theme at 360, 768 and 1280 px;
  - dark theme at 360 px.

  That is 164 page renders. Each page was scrolled to the bottom so lazy-loaded images would load.
- **Repository checks:** `npm test` (203 pass, 1 skipped, 0 fail) and `node scripts/check-links.mjs dist`.
- **External links:** each one was requested with `curl` through the sandbox proxy, because the repository's checker uses Node `fetch`, which cannot reach the network from this sandbox.

## Findings by severity

### High

None.

### Medium

| # | Page / element | Finding | Status |
|---|---|---|---|
| M1 | Every English page, header `a.brand` (`src/components/Nav.astro`, `src/styles/global.css`) | At 360 px the lab name broke in the middle of words: "Applicat / ion", "Laborat / ory" (5 lines). The folded menu (`.nav-menu`, 0 px wide) still took two 16 px flex gaps. That left the name 65 px, but its longest word needs 88 px, so the `overflow-wrap: anywhere` fallback kicked in. The Chinese name was unaffected. | **Fixed** (see below) |

### Low (left for a human, not defects I could fix without a judgement call)

| # | Page / element | Finding |
|---|---|---|
| L1 | All pages, small-screen menu (`#nav-toggle`) | The menu opens and closes correctly. It shows all 8 links inside the viewport and keeps `aria-expanded` in sync, at both 360 and 768 px. **Escape does not close it.** This is not a WCAG failure for a disclosure button, but it is a common keyboard expectation. Adding it is a behaviour change, so it is left for you to decide. |
| L2 | `/search/`, `/zh/search/`, Pagefind search input | The input's accessible name comes only from `title` and `placeholder` ("Search papers, projects, people…"), with no `<label>`. Assistive technology does read it, so it is not broken. A visually hidden label would be more robust. The form is Pagefind's default UI with `action="javascript:void(0)"`. Search works: "wavelet" returns 5 results in English and 3 in Chinese. |
| L3 | Header at **320 px** (narrower than the widths this audit was asked to test) | The English name still splits mid-word at 320 px, though less than before the fix (it now gets 57 px instead of 25 px). Fixing that needs a design choice, such as a smaller font or hiding a tool button. |
| L4 | `astro check` hints (code hygiene, no effect on the site) | `PubItem.astro:61` uses the deprecated `document.execCommand`, presumably as a copy fallback. `People.astro:8` imports `s` and `UiKey` but never uses them. |
| L5 | `scripts/check-links.mjs` | Not a site defect. In this sandbox, Node `fetch` does not go through the HTTPS proxy, so every external link shows as `ENOTFOUND` (a warning, not an error). The weekly GitHub Actions run (`links-weekly.yml`) is unaffected. |

### Checks that passed everywhere

- **Internal links:** 1,666 checked (`href`, `src`, `poster`, `og:image`, `#fragments`), with 0 errors and 0 warnings. No internal request returned 4xx or failed in the browser, and there were no console errors.
- **Images:**
  - No broken images, and every `<img>` has an `alt` attribute.
  - The 114 `alt=""` images are the small headshots in `PersonTile` (People and Alumni lists), each shown right next to the person's name. That is the correct decorative pattern, so no caption-derived alt text was needed.
  - All photos and figures have descriptive alt text in the page's own language.
  - Every `svg[role=img]` has a name.
- **Headings:** every page has exactly one `h1` and no skipped levels (for example h2 → h4). There are no empty headings.
- **`html lang`:** `en` on all English pages and `404.html`; `zh-Hant-TW` on all `/zh/` pages. The language switch link carries `lang` and `hreflang`.
- **Viewport meta:** `width=device-width, initial-scale=1` on all 41 pages.
- **Horizontal overflow:** none at 360, 768 or 1280 px, in light or dark theme, with the menu open or closed, and with JavaScript off at 360 and 768 px.
- **Colour contrast:** every visible text element on the 164 renders meets WCAG AA (4.5:1 for normal text, 3:1 for large text). On the People page:

  | Theme | Body text | Muted text (`.muted`) |
  |---|---|---|
  | Light | #111827 on #fff = 17.7:1 | 6.0:1 |
  | Dark | 15.5:1 | 7.1:1 |

- **Forms:** the only `<form>` is the Pagefind search (L2). The filter radios on Projects and Publications are all labelled. There are no forms that post elsewhere, and there are no third-party scripts.
- **Other:** there is a skip link, no `http://` (mixed-content) URLs, no duplicate `id`s and no links without an accessible name.

## Fix applied (branch `cloud/site-audit-2026-11-05`)

`src/styles/global.css`, inside the existing `@media (max-width: 1180px)` block:

```css
html.js .nav-menu { margin-inline: -14px; }
```

- **What it does:** it cancels 28 of the 32 px the empty menu box took as flex gaps. The menu button now sits 4 px from the tool buttons, the same spacing those buttons have between them. At 360 px the English name gets 93 px (88 needed) and wraps cleanly at spaces as "AI / Application / Laboratory".
- **Scope:** it applies only when JavaScript is on. The no-JS layout, where the links sit in a second row, is unchanged and was re-checked: no overflow at 360 or 768 px.
- **Re-check:** after the change, the full crawl again showed 0 problems in 164 renders. `npm test` passes (203/203 run, 1 skipped) and the internal link check shows 0 errors.

The Chinese name's `<wbr>` break and the CSS rules guarded by `tests/a11y.test.mjs` are untouched.

**Nothing else was changed.** That includes names, titles, affiliations, e-mails, publications, wording and Alumni data; no analytics, trackers or scripts were added.

## Left for a human

1. **External links: not checkable from the sandbox.** Of 161 unique external URLs, 1 returned 200 (`github.com/NCUE-EE-AIAL/ncue-ee-aial.github.io`). The proxy blocked the other 160:
   - **10 GitHub URLs:** the org page, 6 lab repositories, the `brian10420` profile and its `EchoMind-Mamba-VA-SER` repository, and this repo's "new issue" page. The proxy refused these because they are outside this session's GitHub scope.
   - **150 URLs** on other hosts: `hdl.handle.net` (NDLTD theses, about 80), `doi.org`, `ieeexplore.ieee.org`, `digital-library.theiet.org`, `arxiv.org`, `mdpi.com`, `sciencedirect.com`, `igi-global.com`, `opg.optica.org`, `iaeng.org`, `tj.uettaxila.edu.pk`, `orcid.org`, `scholar.google.com`, `linkedin.com`, `facebook.com`, `docs.google.com` (the alumni form), `google.com/maps`, `ncue.edu.tw`, `teep.studyintaiwan.org`, `iipp.stpi.niar.org.tw` and `brian10420.github.io`.

   **None of these were found to be broken; none could be tested.** The weekly "Check external links" workflow checks them from GitHub's runners and opens a `broken-links` issue if any are gone.
2. **Content questions:** none found. No wording, people or publication data was reviewed for accuracy, which is outside an automated audit.
3. **Optional improvements:** L1 (Escape closes the menu), L2 (a real label on the search input), L3 (the header at 320 px) and L4 (`astro check` hints).
