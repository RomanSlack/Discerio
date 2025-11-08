# Suroi Simplified Clone

A fully functional, simplified battle royale game based on Suroi.

## Features

- **Multiplayer**: Support for multiple players in real-time
- **Weapons**: 3 weapons (Pistol, Rifle, Shotgun) with different characteristics
- **Combat**: Hitscan bullet system with accurate collision detection
- **Items**: Weapon and ammo pickups scattered across the map
- **Obstacles**: Trees, rocks, crates, and walls for cover
- **Optimized**: Spatial grid system for efficient collision detection
- **Real-time**: 40 TPS server tick rate for smooth gameplay

## Tech Stack

- **Runtime**: Bun
- **Language**: TypeScript
- **Client**: PixiJS for rendering, WebSocket for networking
- **Server**: Bun WebSocket server with custom game loop
- **Build**: Vite for client bundling

## Project Structure

```
simplified_game_env/
├── common/          # Shared code (utilities, definitions, packets)
├── server/          # Game server
├── client/          # Game client
└── package.json     # Root package.json with workspaces
```

## Installation

Install dependencies:
```bash
bun install
```

## Development

Run both server and client:
```bash
bun dev
```

Or run them separately:
```bash
# Terminal 1 - Server
bun dev:server

# Terminal 2 - Client
bun dev:client
```

The game will be available at `http://localhost:3000`

## Controls

- **WASD** - Movement
- **Mouse** - Aim
- **Left Click** - Shoot
- **1/2** - Switch weapons
- **F** - Pick up items
- **R** - Reload

## How to Play

1. Open `http://localhost:3000` in your browser
2. Enter a username
3. Click "PLAY"
4. Move with WASD, aim with mouse, shoot with left click
5. Pick up weapons and ammo by walking over them and pressing F
6. Survive!

## Architecture Highlights

### Server
- **Game Loop**: Fixed 40 TPS tick rate
- **Spatial Grid**: O(1) collision detection using grid partitioning
- **Hitscan Bullets**: Raycasting-based bullet system
- **Authoritative**: Server is source of truth for all game state

### Client
- **PixiJS Rendering**: Hardware-accelerated graphics
- **Smooth Camera**: Lerp-based camera following
- **Input Prediction**: Client sends inputs at 60 FPS
- **HUD**: Real-time health, ammo, and weapon display

### Networking
- **WebSocket**: Full-duplex communication
- **JSON Packets**: Simple, human-readable packet format
- **Update Rate**: Server broadcasts at 40 TPS

## Performance

- Supports 10-20 players simultaneously
- 512x512 game map
- ~30 obstacles
- ~15 loot items
- Efficient spatial grid prevents O(n²) collision checks

## Future Enhancements

Potential improvements (not yet implemented):
- Binary packet protocol for reduced bandwidth
- Client-side prediction and reconciliation
- Particle effects and visual polish
- Sound effects
- Mobile touch controls
- Minimap
- Kill feed
- Leaderboard
- Safe zone/gas mechanic

## License

This is a simplified educational clone. Original Suroi by Hasanger Games.
