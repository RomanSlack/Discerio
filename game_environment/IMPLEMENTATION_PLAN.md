# Suroi Simplified Clone - Complete Implementation Plan

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture Analysis](#architecture-analysis)
3. [Implementation Strategy](#implementation-strategy)
4. [Component Breakdown](#component-breakdown)
5. [File Structure](#file-structure)
6. [Code Examples & Patterns](#code-examples--patterns)
7. [Dependency Management](#dependency-management)
8. [Common Pitfalls & Solutions](#common-pitfalls--solutions)

---

## Project Overview

### Goal
Build a simplified but fully functional clone of Suroi battle royale game with:
- Single static map (512x512 units)
- 2-3 basic weapons (pistol, rifle, shotgun)
- Basic player movement, shooting, and collision
- Item pickup system
- 10-20 players per server
- Minimal but functional UI

### Approach
**Hybrid Strategy**: Copy proven utilities from Suroi, simplify complex systems, build UI from scratch

### Target Size
- **Estimated Lines of Code**: 4,500 - 8,000 lines
- **Reused from Suroi**: ~2,000 lines (utilities)
- **Newly Written**: ~2,500 - 6,000 lines
- **Files**: ~35-40 files

---

## Architecture Analysis

### What Suroi Does Well (Copy These)

#### 1. **Vector Math System** (`common/src/utils/vector.ts`)
**Status**: ✅ Copy directly - 235 lines

The vector utility is pure, well-tested mathematics with zero dependencies:

```typescript
export const Vec = Object.assign(create, {
    add(a: Vector, b: Vector): Vector,
    sub(a: Vector, b: Vector): Vector,
    scale(a: Vector, n: number): Vector,
    rotate(vector: Vector, angle: number): Vector,
    normalize(a: Vector): Vector,
    // ... 20+ more functions
});
```

**Why Copy**: Essential for all game physics, well-optimized, no reason to rewrite

#### 2. **Hitbox System** (`common/src/utils/hitbox.ts`)
**Status**: ✅ Copy with minor simplifications

Provides Circle and Rectangle hitboxes with collision detection:

```typescript
class CircleHitbox {
    radius: number;
    position: Vector;

    collidesWith(other: Hitbox): boolean;
    intersectsLine(start: Vector, end: Vector): IntersectionResponse;
}

class RectangleHitbox {
    min: Vector;
    max: Vector;

    collidesWith(other: Hitbox): boolean;
    // ...
}
```

**Simplifications**: Remove Polygon and Group hitboxes initially, keep Circle and Rectangle only

#### 3. **Spatial Grid** (`server/src/utils/grid.ts`)
**Status**: ✅ Copy with adaptations - 170 lines

Critical for performance - avoids O(n²) collision checks:

```typescript
class Grid {
    private _grid: Map<number, GameObject>[][];
    cellSize = 32;

    addObject(obj: GameObject): void {
        // Calculate cells occupied by hitbox
        // Add to all intersecting cells
    }

    intersectsHitbox(hitbox: Hitbox): Set<GameObject> {
        // Query only cells in hitbox bounds
        // Return all objects in those cells
    }
}
```

**Performance Impact**: With spatial grid, collision checks scale with object density, not total count

#### 4. **Math Utilities** (`common/src/utils/math.ts`)
**Status**: ✅ Copy collision functions - selective copy

Take these namespaces:
- `Angle`: Normalize, minimize, betweenPoints
- `Numeric`: Lerp, clamp, remap
- `Geometry`: Distance, distanceSquared
- `Collision`: Line-circle, line-rect, circle-circle intersections

Skip: `Statistics`, `EaseFunctions` (not critical for MVP)

#### 5. **Binary Stream** (`common/src/utils/byteStream.ts`)
**Status**: ⚠️ Optional - start with JSON

Provides efficient binary serialization, but adds complexity:

```typescript
class ByteStream {
    writeUint8(value: number): void;
    writeUint16(value: number): void;
    writeFloat(value: number, min: number, max: number, bits: number): void;
    // ... read methods
}
```

**Decision**: Use JSON for initial implementation, add binary protocol in optimization phase

### What to Simplify

#### 1. **Packet Protocol**
**Original**: 11 packet types with complex bit packing
**Simplified**: 4 core packet types with JSON

```typescript
// Simplified packet types
enum PacketType {
    Join = 0,      // Client → Server: Player joins
    Input = 1,     // Client → Server: Movement/shooting input
    Update = 2,    // Server → Client: Game state update
    Disconnect = 3 // Server → Client: Player left
}
```

**Join Packet** (Client → Server):
```typescript
{
    type: PacketType.Join,
    playerName: string,
    skin: string
}
```

**Input Packet** (Client → Server, sent every frame):
```typescript
{
    type: PacketType.Input,
    seq: number,           // Sequence for reconciliation
    movement: {
        up: boolean,
        down: boolean,
        left: boolean,
        right: boolean
    },
    mouse: {
        x: number,        // Mouse position in world coords
        y: number
    },
    attacking: boolean,
    action: number       // 0: none, 1: switch weapon, 2: pickup item
}
```

**Update Packet** (Server → Client, sent every tick):
```typescript
{
    type: PacketType.Update,
    tick: number,
    players: [{
        id: number,
        x: number,
        y: number,
        rotation: number,  // Radians
        health: number,    // 0-100
        activeWeapon: number,
        username: string,
        dead: boolean
    }],
    bullets: [{
        id: number,
        x: number,
        y: number,
        targetX: number,
        targetY: number
    }],
    obstacles: [{      // Static, sent once
        id: number,
        type: string,  // "tree", "rock", etc.
        x: number,
        y: number,
        rotation: number,
        destroyed: boolean
    }],
    loot: [{
        id: number,
        type: string,  // "pistol", "ammo_9mm", etc.
        x: number,
        y: number,
        picked: boolean
    }],
    playerData: {      // Personal data for this client
        health: number,
        ammo: { [type: string]: number },
        weapons: [string?, string?]
    }
}
```

#### 2. **Player Class**
**Original**: 3,573 lines with perks, infections, team revival
**Simplified**: ~300-500 lines with core functionality

```typescript
class Player {
    id: number;
    position: Vector;
    rotation: number;
    health: number = 100;
    maxHealth: number = 100;
    speed: number = 0.03;  // units per ms

    inventory: {
        weapons: [GunItem?, GunItem?],
        ammo: Map<string, number>,
        activeWeaponIndex: number
    };

    // Networking
    socket: WebSocket;
    lastInputSeq: number = 0;

    // State flags
    dead: boolean = false;
    attacking: boolean = false;
    moving: boolean = false;

    update(dt: number): void {
        // Process movement
        // Handle shooting
        // Check collisions
    }

    damage(amount: number, source?: Player): void {
        this.health -= amount;
        if (this.health <= 0) this.die();
    }

    serialize(): PlayerData {
        // Return data for Update packet
    }
}
```

**What to Skip**:
- Perks system
- Infection mechanic
- Team revival
- Scope items
- Status effects
- Mobile-specific handling (initially)

#### 3. **Inventory System**
**Original**: 4 weapon slots, complex slot locking, 10+ item types
**Simplified**: 2 weapon slots, basic ammo tracking

```typescript
interface Inventory {
    weapons: [Gun | null, Gun | null],  // Primary, Secondary
    ammo: {
        "9mm": number,
        "556mm": number,
        "12g": number
    },
    activeIndex: 0 | 1
}

class Gun {
    definition: GunDefinition;
    ammo: number;
    lastShotTime: number;
    reloading: boolean;
    reloadStartTime: number;

    canShoot(now: number): boolean {
        return !this.reloading &&
               this.ammo > 0 &&
               (now - this.lastShotTime) >= this.definition.fireDelay;
    }

    shoot(now: number): void {
        this.ammo--;
        this.lastShotTime = now;
    }

    startReload(now: number): void {
        this.reloading = true;
        this.reloadStartTime = now;
    }

    update(now: number, totalAmmo: number): void {
        if (this.reloading &&
            (now - this.reloadStartTime) >= this.definition.reloadTime) {
            const needed = this.definition.capacity - this.ammo;
            const toLoad = Math.min(needed, totalAmmo);
            this.ammo += toLoad;
            this.reloading = false;
        }
    }
}
```

#### 4. **Game Loop**
**Original**: 3-phase update with dirty flagging and partial serialization
**Simplified**: Single-pass update, always send full state

```typescript
class Game {
    players: Map<number, Player> = new Map();
    obstacles: Obstacle[] = [];
    loot: Loot[] = [];
    bullets: Bullet[] = [];
    grid: Grid;

    tick(): void {
        const now = Date.now();
        const dt = now - this.lastTickTime;
        this.lastTickTime = now;

        // 1. Update all bullets (movement + collision)
        for (const bullet of this.bullets) {
            bullet.update(dt);
            if (bullet.dead) this.removeBullet(bullet);
        }

        // 2. Update all players (movement, shooting, actions)
        for (const player of this.players.values()) {
            if (player.dead) continue;
            player.update(dt);
        }

        // 3. Check item pickups
        for (const player of this.players.values()) {
            if (player.dead) continue;
            this.checkPickups(player);
        }

        // 4. Serialize and send to all clients
        const updatePacket = this.serializeWorld();
        for (const player of this.players.values()) {
            player.socket.send(JSON.stringify(updatePacket));
        }

        // 5. Schedule next tick
        const elapsed = Date.now() - now;
        const delay = Math.max(0, (1000 / 40) - elapsed);  // 40 TPS
        setTimeout(() => this.tick(), delay);
    }
}
```

**Optimizations to Add Later**:
- Dirty flagging (only send changed objects)
- Visibility culling (only send nearby objects)
- Partial updates (position-only for moving objects)

### What to Build from Scratch

#### 1. **Client Rendering**
**Why**: Suroi's rendering has extensive features we don't need

**Minimal PixiJS Setup**:
```typescript
import * as PIXI from 'pixi.js';

class GameClient {
    app: PIXI.Application;
    playerSprites: Map<number, PIXI.Sprite> = new Map();
    obstacleSprites: PIXI.Sprite[] = [];

    async init(): Promise<void> {
        this.app = new PIXI.Application();
        await this.app.init({
            width: 1920,
            height: 1080,
            backgroundColor: 0x7ec850  // Grass color
        });
        document.body.appendChild(this.app.canvas);

        // Start render loop
        this.app.ticker.add(() => this.render());
    }

    render(): void {
        // Interpolate positions
        // Update sprite positions
        // Render bullets as lines
    }

    handleUpdate(data: UpdatePacket): void {
        // Update player sprites
        for (const playerData of data.players) {
            let sprite = this.playerSprites.get(playerData.id);
            if (!sprite) {
                sprite = PIXI.Sprite.from('player.png');
                this.app.stage.addChild(sprite);
                this.playerSprites.set(playerData.id, sprite);
            }
            sprite.position.set(playerData.x, playerData.y);
            sprite.rotation = playerData.rotation;
        }

        // Similar for obstacles, loot, bullets
    }
}
```

#### 2. **UI System**
**Why**: Suroi uses complex jQuery/Svelte UI, we need minimal HUD

**Simple HTML HUD**:
```html
<div id="hud">
    <div id="health-bar">
        <div id="health-fill"></div>
        <span id="health-text">100</span>
    </div>

    <div id="ammo">
        <span id="ammo-current">15</span> /
        <span id="ammo-reserve">45</span>
    </div>

    <div id="weapon">
        <span id="weapon-name">Pistol</span>
    </div>

    <div id="kill-feed"></div>
</div>
```

```css
#hud {
    position: fixed;
    font-family: sans-serif;
}

#health-bar {
    position: absolute;
    bottom: 20px;
    left: 20px;
    width: 200px;
    height: 30px;
    background: rgba(0,0,0,0.5);
    border: 2px solid #fff;
}

#health-fill {
    height: 100%;
    background: linear-gradient(90deg, #f00, #ff0);
    transition: width 0.3s;
}
```

```typescript
function updateHUD(playerData: PlayerData): void {
    const healthFill = document.getElementById('health-fill')!;
    const healthText = document.getElementById('health-text')!;

    healthFill.style.width = `${playerData.health}%`;
    healthText.textContent = Math.ceil(playerData.health).toString();

    // Update ammo, weapon, etc.
}
```

#### 3. **Static Map**
**Why**: Suroi has procedural generation, we want simple hardcoded layout

**Map Definition**:
```typescript
const MAP_CONFIG = {
    width: 512,
    height: 512,
    obstacles: [
        // Trees
        { type: "tree", x: 50, y: 50 },
        { type: "tree", x: 120, y: 80 },
        { type: "tree", x: 200, y: 150 },
        // ... 50-100 more obstacles

        // Rocks
        { type: "rock", x: 300, y: 200 },
        { type: "rock", x: 350, y: 250 },

        // Walls (map boundary + some internal)
        { type: "wall", x: 0, y: 256, rotation: 0 },
        { type: "wall", x: 512, y: 256, rotation: 0 },
        { type: "wall", x: 256, y: 0, rotation: Math.PI/2 },
        { type: "wall", x: 256, y: 512, rotation: Math.PI/2 },
    ],
    lootSpawns: [
        { type: "pistol", x: 100, y: 100 },
        { type: "rifle", x: 400, y: 400 },
        { type: "ammo_9mm", x: 150, y: 150, count: 30 },
        // ... 20-30 loot spawns
    ],
    playerSpawns: [
        { x: 256, y: 256 },
        { x: 100, y: 100 },
        { x: 400, y: 400 },
        // ... 10-20 spawn points
    ]
};
```

---

## Implementation Strategy

### Phase 1: Foundation & Connection
**Goal**: Server-client connection with one player moving

**Steps**:
1. Copy vector math utilities
2. Set up Bun WebSocket server
3. Create PixiJS client app
4. Implement Join and Update packets (JSON)
5. Add single player sprite that moves with WASD
6. Server broadcasts position to client

**Files to Create**:
```
common/
  utils/
    vector.ts          [COPY from Suroi]
    math.ts            [COPY Numeric, Geometry only]

server/
  index.ts             [NEW - Bun.serve setup]
  game.ts              [NEW - Game class with tick loop]
  player.ts            [NEW - Simplified Player class]

client/
  index.html           [NEW - Minimal HTML]
  main.ts              [NEW - GameClient class]

shared/
  packets.ts           [NEW - Packet type definitions]
```

**Test Criteria**:
- Client connects to server via WebSocket
- Player sees their sprite on screen
- WASD keys move the player
- Position updates in real-time

**Estimated Lines**: ~500-800

---

### Phase 2: Collision & Shooting
**Goal**: Bullets, obstacles, collision detection

**Steps**:
1. Copy hitbox utilities (Circle, Rectangle)
2. Copy spatial grid system
3. Add obstacles to map (static)
4. Implement hitscan bullet system
5. Add collision detection (player-obstacle, bullet-obstacle, bullet-player)
6. Render obstacles and bullet tracers

**Files to Create**:
```
common/
  utils/
    hitbox.ts          [COPY from Suroi, remove Group/Polygon]

server/
  grid.ts              [COPY from Suroi]
  obstacle.ts          [NEW - Simplified Obstacle class]
  bullet.ts            [NEW - Hitscan bullet with raycasting]

client/
  obstacle.ts          [NEW - Obstacle sprite]
  bullet.ts            [NEW - Bullet tracer visual]

shared/
  definitions.ts       [NEW - Obstacle definitions]
```

**Key Implementation - Hitscan Bullet**:
```typescript
class Bullet {
    position: Vector;
    direction: Vector;  // Normalized
    speed: number;
    maxRange: number;
    damage: number;
    traveledDistance: number = 0;
    dead: boolean = false;

    update(dt: number, game: Game): void {
        const velocity = Vec.scale(this.direction, this.speed * dt);
        const newPosition = Vec.add(this.position, velocity);

        // Create line segment for collision check
        const lineRect = RectangleHitbox.fromLine(this.position, newPosition);
        const nearbyObjects = game.grid.intersectsHitbox(lineRect);

        let closestHit: { object: GameObject, point: Vector, distance: number } | null = null;

        // Check all nearby objects
        for (const obj of nearbyObjects) {
            const intersection = obj.hitbox.intersectsLine(this.position, newPosition);
            if (intersection) {
                const distance = Vec.len(Vec.sub(intersection.point, this.position));
                if (!closestHit || distance < closestHit.distance) {
                    closestHit = { object: obj, point: intersection.point, distance };
                }
            }
        }

        if (closestHit) {
            // Hit something
            this.position = closestHit.point;
            if (closestHit.object instanceof Player) {
                closestHit.object.damage(this.damage);
            } else if (closestHit.object instanceof Obstacle) {
                closestHit.object.damage(this.damage);
            }
            this.dead = true;
        } else {
            // No hit, move bullet
            this.position = newPosition;
            this.traveledDistance += Vec.len(velocity);
            if (this.traveledDistance >= this.maxRange) {
                this.dead = true;
            }
        }
    }
}
```

**Test Criteria**:
- Obstacles appear on map
- Player collides with obstacles (can't walk through)
- Left click shoots bullet
- Bullet hits obstacles and players
- Health decreases when hit

**Estimated Lines**: ~1,500-2,000

---

### Phase 3: Items & Inventory
**Goal**: Weapon switching, ammo, loot pickups

**Steps**:
1. Create gun definitions (pistol, rifle, shotgun)
2. Implement inventory system (2 slots)
3. Add loot items on ground
4. Implement pickup interaction (press F near item)
5. Add weapon switching (keys 1, 2)
6. Add ammo tracking and reload system
7. Render loot items as sprites

**Files to Create**:
```
shared/
  guns.ts              [NEW - Gun definitions]

server/
  inventory.ts         [NEW - Inventory class]
  gun.ts               [NEW - Gun class with reload logic]
  loot.ts              [NEW - Loot item class]

client/
  loot.ts              [NEW - Loot sprite]
  hud.ts               [NEW - HUD update functions]
```

**Gun Definition Example**:
```typescript
export const Guns = {
    pistol: {
        idString: "pistol",
        name: "Pistol",
        ammoType: "9mm",
        capacity: 15,
        reloadTime: 1500,
        fireDelay: 150,
        damage: 12,
        range: 120,
        speed: 0.25,
        bulletCount: 1
    },
    rifle: {
        idString: "rifle",
        name: "Rifle",
        ammoType: "556mm",
        capacity: 30,
        reloadTime: 2200,
        fireDelay: 100,
        damage: 14,
        range: 160,
        speed: 0.3,
        bulletCount: 1
    },
    shotgun: {
        idString: "shotgun",
        name: "Shotgun",
        ammoType: "12g",
        capacity: 8,
        reloadTime: 800,
        fireDelay: 900,
        damage: 10,
        range: 80,
        speed: 0.2,
        bulletCount: 8,  // Fires 8 pellets
        spread: 0.3      // Radians of spread
    }
};
```

**Pickup System**:
```typescript
// Server-side
checkPickups(player: Player): void {
    const pickupRadius = 5;  // units

    for (const loot of this.loot) {
        if (loot.picked) continue;

        const distance = Geometry.distance(player.position, loot.position);
        if (distance <= pickupRadius && player.wantsToPickup) {
            if (loot.type.startsWith('ammo_')) {
                const ammoType = loot.type.replace('ammo_', '');
                player.inventory.ammo[ammoType] += loot.count;
                loot.picked = true;
            } else if (Guns[loot.type]) {
                const gun = new Gun(Guns[loot.type]);
                player.inventory.addWeapon(gun);
                loot.picked = true;
            }
        }
    }
}
```

**Test Criteria**:
- Loot items spawn on map
- Player can walk over item and press F to pick up
- Weapon appears in inventory slot
- Press 1 or 2 to switch weapons
- Ammo counter updates
- Reload happens automatically when empty or manually with R

**Estimated Lines**: ~1,200-1,800

---

### Phase 4: Polish & UI
**Goal**: Full HUD, visual effects, sounds

**Steps**:
1. Create complete HUD (health bar, ammo, weapon, kill feed)
2. Add muzzle flash effect when shooting
3. Add hit marker when damaging player
4. Add death screen and respawn
5. Add sound effects (shoot, hit, reload, death)
6. Add minimap
7. Improve player/obstacle sprites
8. Add blood particle effects

**Files to Create**:
```
client/
  effects.ts           [NEW - Visual effects (muzzle flash, hit markers)]
  sounds.ts            [NEW - Sound manager]
  minimap.ts           [NEW - Minimap renderer]
  particles.ts         [NEW - Simple particle system]

assets/
  sounds/
    shoot_pistol.mp3
    shoot_rifle.mp3
    shoot_shotgun.mp3
    hit.mp3
    death.mp3

  images/
    player.png
    tree.png
    rock.png
    crate.png
    pistol_icon.png
    rifle_icon.png
```

**Muzzle Flash Effect**:
```typescript
function createMuzzleFlash(position: Vector, rotation: number): void {
    const flash = new PIXI.Graphics();
    flash.circle(0, 0, 3);
    flash.fill({ color: 0xffff00, alpha: 0.8 });
    flash.position.set(position.x, position.y);
    flash.rotation = rotation;

    this.app.stage.addChild(flash);

    // Fade out and remove
    let alpha = 0.8;
    const fadeInterval = setInterval(() => {
        alpha -= 0.1;
        flash.alpha = alpha;
        if (alpha <= 0) {
            clearInterval(fadeInterval);
            this.app.stage.removeChild(flash);
        }
    }, 16);
}
```

**Sound System**:
```typescript
class SoundManager {
    private sounds = new Map<string, HTMLAudioElement>();

    load(name: string, path: string): void {
        const audio = new Audio(path);
        audio.preload = 'auto';
        this.sounds.set(name, audio);
    }

    play(name: string, volume: number = 1.0): void {
        const sound = this.sounds.get(name);
        if (!sound) return;

        const clone = sound.cloneNode() as HTMLAudioElement;
        clone.volume = volume;
        clone.play();
    }
}
```

**Test Criteria**:
- Health bar shows current health
- Ammo counter shows bullets in mag and reserve
- Kill feed shows when players kill each other
- Muzzle flash appears when shooting
- Hit marker appears when hitting player
- Death screen shows on death with respawn button
- Minimap shows player positions and obstacles
- Sounds play for all major actions

**Estimated Lines**: ~1,500-2,500

---

## File Structure

```
suroi_simplified_clone_complete/
├── package.json
├── tsconfig.json
├── README.md
├── IMPLEMENTATION_PLAN.md (this file)
│
├── common/                      # Shared code between client and server
│   ├── package.json
│   ├── src/
│   │   ├── utils/
│   │   │   ├── vector.ts       [COPY from Suroi - 235 lines]
│   │   │   ├── math.ts         [COPY from Suroi - selective, ~400 lines]
│   │   │   ├── hitbox.ts       [COPY from Suroi - simplified, ~300 lines]
│   │   │   └── misc.ts         [COPY from Suroi - utility types]
│   │   │
│   │   ├── definitions/
│   │   │   ├── guns.ts         [NEW - 100 lines]
│   │   │   ├── obstacles.ts    [NEW - 80 lines]
│   │   │   └── loot.ts         [NEW - 60 lines]
│   │   │
│   │   ├── packets.ts          [NEW - 150 lines]
│   │   ├── constants.ts        [NEW - 50 lines]
│   │   └── typings.ts          [NEW - 30 lines]
│
├── server/                      # Game server
│   ├── package.json
│   ├── src/
│   │   ├── index.ts            [NEW - Entry point, 100 lines]
│   │   ├── game.ts             [NEW - Game loop, 400 lines]
│   │   ├── player.ts           [NEW - Player class, 350 lines]
│   │   ├── bullet.ts           [NEW - Bullet class, 150 lines]
│   │   ├── obstacle.ts         [NEW - Obstacle class, 100 lines]
│   │   ├── loot.ts             [NEW - Loot class, 80 lines]
│   │   ├── inventory.ts        [NEW - Inventory class, 150 lines]
│   │   ├── gun.ts              [NEW - Gun class, 120 lines]
│   │   │
│   │   ├── utils/
│   │   │   └── grid.ts         [COPY from Suroi - 170 lines]
│   │   │
│   │   └── data/
│   │       └── map.ts          [NEW - Static map data, 200 lines]
│
├── client/                      # Game client
│   ├── package.json
│   ├── index.html              [NEW - 80 lines]
│   ├── public/
│   │   ├── css/
│   │   │   └── style.css       [NEW - 200 lines]
│   │   ├── assets/
│   │   │   ├── images/
│   │   │   │   ├── player.png
│   │   │   │   ├── tree.png
│   │   │   │   ├── rock.png
│   │   │   │   └── ...
│   │   │   └── sounds/
│   │   │       ├── shoot_pistol.mp3
│   │   │       ├── shoot_rifle.mp3
│   │   │       └── ...
│   │   │
│   │   └── src/
│   │       ├── main.ts         [NEW - Entry point, 150 lines]
│   │       ├── game.ts         [NEW - GameClient class, 500 lines]
│   │       ├── input.ts        [NEW - Input manager, 150 lines]
│   │       ├── camera.ts       [NEW - Camera system, 100 lines]
│   │       ├── hud.ts          [NEW - HUD updates, 200 lines]
│   │       ├── sounds.ts       [NEW - Sound manager, 100 lines]
│   │       │
│   │       ├── objects/
│   │       │   ├── player.ts   [NEW - Player sprite, 150 lines]
│   │       │   ├── bullet.ts   [NEW - Bullet visual, 80 lines]
│   │       │   ├── obstacle.ts [NEW - Obstacle sprite, 100 lines]
│   │       │   └── loot.ts     [NEW - Loot sprite, 80 lines]
│   │       │
│   │       └── managers/
│   │           ├── effects.ts  [NEW - Visual effects, 150 lines]
│   │           ├── minimap.ts  [NEW - Minimap, 120 lines]
│   │           └── particles.ts [NEW - Particles, 150 lines]
│
└── .gitignore
```

**Total File Count**: ~40 files
**Total Lines of Code**: ~5,500-7,500 lines

---

## Code Examples & Patterns

### Pattern 1: Server Game Loop with Fixed Tick Rate

```typescript
// server/src/game.ts

export class Game {
    players: Map<number, Player> = new Map();
    obstacles: Obstacle[] = [];
    bullets: Bullet[] = [];
    loot: Loot[] = [];
    grid: Grid;

    private tickRate = 40; // TPS
    private tickInterval = 1000 / this.tickRate;
    private lastTickTime = 0;
    private running = false;

    constructor() {
        this.grid = new Grid(512, 512, 32); // width, height, cellSize
        this.loadMap();
    }

    start(): void {
        this.running = true;
        this.lastTickTime = Date.now();
        this.tick();
    }

    stop(): void {
        this.running = false;
    }

    private tick(): void {
        if (!this.running) return;

        const now = Date.now();
        const dt = now - this.lastTickTime;
        this.lastTickTime = now;

        // 1. Update bullets (movement + collision)
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.update(dt, this);
            if (bullet.dead) {
                this.bullets.splice(i, 1);
            }
        }

        // 2. Update players (movement, actions)
        for (const player of this.players.values()) {
            if (!player.dead) {
                player.update(dt, this);
            }
        }

        // 3. Check pickups
        for (const player of this.players.values()) {
            if (!player.dead) {
                this.checkPickups(player);
            }
        }

        // 4. Serialize and send update packet
        const updatePacket = this.serializeState();
        this.broadcast(updatePacket);

        // 5. Schedule next tick with delay compensation
        const elapsed = Date.now() - now;
        const delay = Math.max(0, this.tickInterval - elapsed);
        setTimeout(() => this.tick(), delay);
    }

    private serializeState(): UpdatePacket {
        return {
            type: PacketType.Update,
            tick: this.currentTick++,
            players: Array.from(this.players.values()).map(p => p.serialize()),
            bullets: this.bullets.map(b => b.serialize()),
            obstacles: this.obstacles.map(o => o.serialize()),
            loot: this.loot.map(l => l.serialize())
        };
    }

    private broadcast(packet: any): void {
        const message = JSON.stringify(packet);
        for (const player of this.players.values()) {
            if (player.socket.readyState === WebSocket.OPEN) {
                player.socket.send(message);
            }
        }
    }

    addPlayer(socket: WebSocket, username: string): Player {
        const player = new Player(this.nextPlayerId++, socket, username);
        player.position = this.getRandomSpawnPoint();
        this.players.set(player.id, player);
        this.grid.addObject(player);
        return player;
    }

    removePlayer(playerId: number): void {
        const player = this.players.get(playerId);
        if (player) {
            this.grid.removeObject(player);
            this.players.delete(playerId);
        }
    }
}
```

### Pattern 2: Client Input Handling with Prediction

```typescript
// client/src/input.ts

export class InputManager {
    keys = {
        up: false,
        down: false,
        left: false,
        right: false
    };

    mouse = {
        x: 0,
        y: 0,
        down: false
    };

    actions = {
        switchWeapon: false,
        pickup: false,
        reload: false
    };

    private lastSentInput: InputPacket | null = null;
    private inputSequence = 0;

    constructor(private canvas: HTMLCanvasElement) {
        this.setupListeners();
    }

    private setupListeners(): void {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'KeyW': this.keys.up = true; break;
                case 'KeyS': this.keys.down = true; break;
                case 'KeyA': this.keys.left = true; break;
                case 'KeyD': this.keys.right = true; break;
                case 'Digit1': this.actions.switchWeapon = true; break;
                case 'KeyF': this.actions.pickup = true; break;
                case 'KeyR': this.actions.reload = true; break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch(e.code) {
                case 'KeyW': this.keys.up = false; break;
                case 'KeyS': this.keys.down = false; break;
                case 'KeyA': this.keys.left = false; break;
                case 'KeyD': this.keys.right = false; break;
            }
        });

        // Mouse
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.mouse.down = true;
        });

        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.mouse.down = false;
        });
    }

    getInputPacket(camera: Camera): InputPacket | null {
        // Convert screen coords to world coords
        const worldMouse = camera.screenToWorld(this.mouse);

        const packet: InputPacket = {
            type: PacketType.Input,
            seq: this.inputSequence++,
            movement: { ...this.keys },
            mouse: worldMouse,
            attacking: this.mouse.down,
            actions: {
                switchWeapon: this.actions.switchWeapon,
                pickup: this.actions.pickup,
                reload: this.actions.reload
            }
        };

        // Reset one-time actions
        this.actions.switchWeapon = false;
        this.actions.pickup = false;
        this.actions.reload = false;

        // Only send if different from last packet
        if (this.inputsEqual(packet, this.lastSentInput)) {
            return null;
        }

        this.lastSentInput = packet;
        return packet;
    }

    private inputsEqual(a: InputPacket | null, b: InputPacket | null): boolean {
        if (!a || !b) return false;
        return a.movement.up === b.movement.up &&
               a.movement.down === b.movement.down &&
               a.movement.left === b.movement.left &&
               a.movement.right === b.movement.right &&
               a.attacking === b.attacking &&
               Math.abs(a.mouse.x - b.mouse.x) < 0.1 &&
               Math.abs(a.mouse.y - b.mouse.y) < 0.1;
    }
}
```

### Pattern 3: Spatial Grid for Collision Optimization

```typescript
// server/src/utils/grid.ts [COPIED from Suroi]

interface GridObject {
    id: number;
    position: Vector;
    hitbox: Hitbox;
}

export class Grid {
    private _grid: Set<GridObject>[][];
    private cellSize: number;
    private width: number;
    private height: number;
    private cellsX: number;
    private cellsY: number;

    constructor(width: number, height: number, cellSize: number) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.cellsX = Math.ceil(width / cellSize);
        this.cellsY = Math.ceil(height / cellSize);

        // Initialize grid
        this._grid = [];
        for (let x = 0; x < this.cellsX; x++) {
            this._grid[x] = [];
            for (let y = 0; y < this.cellsY; y++) {
                this._grid[x][y] = new Set();
            }
        }
    }

    private worldToGrid(position: Vector): Vector {
        return Vec(
            Math.floor(position.x / this.cellSize),
            Math.floor(position.y / this.cellSize)
        );
    }

    addObject(object: GridObject): void {
        const bounds = object.hitbox.toRectangle();
        const min = this.worldToGrid(bounds.min);
        const max = this.worldToGrid(bounds.max);

        for (let x = min.x; x <= max.x; x++) {
            for (let y = min.y; y <= max.y; y++) {
                if (x >= 0 && x < this.cellsX && y >= 0 && y < this.cellsY) {
                    this._grid[x][y].add(object);
                }
            }
        }
    }

    removeObject(object: GridObject): void {
        const bounds = object.hitbox.toRectangle();
        const min = this.worldToGrid(bounds.min);
        const max = this.worldToGrid(bounds.max);

        for (let x = min.x; x <= max.x; x++) {
            for (let y = min.y; y <= max.y; y++) {
                if (x >= 0 && x < this.cellsX && y >= 0 && y < this.cellsY) {
                    this._grid[x][y].delete(object);
                }
            }
        }
    }

    intersectsHitbox(hitbox: Hitbox): Set<GridObject> {
        const bounds = hitbox.toRectangle();
        const min = this.worldToGrid(bounds.min);
        const max = this.worldToGrid(bounds.max);

        const objects = new Set<GridObject>();

        for (let x = min.x; x <= max.x; x++) {
            for (let y = min.y; y <= max.y; y++) {
                if (x >= 0 && x < this.cellsX && y >= 0 && y < this.cellsY) {
                    for (const obj of this._grid[x][y]) {
                        objects.add(obj);
                    }
                }
            }
        }

        return objects;
    }
}
```

### Pattern 4: Hitscan Bullet with Raycasting

```typescript
// server/src/bullet.ts

export class Bullet {
    id: number;
    position: Vector;
    direction: Vector;
    speed: number;
    damage: number;
    maxRange: number;
    shooter: Player;

    traveledDistance = 0;
    dead = false;

    constructor(id: number, start: Vector, direction: Vector, gun: GunDefinition, shooter: Player) {
        this.id = id;
        this.position = Vec.clone(start);
        this.direction = Vec.normalize(direction);
        this.speed = gun.speed;
        this.damage = gun.damage;
        this.maxRange = gun.range;
        this.shooter = shooter;
    }

    update(dt: number, game: Game): void {
        // Calculate new position
        const velocity = Vec.scale(this.direction, this.speed * dt);
        const newPosition = Vec.add(this.position, velocity);
        const distance = Vec.len(velocity);

        // Create bounding box for spatial query
        const lineRect = RectangleHitbox.fromLine(this.position, newPosition);
        const nearbyObjects = game.grid.intersectsHitbox(lineRect);

        // Check all nearby objects for collision
        let closestHit: {
            object: Player | Obstacle,
            point: Vector,
            distance: number
        } | null = null;

        for (const obj of nearbyObjects) {
            // Skip shooter
            if (obj === this.shooter) continue;

            // Check line-hitbox intersection
            const intersection = obj.hitbox.intersectsLine(this.position, newPosition);
            if (intersection) {
                const hitDistance = Vec.len(Vec.sub(intersection.point, this.position));
                if (!closestHit || hitDistance < closestHit.distance) {
                    closestHit = {
                        object: obj as Player | Obstacle,
                        point: intersection.point,
                        distance: hitDistance
                    };
                }
            }
        }

        if (closestHit) {
            // Hit something
            this.position = closestHit.point;

            if (closestHit.object instanceof Player) {
                closestHit.object.damage(this.damage, this.shooter);
            } else if (closestHit.object instanceof Obstacle) {
                closestHit.object.damage(this.damage);
            }

            this.dead = true;
        } else {
            // No collision, move bullet
            this.position = newPosition;
            this.traveledDistance += distance;

            // Check max range
            if (this.traveledDistance >= this.maxRange) {
                this.dead = true;
            }
        }
    }

    serialize() {
        return {
            id: this.id,
            x: this.position.x,
            y: this.position.y,
            targetX: this.position.x + this.direction.x * 10,
            targetY: this.position.y + this.direction.y * 10
        };
    }
}

// Helper for RectangleHitbox
class RectangleHitbox {
    static fromLine(start: Vector, end: Vector): RectangleHitbox {
        return new RectangleHitbox(
            Vec(Math.min(start.x, end.x), Math.min(start.y, end.y)),
            Vec(Math.max(start.x, end.x), Math.max(start.y, end.y))
        );
    }
}
```

### Pattern 5: Client-Side Interpolation for Smooth Movement

```typescript
// client/src/objects/player.ts

export class ClientPlayer {
    id: number;
    sprite: PIXI.Sprite;

    // Current state (from server)
    serverPosition: Vector;
    serverRotation: number;

    // Interpolated state (for rendering)
    renderPosition: Vector;
    renderRotation: number;

    // Interpolation settings
    private interpSpeed = 0.3;  // 30% per frame

    constructor(id: number) {
        this.id = id;
        this.sprite = PIXI.Sprite.from('player.png');
        this.sprite.anchor.set(0.5, 0.5);
    }

    updateFromServer(data: PlayerData): void {
        this.serverPosition = Vec(data.x, data.y);
        this.serverRotation = data.rotation;

        // Initialize interpolation target if first update
        if (!this.renderPosition) {
            this.renderPosition = Vec.clone(this.serverPosition);
            this.renderRotation = this.serverRotation;
        }
    }

    render(delta: number): void {
        // Interpolate position for smooth movement
        this.renderPosition = Vec.lerp(
            this.renderPosition,
            this.serverPosition,
            this.interpSpeed
        );

        // Interpolate rotation
        const rotDiff = Angle.minimize(this.renderRotation, this.serverRotation);
        this.renderRotation += rotDiff * this.interpSpeed;

        // Update sprite
        this.sprite.position.set(this.renderPosition.x, this.renderPosition.y);
        this.sprite.rotation = this.renderRotation;
    }
}
```

---

## Dependency Management

### Required Dependencies

**Server**:
```json
{
  "dependencies": {},
  "devDependencies": {
    "@types/bun": "^1.3.1",
    "@types/node": "^24.9.2",
    "typescript": "^5.9.3"
  }
}
```

**Client**:
```json
{
  "dependencies": {
    "pixi.js": "^8.14.0"
  },
  "devDependencies": {
    "typescript": "^5.9.3",
    "vite": "^6.4.1"
  }
}
```

**Common**:
```json
{
  "devDependencies": {
    "typescript": "^5.9.3"
  }
}
```

### Optional Dependencies (Add Later)

**For Mobile Support**:
- `nipplejs`: Virtual joystick

**For Better Audio**:
- `howler`: Cross-browser audio library
- Or use Web Audio API directly

**For Binary Protocol**:
- None needed, implement custom ByteStream (copy from Suroi)

**For Production**:
- `dotenv`: Environment variables
- `pm2`: Process management
- `compression`: Gzip compression for HTTP

---

## Common Pitfalls & Solutions

### Pitfall 1: Client-Server Desync

**Problem**: Player sees themselves in different position than server thinks they are.

**Cause**:
- Network latency
- Client prediction not matching server logic
- Floating point precision differences

**Solution**:
```typescript
// Server should be authoritative
// Client predicts, but reconciles on server update

class ClientPlayer {
    predictedPosition: Vector;
    pendingInputs: InputPacket[] = [];

    sendInput(input: InputPacket): void {
        // Send to server
        this.socket.send(JSON.stringify(input));

        // Apply locally for prediction
        this.applyInput(input);
        this.pendingInputs.push(input);
    }

    receiveUpdate(data: PlayerData): void {
        // Server position is truth
        this.serverPosition = Vec(data.x, data.y);

        // Remove inputs server has processed
        this.pendingInputs = this.pendingInputs.filter(
            input => input.seq > data.lastProcessedSeq
        );

        // Re-apply pending inputs
        this.predictedPosition = Vec.clone(this.serverPosition);
        for (const input of this.pendingInputs) {
            this.applyInput(input);
        }
    }
}
```

### Pitfall 2: Bullets Missing on Server

**Problem**: Player shoots enemy on their screen, but server doesn't register hit.

**Cause**:
- Client visual not matching server hitbox
- Latency causing position mismatch
- Bullet traveling through object in one tick

**Solution**:
```typescript
// Use continuous collision detection
// Check entire path, not just endpoints

class Bullet {
    update(dt: number, game: Game): void {
        const oldPos = this.position;
        const newPos = Vec.add(oldPos, Vec.scale(this.direction, this.speed * dt));

        // Create line segment
        const line = { start: oldPos, end: newPos };

        // Query ALL objects along path (not just at endpoints)
        const lineRect = RectangleHitbox.fromLine(oldPos, newPos);
        const candidates = game.grid.intersectsHitbox(lineRect);

        // Check EACH object for intersection with line
        for (const obj of candidates) {
            const hit = obj.hitbox.intersectsLine(oldPos, newPos);
            if (hit) {
                // Process hit
                this.handleHit(obj, hit.point);
                return;
            }
        }

        this.position = newPos;
    }
}
```

### Pitfall 3: Performance Degradation with Many Objects

**Problem**: Game starts lagging when there are 50+ players/bullets/obstacles.

**Cause**:
- O(n²) collision checks
- Sending too much data every tick
- Not using spatial partitioning

**Solution**:
```typescript
// 1. Use spatial grid (already implemented)
// 2. Visibility culling - only send nearby objects

class Game {
    serializeForPlayer(player: Player): UpdatePacket {
        const visibleRadius = 100; // units

        // Only include players within visible radius
        const visiblePlayers = Array.from(this.players.values())
            .filter(p => {
                if (p === player) return true; // Always include self
                const distance = Vec.len(Vec.sub(p.position, player.position));
                return distance <= visibleRadius;
            });

        return {
            type: PacketType.Update,
            players: visiblePlayers.map(p => p.serialize()),
            // ... other data
        };
    }
}

// 3. Use dirty flags (add later)
// 4. Binary protocol instead of JSON (add later)
```

### Pitfall 4: Weapon Not Firing

**Problem**: Player clicks but gun doesn't shoot.

**Cause**:
- Fire delay not respected
- Ammo check failing
- Reload state not properly managed

**Solution**:
```typescript
class Gun {
    canShoot(now: number): boolean {
        // Check all conditions
        if (this.reloading) return false;
        if (this.ammo <= 0) return false;
        if (now - this.lastShotTime < this.definition.fireDelay) return false;
        return true;
    }

    tryShoot(now: number): boolean {
        if (!this.canShoot(now)) {
            // Auto-reload if empty
            if (this.ammo <= 0 && !this.reloading) {
                this.startReload(now);
            }
            return false;
        }

        this.shoot(now);
        return true;
    }

    update(now: number, totalAmmo: number): void {
        // Handle reload completion
        if (this.reloading &&
            now - this.reloadStartTime >= this.definition.reloadTime) {
            this.finishReload(totalAmmo);
        }
    }
}
```

### Pitfall 5: Memory Leaks in Client

**Problem**: Game gets slower over time, browser tab uses more and more memory.

**Cause**:
- Not removing sprites when objects are destroyed
- Event listeners not cleaned up
- Intervals/timeouts not cleared

**Solution**:
```typescript
class GameClient {
    private objectSprites = new Map<number, PIXI.Sprite>();

    handleUpdate(data: UpdatePacket): void {
        // Track which IDs we received
        const currentPlayerIds = new Set(data.players.map(p => p.id));

        // Remove sprites for players that no longer exist
        for (const [id, sprite] of this.objectSprites.entries()) {
            if (!currentPlayerIds.has(id)) {
                // Clean up sprite
                sprite.destroy();
                this.objectSprites.delete(id);
            }
        }

        // Add/update sprites
        for (const playerData of data.players) {
            let sprite = this.objectSprites.get(playerData.id);
            if (!sprite) {
                sprite = this.createPlayerSprite(playerData);
                this.objectSprites.set(playerData.id, sprite);
            }
            this.updateSprite(sprite, playerData);
        }
    }

    cleanup(): void {
        // Remove all sprites
        for (const sprite of this.objectSprites.values()) {
            sprite.destroy();
        }
        this.objectSprites.clear();

        // Destroy PixiJS app
        this.app.destroy(true, { children: true, texture: true });
    }
}
```

### Pitfall 6: Obstacles Not Blocking Bullets

**Problem**: Bullets go through obstacles or hit players behind obstacles.

**Cause**:
- Line-rectangle intersection not working correctly
- Not sorting hits by distance
- Checking wrong hitboxes

**Solution**:
```typescript
class Bullet {
    update(dt: number, game: Game): void {
        const oldPos = this.position;
        const newPos = Vec.add(oldPos, Vec.scale(this.direction, this.speed * dt));

        // Get ALL objects in path (players AND obstacles)
        const lineRect = RectangleHitbox.fromLine(oldPos, newPos);
        const candidates = game.grid.intersectsHitbox(lineRect);

        // Check each for intersection
        const hits: Array<{ obj: GameObject, point: Vector, dist: number }> = [];

        for (const obj of candidates) {
            if (obj === this.shooter) continue;

            const intersection = obj.hitbox.intersectsLine(oldPos, newPos);
            if (intersection) {
                const dist = Vec.len(Vec.sub(intersection.point, oldPos));
                hits.push({ obj, point: intersection.point, dist });
            }
        }

        if (hits.length === 0) {
            // No hits, move bullet
            this.position = newPos;
            return;
        }

        // Sort by distance, hit closest first
        hits.sort((a, b) => a.dist - b.dist);
        const closest = hits[0];

        // Process closest hit
        this.position = closest.point;
        if (closest.obj instanceof Player) {
            closest.obj.damage(this.damage, this.shooter);
        } else if (closest.obj instanceof Obstacle) {
            closest.obj.damage(this.damage);
        }
        this.dead = true;
    }
}
```

---

## Summary & Next Steps

### What This Plan Provides

1. **Complete architecture analysis** of original Suroi codebase
2. **Specific files to copy** (~2,000 lines of battle-tested utilities)
3. **Simplified implementations** for complex systems
4. **Full file structure** with line count estimates
5. **Working code examples** for all major systems
6. **Common pitfall solutions** to save debugging time

### Implementation Order

Follow phases sequentially:
1. **Phase 1**: Foundation (1-2 weeks) - Get basic connection working
2. **Phase 2**: Collision & Shooting (2-3 weeks) - Add combat mechanics
3. **Phase 3**: Items & Inventory (2-3 weeks) - Add loot and weapons
4. **Phase 4**: Polish & UI (2-4 weeks) - Make it playable

**Total Estimate**: 7-12 weeks for one developer

### Key Success Factors

1. **Copy proven utilities**: Don't rewrite vector math, hitboxes, or spatial grid
2. **Start simple**: Use JSON before binary protocol
3. **Server authority**: Always trust server, client just predicts
4. **Test incrementally**: Get each phase fully working before moving on
5. **Profile before optimizing**: Measure performance, don't assume bottlenecks

### What's Not in This Plan

- Team/squad system (add later if needed)
- Spectator mode (add after MVP)
- Gas/safe zone shrinking (add after MVP)
- Buildings/multi-floor structures (too complex for simplified version)
- Perks/special abilities (skip for simplicity)
- Mobile touch controls (add later)
- Sound spatialization (use simple sounds initially)
- Advanced effects (particles, screen shake, etc. - add for polish)

---

## Final Notes

This plan is designed to be **implementable by a single developer** or AI agent working linearly through the phases. The codebase structure mirrors Suroi's proven architecture while simplifying or removing complex features.

**Key Philosophy**:
- **Reuse** what works (utilities, patterns, architecture)
- **Simplify** what's complex (packets, inventory, player class)
- **Rebuild** what's specific (UI, map, effects)

The result will be a **playable, simplified battle royale** in ~6,000 lines of code that demonstrates all core mechanics without the complexity of a full production game.

**Good luck with the implementation!**
