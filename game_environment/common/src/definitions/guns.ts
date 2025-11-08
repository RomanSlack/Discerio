export interface GunDefinition {
    idString: string;
    name: string;
    ammoType: string;
    capacity: number;
    reloadTime: number;
    fireDelay: number;
    damage: number;
    range: number;
    speed: number;
    bulletCount: number;
    spread?: number;
}

export const Guns: Record<string, GunDefinition> = {
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
        bulletCount: 8,
        spread: 0.3
    }
};
