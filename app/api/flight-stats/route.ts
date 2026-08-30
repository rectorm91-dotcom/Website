import { SITE_CONFIG } from '../../config';

const ONE_DAY = 86_400;

type InfiniteFlightUser = Record<string, unknown>;

function pickNumber(record: InfiniteFlightUser, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return null;
}

export async function GET() {
  const apiKey = process.env.INFINITE_FLIGHT_API_KEY;

  if (!apiKey) {
    return Response.json(
      { available: false, message: 'Stats temporarily unavailable.', updatedAt: null },
      { status: 503, headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' } },
    );
  }

  try {
    const response = await fetch('https://api.infiniteflight.com/public/v2/users', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ discourseNames: [SITE_CONFIG.infiniteFlightUsername] }),
      next: { revalidate: ONE_DAY },
    });

    if (!response.ok) throw new Error('Upstream request failed');

    const payload = await response.json() as { result?: InfiniteFlightUser[] };
    const users = Array.isArray(payload?.result) ? payload.result : [];
    const user = users[0] as InfiniteFlightUser | undefined;
    if (!user) throw new Error('User unavailable');

    const stats = {
      grade: pickNumber(user, ['grade']),
      xp: pickNumber(user, ['xp', 'experiencePoints']),
      flightTime: pickNumber(user, ['flightTime', 'flightTimeMinutes']),
      landings: pickNumber(user, ['landingCount', 'landings']),
      onlineFlights: pickNumber(user, ['onlineFlights']),
      atcOperations: pickNumber(user, ['atcOperations']),
    };

    if (Object.values(stats).some((value) => value === null)) throw new Error('Incomplete stats');

    return Response.json(
      { available: true, stats, updatedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': `public, max-age=300, s-maxage=${ONE_DAY}, stale-while-revalidate=${ONE_DAY}` } },
    );
  } catch {
    return Response.json(
      { available: false, message: 'Stats temporarily unavailable.', updatedAt: null },
      { status: 503, headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' } },
    );
  }
}
