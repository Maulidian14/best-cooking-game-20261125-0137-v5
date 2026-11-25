// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps (several in a slow frame, none in a fast one), and the
// renderer paints what is there. The game moves between four screens: title,
// play, paused and game over.
//
// ?seed=N fixes the order pattern. ?shot=start|play|rush|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, BIN_SIZE, STATIONS, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_BURN, EVENT_CHOP, EVENT_CHOP_DONE, EVENT_COOK_DONE, EVENT_EXPIRE, EVENT_NEW_ORDER, EVENT_OVER, EVENT_PICKUP, EVENT_PLACE, EVENT_SERVE, EVENT_WRONG } from './world.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, ACTION_TAKEBACK, createInput } from './input.js';
import { createAudio } from './audio.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

// Where the chef walks to use a station: above a workstation, below a bin.
function standPointFor(station, point) {
  if (station === 'pantry') {
    const bin = world.pantryBinAt(point.x, point.y);
    if (bin) return { x: bin.x + BIN_SIZE / 2, y: bin.y + BIN_SIZE + 34 };
    return { x: point.x, y: point.y + 40 };
  }
  const r = STATIONS[station];
  return { x: r.x + r.w / 2, y: r.y - 34 };
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, world.particles, false);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let sizzleTimer = 0;
  const lastTickSecond = new Map();
  // The walk target of the current mouse click, and the station it asked for.
  let walkTarget = null;
  let walkStation = null;
  let seenClickTarget = null;

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    walkTarget = null;
    walkStation = null;
    lastTickSecond.clear();
    screen = SCREEN_PLAY;
    audio.unlock();
    announce(`Playing. Serve tickets before their timers run out.`);
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    audio.gameOver();
    announce(`Shift over. Score ${world.state.score}. Best ${best}.`);
  }

  function playEvents(events) {
    if (events & EVENT_PICKUP) audio.pickup();
    if (events & EVENT_PLACE) audio.place();
    if (events & EVENT_CHOP) audio.chop();
    if (events & EVENT_CHOP_DONE) audio.chopDone();
    if (events & EVENT_COOK_DONE) audio.cookDone();
    if (events & EVENT_SERVE) audio.serve();
    if (events & EVENT_WRONG) audio.wrong();
    if (events & EVENT_EXPIRE) audio.wrong();
    if (events & EVENT_NEW_ORDER) audio.newOrder();
    if (events & EVENT_BURN) audio.wrong();
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const muted = audio.toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) startGame();
    else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
    return actions;
  }

  function mouseDirection() {
    const target = input.clickTarget();
    if (!target) return null;
    if (target !== seenClickTarget) {
      seenClickTarget = target;
      const station = world.stationAt(target.x, target.y) || (world.pantryBinAt(target.x, target.y) ? 'pantry' : null);
      walkStation = station;
      walkTarget = station ? standPointFor(station, target) : { x: target.x, y: target.y };
    }
    const chef = world.state.chef;
    const dx = walkTarget.x - chef.x;
    const dy = walkTarget.y - chef.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 26) {
      input.clearClickTarget();
      seenClickTarget = null;
      // Arrived at a station: use it at once.
      if (walkStation) {
        const station = walkStation;
        walkStation = null;
        walkTarget = null;
        return { x: 0, y: 0, arriveStation: station };
      }
      walkTarget = null;
      return { x: 0, y: 0 };
    }
    return { x: dx / dist, y: dy / dist };
  }

  function stepWorld(dt, actions) {
    let dir = input.direction();
    let act = false;
    let takeback = false;
    if (screen === SCREEN_PLAY) {
      if (dir) {
        input.clearClickTarget();
        seenClickTarget = null;
        walkTarget = null;
        walkStation = null;
      } else {
        const mouse = mouseDirection();
        if (mouse) {
          dir = { x: mouse.x, y: mouse.y };
          if (mouse.arriveStation) act = true;
        }
      }
      if (actions & ACTION_CONFIRM) act = true;
      if (actions & ACTION_TAKEBACK) takeback = true;
    }
    const events = world.step(dt, screen === SCREEN_PLAY ? { mx: dir ? dir.x : 0, my: dir ? dir.y : 0, act, takeback } : null, screen === SCREEN_TITLE);
    playEvents(events);
    if (events & EVENT_OVER) endGame();
    // The order alarm: one tick a second while a ticket has under 10 s left.
    for (const order of world.state.orders) {
      if (order.timeLeft <= 10 && order.timeLeft > 0) {
        const whole = Math.ceil(order.timeLeft);
        if (lastTickSecond.get(order.id) !== whole) {
          lastTickSecond.set(order.id, whole);
          audio.tick();
        }
      }
    }
    // Sizzle while anything cooks.
    const cooking = world.state.stove.some((b) => b.item && !b.item.done);
    if (cooking) {
      sizzleTimer -= dt;
      if (sizzleTimer <= 0) {
        audio.sizzle();
        sizzleTimer = 0.4;
      }
    }
    audio.updateMusic(dt, screen === SCREEN_PLAY);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    const actions = handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      // The action edge is spent on the first sub-step only: repeating it in
      // every catch-up step would double-fire one key press.
      let pending = actions;
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        stepWorld(STEP, pending);
        pending = 0;
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
      world.step(0, null, false);
    }
    renderer.draw(world.state, screen, best, world.particles, audio.isMuted());
  }

  // Leaving the tab pauses a running game rather than letting orders expire unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Sizzle and Serve. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
