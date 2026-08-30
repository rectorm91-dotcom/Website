import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceParticles, connectionOpacity, createParticles, drawConstellation } from '../app/lib/constellation.ts';
import { SITE_CONFIG } from '../app/config.ts';
import { DISCORD_BADGES, DISCORD_STATUSES } from '../app/discord-icons.ts';
import { access } from 'node:fs/promises';

const options = SITE_CONFIG.constellation;
const particle = () => ({ x: 100, y: 100, vx: 0, vy: 0, driftX: 0, driftY: 0, radius: 1 });
const cursor = { x: 190, y: 100, active: true };

test('Connections fade monotonically to exactly zero at the configured radius', () => {
  assert.equal(connectionOpacity(0, 150, .22), .22);
  assert.equal(connectionOpacity(150, 150, .22), 0);
  assert.equal(connectionOpacity(151, 150, .22), 0);
  assert.equal(connectionOpacity(1, 0, .22), 0);
  let previous = 1;
  for (let distance = 0; distance <= 150; distance++) {
    const opacity = connectionOpacity(distance, 150, .22);
    assert.ok(opacity >= 0 && opacity <= previous);
    previous = opacity;
  }
  assert.ok(connectionOpacity(149.99, 150, .22) < 1e-8);
  assert.ok(connectionOpacity(100, 200, .22) > connectionOpacity(100, 150, .22));
});

test('Cursor repulsion is local and eased, never snapping', () => {
  const near = particle();
  const far = { ...particle(), x: 600 };
  advanceParticles([near, far], 1/30, 1000, 800, cursor, options);
  assert.ok(near.x < 100 && near.x > 99);
  assert.equal(near.y, 100);
  assert.equal(far.x, 600);
  for (let i = 0; i < 90; i++) advanceParticles([near], 1/30, 1000, 800, cursor, options);
  assert.ok(near.x < 90);
  assert.ok(Math.abs(near.x - cursor.x) > 100);
});

test('Particles move outward on every side of the cursor', () => {
  const center = { x: 500, y: 400, active: true };
  for (const [dx, dy] of [[-60, 0], [60, 0], [0, -60], [0, 60], [-40, 40], [40, -40]]) {
    const point = { ...particle(), x: center.x + dx, y: center.y + dy };
    const before = Math.hypot(dx, dy);
    advanceParticles([point], 1/30, 1000, 800, center, options);
    assert.ok(Math.hypot(point.x - center.x, point.y - center.y) > before);
  }
});

test('Cursor departure smoothly returns particles to their own drift', () => {
  const point = { ...particle(), vx: 20, driftX: 3 };
  advanceParticles([point], 1/30, 1000, 800, { ...cursor, active: false }, options);
  assert.ok(point.vx > 3 && point.vx < 20);
  for (let i = 0; i < 150; i++) advanceParticles([point], 1/30, 1000, 800, { ...cursor, active: false }, options);
  assert.ok(Math.abs(point.vx - 3) < .02);
});

test('Frame rate variations preserve comparable movement', () => {
  const fast = particle();
  const slow = particle();
  for (let i = 0; i < 60; i++) advanceParticles([fast], 1/60, 1000, 800, cursor, options);
  for (let i = 0; i < 30; i++) advanceParticles([slow], 1/30, 1000, 800, cursor, options);
  assert.ok(Math.abs(fast.x - slow.x) < .25);
});

test('Large elapsed intervals and cursor forces cannot cause jumps', () => {
  const point = particle();
  advanceParticles([point], 3600, 1000, 800, cursor, { ...options, cursorPush: 100 });
  assert.ok(Math.hypot(point.vx, point.vy) <= options.maxSpeed);
  assert.ok(Math.abs(point.x - 100) <= options.maxSpeed * .05 + 1e-8);
});

test('Particles are capped for phones and ultrawide screens, with slow independent drift', () => {
  const desktop = createParticles(8000, 4000, options);
  const mobile = createParticles(8000, 4000, options, true);
  assert.equal(desktop.length, options.maxParticles);
  assert.equal(mobile.length, options.mobileMaxParticles);
  assert.equal(createParticles(8000, 4000, { ...options, maxParticles: 10000 }).length, 160);
  for (const p of desktop) assert.ok(Math.hypot(p.vx, p.vy) <= options.driftSpeed + 1e-8);
});

test('Drawing emits one thin line per nearby pair and no out-of-radius lines', () => {
  const strokes = [];
  const context = { clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, arc() {}, fill() {}, stroke() { strokes.push(this.strokeStyle); } };
  drawConstellation(context, [particle(), {...particle(), x:150}, {...particle(), x:900}], 1000, 800, options);
  assert.equal(strokes.length, 1);
  assert.equal(context.lineWidth, .65);
  assert.equal(context.lineCap, 'round');
});

test('Every supported badge and availability state has a local original Discord asset', async () => {
  for (const badge of DISCORD_BADGES) await access(new URL(`../public/icons/discord/${badge.icon}.png`, import.meta.url));
  for (const state of Object.values(DISCORD_STATUSES)) await access(new URL(`../public${state.icon}`, import.meta.url));
  assert.equal(DISCORD_BADGES.filter(b => (256 & b.bit) === b.bit)[0].label, 'HypeSquad Balance');
});
