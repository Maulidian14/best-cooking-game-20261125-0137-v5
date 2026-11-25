// The screenshot scenes behind ?shot=start|play|rush|end. Each one plays the
// real rules forward from a fresh world, steered by a scripted autopilot that
// walks the chef to real stations and presses the real interact button, so the
// frame is what a short game really looks like and the same seed always gives
// the same frame. One file, one job: staging the screenshots.
import { BIN_SIZE, PANTRY_BINS, STATIONS, STEP } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const SAMPLE = STEP;
/** Steps a single task may take before it is abandoned (15 s). */
const TASK_LIMIT = 900;
/** Steps a whole scene may run (200 s of play). */
const SCENE_LIMIT = 12000;

function binByKind(kind) {
  return PANTRY_BINS.find((b) => b.kind === kind);
}

// A point just outside a station where the chef stands to use it: the
// workstations sit along the bottom wall, so the chef stands above them;
// the pantry shelf is along the top wall, so the chef stands below its bins.
function standPoint(station) {
  const r = STATIONS[station];
  if (station === 'pantry') return null;
  return { x: r.x + r.w / 2, y: r.y - 34 };
}
function binStandPoint(kind) {
  const bin = binByKind(kind);
  return { x: bin.x + BIN_SIZE / 2, y: bin.y + BIN_SIZE + 34 };
}

// Tasks: { at: {x,y}, act: true } walks to a point then presses interact;
// { wait: seconds } stands still; { order: true } builds tasks for the first
// open order (see buildOrderTasks).
function runTasks(world, tasks) {
  let steps = 0;
  for (const task of tasks) {
    if (steps >= SCENE_LIMIT) break;
    if (task.wait) {
      const count = Math.ceil(task.wait / SAMPLE);
      for (let i = 0; i < count && steps < SCENE_LIMIT; i += 1) {
        world.step(SAMPLE, null, false);
        steps += 1;
      }
      continue;
    }
    let acted = false;
    let used = 0;
    while (used < TASK_LIMIT && steps < SCENE_LIMIT) {
      const chef = world.state.chef;
      const dx = task.at.x - chef.x;
      const dy = task.at.y - chef.y;
      const dist = Math.hypot(dx, dy);
      let input = null;
      if (dist > 26) {
        input = { mx: dx / dist, my: dy / dist, act: false, takeback: false };
      } else if (task.act && !acted) {
        input = { mx: 0, my: 0, act: true, takeback: false };
        acted = true;
      } else {
        break;
      }
      world.step(SAMPLE, input, false);
      steps += 1;
      used += 1;
      if (world.state.over) return steps;
    }
  }
  return steps;
}

function gotoAct(at) {
  return { at, act: true };
}

/** Tasks that gather one recipe item: pantry, prep station, back to hands. */
function tasksForItem(kind) {
  const tasks = [gotoAct(binStandPoint(kind))];
  if (kind === 'lettuce' || kind === 'tomato') {
    tasks.push(gotoAct(standPoint('board')));
    tasks.push({ wait: 2.2 });
    tasks.push(gotoAct(standPoint('board')));
  } else if (kind === 'patty' || kind === 'pasta') {
    tasks.push(gotoAct(standPoint('stove')));
    tasks.push({ wait: kind === 'patty' ? 5.6 : 6.6 });
    tasks.push(gotoAct(standPoint('stove')));
  }
  return tasks;
}

/** Tasks that cook the first open order from pantry to serving window. */
function tasksForFirstOrder(world) {
  const order = world.state.orders[0];
  if (!order) return null;
  const tasks = [];
  for (const item of order.recipe.items) {
    // A raw pantry item goes straight to the plate; a prepped one is cooked
    // or chopped first, then carried to the plate.
    if (item === 'bun' || item === 'cheese' || item === 'sauce') {
      tasks.push(gotoAct(binStandPoint(item)));
      tasks.push(gotoAct(standPoint('plating')));
    } else {
      const raw = item.replace('-cooked', '').replace('-chopped', '');
      tasks.push(...tasksForItem(raw));
      tasks.push(gotoAct(standPoint('plating')));
    }
  }
  // Hands are empty now: pick the plate up and serve it.
  tasks.push(gotoAct(standPoint('plating')));
  tasks.push(gotoAct(standPoint('serve')));
  return tasks;
}

