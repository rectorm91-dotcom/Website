'use client';
/* eslint-disable @next/next/no-img-element -- fixed-size public avatar, brand, and Roblox CDN assets */

import { useEffect, useMemo, useState } from 'react';
import { SITE_CONFIG } from './config';
import { DISCORD_BADGES, DISCORD_STATUSES } from './discord-icons';
import { ConstellationBackground } from './components/ConstellationBackground';
import type { PresenceResult, ThumbnailResult } from './lib/profile-data';

type FlightStats = {
  grade: number;
  xp: number;
  flightTime: number;
  landings: number;
  onlineFlights: number;
  atcOperations: number;
};

type FlightStatsResponse = {
  available: boolean;
  stats?: FlightStats;
  updatedAt: string | null;
  message?: string;
};

function BrandIcon({ name }: { name: 'roblox' | 'discord' | 'youtube' }) {
  return <span className={`brand-icon brand-${name}`} aria-hidden="true" style={{ maskImage: `url(/icons/${name}.svg)` }} />;
}

function Icon({ name }: { name: string }) {
  return <span className="ui-icon" aria-hidden="true" style={{ maskImage: `url(/icons/interface/${name}.svg)` }} />;
}

function RemoteImage({ src, alt, fallback }: { src?: string | null; alt: string; fallback: React.ReactNode }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  return src && src !== failedSource
    ? <img src={src} alt={alt} onError={() => setFailedSource(src)} decoding="async" />
    : fallback;
}

