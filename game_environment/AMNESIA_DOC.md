# Amnesia Doc - Simplified Game Environment

> Quick-start guide for AI agents working on this multiplayer battle royale game project.

## What This Is

A **fully functional multiplayer battle royale game** - a simplified clone of Suroi. Production-ready with ~2,700 lines of TypeScript. Players shoot each other with 3 weapons, pick up loot, and destroy obstacles in real-time multiplayer.

**Status:** ✅ Fully working, playable right now
**Tech:** Bun + TypeScript + PixiJS + WebSockets
**Players:** 10-20 concurrent

## Quick Start

```bash
# From project root
bun install
bun dev  # Starts server (8000) + client (3000)
# Open http://localhost:3000
```

**For multiplayer from different computers:** See `MULTIPLAYER_SETUP.md` for detailed instructions on LAN, internet, and production deployment.

## Architecture Overview

```
├── server/     - Authoritative game server (Bun + WebSocket)
│   ├── src/
│   │   ├── index.ts           - WebSocket server entry point
│   │   ├── game.ts            - Main game loop (40 TPS)
│   │   ├── gun.ts             - Weapon mechanics
│   │   ├── objects/
│   │   │   ├── player.ts      - Player class (movement, shooting, inventory)
│   │   │   ├── bullet.ts      - Hitscan bullets with raycasting
│   │   │   ├── obstacle.ts    - Destructible objects (trees, rocks, crates)
│   │   │   └── loot.ts        - Item pickups
│   │   ├── utils/
│   │   │   └── grid.ts        - **CRITICAL** Spatial partitioning for collision
│   │   └── data/
│   │       └── map.ts         - Static map layout (obstacles, loot, spawns)
│
├── client/     - PixiJS renderer (Vite dev server)
│   ├── src/
│   │   ├── main.ts            - Menu system, connection handling
│   │   ├── game.ts            - PixiJS game client, rendering
│   │   ├── camera.ts          - Smooth camera following
│   │   ├── input.ts           - Keyboard/mouse input
│   │   ├── hud.ts             - Health bar, ammo counter
│   │   └── assetManager.ts    - Texture loading
│   └── index.html             - UI structure
│
└── common/     - Shared code between client/server
    ├── src/
    │   ├── constants.ts       - Game constants (TPS, map size, speeds)
    │   ├── packets.ts         - Network protocol (4 packet types)
    │   ├── config.ts          - **NEW** Server/client configuration, multiplayer setup
    │   ├── definitions/
    │   │   ├── guns.ts        - 3 weapon definitions
    │   │   └── obstacles.ts   - 4 obstacle types
    │   └── utils/
    │       ├── vector.ts      - **CRITICAL** 2D vector math (from Suroi)
    │       ├── hitbox.ts      - Circle + Rectangle collision shapes
    │       └── math.ts        - Angle, geometry, collision functions
```

## Core Systems (What Makes It Work)

### 1. Spatial Grid (Most Important for Performance)
**File:** `server/src/utils/grid.ts`

- Divides 512x512 map into 16×16 grid (32-unit cells)
- Objects stored in Map<cell> for each overlapping cell
- Collision queries only check nearby cells
- **Without this:** O(n²) collision checks = lag
- **With this:** O(1) collision checks = smooth multiplayer

**When to modify:** Adding new object types, changing map size, debugging collision

### 2. Game Loop
**File:** `server/src/game.ts`

Runs at 40 TPS (every 25ms):
1. Update bullets → raycast collisions → apply damage
2. Process player inputs → movement + shooting
3. Check item pickups
4. Serialize game state → broadcast to all clients

**When to modify:** Adding new game mechanics, changing tick rate, adding systems

### 3. Hitscan Bullets
**File:** `server/src/objects/bullet.ts`

- Moves along path each tick
- Creates bounding box from old→new position
- Queries spatial grid for nearby objects
- Raycasts line-to-hitbox for each potential hit
- Finds closest collision
- **Continuous collision detection** prevents tunneling

**When to modify:** Adding projectile physics, splash damage, bullet drop

### 4. Network Protocol
**File:** `common/src/packets.ts`

4 packet types (all JSON):
- **Join** (C→S): Player connects with username
- **Input** (C→S, 60/sec): Movement, mouse, actions
- **Update** (S→C, 40/sec): Full game state
- **Disconnect** (S→C): Player left

**When to modify:** Adding new features that need client-server sync

### 5. Vector Math
**File:** `common/src/utils/vector.ts`

Battle-tested 2D vector library from Suroi. Used everywhere.
- Positions, velocities, directions
- Pure functions, immutable operations
- `Vec.add()`, `Vec.scale()`, `Vec.normalize()`, `Vec.rotate()`, etc.

**When to modify:** Rarely. This is production code. Only if adding 3D.

## Current Features

### Weapons (3 types)
- **Pistol:** 12 dmg, 150ms fire rate, 15 capacity, 120 range
- **Rifle:** 14 dmg, 100ms fire rate, 30 capacity, 160 range
- **Shotgun:** 10×8 dmg, 900ms fire rate, 8 capacity, 80 range, spread

**Defined in:** `common/src/definitions/guns.ts`

### Obstacles (4 types)
- **Tree:** 100 HP, 3.5 radius, destructible
- **Rock:** 200 HP, 4 radius, destructible
- **Crate:** 80 HP, 7×7 box, destructible
- **Wall:** Indestructible, 4×4 box, map boundaries

**Defined in:** `common/src/definitions/obstacles.ts`

### Map
- 512×512 units
- 31 obstacles (trees, rocks, crates, walls)
- 14 loot spawns (weapons, ammo)
- 13 player spawn points

**Defined in:** `server/src/data/map.ts`

