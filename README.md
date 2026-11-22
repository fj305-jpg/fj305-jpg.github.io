# Jin Fengzhou — interactive resume, version 2

Built on the MIT-licensed Sen 3D resume framework. The personal content, background geometry, character and interface are replacements.

## Local use

Node.js 22+ and pnpm 11 are recommended.

```
cd web
pnpm install --frozen-lockfile --ignore-scripts
pnpm dev
```

Open the printed local URL. `pnpm build` creates `web/dist`; `pnpm preview` serves that production build. The site needs an HTTP server; double-clicking its HTML file is not sufficient.

## What changed

- Original texture-free three-dimensional character, built from geometry and standard materials; no portrait image, image plane or dog is loaded.
- Drag rotation, head / eye tracking, a waving arm, keyboard-accessible rotation and greeting controls.
- Downloadable GLB model in `web/public/personal/jin-fengzhou.glb`. This is a stylized approximation, not a precise scan. Its named part groups can be animated; it is not a production skeletal rig.
- Pale blue / slate visual palette, clear education and experience headings.
- Education is ordered high school, then university.
- Experiences are grouped into Quantitative and Engineering. Descriptions are concise summaries of the user's supplied information and existing CVs. Degree end date was omitted because existing CV versions disagree.
- Email and phone are real clickable mailto / tel links supplied by the user.
- GSAP React + ScrollTrigger handle chapter activation, content reveals and reading progress with cleanup and reduced-motion support.
- The architectural backgrounds are conceptual geometry, not reconstructions of actual campuses.

## Source

`web/src/ResumeApp.tsx` contains the English copy and experience lists.
`web/src/resume.css` contains colours and responsive layout.
`web/src/scene/ResumeScene.tsx` contains runtime interaction.
`web/src/scene/avatarModel.ts` creates the character.
`web/src/scene/BackgroundSets.tsx` contains background sets.

To regenerate the GLB after model edits, run `node --experimental-strip-types export-avatar.mjs` with Node.js 22+.

## Deployment

The supplied static ZIP contains the built website with `index.html` at root. The source ZIP contains an Actions workflow for GitHub Pages. Push to your own repository and choose GitHub Actions in the Pages settings. No paid domain is required. The repository workflow is prepared but has not yet been run on GitHub.

The preview is local, not publicly deployed. Print profile prints this website's content rather than downloading an existing CV. Source attribution is preserved in LICENSE and the site footer. Original Sen personal assets are excluded from the release.
