# AEY Technologia Website

A cinematic 3D website for AEY Technologia, built around a journey from
Malaysia to Mars.

## Experience

- Animated rocket launch from Earth
- Realistic Earth and Mars textures
- Interactive orbital service modules
- Mission-control contact scene
- Smooth full-section scrolling on desktop and mobile

## Tech Stack

- React 19
- TypeScript
- Three.js
- vinext / Vite
- Tailwind CSS

## Local Development

Requires Node.js `>=22.13.0` and pnpm.

```bash
pnpm install
pnpm dev
```

Create a production build with:

```bash
pnpm build
```

## Project Structure

```text
app/       Page components, 3D scenes and styling
public/    Earth, Mars and brand assets
```

Earth and Mars imagery is sourced from NASA and is used as texture data for
the Three.js scenes.
