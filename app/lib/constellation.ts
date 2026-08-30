export type ConstellationOptions = {
  connectionRadius: number;
  cursorRadius: number;
  cursorPush: number;
  easingSeconds: number;
  driftSpeed: number;
  maxSpeed: number;
  lineOpacity: number;
  particleOpacity: number;
  areaPerParticle: number;
  maxParticles: number;
  mobileMaxParticles: number;
  framesPerSecond: number;
};

export type Particle = { x: number; y: number; vx: number; vy: number; driftX: number; driftY: number; radius: number };
export type Cursor = { x: number; y: number; active: boolean };

export function connectionOpacity(distance: number, radius: number, maximum: number) {
  if (radius <= 0 || distance >= radius) return 0;
  const proximity = Math.max(0, Math.min(1, 1 - distance / radius));
  // Smoothstep has zero slope at both ends, so connections never pop at the threshold.
  return maximum * proximity * proximity * (3 - 2 * proximity);
}

export function createParticles(width: number, height: number, options: ConstellationOptions, compact = false, random = Math.random): Particle[] {
  const cap = Math.min(160, compact ? options.mobileMaxParticles : options.maxParticles);
  const count = Math.max(0, Math.min(cap, Math.max(24, Math.round(width * height / options.areaPerParticle))));
  return Array.from({ length: count }, () => {
    const angle = random() * Math.PI * 2;
    const speed = options.driftSpeed * (0.4 + random() * 0.6);
    const driftX = Math.cos(angle) * speed;
    const driftY = Math.sin(angle) * speed;
    return { x: random() * width, y: random() * height, vx: driftX, vy: driftY, driftX, driftY, radius: 0.8 + random() * 0.8 };
  });
}

export function advanceParticles(particles: Particle[], seconds: number, width: number, height: number, cursor: Cursor, options: ConstellationOptions) {
  const dt = Math.min(0.05, Math.max(0, seconds));
  const easing = 1 - Math.exp(-dt / Math.max(0.05, options.easingSeconds));
  for (const particle of particles) {
    let targetX = particle.driftX;
    let targetY = particle.driftY;
    if (cursor.active && options.cursorRadius > 0) {
      // Point away from the cursor so nearby particles spread outward.
      const dx = particle.x - cursor.x;
      const dy = particle.y - cursor.y;
      const distance = Math.hypot(dx, dy);
      const influence = connectionOpacity(distance, options.cursorRadius, options.cursorPush);
      targetX += dx * influence;
      targetY += dy * influence;
    }
    // Ease velocity, not position: the cursor can never teleport a particle.
    particle.vx += (targetX - particle.vx) * easing;
    particle.vy += (targetY - particle.vy) * easing;
    const speed = Math.hypot(particle.vx, particle.vy);
    if (speed > options.maxSpeed && speed > 0) {
      particle.vx *= options.maxSpeed / speed;
      particle.vy *= options.maxSpeed / speed;
    }
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    // Wrap out of view, avoiding visible jumps at the canvas edge.
    const margin = 25;
    if (particle.x < -margin) particle.x = width + margin;
    else if (particle.x > width + margin) particle.x = -margin;
    if (particle.y < -margin) particle.y = height + margin;
    else if (particle.y > height + margin) particle.y = -margin;
  }
}

export function drawConstellation(context: CanvasRenderingContext2D, particles: Particle[], width: number, height: number, options: ConstellationOptions) {
  context.clearRect(0, 0, width, height);
  context.lineWidth = 0.65;
  context.lineCap = 'round';
  const radiusSquared = options.connectionRadius ** 2;
  for (let i = 0; i < particles.length; i++) {
    const a = particles[i];
    for (let j = i + 1; j < particles.length; j++) {
      const b = particles[j];
      const distanceSquared = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
      if (distanceSquared >= radiusSquared) continue;
      const opacity = connectionOpacity(Math.sqrt(distanceSquared), options.connectionRadius, options.lineOpacity);
      context.strokeStyle = `rgba(112, 190, 255, ${opacity})`;
      context.beginPath();
      context.moveTo(a.x, a.y);
      context.lineTo(b.x, b.y);
      context.stroke();
    }
  }
  for (const particle of particles) {
    context.fillStyle = `rgba(136, 207, 255, ${options.particleOpacity})`;
    context.beginPath();
    context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    context.fill();
  }
}
