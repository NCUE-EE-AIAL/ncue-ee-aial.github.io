# AI Application Laboratory · NCUE EE — website

Live: https://ncue-ee-aial.github.io/ (en) · https://ncue-ee-aial.github.io/zh/ (繁中)

Static site built with [Astro](https://astro.build). Content lives in `src/content/` as YAML / Markdown;
adding a paper, person, project or news post means adding one file — see `CONTRIBUTING.md`.
Pushing to `main` builds and deploys automatically via GitHub Actions.

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # type-check + build to dist/
```
