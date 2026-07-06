const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { addonBuilder } = require('stremio-addon-sdk');

const PORT = Number(process.env.PORT || 7000);
const HOST = process.env.HOST || '0.0.0.0';
const MEDIA_BASE_URL = trimTrailingSlash(process.env.MEDIA_BASE_URL || 'https://videos.mzootfb.xyz');
const ADDON_PUBLIC_URL = trimTrailingSlash(process.env.ADDON_PUBLIC_URL || 'https://media.mzootfb.xyz');

const ADDON_ID = 'xyz.mzootfb.fmab-redub';
const SERIES_ID = 'fmab-redub';
const CATALOG_ID = 'fmab-redub-catalog';
const SERIES_NAME = 'El Alquimista de Acero';
const EPISODES_PATH = path.join(__dirname, 'episodes.json');

function trimTrailingSlash(value) {
  return String(value).replace(/\/+$/, '');
}

function loadEpisodes() {
  const raw = fs.readFileSync(EPISODES_PATH, 'utf8');
  const episodes = JSON.parse(raw);

  if (!Array.isArray(episodes)) {
    throw new Error('episodes.json must be an array');
  }

  return episodes.map((episode) => {
    for (const field of ['id', 'title', 'season', 'episode', 'filename']) {
      if (episode[field] === undefined || episode[field] === null || episode[field] === '') {
        throw new Error(`Episode is missing required field "${field}": ${JSON.stringify(episode)}`);
      }
    }

    return {
      ...episode,
      season: Number(episode.season),
      episode: Number(episode.episode),
    };
  }).sort((a, b) => a.season - b.season || a.episode - b.episode);
}

function episodeId(season, episode) {
  return `${SERIES_ID}:s${String(season).padStart(2, '0')}e${String(episode).padStart(2, '0')}`;
}

function streamUrl(filename) {
  return `${MEDIA_BASE_URL}/${String(filename).replace(/^\/+/, '')}`;
}

const episodes = loadEpisodes();
const episodeById = new Map(episodes.map((episode) => [episode.id, episode]));

const manifest = {
  id: ADDON_ID,
  version: '1.0.0',
  name: 'FMAB Redub',
  description: 'Private Stremio addon for the FMAB redub project.',
  logo: `${ADDON_PUBLIC_URL}/logo.png`,
  resources: ['catalog', 'meta', 'stream'],
  types: ['series'],
  idPrefixes: [SERIES_ID],
  catalogs: [
    {
      type: 'series',
      id: CATALOG_ID,
      name: 'FMAB Redub',
    },
  ],
};

const catalogMeta = {
  id: SERIES_ID,
  type: 'series',
  name: SERIES_NAME,
  description: 'FMAB redub video collection.',
  posterShape: 'regular',
};

function seriesMeta() {
  return {
    ...catalogMeta,
    videos: episodes.map((episode) => ({
      id: episode.id || episodeId(episode.season, episode.episode),
      title: episode.title,
      season: episode.season,
      episode: episode.episode,
      released: episode.released || undefined,
    })),
  };
}

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(({ type, id }) => {
  if (type !== 'series' || id !== CATALOG_ID) {
    return Promise.resolve({ metas: [] });
  }

  return Promise.resolve({ metas: [catalogMeta] });
});

builder.defineMetaHandler(({ type, id }) => {
  if (type !== 'series' || id !== SERIES_ID) {
    return Promise.resolve({ meta: null });
  }

  return Promise.resolve({ meta: seriesMeta() });
});

builder.defineStreamHandler(({ type, id }) => {
  if (type !== 'series') {
    return Promise.resolve({ streams: [] });
  }

  const episode = episodeById.get(id);
  if (!episode) {
    return Promise.resolve({ streams: [] });
  }

  return Promise.resolve({
    streams: [
      {
        title: `${SERIES_NAME} - ${episode.title}`,
        url: streamUrl(episode.filename),
        behaviorHints: {
          notWebReady: false,
        },
      },
    ],
  });
});

