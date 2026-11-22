# Jin Fengzhou — interactive personal résumé

Live website: https://fj305-jpg.github.io/

Built on the MIT-licensed Sen résumé framework with original English content, scenes and personal artwork. Updates to `main` build and deploy automatically through GitHub Actions.

## Current character

A photo-referenced, lightly illustrated chin-resting portrait is mapped onto an original shallow relief surface. It has independent iris motion, pointer-following gaze, a small greeting nod and a hard horizontal limit of 15 degrees in each direction (30 degrees total). It is a 2.5D illustration, not a full-turn scanned or rigged character. The earlier procedural GLB and its generator remain as archived source assets, but are not loaded or offered in the current interface.

The artwork was generated using the built-in image-generation tool. Prompt brief: preserve the user's facial proportions, original eye shape, rounded jaw, black swept hair and black crewneck; lightly cartoonized editorial shading; relaxed hand-under-chin pose; both eyes visible; transparent background; no dog or props. No original photograph is shipped as the displayed character.

## Content and readability

- White / deep navy / restrained blue palette, opaque text, darker body copy and bordered control panels.
- Education is ordered GHCIS high school, then University of Cambridge / Engineering.
- Experiences are grouped into Quantitative and Engineering, including the user's Windshield Defrost Duct work.
- Interests: Karting, Football and Guan Dan, with selectable decorative scenes. No achievements or playing level are claimed.
- Email and phone are supplied by the owner and use mailto / tel links.
- All visible copy is English. Source context and supplied CVs informed concise factual experience descriptions; degree end date is omitted because prior CV versions differ.

## Development

Node.js 22+ and pnpm 11 are recommended:

```
cd web
pnpm install --frozen-lockfile --ignore-scripts
pnpm dev
```

`pnpm build` produces `web/dist`; `pnpm preview` serves that production build. Use an HTTP server rather than opening the source HTML directly.

## Main files

- `web/src/ResumeApp.tsx`: English content, education, experiences, interests and contact links.
- `web/src/theme-v3.css`: current colours and contrast rules, layered over `resume.css`.
- `web/src/scene/PortraitRelief.tsx`: shallow relief, gaze shader and bounded motion.
- `web/src/scene/PortraitStage.tsx`: background scenes and hobby illustrations.
- `web/src/journey.ts`: section and interest state.
- `web/public/personal/jin-chin-portrait.png`: current generated artwork.

GSAP React / ScrollTrigger manage section activation and restrained motion, with cleanup and reduced-motion support. Campus architecture is conceptual, not an accurate reconstruction. Print profile prints the website content rather than downloading an existing CV. LICENSE preserves upstream attribution; the original author's personal model, portfolio and imagery are excluded.
