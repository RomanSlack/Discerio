import { Vec, type Vector } from "./vector";

export const π = Math.PI;
export const τ = 2 * π;

export const Angle = Object.freeze({
    /**
     * Draws a line between two points and returns that line's angle
     */
    betweenPoints(a: Vector, b: Vector): number {
        return Math.atan2(b.y - a.y, b.x - a.x);
    },
    /**
     * Normalize an angle to a value between `-π` and `π`
     */
    normalize(radians: number): number {
        return Numeric.absMod(radians - π, τ) - π;
    },
    /**
     * Find the smallest difference between two angles
     */
    minimize(start: number, end: number): number {
        return Numeric.absMod(end - start + π, τ) - π;
    }
});

export const Numeric = Object.freeze({
    /**
     * Works like regular modulo, but negative numbers cycle back around
     */
    absMod(a: number, n: number): number {
        return a >= 0
            ? a % n
            : (a % n + n) % n;
    },
    /**
     * Interpolates between two values
     */
    lerp(start: number, end: number, interpFactor: number): number {
        return start * (1 - interpFactor) + end * interpFactor;
    },
    /**
     * Conform a number to specified bounds
     */
    clamp(value: number, min: number, max: number): number {
        return value < max ? value > min ? value : min : max;
    },
    /**
     * Remaps a value from a range to another
     */
    remap(value: number, min0: number, max0: number, min1: number, max1: number): number {
        return Numeric.lerp(min1, max1, Numeric.clamp((value - min0) / (max0 - min0), 0, 1));
    }
});

export const Geometry = Object.freeze({
    /**
     * Get the distance between two points
     */
    distance(a: Vector, b: Vector): number {
        return Math.sqrt(this.distanceSquared(a, b));
    },
    /**
     * Get the squared distance between two points
     */
    distanceSquared(a: Vector, b: Vector): number {
        return (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
    }
});

export const Collision = Object.freeze({
    /**
     * Line-circle intersection test
     */
    lineIntersectsCircle(start: Vector, end: Vector, center: Vector, radius: number): Vector | null {
        const d = Vec.sub(end, start);
        const f = Vec.sub(start, center);

        const a = Vec.squaredLen(d);
        const b = 2 * (f.x * d.x + f.y * d.y);
        const c = Vec.squaredLen(f) - radius * radius;

        let discriminant = b * b - 4 * a * c;

        if (discriminant < 0) {
            return null;
        }

        discriminant = Math.sqrt(discriminant);
        const t1 = (-b - discriminant) / (2 * a);
        const t2 = (-b + discriminant) / (2 * a);

        if (t1 >= 0 && t1 <= 1) {
            return Vec.add(start, Vec.scale(d, t1));
        }

        if (t2 >= 0 && t2 <= 1) {
            return Vec.add(start, Vec.scale(d, t2));
        }

        return null;
    },

    /**
     * Line-rectangle intersection test
     */
    lineIntersectsRect(start: Vector, end: Vector, min: Vector, max: Vector): Vector | null {
        let tMin = 0;
        let tMax = 1;

        const delta = Vec.sub(end, start);

        // Check X axis
        if (Math.abs(delta.x) < 0.0000001) {
            if (start.x < min.x || start.x > max.x) {
                return null;
            }
        } else {
            const tx1 = (min.x - start.x) / delta.x;
            const tx2 = (max.x - start.x) / delta.x;

            tMin = Math.max(tMin, Math.min(tx1, tx2));
            tMax = Math.min(tMax, Math.max(tx1, tx2));

            if (tMin > tMax) {
                return null;
            }
        }

        // Check Y axis
        if (Math.abs(delta.y) < 0.0000001) {
            if (start.y < min.y || start.y > max.y) {
                return null;
            }
        } else {
            const ty1 = (min.y - start.y) / delta.y;
            const ty2 = (max.y - start.y) / delta.y;

            tMin = Math.max(tMin, Math.min(ty1, ty2));
            tMax = Math.min(tMax, Math.max(ty1, ty2));

            if (tMin > tMax) {
                return null;
            }
        }

        return Vec.add(start, Vec.scale(delta, tMin));
    },

    /**
     * Circle-circle collision test
     */
    circleCircleIntersection(center1: Vector, radius1: number, center2: Vector, radius2: number): boolean {
        const distSquared = Geometry.distanceSquared(center1, center2);
        const radiusSum = radius1 + radius2;
        return distSquared <= radiusSum * radiusSum;
    }
});
