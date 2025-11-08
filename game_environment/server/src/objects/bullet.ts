import { Vec, type Vector } from "../../../common/src/utils/vector";
import { RectangleHitbox } from "../../../common/src/utils/hitbox";
import type { GunDefinition } from "../../../common/src/definitions/guns";
import type { Game } from "../game";
import { Obstacle } from "./obstacle";
import type { BulletData } from "../../../common/src/packets";
import type { GameObject } from "./gameObject";

// Forward declaration to avoid circular dependency
interface Player extends GameObject {
    damage(amount: number, source?: Player): void;
}

export class Bullet {
    id: number;
    position: Vector;
    direction: Vector;
    rotation: number;
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
        this.rotation = Vec.direction(this.direction);
        this.speed = gun.speed;
        this.damage = gun.damage;
        this.maxRange = gun.range;
        this.shooter = shooter;
    }

    update(dt: number, game: Game): void {
        const velocity = Vec.scale(this.direction, this.speed * dt);
        const newPosition = Vec.add(this.position, velocity);
        const distance = Vec.len(velocity);

        // Create bounding box for spatial query
        const lineRect = RectangleHitbox.fromLine(this.position, newPosition);
        const nearbyObjects = game.grid.intersectsHitbox(lineRect);

        let closestHit: {
            object: GameObject;
            point: Vector;
            distance: number;
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
                        object: obj,
                        point: intersection.point,
                        distance: hitDistance
                    };
                }
            }
        }

        if (closestHit) {
            // Hit something
            this.position = closestHit.point;

            // Check if it's an Obstacle (has a definition property)
            if (closestHit.object instanceof Obstacle) {
                closestHit.object.damage(this.damage);
            } else {
                // It's a Player
                const player = closestHit.object as Player;
                player.damage(this.damage, this.shooter);
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

    serialize(): BulletData {
        return {
            id: this.id,
            x: this.position.x,
            y: this.position.y,
            rotation: this.rotation
        };
    }
}
