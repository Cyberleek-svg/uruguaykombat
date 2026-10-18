// Data-driven roster: stats and metadata.
export const ROSTER = [
  {
    id: 'orsi',
    name: 'Orsi',
    color: 0x1e88e5,
    accent: 0xffffff,
    maxHp: 100,
    speed: 380,
    jumpForce: 1020,
    attackDamage: 10,
    specialDamage: 22,
    attackCooldown: 420,
    specialCooldown: 1800,
  },
  {
    id: 'lacalle',
    name: 'Lacalle Pou',
    color: 0xe53935,
    accent: 0xffffff,
    maxHp: 90,
    speed: 440,
    jumpForce: 1080,
    attackDamage: 12,
    specialDamage: 24,
    attackCooldown: 380,
    specialCooldown: 1700,
  },
  {
    id: 'mujica',
    name: 'Mujica',
    color: 0x43a047,
    accent: 0xffeb3b,
    maxHp: 130,
    speed: 320,
    jumpForce: 960,
    attackDamage: 14,
    specialDamage: 28,
    attackCooldown: 500,
    specialCooldown: 2000,
  },
  {
    id: 'ojeda',
    name: 'Ojeda',
    color: 0xfb8c00,
    accent: 0x000000,
    maxHp: 110,
    speed: 350,
    jumpForce: 1000,
    attackDamage: 11,
    specialDamage: 20,
    attackCooldown: 440,
    specialCooldown: 1900,
  },
];

export function getFighterData(id) {
  return ROSTER.find((f) => f.id === id) || ROSTER[0];
}