function CollapsibleCard({
  title,
  icon,
  open,
  onToggle,
  children,
  id,
}: {
  title: string;
  icon: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  id: string;
}) {
  return (
    <article className={`glass-card collapsible-card ${open ? 'expanded' : ''}`}>
      <button className="collapse-trigger" type="button" aria-expanded={open} aria-controls={id} onClick={onToggle}>
        <span className="collapse-title"><Icon name={icon} />{title}</span>
        <span className="chevron"><Icon name="chevron-down" /></span>
      </button>
      <div className="collapse-region" id={id} aria-hidden={!open} inert={!open}>
        <div className="collapse-inner">{children}</div>
      </div>
    </article>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatFlightTime(value: number) {
  if (value <= 0) return '0h';
  return `${Math.round(value / 60)}h`;
}

export default function Home() {
  const [presenceResult, setPresenceResult] = useState<PresenceResult | null>(null);
  const [groupIcons, setGroupIcons] = useState<Record<number, string>>({});
  const [developingOpen, setDevelopingOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [flightStats, setFlightStats] = useState<FlightStatsResponse | null>(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    let updating = false;
    const updatePresence = async () => {
      if (document.hidden || updating) return;
      updating = true;
      try {
        const response = await fetch('/api/discord-presence', { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error('Presence unavailable');
        const payload: PresenceResult = await response.json();
        if (active) setPresenceResult(payload);
      } catch {
        if (active) setPresenceResult({ available: false, reason: 'unavailable' });
      } finally {
        updating = false;
      }
    };
    updatePresence();
    const timer = window.setInterval(updatePresence, 60_000);
    document.addEventListener('visibilitychange', updatePresence);
    return () => { active = false; controller.abort(); window.clearInterval(timer); document.removeEventListener('visibilitychange', updatePresence); };
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    let timer: number | undefined;
    let attempts = 0;
    const updateIcons = async () => {
      let retry = true;
      try {
        const response = await fetch('/api/roblox-thumbnails', { signal: controller.signal });
        if (!response.ok) throw new Error('Thumbnails unavailable');
        const payload: ThumbnailResult = await response.json();
        if (active) setGroupIcons(payload.icons);
        retry = payload.retry;
      } catch { /* Keep current icons during transient network errors. */ }
      if (active) {
        attempts += 1;
        timer = window.setTimeout(updateIcons, retry ? Math.min(5_000 * 2 ** Math.min(attempts - 1, 6), 300_000) : 3_600_000);
      }
    };
    updateIcons();
    return () => { active = false; controller.abort(); window.clearTimeout(timer); };
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/flight-stats')
      .then(async (response) => ({ response, payload: await response.json() as FlightStatsResponse }))
      .then(({ payload }) => active && setFlightStats(payload))
      .catch(() => active && setFlightStats({ available: false, message: 'Stats temporarily unavailable.', updatedAt: null }));
    return () => { active = false; };
  }, []);

  const presence = presenceResult?.available ? presenceResult.data : null;
  const avatarUrl = useMemo(() => {
    const hash = presence?.discord_user.avatar;
    if (!hash) return null;
    const extension = hash.startsWith('a_') ? 'gif' : 'webp';
    return `https://cdn.discordapp.com/avatars/${SITE_CONFIG.discordUserId}/${hash}.${extension}?size=256`;
  }, [presence]);

  const badges = useMemo(() => {
    const flags = presence?.discord_user.public_flags ?? 0;
    return DISCORD_BADGES.filter((badge) => (flags & badge.bit) === badge.bit);
  }, [presence]);

  const status = presence ? DISCORD_STATUSES[presence.discord_status] : null;
  const statusLabel = status?.label ?? (presenceResult ? 'Status unavailable' : 'Checking status…');
  const stats = flightStats?.available ? flightStats.stats : undefined;

  return (
    <main className="profile-page">
      <ConstellationBackground />

      <section className="profile-stack" aria-label="RT profile">
        <article className="glass-card identity-card">
          <div className="identity-row">
            <div className="avatar-wrap">
              <RemoteImage src={avatarUrl} alt="RT's Discord avatar" fallback={<span className="avatar-fallback" role="img" aria-label="Discord avatar placeholder"><BrandIcon name="discord" /></span>} />
              <span className="avatar-status" role="status" aria-label={statusLabel} title={statusLabel}>
                {status && <img src={status.icon} alt="" aria-hidden="true" width="28" height="28" />}
              </span>
            </div>
            <div className="identity-copy">
              <h1>{SITE_CONFIG.profile.displayName}</h1>
              {badges.length > 0 && <div className="badges" aria-label="Discord profile badges">{badges.map((badge) => <span key={badge.bit} title={badge.label}><img src={`/icons/discord/${badge.icon}.png`} alt={badge.label} width="32" height="32" /></span>)}</div>}
            </div>
          </div>
          <div className="profile-details"><p>{SITE_CONFIG.profile.subtitle}</p><span><Icon name="map-pin" />{SITE_CONFIG.profile.location}</span></div>
        </article>

        <article className="glass-card about-card">
          <div className="section-label"><span className="section-icon"><Icon name="user-round" /></span><h2>About Me</h2></div>
          <p>{SITE_CONFIG.profile.about}</p>
        </article>

        <CollapsibleCard title="Developing" icon="briefcase-business" open={developingOpen} onToggle={() => setDevelopingOpen((value) => !value)} id="developing-content">
          <div className="project-list">
            {SITE_CONFIG.projects.map((project) => (
              <div className="project-row" key={project.robloxGroupId}>
                <div className="group-icon-wrap">
                  <RemoteImage src={groupIcons[project.robloxGroupId]} alt={`${project.organization} Roblox community icon`} fallback={<span className="group-placeholder" role="img" aria-label="Community icon unavailable"><BrandIcon name="roblox" /></span>} />
                </div>
                <div className="project-copy"><h3>{project.organization}</h3><p>{project.project}</p></div>
                <div className="project-actions">
                  <a href={project.discordUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${project.organization} Discord`}><BrandIcon name="discord" /></a>
                  <a href={project.robloxUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${project.organization} Roblox community`}><BrandIcon name="roblox" /></a>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleCard>

        <CollapsibleCard title="Flight Stats" icon="plane" open={statsOpen} onToggle={() => setStatsOpen((value) => !value)} id="flight-stats-content">
            <div className="stats-grid">
              {[
                ['Grade', stats ? formatNumber(stats.grade) : '—', 'star'],
                ['XP', stats ? formatNumber(stats.xp) : '—', 'xp'],
                ['Flight Time', stats ? formatFlightTime(stats.flightTime) : '—', 'clock-3'],
                ['Landings', stats ? formatNumber(stats.landings) : '—', 'trophy'],
                ['Online Flights', stats ? formatNumber(stats.onlineFlights) : '—', 'globe'],
                ['ATC Operations', stats ? formatNumber(stats.atcOperations) : '—', 'headset'],
              ].map(([label, value, icon]) => <div className="stat" key={label}><span className="stat-label">{label}</span><strong>{icon === 'xp' ? <span className="xp-icon" aria-hidden="true">XP</span> : <Icon name={icon} />}<span aria-label={stats ? undefined : 'Unavailable'}>{value}</span></strong></div>)}
            </div>
          {!stats && <p className="stats-unavailable" role="status">{flightStats?.message ?? 'Checking current stats…'}</p>}
          {flightStats?.updatedAt && <p className="last-updated">Updated {new Date(flightStats.updatedAt).toLocaleDateString()}</p>}
          <p className="attribution">*Flight Stats are from <a href="https://infiniteflight.com" target="_blank" rel="noopener noreferrer">Infinite Flight</a>.</p>
        </CollapsibleCard>

        <div className="social-row" aria-label="Personal links">
          {SITE_CONFIG.socials.map((social) => (
            <a className="glass-card social-card" href={social.href} target="_blank" rel="noopener noreferrer" aria-label={`Open RT on ${social.label}`} key={social.label}>
              <span className={`social-brand social-${social.icon}`}><BrandIcon name={social.icon} /></span><span className="social-copy"><span>{social.label}</span><small>{social.icon === 'discord' && presence?.discord_user.username ? `@${presence.discord_user.username}` : social.icon === 'youtube' ? '@Reactor_Tech' : 'View profile'}</small></span>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
