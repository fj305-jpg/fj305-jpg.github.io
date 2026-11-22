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

## Directional portrait / midnight theme (v4)

The current portrait uses nine AI-generated, photo-referenced transparent keyframes:
front, left, right, up, down and four diagonals. A pointer selects a direction with an
85 ms two-frame dissolve. This is a 2D directional sequence, not a rigged 3D model;
there is no geometry skew or eye-UV deformation. Fast large movements can still
show discrete pose changes. Reduced-motion mode keeps a front-facing portrait.

Palette: midnight #0b1425, silver #f4f7fc, periwinkle #aab8ff. Existing education,
experience, interests and contact sections are retained. Production portrait assets
are WebP with alpha, approximately 0.95 MB total.

Asset generation: built-in image generation. Shared prompt: preserve the supplied
master identity, subtle cartoon render, facial proportions, hair, black crewneck,
blue rim light, transparent square canvas, fixed torso/framing/scale; change only
head and gaze to each direction. Horizontal target 15 degrees, vertical 7 degrees.
The generated images are artistic approximations, not calibrated 3D projections.

## Continuous portrait interpolation (v5 — current)

Supersedes v4's nine-direction selection and 85 ms dissolves. Pointer input now
controls continuous horizontal/vertical pose coordinates with frame-rate-independent
exponential damping. Four adjacent authored poses are aligned using bidirectional
DIS optical flow, then interpolated on the GPU. Pose changes are interruptible and
pass continuously through cell boundaries. The original torso remains stable.
This remains an image-based portrait, not a fully rigged 3D head. Extreme poses
and newly exposed features may retain small interpolation artifacts.

Motion fields: four 192 x 192 RGBA half-float atlases, 1,179,648 bytes total.
The shader uses five samplers; there is no per-frame network fetch, canvas redraw,
React state update or new Vector3 allocation. Motion-data failure and reduced-motion
preferences retain the frontal portrait. Initial position/scale match mobile layout.

Rebuild motion fields with Python, numpy and opencv-python-headless:
`python scripts/build-portrait-motion.py`
Production does not require Python or OpenCV. Existing artwork is unchanged.
Algorithm reference: https://docs.opencv.org/5.0/main_modules/classcv_1_1DISOpticalFlow.html

Validation: TypeScript, targeted ESLint, production build; browser checked with
no console errors. A 45-frame screen recording of the nod interaction showed 45
unique face frames. This is a continuity check, not a guaranteed device FPS benchmark.

## Portrait artifact fix (current)

User testing exposed obvious double eyes, noses and facial outlines in the v5
multi-view optical-flow interpolation. That approach is retired from production.
The site now renders one unwarped frontal portrait. Direction controls and the
cursor-tracking claim are removed. Chapter navigation/backgrounds remain interactive.
Natural continuous head/eye tracking is not delivered by this fallback; it needs a
consistent rigged character or a consistent rendered sequence, rather than independently
generated view images. Old direction/flow assets are retained only as archived inputs.

## Offline photo sequence + minimalist Cambridge (v7 — current)

The user selected a photo/video sequence instead of a rigged 3D character. The
nine reference views are now interpolated offline with RIFE-ncnn-vulkan v4.6:
33 yaw samples and 9 pitch samples, 297 baked RGBA frames. RGB is premultiplied
against black before interpolation; alpha is interpolated separately and restored.
The torso stays fixed. Production samples exactly ONE frame at a time, without
multi-face crossfading, online optical flow, geometric image warp or video seeking.
Damped, speed-limited pose coordinates choose the frame. A Preview turn button
allows a complete left/right sweep; double-clicking the portrait triggers a nod.

This is an image sequence, not a full 3D model. It uses finite sampled angles;
small pose changes may still show discrete steps, and the interpolated images
remain approximations. It is not a promise of perfect likeness or a device FPS.

Desktop atlas: 5760 x 8160, ~7.1 MB encoded / ~188 MB GPU RGBA storage.
Mobile atlas: 2880 x 4080, ~2.5 MB encoded / ~47 MB GPU storage. Devices with
max texture size below 8192 receive the mobile atlas. The clear original frontal
portrait stays visible while loading or if the atlas cannot be used. Reduced-motion
preferences keep the front pose. No additional assets are fetched per cursor move.

Cambridge background retains the midnight palette and single-colour architectural
lines. The generic arches are replaced with a simplified King's College Chapel:
twelve pointed-window bays, buttresses, crenellated parapet, four corner turrets,
and two restrained river lines. No photographic/coloured campus backdrop is used.
Architecture reference: https://www.kings.cam.ac.uk/sites/default/files/documents/about/cal-sos-and-visual-impact-assessment-compressed.pdf

Rebuild assets with Pillow/numpy and the official extracted RIFE tool:
`python scripts/build-portrait-sequence.py --rife /path/to/rife-ncnn-vulkan.exe`
Official software/source: https://github.com/nihui/rife-ncnn-vulkan
The executable/model are used locally for preparation, not shipped to the website.

Validation: TypeScript, targeted ESLint, production build, intermediate-frame
contact-sheet inspection, browser console checks. A 120-frame browser recording
covered the complete yaw range, including all 33 positions. These checks do not
establish universal smoothness across browsers/devices.