const addonInterface = builder.getInterface();

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': '*',
    'content-type': 'application/json; charset=utf-8',
  });
  res.end(body);
}

function sendText(res, statusCode, body) {
  res.writeHead(statusCode, {
    'access-control-allow-origin': '*',
    'content-type': 'text/plain; charset=utf-8',
  });
  res.end(body);
}

function sendHtml(res, statusCode, body) {
  res.writeHead(statusCode, {
    'access-control-allow-origin': '*',
    'content-type': 'text/html; charset=utf-8',
  });
  res.end(body);
}

function installUrl() {
  return `${ADDON_PUBLIC_URL}/manifest.json`;
}

function stremioInstallUrl() {
  return `stremio://${installUrl().replace(/^https?:\/\//, '')}`;
}

function landingPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>FMAB Redub Stremio Addon</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #08090c; color: #f4f4f5; }
    main { width: min(680px, calc(100% - 32px)); padding: 40px; border: 1px solid #27272a; border-radius: 24px; background: linear-gradient(145deg, #111116, #0b0c10); box-shadow: 0 24px 80px rgba(0,0,0,.45); }
    h1 { margin: 0 0 12px; font-size: clamp(32px, 6vw, 54px); line-height: 1; }
    p { color: #c9c9d1; line-height: 1.6; }
    a.button { display: inline-block; margin: 18px 0; padding: 14px 18px; border-radius: 999px; color: #08090c; background: #f4f4f5; font-weight: 800; text-decoration: none; }
    code { display: block; overflow-x: auto; padding: 14px; border-radius: 12px; background: #050506; color: #d4d4d8; }
    .links { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 20px; }
    .links a { color: #a5b4fc; }
  </style>
</head>
<body>
  <main>
    <h1>FMAB Redub</h1>
    <p>Minimal private Stremio addon. Install it in Stremio, then open the FMAB Redub catalog entry.</p>
    <a class="button" href="${stremioInstallUrl()}">Open in Stremio</a>
    <p>If the button does not open Stremio, copy this manifest URL into Stremio's addon search/install field:</p>
    <code>${installUrl()}</code>
    <div class="links">
      <a href="/manifest.json">manifest.json</a>
      <a href="/catalog/series/${CATALOG_ID}.json">catalog</a>
      <a href="/meta/series/${SERIES_ID}.json">metadata</a>
      <a href="/stream/series/${SERIES_ID}:s01e01.json">episode 1 stream</a>
    </div>
  </main>
</body>
</html>`;
}

async function handleRequest(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': '*',
    });
    res.end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(requestUrl.pathname);

  try {
    if (pathname === '/' || pathname === '') {
      sendHtml(res, 200, landingPage());
      return;
    }

    if (pathname === '/healthz') {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (pathname === '/manifest.json') {
      sendJson(res, 200, manifest);
      return;
    }

    const match = pathname.match(/^\/(catalog|meta|stream)\/([^/]+)\/([^/]+)\.json$/);
    if (!match) {
      sendJson(res, 404, { error: 'Not found' });
      return;
    }

    const [, resource, type, id] = match;
    const payload = await addonInterface.get(resource, type, id, Object.fromEntries(requestUrl.searchParams));
    sendJson(res, 200, payload);
  } catch (error) {
    sendJson(res, 500, { error: error.message || 'Internal server error' });
  }
}

function start() {
  const server = http.createServer(handleRequest);
  server.listen(PORT, HOST, () => {
    console.log(`FMAB Redub Stremio addon listening on ${HOST}:${PORT}`);
    console.log(`Install URL: ${installUrl()}`);
  });
  return server;
}

if (require.main === module) {
  start();
}

module.exports = {
  ADDON_PUBLIC_URL,
  CATALOG_ID,
  MEDIA_BASE_URL,
  SERIES_ID,
  addonInterface,
  episodeById,
  episodes,
  manifest,
  seriesMeta,
  start,
  streamUrl,
  installUrl,
  stremioInstallUrl,
  landingPage,
  handleRequest,
};
