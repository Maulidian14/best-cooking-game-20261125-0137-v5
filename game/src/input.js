// Keyboard and mouse input: WASD/arrows to walk, E or Space to use a station,
// Q to take an item back off the plate, P or Escape to pause, M to mute.
// Clicking a station walks the chef there and uses it on arrival; clicking
// open floor just walks. One file, one job: turning keys and clicks into input.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_MUTE = 4;
export const ACTION_TAKEBACK = 8;

export function createInput(canvas) {
  const keys = new Set();
  let actions = 0;
  // Where the mouse told the chef to go, in game coordinates, or null.
  let clickTarget = null;
  // The station the click asked for, so arrival auto-uses it.
  let clickStation = null;
  let mouse = { x: 0, y: 0 };

  function gamePoint(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  function onKeyDown(event) {
    const code = event.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) event.preventDefault();
    if (event.repeat) return;
    keys.add(code);
    if (code === 'Space' || code === 'KeyE' || code === 'Enter') actions |= ACTION_CONFIRM;
    if (code === 'KeyP' || code === 'Escape') actions |= ACTION_PAUSE;
    if (code === 'KeyM') actions |= ACTION_MUTE;
    if (code === 'KeyQ') actions |= ACTION_TAKEBACK;
    // A key press cancels a mouse walk: the keyboard is in charge now.
    if (code.startsWith('Arrow') || code.startsWith('KeyW') || code.startsWith('KeyA') || code.startsWith('KeyS') || code.startsWith('KeyD')) {
      clickTarget = null;
      clickStation = null;
    }
  }

  function onKeyUp(event) {
    keys.delete(event.code);
  }

  function onPointerDown(event) {
    const point = gamePoint(event);
    mouse = point;
    clickTarget = point;
    clickStation = null;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);

  return {
    mouse,
    // -1/0/1 movement from the keys, or null when the mouse is steering.
    direction() {
      let x = 0;
      let y = 0;
      if (keys.has('ArrowLeft') || keys.has('KeyA')) x -= 1;
      if (keys.has('ArrowRight') || keys.has('KeyD')) x += 1;
      if (keys.has('ArrowUp') || keys.has('KeyW')) y -= 1;
      if (keys.has('ArrowDown') || keys.has('KeyS')) y += 1;
      if (x === 0 && y === 0) return null;
      const length = Math.hypot(x, y);
      return { x: x / length, y: y / length };
    },
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    // The mouse walk target, if any. Cleared by the caller when reached.
    clickTarget() {
      return clickTarget;
    },
    clearClickTarget() {
      clickTarget = null;
    },
    setClickStation(name) {
      clickStation = name;
    },
    clickStation() {
      return clickStation;
    },
    clearClickStation() {
      clickStation = null;
    },
  };
}
