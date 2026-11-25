// Sizzle & Serve: every number the kitchen runs on — canvas size, stations,
// ingredients, recipes, timing and the palette. One file, one job: the facts.
export const VIEW = { width: 1280, height: 720 };
export const STEP = 1 / 60;
export const BEST_KEY = 'sizzle-and-serve-best';
export const SHIFT_SECONDS = 180;
export const MAX_STRIKES = 3;
export const MAX_ORDERS = 4;
export const HAND_LIMIT = 3;
export const PLATE_LIMIT = 5;

// The chef's walk speed in pixels per second.
export const CHEF_SPEED = 275;
export const CHEF_RADIUS = 20;
// How close the chef must be to a station's edge to use it.
export const REACH = 42;

export const COLORS = {
  floorA: '#e8b98a',
  floorB: '#dfa872',
  wall: '#7c4a2d',
  wood: '#a0662f',
  woodDark: '#7e4e22',
  steel: '#b9c2cc',
  steelDark: '#8a939e',
  cream: '#fff6e3',
  ink: '#2b1a10',
  red: '#d64541',
  green: '#3f9e4d',
  gold: '#f2b705',
  board: '#fffdf5',
  ticket: '#fffbe8',
  danger: '#c0392b',
};

// Stations the chef walks between. The pantry is a shelf along the top wall
// and the workstations sit in a row along the bottom, with open floor
// between them, so the chef always has a clear route. Each rect is solid;
// the chef interacts from just outside it. `kind` tells the world what an
// interaction does.
export const STATIONS = {
  pantry: { x: 28, y: 176, w: 700, h: 96, label: 'PANTRY' },
  board: { x: 296, y: 560, w: 150, h: 84, label: 'CHOPPING BOARD' },
  stove: { x: 496, y: 560, w: 210, h: 84, label: 'STOVE' },
  plating: { x: 756, y: 560, w: 200, h: 84, label: 'PLATING' },
  serve: { x: 1006, y: 560, w: 246, h: 84, label: 'SERVE HERE' },
  trash: { x: 28, y: 560, w: 130, h: 84, label: 'TRASH' },
};

// Ingredient bins inside the pantry (positions relative to the pantry rect).
// Each bin holds one raw ingredient, endless supply.
export const PANTRY_BINS = [
  { kind: 'bun', x: 40, y: 186 },
  { kind: 'patty', x: 128, y: 186 },
  { kind: 'lettuce', x: 216, y: 186 },
  { kind: 'tomato', x: 304, y: 186 },
  { kind: 'cheese', x: 392, y: 186 },
  { kind: 'pasta', x: 480, y: 186 },
  { kind: 'sauce', x: 568, y: 186 },
];
// Bin size in pixels.
export const BIN_SIZE = 76;

// What each raw ingredient becomes, where, and how long it takes.
export const PREP = {
  lettuce: { station: 'board', seconds: 1.6, result: 'lettuce-chopped' },
  tomato: { station: 'board', seconds: 1.6, result: 'tomato-chopped' },
  patty: { station: 'stove', seconds: 5, result: 'patty-cooked' },
  pasta: { station: 'stove', seconds: 6, result: 'pasta-cooked' },
};
// Seconds a finished cook may sit before it burns.
export const BURN_AFTER = 4;

export const INGREDIENTS = {
  bun: { name: 'Bun', color: '#e8b06a', raw: true },
  patty: { name: 'Patty', color: '#b45a4a', raw: true },
  lettuce: { name: 'Lettuce', color: '#69b455', raw: true },
  tomato: { name: 'Tomato', color: '#e05244', raw: true },
  cheese: { name: 'Cheese', color: '#f2c531', raw: true },
  pasta: { name: 'Pasta', color: '#f0d089', raw: true },
  sauce: { name: 'Sauce', color: '#c0392b', raw: true },
  'patty-cooked': { name: 'Grilled Patty', color: '#7a3b2e' },
  'lettuce-chopped': { name: 'Chopped Lettuce', color: '#8ed07a' },
  'tomato-chopped': { name: 'Chopped Tomato', color: '#f07a6a' },
  'pasta-cooked': { name: 'Cooked Pasta', color: '#f5dd9a' },
};

export const RECIPES = [
  {
    id: 'classic',
    name: 'Classic Burger',
    items: ['bun', 'patty-cooked', 'lettuce-chopped', 'tomato-chopped'],
    price: 12,
    minLevel: 1,
  },
  {
    id: 'cheese',
    name: 'Cheese Burger',
    items: ['bun', 'patty-cooked', 'cheese', 'tomato-chopped'],
    price: 14,
    minLevel: 1,
  },
  {
    id: 'salad',
    name: 'Garden Salad',
    items: ['lettuce-chopped', 'tomato-chopped', 'cheese'],
    price: 9,
    minLevel: 1,
  },
  {
    id: 'pasta',
    name: 'Pasta Marinara',
    items: ['pasta-cooked', 'sauce'],
    price: 11,
    minLevel: 2,
  },
  {
    id: 'deluxe',
    name: 'Deluxe Burger',
    items: ['bun', 'patty-cooked', 'cheese', 'lettuce-chopped', 'tomato-chopped'],
    price: 18,
    minLevel: 3,
  },
];

// Order pacing by level: spawn gap and ticket time shrink as the shift heats up.
export function spawnGapSeconds(level) {
  return Math.max(7, 15 - level * 1.2);
}
export function orderTimeSeconds(level) {
  return Math.max(40, 80 - level * 4);
}
export function levelForServes(serves) {
  return 1 + Math.floor(serves / 4);
}
