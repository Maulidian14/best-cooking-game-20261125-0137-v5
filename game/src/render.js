// Everything the eye sees: the kitchen, the food, the tickets, the HUD and
// the title / pause / game-over screens. All art is drawn with canvas paths —
// no images, no network. One file, one job: painting the game.
import { BIN_SIZE, COLORS, INGREDIENTS, PANTRY_BINS, STATIONS, VIEW } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

/** Draw one ingredient icon centred at (x, y) with the given diameter. */
export function drawIngredient(ctx, kind, x, y, size) {
  const s = size / 2;
  ctx.save();
  ctx.translate(x, y);
  if (kind === 'bun') {
    ctx.fillStyle = '#e8b06a';
    ctx.beginPath();
    ctx.arc(0, s * 0.25, s * 0.85, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d89a4e';
    ctx.fillRect(-s * 0.85, s * 0.2, s * 1.7, s * 0.28);
    ctx.fillStyle = '#fff2cf';
    for (const [dx, dy] of [[-0.4, -0.35], [0, -0.55], [0.4, -0.35]]) {
      circle(ctx, dx * s, dy * s, s * 0.09);
      ctx.fill();
    }
  } else if (kind === 'patty') {
    ctx.fillStyle = '#b45a4a';
    roundRect(ctx, -s * 0.9, -s * 0.32, s * 1.8, s * 0.64, s * 0.3);
    ctx.fill();
    ctx.fillStyle = '#c9705f';
    for (let i = -2; i <= 2; i += 1) {
      circle(ctx, i * s * 0.32, 0, s * 0.08);
      ctx.fill();
    }
  } else if (kind === 'patty-cooked') {
    ctx.fillStyle = '#7a3b2e';
    roundRect(ctx, -s * 0.9, -s * 0.32, s * 1.8, s * 0.64, s * 0.3);
    ctx.fill();
    ctx.strokeStyle = '#5a2a20';
    ctx.lineWidth = s * 0.1;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * s * 0.5 - s * 0.2, -s * 0.28);
      ctx.lineTo(i * s * 0.5 + s * 0.2, s * 0.28);
      ctx.stroke();
    }
  } else if (kind === 'lettuce') {
    ctx.fillStyle = '#69b455';
    for (const [dx, dy, r] of [[-0.35, 0.1, 0.5], [0.35, 0.1, 0.5], [0, -0.25, 0.55]]) {
      circle(ctx, dx * s, dy * s, r * s);
      ctx.fill();
    }
    ctx.strokeStyle = '#4c8a3d';
    ctx.lineWidth = s * 0.08;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.6);
    ctx.lineTo(0, s * 0.5);
    ctx.stroke();
  } else if (kind === 'lettuce-chopped') {
    ctx.strokeStyle = '#69b455';
    ctx.lineWidth = s * 0.16;
    ctx.lineCap = 'round';
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * s * 0.34 - s * 0.3, -s * 0.35 + i * s * 0.12);
      ctx.lineTo(i * s * 0.34 + s * 0.3, s * 0.35 - i * s * 0.1);
      ctx.stroke();
    }
  } else if (kind === 'tomato') {
    ctx.fillStyle = '#e05244';
    circle(ctx, 0, s * 0.1, s * 0.8);
    ctx.fill();
    ctx.fillStyle = '#3f9e4d';
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.55);
    ctx.lineTo(-s * 0.35, -s * 0.25);
    ctx.lineTo(0, -s * 0.4);
    ctx.lineTo(s * 0.35, -s * 0.25);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'tomato-chopped') {
    ctx.fillStyle = '#f07a6a';
    for (let i = 0; i < 3; i += 1) {
      ctx.save();
      ctx.rotate((i - 1) * 0.5);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, s * 0.75, -0.5, 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  } else if (kind === 'cheese') {
    ctx.fillStyle = '#f2c531';
    ctx.beginPath();
    ctx.moveTo(-s * 0.85, s * 0.6);
    ctx.lineTo(0, -s * 0.7);
    ctx.lineTo(s * 0.85, s * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d9a91c';
    for (const [dx, dy] of [[-0.3, 0.25], [0.25, 0.3], [0, -0.1]]) {
      circle(ctx, dx * s, dy * s, s * 0.11);
      ctx.fill();
    }
  } else if (kind === 'pasta') {
    ctx.strokeStyle = '#f0d089';
    ctx.lineWidth = s * 0.2;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(0, (i - 1) * s * 0.42, s * (0.55 - i * 0.08), 0.3, Math.PI - 0.3);
      ctx.stroke();
    }
  } else if (kind === 'pasta-cooked') {
    ctx.fillStyle = '#e8e2d0';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.85, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#f5dd9a';
    ctx.lineWidth = s * 0.2;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc((i - 1) * s * 0.3, -s * 0.1, s * 0.4, Math.PI, 0);
      ctx.stroke();
    }
  } else if (kind === 'sauce') {
    ctx.fillStyle = '#c0392b';
    roundRect(ctx, -s * 0.45, -s * 0.5, s * 0.9, s * 1.1, s * 0.2);
    ctx.fill();
    ctx.fillStyle = '#8e2a20';
    ctx.fillRect(-s * 0.22, -s * 0.85, s * 0.44, s * 0.4);
    ctx.fillStyle = '#fff6e3';
    ctx.fillRect(-s * 0.32, -s * 0.1, s * 0.64, s * 0.4);
  }
  ctx.restore();
}

