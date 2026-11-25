// The kitchen itself: the chef, the stations, the orders, the scoring.
// One file, one job: the rules of Sizzle & Serve.
//
// Events the step returns (a bitmask) so the caller can play sounds and
// announce without the world knowing about audio.
import {
  BIN_SIZE, BURN_AFTER, CHEF_RADIUS, CHEF_SPEED, HAND_LIMIT, MAX_ORDERS,
  MAX_STRIKES, PANTRY_BINS, PLATE_LIMIT, PREP, RECIPES, SHIFT_SECONDS,
  STATIONS, levelForServes, orderTimeSeconds, spawnGapSeconds,
} from './config.js';
import { createParticles } from './particles.js';

export const EVENT_PICKUP = 1;
export const EVENT_PLACE = 2;
export const EVENT_CHOP = 4;
export const EVENT_CHOP_DONE = 8;
export const EVENT_COOK_DONE = 16;
export const EVENT_SERVE = 32;
export const EVENT_WRONG = 64;
export const EVENT_EXPIRE = 128;
export const EVENT_NEW_ORDER = 256;
export const EVENT_OVER = 512;
export const EVENT_BURN = 1024;

let nextOrderId = 1;
// Seconds between chop sounds while the board is busy.
let chopSfx = 0;

function rectOf(station) {
  return STATIONS[station];
}

function distToRect(x, y, rect) {
  const cx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  return Math.hypot(x - cx, y - cy);
}

function sameItems(a, b) {
  if (a.length !== b.length) return false;
  const rest = [...b];
  for (const item of a) {
    const i = rest.indexOf(item);
    if (i === -1) return false;
    rest.splice(i, 1);
  }
  return true;
}

