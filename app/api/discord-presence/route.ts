import { SITE_CONFIG } from '../../config';
import { cachedLoader, loadPresence } from '../../lib/profile-data';

export const dynamic = 'force-dynamic';
const getPresence = cachedLoader(() => loadPresence(SITE_CONFIG.discordUserId), () => 15_000);

export async function GET() {
  return Response.json(await getPresence(), { headers: { 'Cache-Control': 'no-store' } });
}