### Inventory
- 2 weapon slots
- Ammo stored separately (9mm, 5.56mm, 12 gauge)
- Press F to pick up items within 5-unit radius

## Common Tasks

### Adding a New Weapon

1. Add definition to `common/src/definitions/guns.ts`
2. Add texture loading in `client/src/assetManager.ts`
3. Add loot spawns in `server/src/data/map.ts`
4. Test fire rate, damage, range balance

### Adding a New Obstacle Type

1. Define in `common/src/definitions/obstacles.ts`
2. Add texture in `client/src/assetManager.ts`
3. Place instances in `server/src/data/map.ts`
4. Test collision and HP values

### Modifying the Map

**File:** `server/src/data/map.ts`

- `obstacles`: Array of obstacle placements
- `loots`: Array of loot spawn points
- `places`: Array of player spawn points
- Coordinates are absolute (0,0 to 512,512)

### Adding Sound Effects

1. Install Howler.js: `bun add howler`
2. Load sounds in `client/src/assetManager.ts`
3. Play on events in `client/src/game.ts`:
   - Gunshot when bullet appears
   - Hit sound when damage dealt
   - Pickup sound when loot collected

### Debugging Collisions

1. Check `server/src/utils/grid.ts` - Is object in correct cells?
2. Check hitbox sizes in definitions
3. Add console logs to `bullet.ts` raycast
4. Visualize hitboxes client-side (draw circles/rectangles)

### Optimizing Performance

**Current bottlenecks:**
- JSON packet size (switch to binary protocol)
- Full state broadcast every tick (delta compression)
- No client-side prediction (add interpolation)

**Easy wins:**
- Reduce update rate for far players
- Cull bullets outside view
- Object pooling for bullets

## Key Constants

**File:** `common/src/constants.ts`

```typescript
TPS = 40                    // Server tick rate
MAP_SIZE = 512             // World size
PLAYER_SPEED = 0.09        // Units per ms
PLAYER_RADIUS = 2.25       // Collision size
INTERACT_RADIUS = 5        // Pickup range
GRID_SIZE = 32             // Spatial grid cell size
```

## Controls

- **WASD** - Movement
- **Mouse** - Aim
- **Left Click** - Shoot
- **R** - Reload
- **1/2** - Switch weapons
- **F** - Pick up items

## Data Flow

### Client → Server (60 times/sec)
```typescript
{
  type: "input",
  movement: { up, down, left, right },
  mouseAngle: number,
  isShooting: boolean,
  attemptingInteraction: boolean,
  isReloading: boolean,
  weaponSwitch?: 0 | 1
}
```

### Server → Client (40 times/sec)
```typescript
{
  type: "update",
  players: [{ id, pos, health, username, ... }],
  bullets: [{ id, pos, direction }],
  obstacles: [{ id, pos, health, dead }],
  loots: [{ id, pos, type, dead }],
  yourData: { activeWeaponIndex, guns, health }
}
```

## Testing Multiplayer Locally

1. Start server: `bun dev:server`
2. Start client: `bun dev:client`
3. Open multiple browser tabs at `http://localhost:3000`
4. Each tab = separate player
5. Test shooting, movement, pickups between players

## Known Limitations

- No sound (easy to add)
- No particle effects (blood, muzzle flash)
- No gas/safe zone mechanics
- No teams/squads
- No mobile controls
- JSON packets (bandwidth-heavy)
- No client-side prediction (slight lag feel)
- Static map only

## Git Setup

- **Repo:** https://github.com/RomanSlack/environment_clone
- **Branch:** main
- Already initialized and pushed

```bash
git add .
git commit -m "Your message"
git push origin main
```

## Dependencies

**Minimal by design:**
- **Runtime:** Bun
- **Client:** PixiJS 8.5.2, Vite 6.0.1
- **Language:** TypeScript 5.9.3
- **Total npm packages:** 3 main dependencies

## Design Philosophy

This project intentionally simplifies Suroi while keeping core architecture:

**Kept:** Server authority, spatial grid, vector math, professional structure
**Simplified:** Binary packets → JSON, complex UI → simple HTML, procedural maps → static

Result: 2,700 LOC instead of 50,000+ LOC, but fully playable.

## Quick Reference - Where to Find Things

| What | File |
|------|------|
| Start server | `server/src/index.ts` |
| Game loop | `server/src/game.ts` |
| Player logic | `server/src/objects/player.ts` |
| Shooting/bullets | `server/src/objects/bullet.ts` |
| Collision optimization | `server/src/utils/grid.ts` |
| Map layout | `server/src/data/map.ts` |
| Weapon stats | `common/src/definitions/guns.ts` |
| Network protocol | `common/src/packets.ts` |
| Math utilities | `common/src/utils/vector.ts` |
| Rendering | `client/src/game.ts` |
| UI/HUD | `client/src/hud.ts` |

## When You're Stuck

1. **Collision issues?** → Check `server/src/utils/grid.ts` and hitbox definitions
2. **Networking problems?** → Check `common/src/packets.ts` and console logs
3. **Visual bugs?** → Check `client/src/game.ts` sprite updates
4. **Performance lag?** → Profile spatial grid queries in `game.ts`
5. **Weapon not working?** → Verify definition in `guns.ts` matches usage in `gun.ts`

## Code Quality Notes

- Type-safe TypeScript throughout
- Zero circular dependencies
- Consistent naming: camelCase for variables, PascalCase for classes
- Pure functions in `common/src/utils/`
- Server is source of truth (client just renders)

## Ready to Code

You now know:
- ✅ What this project is
- ✅ How it's structured
- ✅ Where critical systems live
- ✅ How to add features
- ✅ How to debug issues

**Start developing!** The codebase is clean, well-organized, and ready for extensions.
