import { SITE_CONFIG } from '../../config';
import { cachedLoader, loadGroupIcons } from '../../lib/profile-data';

export const dynamic = 'force-dynamic';
const getIcons = cachedLoader(
  () => loadGroupIcons(SITE_CONFIG.projects.map((project) => project.robloxGroupId)),
  (result) => result.retry ? 5_000 : 3_600_000,
);

// Fixed configured IDs only: this endpoint cannot be used as an arbitrary proxy.
export async function GET() {
  const result = await getIcons();
  return Response.json(result, {
    headers: { 'Cache-Control': result.retry ? 'no-store' : 'public, max-age=300, s-maxage=3600' },
  });
}
