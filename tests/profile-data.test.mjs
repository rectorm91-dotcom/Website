import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPresence, loadGroupIcons, cachedLoader } from '../app/lib/profile-data.ts';

const userId = '760858935607165000';
const reply = (body, status = 200) => async () => Response.json(body, { status });

for (const status of ['online', 'idle', 'dnd', 'offline']) {
  test(`Discord preserves real ${status} availability and strips activities`, async () => {
    const result = await loadPresence(userId, reply({ success: true, data: {
      discord_status: status,
      discord_user: { id: userId, avatar: 'a_' + 'a'.repeat(32), username: 'example', public_flags: 256, email: 'must-not-escape' },
      activities: [{ name: 'private game' }], spotify: { song: 'not displayed' }, kv: { secret: 'not displayed' },
    } }));
    assert.deepEqual(result, { available: true, data: { discord_status: status, discord_user: {
      avatar: 'a_' + 'a'.repeat(32), username: 'example', public_flags: 256,
    } } });
  });
}

test('Unmonitored account is not reported as Offline', async () => {
  assert.deepEqual(await loadPresence(userId, reply({ success: false, error: { code: 'user_not_monitored' } }, 404)),
    { available: false, reason: 'not_connected' });
});

test('Malformed, wrong-user and network responses fail safely', async () => {
  for (const body of [null, {}, { success: true, data: { discord_status: 'invisible', discord_user: { id: userId } } },
    { success: true, data: { discord_status: 'online', discord_user: { id: 'other' } } }]) {
    assert.deepEqual(await loadPresence(userId, reply(body)), { available: false, reason: 'unavailable' });
  }
  assert.deepEqual(await loadPresence(userId, async () => { throw new Error('secret'); }), { available: false, reason: 'unavailable' });
});

test('Thumbnails use configured numeric IDs and only completed Roblox CDN URLs', async () => {
  let calledUrl;
  const result = await loadGroupIcons([14355088, 33065528], async (url) => {
    calledUrl = new URL(url);
    return Response.json({ data: [
      { targetId: 14355088, state: 'Completed', imageUrl: 'https://tr.rbxcdn.com/real-image.webp' },
      { targetId: 33065528, state: 'Completed', imageUrl: 'https://t0.rbxcdn.com/other-image.webp' },
      { targetId: 999, state: 'Completed', imageUrl: 'https://tr.rbxcdn.com/not-requested.webp' },
    ] });
  });
  assert.equal(calledUrl.hostname, 'thumbnails.roblox.com');
  assert.equal(calledUrl.searchParams.get('groupIds'), '14355088,33065528');
  assert.deepEqual(result, { icons: { 14355088: 'https://tr.rbxcdn.com/real-image.webp', 33065528: 'https://t0.rbxcdn.com/other-image.webp' }, retry: false });
});

test('Pending thumbnails retry; blocked thumbnails do not invent logos', async () => {
  assert.deepEqual(await loadGroupIcons([1], reply({ data: [{ targetId: 1, state: 'Pending' }] })), { icons: {}, retry: true });
  assert.deepEqual(await loadGroupIcons([1], reply({ data: [{ targetId: 1, state: 'Blocked' }] })), { icons: {}, retry: false });
});

test('Reject non-Roblox, insecure, malformed and credential-bearing image URLs', async () => {
  for (const imageUrl of ['https://rbxcdn.com.attacker.example/a', 'http://tr.rbxcdn.com/a', 'javascript:alert(1)',
    'https://user:pass@tr.rbxcdn.com/a', 'https://tr.rbxcdn.com:444/a', '//tr.rbxcdn.com/a']) {
    assert.deepEqual(await loadGroupIcons([1], reply({ data: [{ targetId: 1, state: 'Completed', imageUrl }] })), { icons: {}, retry: true });
  }
});

test('Roblox failures are recoverable without leaking errors', async () => {
  assert.deepEqual(await loadGroupIcons([1], reply({}, 429)), { icons: {}, retry: true });
  assert.deepEqual(await loadGroupIcons([1], reply(null)), { icons: {}, retry: true });
  assert.deepEqual(await loadGroupIcons([1], async () => { throw new Error('secret'); }), { icons: {}, retry: true });
});

test('Cache coalesces simultaneous requests and avoids repeated upstream traffic', async () => {
  let count = 0;
  const load = cachedLoader(async () => { count++; return { value: 'same' }; }, () => 60_000);
  const results = await Promise.all([load(), load(), load()]);
  assert.equal(count, 1);
  assert.deepEqual(results[0], results[1]);
  await load();
  assert.equal(count, 1);
});

test('Expired cache refreshes and rejected requests do not poison future calls', async () => {
  let count = 0;
  const load = cachedLoader(async () => { if (++count === 1) throw new Error('temporary'); return count; }, () => 0);
  await assert.rejects(load());
  assert.equal(await load(), 2);
  assert.equal(await load(), 3);
});
