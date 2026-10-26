# Moon Finder

Moon Finder is a static, privacy-first Moon tracker. It uses the browser's location (or manually entered coordinates) to calculate the Moon's topocentric position and its path through the next 24 hours.

The 360° sky chart uses an azimuthal equidistant projection: zenith is at the centre, the horizon is the outer circle, and azimuth runs clockwise from north. All astronomical calculations run locally with [Astronomy Engine](https://github.com/cosinekitty/astronomy).

## Features

- Accurate altitude, azimuth, phase, illumination, rise, set, and culmination calculations
- Five-minute trajectory sampling with interpolated horizon crossings
- Solar-state styling along the path for daylight, civil twilight, and post-sunset night
- Interactive 24-hour slider and animation
- High-latitude and circumpolar visibility handling
- Browser geolocation, validated manual coordinates, and local persistence
- Responsive SVG visualization, keyboard controls, and reduced-motion support
- No backend, API key, analytics, or location transmission

## Local development

Node.js 20+:

```bash
npm install
npm run dev
```

Or with Deno 2:

```bash
deno install
deno task dev
```

## Tests and production build

```bash
npm test
npm run build
```

With Deno, use `deno task test` and `deno task build`. The production site is generated in `dist/`.

## Deploy to GitHub Pages

The production site is built into the tracked `docs/` directory, so GitHub Pages can serve it directly without a GitHub Actions workflow.

1. Run `npm run build` after making source changes.
2. Commit the updated source and `docs/` output, then push `main`.
3. Open **Settings → Pages** in the GitHub repository.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/docs` folder, then save.

The Vite base path is relative, so project Pages URLs such as `https://user.github.io/repository/` work without a hardcoded repository name. Geolocation requires HTTPS in production, which GitHub Pages provides.

## Astronomical approach

For each timestamp, Moon Finder asks Astronomy Engine for topocentric equatorial coordinates (`Equator` with equator-of-date and aberration enabled), then converts them to horizontal coordinates with normal atmospheric refraction. Positions are sampled every five minutes. Rise and set use Astronomy Engine's limb- and refraction-aware `SearchRiseSet`; the highest point uses a meridian transit from `SearchHourAngle` when it falls inside the selected 24-hour window.

Times are stored as absolute JavaScript timestamps and formatted only at the display boundary, so crossing midnight or a daylight-saving transition does not distort the 24-hour interval.
