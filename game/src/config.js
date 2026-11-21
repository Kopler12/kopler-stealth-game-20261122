// Lantern Shadow — tuning constants and the three hand-built levels.
//
// Map legend (every row is 28 tiles, every level is 18 rows):
//   # wall   . floor   c crate (cover, blocks sight)   b bush (cover)
//   s shadow pool (detection is slower)   l lantern light (detection is faster)
//   * moon seal   E exit gate   P player start   G guard start (floor)

export const TILE = 40;
export const VIEW_W = 1280;
export const VIEW_H = 800;
export const HUD_H = 64;

export const PLAYER_RUN_SPEED = 175;
export const PLAYER_SNEAK_SPEED = 88;
export const PLAYER_RADIUS = 13;
export const GUARD_PATROL_SPEED = 62;
export const GUARD_CHASE_SPEED = 205;
export const GUARD_RADIUS = 14;
export const VISION_RANGE = 215;
export const VISION_HALF_ANGLE = 0.62;
export const NOISE_RUN_RADIUS = 95;
export const NOISE_SNEAK_RADIUS = 26;
export const PEBBLE_RANGE = 330;
export const PEBBLE_HEAR_RADIUS = 170;

export const LEVELS = [
  {
    name: 'Lantern Alley',
    tip: 'Crates and bushes block sight. Shadow hides you.',
    sealsNeeded: 2,
    pebbles: 3,
    guards: [
      { waypoints: [[25, 1], [25, 16]], pause: 1.2 },
      { waypoints: [[9, 12], [9, 16], [5, 16], [5, 12]], pause: 0.9 },
    ],
    map: [
      '############################',
      '#P....l....#......*........#',
      '#.....c....#...............#',
      '#.####.....#....####.......#',
      '#.#........#....#..#..c....#',
      '#.#..b.....#....#..#.......#',
      '#.#........c....#..#...E...#',
      '#....####..#....#..#.......#',
      '#....#.....#....#..#.......#',
      '#.s..#..c..#....#..#..c....#',
      '#....#.....#....#..#.......#',
      '#.####..l..#....####.......#',
      '#..........#...............#',
      '#.c....b...#....s....l.....#',
      '#..........#...............#',
      '#..*.......#......c........#',
      '#..........#......b....G...#',
      '############################',
    ],
  },
  {
    name: 'The Old Bazaar',
    tip: 'Lantern light reveals you. Cross it fast.',
    sealsNeeded: 4,
    pebbles: 3,
    guards: [
      { waypoints: [[1, 2], [1, 15]], pause: 1.0 },
      { waypoints: [[26, 2], [26, 15]], pause: 1.1 },
      { waypoints: [[14, 15], [25, 15]], pause: 0.8 },
    ],
    map: [
      '############################',
      '#P...l.....c......*........#',
      '#....####..........b.......#',
      '#....#..#....####......l...#',
      '#.c..#..#....#..#....####..#',
      '#....#..#....#..#....#..#..#',
      '#.s..#..c....#..#....#..#E.#',
      '#....#.......#..#....#..#..#',
      '#.####..l....#..#....#..#..#',
      '#..........c....#..c.......#',
      '#..b....####....#....####..#',
      '#.......#..#....#....#.....#',
      '#..*....#..#..s.#....#..c..#',
      '#.......#..#....#....#.....#',
      '#....c..#..#....####..l....#',
      '#...........#.......G......#',
      '#..*....b...#......*....c..#',
      '############################',
    ],
  },
  {
    name: 'Moon Gate',
    tip: 'Toss a pebble to pull a guard off his route.',
    sealsNeeded: 3,
    pebbles: 4,
    guards: [
      { waypoints: [[26, 2], [26, 15]], pause: 0.9 },
      { waypoints: [[9, 13], [9, 15], [4, 15], [4, 13]], pause: 1.0 },
      { waypoints: [[2, 1], [9, 1]], pause: 0.8 },
      { waypoints: [[18, 13], [24, 13]], pause: 1.2 },
    ],
    map: [
      '############################',
      '#P....s....#....l....*.....#',
      '#.....c....#..........b....#',
      '#.####.....#....####.......#',
      '#.#...l....#....#..#..c....#',
      '#.#........#....#..#.......#',
      '#.#..b.....#....#..#...E...#',
      '#.#........#....#..#.......#',
      '#....####..#....#..#.......#',
      '#....#.....#....#..#.......#',
      '#.s..#..c..#....#..#..c....#',
      '#....#.....#....#..#.......#',
      '#.####..l..#....####.......#',
      '#..........#.......s.......#',
      '#..*....c..#....b.....l....#',
      '#..........#...............#',
      '#.....b....#.....*....G....#',
      '############################',
    ],
  },
];
