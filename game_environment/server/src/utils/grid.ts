import { Numeric } from "../../../common/src/utils/math";
import { Vec, type Vector } from "../../../common/src/utils/vector";
import type { Hitbox } from "../../../common/src/utils/hitbox";
import type { GameObject } from "../objects/gameObject";

export class Grid {
    readonly width: number;
    readonly height: number;
    readonly cellSize = 32;

    private readonly _grid: Map<number, GameObject>[][];
    private readonly _objectsCells = new Map<number, Vector[]>();

    constructor(width: number, height: number) {
        this.width = Math.floor(width / this.cellSize);
        this.height = Math.floor(height / this.cellSize);
        this._grid = Array.from({ length: this.width + 1 }, () => []);
    }

    addObject(object: GameObject): void {
        this.updateObject(object);
    }

    updateObject(object: GameObject): void {
        this._removeFromGrid(object);
        const cells: Vector[] = [];

        const rect = object.hitbox.toRectangle();
        const min = this._roundToCells(rect.min);
        const max = this._roundToCells(rect.max);

        for (let x = min.x; x <= max.x; x++) {
            const xRow = this._grid[x];
            for (let y = min.y; y <= max.y; y++) {
                (xRow[y] ??= new Map()).set(object.id, object);
                cells.push(Vec(x, y));
            }
        }

        this._objectsCells.set(object.id, cells);
    }

    private _removeFromGrid(object: GameObject): void {
        const cells = this._objectsCells.get(object.id);
        if (!cells) return;

        for (const cell of cells) {
            this._grid[cell.x]?.[cell.y]?.delete(object.id);
        }
        this._objectsCells.delete(object.id);
    }

    removeObject(object: GameObject): void {
        this._removeFromGrid(object);
    }

    intersectsHitbox(hitbox: Hitbox): Set<GameObject> {
        const rect = hitbox.toRectangle();
        const min = this._roundToCells(rect.min);
        const max = this._roundToCells(rect.max);

        const objects = new Set<GameObject>();

        for (let x = min.x; x <= max.x; x++) {
            const xRow = this._grid[x];
            for (let y = min.y; y <= max.y; y++) {
                const objectsMap = xRow[y];
                if (!objectsMap) continue;

                for (const object of objectsMap.values()) {
                    objects.add(object);
                }
            }
        }

        return objects;
    }

    private _roundToCells(vector: Vector): Vector {
        return {
            x: Numeric.clamp(Math.floor(vector.x / this.cellSize), 0, this.width),
            y: Numeric.clamp(Math.floor(vector.y / this.cellSize), 0, this.height)
        };
    }
}
