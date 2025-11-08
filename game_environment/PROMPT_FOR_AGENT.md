# Agent Task: Build Suroi Simplified Clone

## Context
You're building a simplified but fully functional clone of the Suroi battle royale game. All planning is complete.

## Your Mission
Implement the complete working game following the detailed plan in `IMPLEMENTATION_PLAN.md`.

## Key Instructions
1. **Follow the 4 phases sequentially** - Foundation → Collision/Shooting → Items/Inventory → Polish
2. **Copy liberally from original Suroi codebase** at `/home/roman/suroi/` - especially utilities (vector, hitbox, math, grid)
3. **Simplify complex systems** - Use the simplified versions described in the plan (JSON packets, 2 weapon slots, etc.)
4. **Build from scratch** - UI, map, effects (keep it minimal)
5. **Reference patterns** - Use the code examples in IMPLEMENTATION_PLAN.md as templates
6. **No testing needed** - User will test. Just implement fully and completely.

## File Structure
Follow the exact structure in IMPLEMENTATION_PLAN.md section "File Structure". Create all ~40 files.

## What to Copy Directly
- `common/src/utils/vector.ts` - Copy entirely
- `common/src/utils/math.ts` - Copy Angle, Numeric, Geometry, Collision namespaces
- `common/src/utils/hitbox.ts` - Copy Circle and Rectangle classes
- `server/src/utils/grid.ts` - Copy entirely

## Deliverables
A fully working game with:
- Server running on port 8000 with WebSocket game loop (40 TPS)
- Client HTML/CSS/TS with PixiJS rendering
- 2-3 weapons, 10+ obstacles, item pickups
- Player movement (WASD), shooting (mouse), collision detection
- Basic HUD (health, ammo, weapon)

## Start Here
Begin with Phase 1 from IMPLEMENTATION_PLAN.md. Work through all phases completely. The user will handle all testing.

Good luck!