export function createWorld(random) {
  const particles = createParticles();
  const state = {
    time: 0,
    timeLeft: SHIFT_SECONDS,
    score: 0,
    combo: 0,
    bestCombo: 0,
    strikes: 0,
    serves: 0,
    expired: 0,
    level: 1,
    over: false,
    overReason: '',
    chef: { x: 640, y: 420, face: 1, carrying: [], plate: null, walkPhase: 0, moving: false },
    board: { item: null },
    stove: [{ item: null }, { item: null }],
    plate: null,
    orders: [],
    spawnTimer: 2,
    shake: 0,
    flash: 0,
  };

  function pickRecipe() {
    const available = RECIPES.filter((r) => r.minLevel <= state.level);
    // Every unlocked recipe is equally likely, so the board stays varied;
    // difficulty grows through faster spawns and shorter timers instead.
    return random.pick(available);
  }

  function addOrder() {
    const recipe = pickRecipe();
    const total = orderTimeSeconds(state.level);
    state.orders.push({ id: nextOrderId, recipe, timeLeft: total, total });
    nextOrderId += 1;
    return EVENT_NEW_ORDER;
  }

  function reset() {
    state.time = 0;
    state.timeLeft = SHIFT_SECONDS;
    state.score = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.strikes = 0;
    state.serves = 0;
    state.expired = 0;
    state.level = 1;
    state.over = false;
    state.overReason = '';
    state.chef = { x: 640, y: 420, face: 1, carrying: [], plate: null, walkPhase: 0, moving: false };
    state.board = { item: null };
    state.stove = [{ item: null }, { item: null }];
    state.plate = null;
    state.orders = [];
    state.spawnTimer = 2;
    state.shake = 0;
    state.flash = 0;
    particles.clear();
  }

  function nearestStation() {
    const chef = state.chef;
    let best = null;
    let bestDist = Infinity;
    for (const name of Object.keys(STATIONS)) {
      const d = distToRect(chef.x, chef.y, rectOf(name));
      if (d < bestDist) {
        bestDist = d;
        best = name;
      }
    }
    return bestDist <= CHEF_RADIUS + 42 ? best : null;
  }

  function pantryBinNear() {
    const chef = state.chef;
    // The nearest bin in reach, not the first: the bins sit 88 px apart and
    // the reach is 62 px, so two bins can both be in reach at once.
    let best = null;
    let bestDist = Infinity;
    for (const bin of PANTRY_BINS) {
      // Distance to the bin's edge, not its centre: the chef stands outside
      // the solid pantry and reaches in from the side.
      const d = distToRect(chef.x, chef.y, { x: bin.x, y: bin.y, w: BIN_SIZE, h: BIN_SIZE });
      if (d < bestDist) {
        bestDist = d;
        best = bin;
      }
    }
    return bestDist <= CHEF_RADIUS + 42 ? best : null;
  }

  function takeTopHand() {
    return state.chef.carrying.pop();
  }

  function servePlate() {
    const plate = state.chef.plate;
    if (!plate) return 0;
    const match = state.orders.find((order) => sameItems(plate.items, order.recipe.items));
    state.chef.plate = null;
    if (!match) {
      state.strikes += 1;
      state.combo = 0;
      state.shake = 0.35;
      if (state.strikes >= MAX_STRIKES) {
        state.over = true;
        state.overReason = 'strikes';
        return EVENT_WRONG | EVENT_OVER;
      }
      return EVENT_WRONG;
    }
    state.orders.splice(state.orders.indexOf(match), 1);
    const timeBonus = Math.round(5 * (match.timeLeft / match.total));
    const multiplier = 1 + Math.min(state.combo, 10) * 0.1;
    const gained = Math.round((match.recipe.price + timeBonus) * multiplier);
    state.score += gained;
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    state.serves += 1;
    state.level = levelForServes(state.serves);
    state.shake = 0.18;
    state.flash = 0.25;
    particles.sparkle(1129, 602);
    particles.floatText(1129, 570, `+$${gained}`, '#f2b705');
    if (state.combo >= 2) particles.floatText(state.chef.x, state.chef.y - 46, `COMBO x${state.combo}!`, '#d64541');
    return EVENT_SERVE;
  }

  function interact() {
    // The pantry bins are checked before the nearest station: the chef
    // stands in the corridor between the pantry shelf and the workstations,
    // where both are in reach, and the bin is what they came for.
    const bin = pantryBinNear();
    if (bin) {
      const chef = state.chef;
      if (chef.carrying.length >= HAND_LIMIT) return 0;
      chef.carrying.push(bin.kind);
      return EVENT_PICKUP;
    }
    const station = nearestStation();
    if (!station) return 0;
    const chef = state.chef;
    if (station === 'pantry') return 0;
    if (station === 'board') {
      const slot = state.board;
      if (slot.item && slot.item.done) {
        if (chef.carrying.length >= HAND_LIMIT) return 0;
        chef.carrying.push(slot.item.result);
        slot.item = null;
        return EVENT_PICKUP;
      }
      if (!slot.item && chef.carrying.length > 0) {
        const top = chef.carrying[chef.carrying.length - 1];
        const prep = PREP[top];
        if (prep && prep.station === 'board') {
          chef.carrying.pop();
          slot.item = { kind: top, result: prep.result, progress: 0, seconds: prep.seconds, done: false };
          return EVENT_PLACE;
        }
      }
      return 0;
    }
    if (station === 'stove') {
      // Take a finished burner first, then fill an empty one.
      for (const burner of state.stove) {
        if (burner.item && burner.item.done) {
          if (chef.carrying.length >= HAND_LIMIT) return 0;
          chef.carrying.push(burner.item.result);
          burner.item = null;
          return EVENT_PICKUP;
        }
      }
      if (chef.carrying.length > 0) {
        const top = chef.carrying[chef.carrying.length - 1];
        const prep = PREP[top];
        if (prep && prep.station === 'stove') {
          const free = state.stove.find((b) => !b.item);
          if (!free) return 0;
          chef.carrying.pop();
          free.item = { kind: top, result: prep.result, progress: 0, seconds: prep.seconds, done: false, burnt: false, burnTimer: 0 };
          return EVENT_PLACE;
        }
      }
      return 0;
    }
    if (station === 'plating') {
      if (!state.plate) {
        if (chef.carrying.length === 0) return 0;
        state.plate = { items: [takeTopHand()] };
        return EVENT_PLACE;
      }
      if (chef.carrying.length > 0) {
        if (state.plate.items.length >= PLATE_LIMIT) return 0;
        state.plate.items.push(takeTopHand());
        return EVENT_PLACE;
      }
      // Empty hands: pick the plate up to carry it to the window.
      chef.plate = state.plate;
      state.plate = null;
      return EVENT_PICKUP;
    }
    if (station === 'serve') {
      return servePlate();
    }
    if (station === 'trash') {
      if (chef.carrying.length > 0) {
        chef.carrying.pop();
        return EVENT_PLACE;
      }
      if (chef.plate) {
        chef.plate = null;
        return EVENT_PLACE;
      }
      return 0;
    }
    return 0;
  }

  function takeBack() {
    if (!state.plate || state.plate.items.length === 0) return 0;
    if (state.chef.carrying.length >= HAND_LIMIT) return 0;
    const item = state.plate.items.pop();
    state.chef.carrying.push(item);
    if (state.plate.items.length === 0) state.plate = null;
    return EVENT_PICKUP;
  }

  function moveChef(dt, mx, my) {
    const chef = state.chef;
    if (!mx && !my) {
      chef.moving = false;
      return;
    }
    chef.moving = true;
    if (mx !== 0) chef.face = mx > 0 ? 1 : -1;
    chef.walkPhase += dt * 11;
    const solids = Object.values(STATIONS);
    let nx = chef.x + mx * CHEF_SPEED * dt;
    let ny = chef.y + my * CHEF_SPEED * dt;
    nx = Math.max(20, Math.min(1260, nx));
    ny = Math.max(176, Math.min(700, ny));
    // Slide along station rects: resolve X, then Y.
    const blocked = (x, y) => solids.some((r) => x > r.x - CHEF_RADIUS && x < r.x + r.w + CHEF_RADIUS && y > r.y - CHEF_RADIUS && y < r.y + r.h + CHEF_RADIUS);
    if (!blocked(nx, chef.y)) chef.x = nx;
    if (!blocked(chef.x, ny)) chef.y = ny;
  }

  function updateCooking(dt) {
    let events = 0;
    const slot = state.board;
    if (slot.item && !slot.item.done) {
      slot.item.progress += dt;
      chopSfx -= dt;
      if (chopSfx <= 0) {
        chopSfx = 0.45;
        events |= EVENT_CHOP;
        particles.chop(371, 602, '#8ed07a');
      }
      if (slot.item.progress >= slot.item.seconds) {
        slot.item.done = true;
        events |= EVENT_CHOP_DONE;
      }
    }
    const stoveRect = STATIONS.stove;
    for (let b = 0; b < state.stove.length; b += 1) {
      const burner = state.stove[b];
      const item = burner.item;
      if (!item) continue;
      const burnerX = stoveRect.x + 52 + b * 106;
      const burnerY = stoveRect.y + 34;
      if (!item.done) {
        item.progress += dt;
        if (Math.random() < dt * 8) particles.steam(burnerX, burnerY - 22);
        if (item.progress >= item.seconds) {
          item.done = true;
          events |= EVENT_COOK_DONE;
        }
      } else if (!item.burnt) {
        item.burnTimer += dt;
        if (item.burnTimer >= BURN_AFTER) {
          item.burnt = true;
          events |= EVENT_BURN;
          particles.smoke(burnerX, burnerY - 10);
        }
      }
    }
    return events;
  }

  function step(dt, input, attract) {
    let events = 0;
    particles.update(dt);
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt);
    if (state.flash > 0) state.flash = Math.max(0, state.flash - dt);
    if (attract) {
      // Title backdrop: the kitchen idles, nothing expires.
      state.chef.walkPhase += dt * 2;
      return 0;
    }
    if (state.over) return 0;
    state.time += dt;
    state.timeLeft -= dt;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      state.over = true;
      state.overReason = 'shift';
      return EVENT_OVER;
    }
    if (input) {
      moveChef(dt, input.mx || 0, input.my || 0);
      if (input.act) events |= interact();
      if (input.takeback) events |= takeBack();
    }
    events |= updateCooking(dt);
    // Orders tick down; an expired ticket costs a strike.
    for (let i = state.orders.length - 1; i >= 0; i -= 1) {
      const order = state.orders[i];
      order.timeLeft -= dt;
      if (order.timeLeft <= 0) {
        state.orders.splice(i, 1);
        state.expired += 1;
        state.strikes += 1;
        state.combo = 0;
        state.shake = 0.35;
        events |= EVENT_EXPIRE;
        if (state.strikes >= MAX_STRIKES) {
          state.over = true;
          state.overReason = 'strikes';
          events |= EVENT_OVER;
        }
      }
    }
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0 && state.orders.length < MAX_ORDERS) {
      events |= addOrder();
      state.spawnTimer = spawnGapSeconds(state.level);
    }
    return events;
  }

  return {
    state,
    particles,
    reset,
    step,
    addOrder,
    nearestStation,
    stationAt(x, y) {
      for (const name of Object.keys(STATIONS)) {
        const r = rectOf(name);
        if (x >= r.x - 10 && x <= r.x + r.w + 10 && y >= r.y - 10 && y <= r.y + r.h + 10) return name;
      }
      return null;
    },
    pantryBinAt(x, y) {
      for (const bin of PANTRY_BINS) {
        if (x >= bin.x && x <= bin.x + BIN_SIZE && y >= bin.y && y <= bin.y + BIN_SIZE) return bin;
      }
      return null;
    },
  };
}
