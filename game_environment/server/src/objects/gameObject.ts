import type { Hitbox } from "../../../common/src/utils/hitbox";
import type { Vector } from "../../../common/src/utils/vector";

export abstract class GameObject {
    id: number;
    position: Vector;
    abstract hitbox: Hitbox;
    dead: boolean = false;

    constructor(id: number, position: Vector) {
        this.id = id;
        this.position = position;
    }
}
