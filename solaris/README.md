# Solaris immersive explorer

Root experience for solaris-imersivo.vercel.app. Static HTML, CSS and JavaScript with no runtime dependencies.

- Preserves the reviewed aerial masterplan and landmark coordinates from the previous production release.
- Ports the Metropolitan gallery, guided tour, gestures, presentation, fullscreen and responsive panels.
- Adds independent selection of 10 blocks and 249 parcels with a searchable list, highlighted boundaries, previous/next navigation and deep links.
- Uses a separate illustrated identification layer for parcel selection. Source: supplied Solaris urbanistic plan dated 22/07/2025 and its previously prepared schematic mapping. Image coordinates are not survey coordinates. C18 is institutional. No areas, prices or availability are inferred.
- Three new conceptual renders (portaria, clube, lago), created with the built-in image generation tool. Prompts are in render-prompts.json.
- Does not change Metropolitan source files or introduce the retired game runtime.

Production build: `node .ops/build-solaris.mjs` from repository root. Public files use an explicit allowlist. Deploys via the existing Vercel Git integration on `solaris-imersivo-mobile`.
