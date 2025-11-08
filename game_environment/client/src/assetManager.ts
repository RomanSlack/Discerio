import * as PIXI from 'pixi.js';

export class AssetManager {
    private static instance: AssetManager;
    private textures: Map<string, PIXI.Texture> = new Map();
    private loaded = false;

    static getInstance(): AssetManager {
        if (!AssetManager.instance) {
            AssetManager.instance = new AssetManager();
        }
        return AssetManager.instance;
    }

    async loadAssets(): Promise<void> {
        if (this.loaded) return;

        const assets = [
            // Obstacles - trees
            { name: 'tree_trunk', url: '/assets/obstacles/oak_tree_trunk_1.svg' },
            { name: 'tree_leaves', url: '/assets/obstacles/oak_tree_leaves_1.svg' },

            // Obstacles - rocks
            { name: 'rock', url: '/assets/obstacles/gold_rock.svg' },

            // Obstacles - crates
            { name: 'crate', url: '/assets/obstacles/aegis_crate.svg' },

            // Obstacles - walls
            { name: 'wall', url: '/assets/obstacles/barrier.svg' },

            // Loot - ammo
            { name: 'ammo_9mm', url: '/assets/loot/9mm.svg' },
            { name: 'ammo_556mm', url: '/assets/loot/556mm.svg' },
            { name: 'ammo_12g', url: '/assets/loot/12g.svg' },

            // Loot - weapons (world versions)
            { name: 'loot_pistol', url: '/assets/weapons/cz75a_world.svg' },
            { name: 'loot_rifle', url: '/assets/weapons/ak47_world.svg' },
            { name: 'loot_shotgun', url: '/assets/weapons/hp18_world.svg' },

            // Weapons (held versions)
            { name: 'pistol', url: '/assets/weapons/cz75a.svg' },
            { name: 'rifle', url: '/assets/weapons/ak47.svg' },
            { name: 'shotgun', url: '/assets/weapons/hp18.svg' },

            // Bullet trails
            { name: 'bullet_trail', url: '/assets/trails/base_trail.svg' }
        ];

        for (const asset of assets) {
            try {
                const texture = await PIXI.Assets.load(asset.url);
                this.textures.set(asset.name, texture);
            } catch (error) {
                console.warn(`Failed to load ${asset.name}, using fallback`);
                // Create a simple colored rectangle as fallback
                const graphics = new PIXI.Graphics();
                graphics.rect(0, 0, 32, 32);
                graphics.fill({ color: 0x808080 });
                const texture = PIXI.RenderTexture.create({ width: 32, height: 32 });
                this.textures.set(asset.name, texture);
            }
        }

        this.loaded = true;
    }

    getTexture(name: string): PIXI.Texture | null {
        return this.textures.get(name) || null;
    }

    isLoaded(): boolean {
        return this.loaded;
    }
}
