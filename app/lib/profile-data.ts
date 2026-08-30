export type Presence = {
  discord_status: 'online' | 'idle' | 'dnd' | 'offline';
  discord_user: { avatar: string | null; username?: string; public_flags: number };
};

export type PresenceResult =
  | { available: true; data: Presence }
  | { available: false; reason: 'not_connected' | 'unavailable' };

export type ThumbnailResult = {
  icons: Record<number, string>;
  retry: boolean;
};

// Return only fields used by the profile. Never pass activities or rich presence through.
export async function loadPresence(userId: string, request: typeof fetch = fetch): Promise<PresenceResult> {
  try {
    const response = await request(`https://api.lanyard.rest/v1/users/${userId}`, {
      cache: 'no-store', signal: AbortSignal.timeout(8_000),
    });
    const payload = await response.json() as {
      success?: boolean;
      error?: { code?: string };
      data?: Presence & { discord_user: Presence['discord_user'] & { id?: string } };
    };
    if (!payload.success && payload.error?.code === 'user_not_monitored') {
      return { available: false, reason: 'not_connected' };
    }
    const data = payload.data;
    if (!response.ok || !payload.success || !data || data.discord_user?.id !== userId ||
      !['online', 'idle', 'dnd', 'offline'].includes(data?.discord_status)) {
      return { available: false, reason: 'unavailable' };
    }
    const user = data.discord_user;
    return {
      available: true,
      data: {
        discord_status: data.discord_status,
        discord_user: {
          avatar: typeof user.avatar === 'string' && /^(a_)?[a-f0-9]{32}$/.test(user.avatar) ? user.avatar : null,
          username: typeof user.username === 'string' ? user.username.slice(0, 64) : undefined,
          public_flags: Number.isSafeInteger(user.public_flags) && user.public_flags >= 0 ? user.public_flags : 0,
        },
      },
    };
  } catch {
    return { available: false, reason: 'unavailable' };
  }
}

export async function loadGroupIcons(groupIds: readonly number[], request: typeof fetch = fetch): Promise<ThumbnailResult> {
  try {
    const query = new URLSearchParams({ groupIds: groupIds.join(','), size: '150x150', format: 'WebP', isCircular: 'false' });
    const response = await request(`https://thumbnails.roblox.com/v1/groups/icons?${query}`, {
      cache: 'no-store', signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return { icons: {}, retry: true };
    const payload = await response.json() as { data?: Array<{ targetId?: number; state?: string; imageUrl?: string }> };
    if (!Array.isArray(payload.data)) return { icons: {}, retry: true };
    const icons: Record<number, string> = {};
    let retry = false;
    for (const id of groupIds) {
      const item = payload.data.find((entry: { targetId?: number }) => entry?.targetId === id);
      if (item?.state === 'Completed' && typeof item.imageUrl === 'string') {
        try {
          const url = new URL(item.imageUrl);
          if (url.protocol === 'https:' && !url.username && !url.password && !url.port &&
            (url.hostname === 'rbxcdn.com' || url.hostname.endsWith('.rbxcdn.com'))) icons[id] = url.href;
          else retry = true;
        } catch { retry = true; }
      } else if (!item || !['Blocked', 'Error', 'InReview'].includes(item.state ?? '')) retry = true;
    }
    return { icons, retry };
  } catch {
    return { icons: {}, retry: true };
  }
}

// Per-process bounded cache with request coalescing. Each route has one fixed key.
export function cachedLoader<T>(loader: () => Promise<T>, ttl: (value: T) => number) {
  let cached: { value: T; expires: number } | undefined;
  let pending: Promise<T> | undefined;
  return async (): Promise<T> => {
    if (cached && Date.now() < cached.expires) return cached.value;
    if (pending) return pending;
    pending = loader().then((value) => {
      cached = { value, expires: Date.now() + ttl(value) };
      return value;
    }).finally(() => { pending = undefined; });
    return pending;
  };
}
