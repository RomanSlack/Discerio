import type { GunDefinition } from "../../common/src/definitions/guns";

export class Gun {
    definition: GunDefinition;
    ammo: number;
    lastShotTime: number = 0;
    reloading: boolean = false;
    reloadStartTime: number = 0;

    constructor(definition: GunDefinition) {
        this.definition = definition;
        this.ammo = definition.capacity;
    }

    canShoot(now: number): boolean {
        return !this.reloading &&
               this.ammo > 0 &&
               (now - this.lastShotTime) >= this.definition.fireDelay;
    }

    shoot(now: number): void {
        if (!this.canShoot(now)) return;
        this.ammo--;
        this.lastShotTime = now;
    }

    startReload(now: number): void {
        if (this.reloading || this.ammo === this.definition.capacity) return;
        this.reloading = true;
        this.reloadStartTime = now;
    }

    update(now: number, totalAmmo: number): void {
        if (this.reloading && (now - this.reloadStartTime) >= this.definition.reloadTime) {
            const needed = this.definition.capacity - this.ammo;
            const toLoad = Math.min(needed, totalAmmo);
            this.ammo += toLoad;
            this.reloading = false;
            return toLoad;
        }
        return 0;
    }
}
