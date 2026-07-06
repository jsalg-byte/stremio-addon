# FMAB Redub Stremio Addon

Minimal Stremio addon for the FMAB redub project.

Install URL after deployment:

```text
https://media.mzootfb.xyz/manifest.json
```

This app does **not** host or upload videos. It only exposes Stremio addon endpoints and returns stream URLs pointing at the R2-backed video domain.

## Endpoints

The addon exposes the normal Stremio endpoints:

```text
/manifest.json
/catalog/series/fmab-redub-catalog.json
/meta/series/fmab-redub.json
/stream/series/fmab-redub:s01e01.json
```

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `7000` | HTTP port. Coolify should expose this port. |
| `MEDIA_BASE_URL` | `https://videos.mzootfb.xyz` | Base URL for MP4 stream URLs. |
| `ADDON_PUBLIC_URL` | `https://media.mzootfb.xyz` | Public URL of this Stremio addon. |

Example:

```bash
PORT=7000 \
MEDIA_BASE_URL=https://videos.mzootfb.xyz \
ADDON_PUBLIC_URL=https://media.mzootfb.xyz \
npm start
```

## Local development

```bash
npm install
npm run validate
npm start
```

Then check:

```bash
curl http://localhost:7000/manifest.json
curl http://localhost:7000/catalog/series/fmab-redub-catalog.json
curl http://localhost:7000/meta/series/fmab-redub.json
curl 'http://localhost:7000/stream/series/fmab-redub:s01e01.json'
```

Expected stream URL for episode 1:

```text
https://videos.mzootfb.xyz/el-alquimista-de-acero/season-01/s01e01.mp4
```

## Coolify deployment

Use the simplest Node/Nixpacks deployment:

- Build pack: `Nixpacks`
- Install command: `npm install`
- Start command: `npm start`
- Exposed port: `7000`
- Domain: `https://media.mzootfb.xyz`

Set these env vars in Coolify:

```text
PORT=7000
MEDIA_BASE_URL=https://videos.mzootfb.xyz
ADDON_PUBLIC_URL=https://media.mzootfb.xyz
```

After deploy, install in Stremio using:

```text
https://media.mzootfb.xyz/manifest.json
```

## Notes

- `episodes.json` is the source of episode IDs and R2 object paths.
- Stremio IDs use the stable addon slug `fmab-redub`; video filenames point to the uploaded R2 prefix `el-alquimista-de-acero/season-01/`.
- For v1 there is one Stremio series entry: `fmab-redub`.
- No auth, DB, admin UI, or upload flow is included.