function drawProgressRing(ctx, x, y, r, fraction, done, burnt) {
  ctx.save();
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  circle(ctx, x, y, r);
  ctx.stroke();
  ctx.strokeStyle = burnt ? '#c0392b' : done ? '#3f9e4d' : '#f2b705';
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + fraction * Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawPlate(ctx, items, x, y, size) {
  ctx.save();
  ctx.fillStyle = '#f4f6f8';
  circle(ctx, x, y, size / 2);
  ctx.fill();
  ctx.strokeStyle = '#c8ccd2';
  ctx.lineWidth = 2;
  circle(ctx, x, y, size / 2);
  ctx.stroke();
  ctx.fillStyle = '#dde1e6';
  circle(ctx, x, y, size * 0.32);
  ctx.fill();
  // Stack the dish's items so the plate reads at a glance.
  const shown = items.slice(-4);
  shown.forEach((kind, i) => {
    drawIngredient(ctx, kind, x, y - size * 0.08 + i * size * 0.05, size * 0.52);
  });
  ctx.restore();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function drawFloor() {
    ctx.fillStyle = COLORS.floorA;
    ctx.fillRect(0, 164, VIEW.width, VIEW.height - 164);
    ctx.fillStyle = COLORS.floorB;
    const tile = 64;
    for (let ty = 164; ty < VIEW.height; ty += tile) {
      for (let tx = ((ty / tile) % 2 === 0 ? 0 : tile / 2); tx < VIEW.width; tx += tile) {
        ctx.fillRect(tx, ty, tile - 2, tile - 2);
      }
    }
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(0, 164, VIEW.width, 10);
  }

  function drawPantry(state) {
    const r = STATIONS.pantry;
    ctx.fillStyle = COLORS.wood;
    roundRect(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.fill();
    ctx.fillStyle = COLORS.cream;
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PANTRY', r.x + r.w - 42, r.y + r.h / 2 + 5);
    for (const bin of PANTRY_BINS) {
      ctx.fillStyle = '#fffdf5';
      roundRect(ctx, bin.x, bin.y, BIN_SIZE, BIN_SIZE, 8);
      ctx.fill();
      ctx.strokeStyle = '#cbb98f';
      ctx.lineWidth = 2;
      roundRect(ctx, bin.x, bin.y, BIN_SIZE, BIN_SIZE, 8);
      ctx.stroke();
      drawIngredient(ctx, bin.kind, bin.x + BIN_SIZE / 2, bin.y + BIN_SIZE / 2 - 6, 44);
      ctx.fillStyle = COLORS.ink;
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillText(INGREDIENTS[bin.kind].name, bin.x + BIN_SIZE / 2, bin.y + BIN_SIZE - 7);
    }
  }

  function drawBoard(state) {
    const r = STATIONS.board;
    ctx.fillStyle = '#d9a066';
    roundRect(ctx, r.x, r.y, r.w, r.h, 8);
    ctx.fill();
    ctx.fillStyle = '#f3e2c7';
    roundRect(ctx, r.x + 10, r.y + 12, r.w - 20, r.h - 34, 6);
    ctx.fill();
    ctx.fillStyle = COLORS.ink;
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CHOP', r.x + r.w / 2, r.y + r.h - 6);
    const item = state.board.item;
    if (item) {
      drawIngredient(ctx, item.kind, r.x + r.w / 2, r.y + r.h / 2 - 6, 44);
      if (!item.done) {
        drawProgressRing(ctx, r.x + r.w / 2, r.y + r.h / 2 - 6, 30, item.progress / item.seconds, false, false);
      } else {
        ctx.fillStyle = '#3f9e4d';
        ctx.font = 'bold 13px system-ui, sans-serif';
        ctx.fillText('READY!', r.x + r.w / 2, r.y + 22);
      }
    }
  }

  function drawStove(state) {
    const r = STATIONS.stove;
    ctx.fillStyle = COLORS.steelDark;
    roundRect(ctx, r.x, r.y, r.w, r.h, 8);
    ctx.fill();
    ctx.fillStyle = COLORS.steel;
    roundRect(ctx, r.x + 6, r.y + 6, r.w - 12, r.h - 26, 6);
    ctx.fill();
    ctx.fillStyle = COLORS.ink;
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('STOVE', r.x + r.w / 2, r.y + r.h - 6);
    state.stove.forEach((burner, i) => {
      const cx = r.x + 52 + i * 106;
      const cy = r.y + 34;
      ctx.fillStyle = '#3a3f45';
      circle(ctx, cx, cy, 30);
      ctx.fill();
      ctx.fillStyle = '#22262b';
      circle(ctx, cx, cy, 22);
      ctx.fill();
      const item = burner.item;
      if (item) {
        if (item.burnt) {
          ctx.fillStyle = '#1a1a1a';
          circle(ctx, cx, cy, 18);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 12px system-ui, sans-serif';
          ctx.fillText('BURNT', cx, cy + 4);
        } else {
          drawIngredient(ctx, item.done ? item.result : item.kind, cx, cy, 40);
          if (!item.done) drawProgressRing(ctx, cx, cy, 32, item.progress / item.seconds, false, false);
          else {
            ctx.fillStyle = '#3f9e4d';
            ctx.font = 'bold 11px system-ui, sans-serif';
            ctx.fillText('READY', cx, cy - 36);
          }
        }
      }
    });
  }

  function drawPlating(state) {
    const r = STATIONS.plating;
    ctx.fillStyle = '#e9e2d0';
    roundRect(ctx, r.x, r.y, r.w, r.h, 8);
    ctx.fill();
    ctx.strokeStyle = '#b9ac8d';
    ctx.lineWidth = 2;
    roundRect(ctx, r.x, r.y, r.w, r.h, 8);
    ctx.stroke();
    ctx.fillStyle = COLORS.ink;
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PLATING', r.x + r.w / 2, r.y + r.h - 6);
    if (state.plate) {
      drawPlate(ctx, state.plate.items, r.x + r.w / 2, r.y + r.h / 2 - 6, 62);
      ctx.fillStyle = COLORS.ink;
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillText(`${state.plate.items.length} item${state.plate.items.length === 1 ? '' : 's'}`, r.x + r.w / 2, r.y + 20);
    } else {
      ctx.fillStyle = '#9a8a6d';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText('build a dish here', r.x + r.w / 2, r.y + r.h / 2);
    }
  }

  function drawServe(state) {
    const r = STATIONS.serve;
    ctx.fillStyle = '#8a5a2b';
    roundRect(ctx, r.x, r.y, r.w, r.h, 8);
    ctx.fill();
    // Red-and-white awning stripes above the window.
    for (let i = 0; i < 8; i += 1) {
      ctx.fillStyle = i % 2 === 0 ? '#d64541' : '#fff6e3';
      ctx.fillRect(r.x + 6 + i * ((r.w - 12) / 8), r.y - 2, (r.w - 12) / 8, 14);
    }
    ctx.fillStyle = '#2b1a10';
    roundRect(ctx, r.x + 12, r.y + 18, r.w - 24, r.h - 40, 6);
    ctx.fill();
    ctx.fillStyle = '#ffd94d';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SERVE  •  $', r.x + r.w / 2, r.y + 48);
    ctx.fillStyle = '#fff6e3';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('bring a finished plate', r.x + r.w / 2, r.y + 68);
  }

  function drawTrash(state) {
    const r = STATIONS.trash;
    ctx.fillStyle = '#5a6068';
    roundRect(ctx, r.x, r.y, r.w, r.h, 8);
    ctx.fill();
    ctx.fillStyle = '#3a3f45';
    roundRect(ctx, r.x + 14, r.y + 10, r.w - 28, r.h - 28, 6);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TRASH', r.x + r.w / 2, r.y + r.h - 6);
  }

  function drawOrders(state) {
    ctx.fillStyle = COLORS.wall;
    roundRect(ctx, 16, 72, VIEW.width - 32, 84, 10);
    ctx.fill();
    ctx.fillStyle = '#fff6e3';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ORDER BOARD', 30, 96);
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = '#e8b98a';
    ctx.fillText('serve the ticket before its timer runs out', 150, 96);
    state.orders.forEach((order, i) => {
      const x = 200 + i * 262;
      const y = 76;
      const w = 248;
      const h = 76;
      const urgent = order.timeLeft <= 10;
      ctx.fillStyle = urgent ? '#ffe1de' : COLORS.ticket;
      roundRect(ctx, x, y, w, h, 8);
      ctx.fill();
      ctx.strokeStyle = urgent ? COLORS.danger : '#d9c48f';
      ctx.lineWidth = urgent ? 3 : 2;
      roundRect(ctx, x, y, w, h, 8);
      ctx.stroke();
      ctx.fillStyle = COLORS.ink;
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(order.recipe.name, x + 10, y + 20);
      ctx.fillStyle = '#7a5a2a';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`$${order.recipe.price}`, x + w - 10, y + 20);
      order.recipe.items.forEach((kind, j) => {
        drawIngredient(ctx, kind, x + 24 + j * 34, y + 44, 26);
      });
      const frac = Math.max(0, order.timeLeft / order.total);
      ctx.fillStyle = '#e0d6bd';
      roundRect(ctx, x + 10, y + 62, w - 20, 8, 4);
      ctx.fill();
      ctx.fillStyle = urgent ? COLORS.danger : frac > 0.5 ? '#3f9e4d' : '#f2b705';
      roundRect(ctx, x + 10, y + 62, (w - 20) * frac, 8, 4);
      ctx.fill();
      ctx.fillStyle = urgent ? COLORS.danger : COLORS.ink;
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${Math.ceil(order.timeLeft)}s`, x + w - 10, y + 58);
    });
    if (state.orders.length === 0) {
      ctx.fillStyle = '#e8b98a';
      ctx.font = 'italic 14px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('No orders yet — the first ticket is on its way…', 200, 122);
    }
  }

  function drawHud(state, muted) {
    ctx.fillStyle = '#2b1a10';
    ctx.fillRect(0, 0, VIEW.width, 64);
    ctx.fillStyle = '#f2b705';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`$${state.score}`, 20, 42);
    ctx.fillStyle = '#fff6e3';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText('SIZZLE & SERVE', 110, 30);
    ctx.fillText(`LEVEL ${state.level}  •  ${state.serves} served`, 110, 48);
    if (state.combo >= 2) {
      ctx.fillStyle = '#d64541';
      roundRect(ctx, 330, 14, 130, 36, 18);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`COMBO x${state.combo}`, 395, 38);
    }
    // Shift timer, centre.
    const frac = Math.max(0, state.timeLeft / 180);
    ctx.fillStyle = '#4a3423';
    roundRect(ctx, 520, 18, 320, 16, 8);
    ctx.fill();
    ctx.fillStyle = frac > 0.33 ? '#3f9e4d' : '#d64541';
    roundRect(ctx, 520, 18, 320 * frac, 16, 8);
    ctx.fill();
    ctx.fillStyle = '#fff6e3';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    const minutes = Math.floor(state.timeLeft / 60);
    const seconds = Math.floor(state.timeLeft % 60);
    ctx.fillText(`SHIFT ${minutes}:${String(seconds).padStart(2, '0')}`, 680, 48);
    // Strikes, right.
    ctx.textAlign = 'right';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillStyle = '#fff6e3';
    ctx.fillText('STRIKES', 1150, 28);
    for (let i = 0; i < 3; i += 1) {
      ctx.fillStyle = i < state.strikes ? '#d64541' : '#6b543a';
      circle(ctx, 1100 + i * 30, 44, 9);
      ctx.fill();
      if (i < state.strikes) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(1100 + i * 30 - 4, 40);
        ctx.lineTo(1100 + i * 30 + 4, 48);
        ctx.moveTo(1100 + i * 30 + 4, 40);
        ctx.lineTo(1100 + i * 30 - 4, 48);
        ctx.stroke();
      }
    }
    ctx.fillStyle = '#e8b98a';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(muted ? 'M: sound off' : 'M: sound on', 1260, 60);
  }

  function drawChef(state) {
    const chef = state.chef;
    const bob = chef.moving ? Math.sin(chef.walkPhase) * 2 : Math.sin(chef.walkPhase) * 0.8;
    ctx.save();
    ctx.translate(chef.x, chef.y + bob);
    // Shadow.
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 18, 20, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // Body and apron.
    ctx.fillStyle = '#fff6e3';
    circle(ctx, 0, 0, 20);
    ctx.fill();
    ctx.fillStyle = '#3f9e4d';
    ctx.beginPath();
    ctx.arc(0, 2, 20, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.closePath();
    ctx.fill();
    // Face.
    ctx.fillStyle = '#2b1a10';
    circle(ctx, chef.face * 6, -4, 2.4);
    ctx.fill();
    circle(ctx, chef.face * 6, 4, 2.4);
    ctx.fill();
    // Chef hat.
    ctx.fillStyle = '#ffffff';
    circle(ctx, -8, -20, 8);
    ctx.fill();
    circle(ctx, 0, -24, 9);
    ctx.fill();
    circle(ctx, 8, -20, 8);
    ctx.fill();
    ctx.fillRect(-13, -22, 26, 8);
    // Carried plate.
    if (chef.plate) {
      drawPlate(ctx, chef.plate.items, chef.face * 26, -6, 44);
    }
    // Carried items stacked above the hat.
    chef.carrying.forEach((kind, i) => {
      drawIngredient(ctx, kind, -14 + i * 15, -38, 22);
    });
    ctx.restore();
  }

  function drawParticles(particles) {
    for (const p of particles.list) {
      const alpha = Math.max(0, p.life / p.max);
      if (p.kind === 'steam' || p.kind === 'smoke') {
        ctx.fillStyle = p.kind === 'steam' ? `rgba(255,255,255,${0.5 * alpha})` : `rgba(60,60,60,${0.55 * alpha})`;
        circle(ctx, p.x, p.y, p.size);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color || '#f2b705';
        ctx.globalAlpha = alpha;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        ctx.globalAlpha = 1;
      }
    }
    ctx.textAlign = 'center';
    for (const f of particles.floats) {
      const alpha = Math.max(0, f.life / f.max);
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillStyle = f.color;
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 4;
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    }
  }

  function drawHelp() {
    ctx.fillStyle = 'rgba(43,26,16,0.85)';
    roundRect(ctx, 16, 668, 640, 40, 8);
    ctx.fill();
    ctx.fillStyle = '#fff6e3';
    ctx.font = '13px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('WASD / arrows: walk   •   E / click: use station   •   Q: take item off plate   •   P: pause', 30, 693);
  }

  function drawTitle(state, best) {
    ctx.fillStyle = 'rgba(43,26,16,0.72)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f2b705';
    ctx.font = 'bold 84px system-ui, sans-serif';
    ctx.fillText('SIZZLE & SERVE', VIEW.width / 2, 250);
    ctx.fillStyle = '#fff6e3';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText('The rush-hour kitchen — chop, grill, plate, serve!', VIEW.width / 2, 300);
    ctx.font = '17px system-ui, sans-serif';
    const lines = [
      'Take tickets from the order board. Grab ingredients in the pantry.',
      'Chop veg on the board, grill patties and pasta on the stove.',
      'Build the dish on the plating counter, carry it to SERVE before the timer ends.',
      'Three strikes and the shift is over. Fast serves build your combo.',
    ];
    lines.forEach((line, i) => ctx.fillText(line, VIEW.width / 2, 350 + i * 28));
    ctx.fillStyle = '#f2b705';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('Press SPACE or click to start cooking', VIEW.width / 2, 510);
    if (best > 0) {
      ctx.fillStyle = '#fff6e3';
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillText(`Best shift so far: $${best}`, VIEW.width / 2, 545);
    }
    ctx.fillStyle = '#e8b98a';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText('WASD / arrows to walk  •  E or click to use a station  •  Q takes an item off the plate  •  M mutes', VIEW.width / 2, 580);
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(43,26,16,0.7)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = '#fff6e3';
    ctx.font = 'bold 56px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', VIEW.width / 2, 340);
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText('Press P or Space to keep cooking', VIEW.width / 2, 385);
  }

  function drawOver(state, best) {
    ctx.fillStyle = 'rgba(43,26,16,0.78)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f2b705';
    ctx.font = 'bold 60px system-ui, sans-serif';
    ctx.fillText(state.overReason === 'strikes' ? 'SHIFT CUT SHORT!' : 'SHIFT OVER!', VIEW.width / 2, 210);
    ctx.fillStyle = '#fff6e3';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText(`You earned $${state.score}`, VIEW.width / 2, 280);
    ctx.font = '20px system-ui, sans-serif';
    const rows = [
      `Dishes served: ${state.serves}`,
      `Best combo: x${state.bestCombo}`,
      `Orders expired: ${state.expired}`,
      `Level reached: ${state.level}`,
    ];
    rows.forEach((row, i) => ctx.fillText(row, VIEW.width / 2, 330 + i * 34));
    if (state.score >= best && state.score > 0) {
      ctx.fillStyle = '#f2b705';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillText('NEW BEST SHIFT!', VIEW.width / 2, 490);
    } else if (best > 0) {
      ctx.fillStyle = '#e8b98a';
      ctx.font = '18px system-ui, sans-serif';
      ctx.fillText(`Best shift: $${best}`, VIEW.width / 2, 490);
    }
    ctx.fillStyle = '#fff6e3';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('Press SPACE to cook again', VIEW.width / 2, 540);
  }

  return {
    draw(state, screen, best, particles, muted) {
      ctx.save();
      ctx.clearRect(0, 0, VIEW.width, VIEW.height);
      if (state.shake > 0) {
        const mag = state.shake * 14;
        ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
      }
      drawFloor();
      drawPantry(state);
      drawBoard(state);
      drawStove(state);
      drawPlating(state);
      drawServe(state);
      drawTrash(state);
      drawOrders(state);
      drawChef(state);
      drawParticles(particles);
      if (state.flash > 0) {
        ctx.fillStyle = `rgba(242,183,5,${state.flash * 0.9})`;
        ctx.fillRect(0, 0, VIEW.width, VIEW.height);
      }
      drawHud(state, muted);
      if (screen === SCREEN_PLAY) drawHelp();
      else if (screen === SCREEN_TITLE) drawTitle(state, best);
      else if (screen === SCREEN_PAUSED) drawPaused();
      else if (screen === SCREEN_OVER) drawOver(state, best);
      ctx.restore();
    },
  };
}