/**
 * Set `world` to the named scene (start, play, rush or end) and return the
 * screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'rush' && name !== 'end') {
    world.addOrder();
    world.addOrder();
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'play') {
    // Build a Classic Burger, but stop one step short: the plate holds
    // bun, tomato and lettuce while the grilled patty is still in hand —
    // a dish mid-assembly, with pasta on the second burner and three
    // tickets on the board.
    world.addOrder();
    world.addOrder();
    const script = [
      gotoAct(binStandPoint('patty')),
      gotoAct(standPoint('stove')),
      gotoAct(binStandPoint('lettuce')),
      gotoAct(standPoint('board')),
      { wait: 2.2 },
      gotoAct(standPoint('board')),
      gotoAct(binStandPoint('tomato')),
      gotoAct(standPoint('board')),
      { wait: 2.2 },
      gotoAct(standPoint('board')),
      gotoAct(binStandPoint('bun')),
      gotoAct(standPoint('plating')),
      gotoAct(standPoint('plating')),
      gotoAct(standPoint('plating')),
      // The patty is done by now: take it first (the stove hands back a
      // finished burner before it accepts a new one), then start the pasta.
      gotoAct(standPoint('stove')),
      gotoAct(binStandPoint('pasta')),
      gotoAct(standPoint('stove')),
    ];
    runTasks(world, script);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'rush') {
    // Play on: finish the burger, serve it, start a salad — then the board
    // fills up and one ticket is nearly out of time.
    world.addOrder();
    world.addOrder();
    const script = [
      gotoAct(binStandPoint('patty')),
      gotoAct(standPoint('stove')),
      gotoAct(binStandPoint('lettuce')),
      gotoAct(standPoint('board')),
      { wait: 2.2 },
      gotoAct(standPoint('board')),
      gotoAct(binStandPoint('tomato')),
      gotoAct(standPoint('board')),
      { wait: 2.2 },
      gotoAct(standPoint('board')),
      gotoAct(binStandPoint('bun')),
      gotoAct(standPoint('plating')),
      gotoAct(standPoint('plating')),
      gotoAct(standPoint('plating')),
      { wait: 4 },
      gotoAct(standPoint('stove')),
      gotoAct(standPoint('plating')),
      gotoAct(standPoint('plating')),
      gotoAct(standPoint('serve')),
      gotoAct(binStandPoint('lettuce')),
      gotoAct(standPoint('board')),
      { wait: 2.2 },
      gotoAct(standPoint('board')),
    ];
    runTasks(world, script);
    while (world.state.orders.length < 4) world.addOrder();
    const doomed = world.state.orders[world.state.orders.length - 1];
    if (doomed) doomed.timeLeft = 8;
    return { screen: SCREEN_PLAY, best: world.state.score };
  }
  // end: let the order-driven autopilot play a whole shift.
  let steps = 0;
  while (!world.state.over && steps < SCENE_LIMIT) {
    if (world.state.orders.length === 0) {
      const waited = runTasks(world, [{ wait: 3 }]);
      steps += waited;
      continue;
    }
    const tasks = tasksForFirstOrder(world);
    if (!tasks) break;
    steps += runTasks(world, tasks);
  }
  // If the autopilot stalled, run the clock out honestly.
  let guard = 0;
  while (!world.state.over && guard < 12000) {
    world.step(STEP, null, false);
    guard += 1;
  }
  return { screen: SCREEN_OVER, best: world.state.score };
}
