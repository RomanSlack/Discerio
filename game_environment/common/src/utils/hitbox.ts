import { Collision, Geometry } from "./math";
import { Vec, type Vector } from "./vector";

export enum HitboxType {
    Circle,
    Rect
}

export abstract class BaseHitbox {
    abstract type: HitboxType;
    abstract collidesWith(that: Hitbox): boolean;
    abstract intersectsLine(start: Vector, end: Vector): { point: Vector; normal: Vector } | null;
    abstract toRectangle(): RectangleHitbox;
    abstract clone(): Hitbox;
}

export class CircleHitbox extends BaseHitbox {
    override readonly type = HitboxType.Circle;
    position: Vector;
    radius: number;

    constructor(radius: number, position?: Vector) {
        super();
        this.position = position ?? Vec(0, 0);
        this.radius = radius;
    }

    override collidesWith(that: Hitbox): boolean {
        if (that.type === HitboxType.Circle) {
            return Collision.circleCircleIntersection(
                this.position,
                this.radius,
                that.position,
                that.radius
            );
        } else if (that.type === HitboxType.Rect) {
            return this.collidesWithRect(that);
        }
        return false;
    }

    private collidesWithRect(rect: RectangleHitbox): boolean {
        // Find closest point on rectangle to circle center
        const closestX = Math.max(rect.min.x, Math.min(this.position.x, rect.max.x));
        const closestY = Math.max(rect.min.y, Math.min(this.position.y, rect.max.y));

        const distX = this.position.x - closestX;
        const distY = this.position.y - closestY;

        return (distX * distX + distY * distY) <= (this.radius * this.radius);
    }

    override intersectsLine(start: Vector, end: Vector): { point: Vector; normal: Vector } | null {
        const intersection = Collision.lineIntersectsCircle(start, end, this.position, this.radius);
        if (!intersection) return null;

        const normal = Vec.normalize(Vec.sub(intersection, this.position));
        return { point: intersection, normal };
    }

    override toRectangle(): RectangleHitbox {
        return new RectangleHitbox(
            Vec(this.position.x - this.radius, this.position.y - this.radius),
            Vec(this.position.x + this.radius, this.position.y + this.radius)
        );
    }

    override clone(): CircleHitbox {
        return new CircleHitbox(this.radius, Vec.clone(this.position));
    }

    transform(position: Vector): CircleHitbox {
        return new CircleHitbox(this.radius, Vec.add(this.position, position));
    }
}

export class RectangleHitbox extends BaseHitbox {
    override readonly type = HitboxType.Rect;
    min: Vector;
    max: Vector;

    constructor(min: Vector, max: Vector) {
        super();
        this.min = min;
        this.max = max;
    }

    static fromLine(start: Vector, end: Vector): RectangleHitbox {
        return new RectangleHitbox(
            Vec(Math.min(start.x, end.x), Math.min(start.y, end.y)),
            Vec(Math.max(start.x, end.x), Math.max(start.y, end.y))
        );
    }

    static fromRect(x: number, y: number, width: number, height: number): RectangleHitbox {
        return new RectangleHitbox(
            Vec(x - width / 2, y - height / 2),
            Vec(x + width / 2, y + height / 2)
        );
    }

    override collidesWith(that: Hitbox): boolean {
        if (that.type === HitboxType.Circle) {
            return that.collidesWith(this);
        } else if (that.type === HitboxType.Rect) {
            return !(
                this.max.x < that.min.x ||
                this.min.x > that.max.x ||
                this.max.y < that.min.y ||
                this.min.y > that.max.y
            );
        }
        return false;
    }

    override intersectsLine(start: Vector, end: Vector): { point: Vector; normal: Vector } | null {
        const intersection = Collision.lineIntersectsRect(start, end, this.min, this.max);
        if (!intersection) return null;

        // Determine which edge was hit for normal calculation
        const epsilon = 0.001;
        let normal: Vector;

        if (Math.abs(intersection.x - this.min.x) < epsilon) {
            normal = Vec(-1, 0); // Left edge
        } else if (Math.abs(intersection.x - this.max.x) < epsilon) {
            normal = Vec(1, 0); // Right edge
        } else if (Math.abs(intersection.y - this.min.y) < epsilon) {
            normal = Vec(0, -1); // Top edge
        } else {
            normal = Vec(0, 1); // Bottom edge
        }

        return { point: intersection, normal };
    }

    override toRectangle(): RectangleHitbox {
        return this.clone();
    }

    override clone(): RectangleHitbox {
        return new RectangleHitbox(Vec.clone(this.min), Vec.clone(this.max));
    }

    transform(position: Vector): RectangleHitbox {
        return new RectangleHitbox(
            Vec.add(this.min, position),
            Vec.add(this.max, position)
        );
    }

    getCenter(): Vector {
        return Vec(
            (this.min.x + this.max.x) / 2,
            (this.min.y + this.max.y) / 2
        );
    }

    isPointInside(point: Vector): boolean {
        return point.x >= this.min.x &&
               point.x <= this.max.x &&
               point.y >= this.min.y &&
               point.y <= this.max.y;
    }
}

export type Hitbox = CircleHitbox | RectangleHitbox;
