const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const addon = require('../server');

const episodesPath = path.join(__dirname, '..', 'episodes.json');
const episodes = JSON.parse(fs.readFileSync(episodesPath, 'utf8'));
const seriesPath = path.join(__dirname, '..', 'series.json');
const series = JSON.parse(fs.readFileSync(seriesPath, 'utf8'));

assert(Array.isArray(episodes), 'episodes.json must be an array');
assert.equal(episodes.length, 64, 'episodes.json should contain 64 episodes');
assert.equal(series.id, 'fmab-redub');
assert.equal(series.type, 'series');
assert.equal(typeof series.description, 'string');
assert.equal(series.poster, '/assets/cover.jpg');
assert.match(series.background, /^https:\/\//);

const ids = new Set();
for (const episode of episodes) {
  assert.equal(typeof episode.id, 'string', 'episode.id must be a string');
  assert.equal(typeof episode.title, 'string', 'episode.title must be a string');
  assert.equal(typeof episode.overview, 'string', 'episode.overview must be a string');
  assert.match(episode.thumbnail, /^\/assets\/episodes\/s01e\d{2}\.jpg$/);
  assert(fs.statSync(path.join(__dirname, '..', 'public', episode.thumbnail)).size <= 5120, `${episode.thumbnail} must stay Stremio-small`);
  assert.equal(episode.season, 1, 'v1 only contains season 1');
  assert.equal(typeof episode.episode, 'number', 'episode.episode must be a number');
  assert.equal(typeof episode.filename, 'string', 'episode.filename must be a string');
  assert.match(episode.id, /^fmab-redub:s01e\d{2}$/);
  assert.match(episode.filename, /^el-alquimista-de-acero\/season-01\/s01e\d{2}\.mp4$/);
  assert(!ids.has(episode.id), `duplicate episode id: ${episode.id}`);
  ids.add(episode.id);
}

assert.equal(addon.manifest.id, 'xyz.mzootfb.fmab-redub');
assert.equal(addon.manifest.resources.includes('catalog'), true);
assert.equal(addon.manifest.resources.includes('meta'), true);
assert.equal(addon.manifest.resources.includes('stream'), true);
assert.equal(addon.streamUrl(episodes[0].filename), 'https://videos.mzootfb.xyz/el-alquimista-de-acero/season-01/s01e01.mp4');
assert.equal(addon.streamUrl('/el-alquimista-de-acero/season-01/s01e01.mp4'), 'https://videos.mzootfb.xyz/el-alquimista-de-acero/season-01/s01e01.mp4');
assert.equal(addon.installUrl(), 'https://media.mzootfb.xyz/manifest.json');
assert.equal(addon.stremioInstallUrl(), 'stremio://media.mzootfb.xyz/manifest.json');
assert.equal(addon.publicUrl('/assets/cover.jpg'), 'https://media.mzootfb.xyz/assets/cover.jpg');
assert.match(addon.landingPage(), /Open in Stremio/);

const meta = addon.seriesMeta();
assert.equal(meta.id, 'fmab-redub');
assert.equal(meta.type, 'series');
assert.equal(meta.description, series.description);
assert.equal(meta.poster, 'https://media.mzootfb.xyz/assets/cover.jpg');
assert.equal(meta.background, series.background);
assert.deepEqual(meta.genres, series.genres);
assert.equal(meta.posterShape, 'poster');
assert.equal(meta.videos.length, 64);
assert.equal(meta.videos[0].id, 'fmab-redub:s01e01');
assert.equal(meta.videos[0].title, 'El Alquimista de Acero');
assert.match(meta.videos[0].overview, /Edward/);
assert.equal(meta.videos[0].thumbnail, 'https://media.mzootfb.xyz/assets/episodes/s01e01.jpg');
assert.equal(meta.videos[0].released, '2009-04-05T00:00:00.000Z');
assert.equal(meta.videos[63].id, 'fmab-redub:s01e64');

console.log('Validation passed: episodes.json, manifest shape, metadata, and stream URL generation are valid.');
