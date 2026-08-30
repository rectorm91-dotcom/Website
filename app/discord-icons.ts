// Original Discord assets, not generated or redrawn. Provenance: public/icons/discord/SOURCES.md.
export const DISCORD_BADGES = [
  { bit: 1, label: 'Discord Staff', icon: 'staff' },
  { bit: 2, label: 'Partnered Server Owner', icon: 'partner' },
  { bit: 4, label: 'HypeSquad Events', icon: 'hypesquad-events' },
  { bit: 64, label: 'HypeSquad Bravery', icon: 'hypesquad-bravery' },
  { bit: 128, label: 'HypeSquad Brilliance', icon: 'hypesquad-brilliance' },
  { bit: 256, label: 'HypeSquad Balance', icon: 'hypesquad-balance' },
  { bit: 512, label: 'Early Supporter', icon: 'early-supporter' },
  { bit: 131072, label: 'Moderator Programs Alumni', icon: 'moderator-alumni' },
  { bit: 4194304, label: 'Active Developer', icon: 'active-developer' },
] as const;

export const DISCORD_STATUSES = {
  online: { label: 'Online', icon: '/icons/discord/status-online.png' },
  idle: { label: 'Idle', icon: '/icons/discord/status-idle.png' },
  dnd: { label: 'Do Not Disturb', icon: '/icons/discord/status-dnd.png' },
  offline: { label: 'Offline', icon: '/icons/discord/status-offline.png' },
} as const;
