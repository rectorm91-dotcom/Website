export const SITE_CONFIG = {
  // Canvas distances are CSS pixels; speeds are pixels/second.
  constellation: {
    connectionRadius: 150,
    cursorRadius: 210,
    cursorPush: 0.65,
    easingSeconds: 0.7,
    driftSpeed: 7,
    maxSpeed: 34,
    lineOpacity: 0.22,
    particleOpacity: 0.65,
    areaPerParticle: 11_000,
    maxParticles: 120,
    mobileMaxParticles: 48,
    framesPerSecond: 30,
  },
  discordUserId: '760858935607165000',
  infiniteFlightUsername: 'RTCarter1',
  profile: {
    displayName: 'RT',
    subtitle: 'Aviation | Developer',
    location: 'Dallas, Texas',
    about: 'Hey, I’m RT! I’m an 18 year old aviation enthusiast and Lua, Luau and JavaScript developer with an interest in technology, flight simulation and building new projects. I enjoy developing, learning and flying.',
  },
  projects: [
    {
      organization: 'Union Interactive',
      project: 'California State Roleplay',
      robloxGroupId: 14355088,
      robloxUrl: 'https://www.roblox.com/communities/14355088/Union-lnteractive',
      discordUrl: 'https://discord.com/invite/TfkV45Uj29',
    },
    {
      organization: 'Florida State Roleplay',
      project: 'Florida State Roleplay',
      robloxGroupId: 33065528,
      robloxUrl: 'https://www.roblox.com/communities/33065528/LEO-Group-PS-RP',
      discordUrl: 'https://discord.com/invite/fsrpx1',
    },
  ],
  socials: [
    { label: 'Roblox', href: 'https://www.roblox.com/users/2748381914/profile', icon: 'roblox' },
    { label: 'Discord', href: 'https://discord.com/users/760858935607165000', icon: 'discord' },
    { label: 'YouTube', href: 'https://youtube.com/@Reactor_Tech', icon: 'youtube' },
  ],
} as const;
