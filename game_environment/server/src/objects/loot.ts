import { CircleHitbox } from "../../../common/src/utils/hitbox";
import { Vec, type Vector } from "../../../common/src/utils/vector";
import { GameObject } from "./gameObject";
import type { LootData } from "../../../common/src/packets";

export class Loot extends GameObject {
    type: string;
    hitbox: CircleHitbox;
    count: number;
    picked: boolean = false;

    constructor(id: number, type: string, position: Vector, count: number = 1) {
        super(id, position);
        this.type = type;
        this.count = count;
        this.hitbox = new CircleHitbox(2, Vec.clone(position));
    }

    serialize(): LootData {
        return {
            id: this.id,
            type: this.type,
            x: this.position.x,
            y: this.position.y,
            picked: this.picked
        };
    }
}
