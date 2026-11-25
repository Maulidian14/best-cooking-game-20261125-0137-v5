// Steam, chop bits, sparkles and floating score text. Particles are pure
// decoration: they never change the rules, only the feel. One file, one job.
export function createParticles() {
  const list = [];
  const floats = [];

  return {
    list,
    floats,
    steam(x, y) {
      list.push({ kind: 'steam', x: x + (Math.random() - 0.5) * 20, y, vy: -34 - Math.random() * 18, life: 0.9, max: 0.9, size: 7 + Math.random() * 6 });
    },
    chop(x, y, color) {
      for (let i = 0; i < 10; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 60 + Math.random() * 90;
        list.push({ kind: 'bit', x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 30, life: 0.5, max: 0.5, size: 3 + Math.random() * 3, color });
      }
    },
    sparkle(x, y) {
      for (let i = 0; i < 14; i += 1) {
        const angle = (i / 14) * Math.PI * 2;
        const speed = 70 + Math.random() * 60;
        list.push({ kind: 'bit', x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.6, max: 0.6, size: 3, color: '#f2b705' });
      }
    },
    smoke(x, y) {
      list.push({ kind: 'smoke', x, y, vy: -26, life: 1.2, max: 1.2, size: 9 });
    },
    floatText(x, y, text, color) {
      floats.push({ x, y, text, color, life: 1.4, max: 1.4 });
    },
    update(dt) {
      for (let i = list.length - 1; i >= 0; i -= 1) {
        const p = list[i];
        p.life -= dt;
        if (p.life <= 0) {
          list.splice(i, 1);
          continue;
        }
        if (p.kind === 'bit') {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += 220 * dt;
        } else {
          p.y += p.vy * dt;
          p.size += 6 * dt;
        }
      }
      for (let i = floats.length - 1; i >= 0; i -= 1) {
        const f = floats[i];
        f.life -= dt;
        f.y -= 42 * dt;
        if (f.life <= 0) floats.splice(i, 1);
      }
    },
    clear() {
      list.length = 0;
      floats.length = 0;
    },
  };
}
