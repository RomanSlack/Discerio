import * as PIXI from 'pixi.js';
import { Vec, type Vector } from "../../common/src/utils/vector";
import { Camera } from "./camera";
import { InputManager } from "./input";
import { HUD } from "./hud";
import { PacketType, type UpdatePacket, type PlayerData, type BulletData, type ObstacleData, type LootData } from "../../common/src/packets";
import { Guns } from "../../common/src/definitions/guns";

interface RenderObject {
    sprite: PIXI.Graphics | PIXI.Container;
    position: Vector;
    rotation: number;
}

export class GameClient {
    private app: PIXI.Application;
    private camera: Camera;
    private input!: InputManager;
    private hud: HUD;
    private socket: WebSocket | null = null;

    private playerId: number | null = null;
    private playerSprites: Map<number, RenderObject> = new Map();
    private bulletGraphics: Map<number, PIXI.Graphics> = new Map();
    private obstacleSprites: Map<number, RenderObject> = new Map();
    private lootSprites: Map<number, RenderObject> = new Map();

    private lastPlayerData: PlayerData | null = null;
    private lastUpdateTime = 0;

    constructor() {
        this.app = new PIXI.Application();
        this.camera = new Camera(window.innerWidth, window.innerHeight);
        this.hud = new HUD();
    }

    async init(): Promise<void> {
        await this.app.init({
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x7ec850,
            antialias: true
        });

        const gameContainer = document.getElementById('game-container')!;
        gameContainer.innerHTML = '';
        gameContainer.appendChild(this.app.canvas);

        // Initialize input manager after canvas is created
        this.input = new InputManager(this.app.canvas as HTMLCanvasElement);

        // Handle window resize
        window.addEventListener('resize', () => {
            this.app.renderer.resize(window.innerWidth, window.innerHeight);
            this.camera.resize(window.innerWidth, window.innerHeight);
        });

        // Start render loop
        this.app.ticker.add(() => this.render());
    }

    async connect(username: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.socket = new WebSocket('ws://localhost:8000/play');

            this.socket.onopen = () => {
                console.log('[Client] Connected to server');
                this.socket!.send(JSON.stringify({
                    type: PacketType.Join,
                    playerName: username
                }));
                resolve();
            };

            this.socket.onmessage = (event) => {
                try {
                    const packet: UpdatePacket = JSON.parse(event.data);
                    this.handleUpdate(packet);
                } catch (error) {
                    console.error('[Client] Error parsing packet:', error);
                }
            };

            this.socket.onerror = (error) => {
                console.error('[Client] WebSocket error:', error);
                reject(error);
            };

            this.socket.onclose = () => {
                console.log('[Client] Disconnected from server');
            };

            // Send input packets
            setInterval(() => {
                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    const inputPacket = this.input.getInputPacket(this.camera);
                    this.socket.send(JSON.stringify(inputPacket));
                }
            }, 1000 / 60); // 60 FPS
        });
    }

    private handleUpdate(packet: UpdatePacket): void {
        this.lastUpdateTime = Date.now();

        // Find our player
        if (this.playerId === null && packet.players.length > 0) {
            // Assume newest player is us (last in list on first join)
            this.playerId = packet.players[packet.players.length - 1].id;
        }

        // Update players
        const currentPlayerIds = new Set(packet.players.map(p => p.id));
        for (const [id, obj] of this.playerSprites.entries()) {
            if (!currentPlayerIds.has(id)) {
                this.app.stage.removeChild(obj.sprite);
                obj.sprite.destroy();
                this.playerSprites.delete(id);
            }
        }

        for (const playerData of packet.players) {
            if (playerData.id === this.playerId) {
                this.lastPlayerData = playerData;
            }

            let renderObj = this.playerSprites.get(playerData.id);
            if (!renderObj) {
                renderObj = this.createPlayerSprite(playerData);
                this.playerSprites.set(playerData.id, renderObj);
            }
            renderObj.position = Vec(playerData.x, playerData.y);
            renderObj.rotation = playerData.rotation;
        }

        // Update camera to follow our player
        if (this.playerId !== null && this.lastPlayerData) {
            this.camera.update(Vec(this.lastPlayerData.x, this.lastPlayerData.y));
        }

        // Update bullets
        const currentBulletIds = new Set(packet.bullets.map(b => b.id));
        for (const [id, graphic] of this.bulletGraphics.entries()) {
            if (!currentBulletIds.has(id)) {
                this.app.stage.removeChild(graphic);
                graphic.destroy();
                this.bulletGraphics.delete(id);
            }
        }

        for (const bulletData of packet.bullets) {
            if (!this.bulletGraphics.has(bulletData.id)) {
                const graphic = this.createBulletGraphic(bulletData);
                this.bulletGraphics.set(bulletData.id, graphic);
            }
        }

        // Update obstacles (only once)
        if (this.obstacleSprites.size === 0) {
            for (const obstacleData of packet.obstacles) {
                if (!obstacleData.destroyed) {
                    const renderObj = this.createObstacleSprite(obstacleData);
                    this.obstacleSprites.set(obstacleData.id, renderObj);
                }
            }
        }

        // Update loot
        const currentLootIds = new Set(packet.loot.map(l => l.id));
        for (const [id, obj] of this.lootSprites.entries()) {
            if (!currentLootIds.has(id)) {
                this.app.stage.removeChild(obj.sprite);
                obj.sprite.destroy();
                this.lootSprites.delete(id);
            }
        }

        for (const lootData of packet.loot) {
            if (!lootData.picked && !this.lootSprites.has(lootData.id)) {
                const renderObj = this.createLootSprite(lootData);
                this.lootSprites.set(lootData.id, renderObj);
            }
        }

        // Update HUD
        if (packet.playerData) {
            this.hud.updateHealth(packet.playerData.health);

            const activeWeapon = packet.playerData.weapons[this.lastPlayerData?.activeWeapon ?? 0];
            if (activeWeapon) {
                const gunDef = Guns[activeWeapon];
                this.hud.updateWeapon(gunDef?.name ?? activeWeapon);

                // Calculate ammo
                const ammoType = gunDef?.ammoType;
                const reserveAmmo = ammoType ? (packet.playerData.ammo[ammoType] ?? 0) : 0;
                this.hud.updateAmmo(15, reserveAmmo); // TODO: track current mag ammo
            } else {
                this.hud.updateWeapon(null);
                this.hud.updateAmmo(0, 0);
            }

            // Check if we died
            if (packet.playerData.health <= 0) {
                this.hud.showDeathScreen();
            }
        }
    }

    private render(): void {
        // Render players
        for (const [id, obj] of this.playerSprites.entries()) {
            const screenPos = this.camera.worldToScreen(obj.position);
            obj.sprite.position.set(screenPos.x, screenPos.y);
            obj.sprite.rotation = obj.rotation;
            obj.sprite.scale.set(this.camera.zoom);

            // Highlight our player
            if (id === this.playerId) {
                obj.sprite.alpha = 1;
            } else {
                obj.sprite.alpha = 0.8;
            }
        }

        // Render bullets
        for (const [id, graphic] of this.bulletGraphics.entries()) {
            // Bullets are rendered with the graphic already positioned
        }

        // Render obstacles
        for (const [id, obj] of this.obstacleSprites.entries()) {
            const screenPos = this.camera.worldToScreen(obj.position);
            obj.sprite.position.set(screenPos.x, screenPos.y);
            obj.sprite.rotation = obj.rotation;
            obj.sprite.scale.set(this.camera.zoom);
        }

        // Render loot
        for (const [id, obj] of this.lootSprites.entries()) {
            const screenPos = this.camera.worldToScreen(obj.position);
            obj.sprite.position.set(screenPos.x, screenPos.y);
            obj.sprite.scale.set(this.camera.zoom);
        }
    }

    private createPlayerSprite(playerData: PlayerData): RenderObject {
        const container = new PIXI.Container();

        // Body (circle)
        const body = new PIXI.Graphics();
        body.circle(0, 0, 2.25);
        body.fill({ color: playerData.dead ? 0x666666 : 0x4287f5 });
        body.stroke({ color: 0x000000, width: 0.2 });

        // Direction indicator (line)
        const direction = new PIXI.Graphics();
        direction.moveTo(0, 0);
        direction.lineTo(3, 0);
        direction.stroke({ color: 0xffffff, width: 0.3 });

        // Username
        const nameText = new PIXI.Text({
            text: playerData.username,
            style: {
                fontSize: 1,
                fill: 0xffffff,
                stroke: { color: 0x000000, width: 0.1 }
            }
        });
        nameText.anchor.set(0.5, 0.5);
        nameText.position.set(0, -4);

        container.addChild(body);
        container.addChild(direction);
        container.addChild(nameText);

        this.app.stage.addChild(container);

        return {
            sprite: container,
            position: Vec(playerData.x, playerData.y),
            rotation: playerData.rotation
        };
    }

    private createBulletGraphic(bulletData: BulletData): PIXI.Graphics {
        const graphic = new PIXI.Graphics();

        // Update bullet position every frame
        const updateBullet = () => {
            const screenStart = this.camera.worldToScreen(Vec(bulletData.x, bulletData.y));
            const bulletEnd = Vec.add(Vec(bulletData.x, bulletData.y), Vec.fromPolar(bulletData.rotation, 5));
            const screenEnd = this.camera.worldToScreen(bulletEnd);

            graphic.clear();
            graphic.moveTo(screenStart.x, screenStart.y);
            graphic.lineTo(screenEnd.x, screenEnd.y);
            graphic.stroke({ color: 0xffff00, width: 2 });
        };

        updateBullet();
        this.app.stage.addChild(graphic);

        return graphic;
    }

    private createObstacleSprite(obstacleData: ObstacleData): RenderObject {
        const graphic = new PIXI.Graphics();

        let color = 0x228B22;
        let radius = 3.5;

        switch (obstacleData.type) {
            case 'tree':
                color = 0x228B22;
                radius = 3.5;
                graphic.circle(0, 0, radius * obstacleData.scale);
                graphic.fill({ color });
                graphic.stroke({ color: 0x006400, width: 0.3 });
                break;
            case 'rock':
                color = 0x808080;
                radius = 4;
                graphic.circle(0, 0, radius * obstacleData.scale);
                graphic.fill({ color });
                graphic.stroke({ color: 0x404040, width: 0.3 });
                break;
            case 'crate':
                color = 0x8B4513;
                const size = 3.5 * obstacleData.scale;
                graphic.rect(-size, -size, size * 2, size * 2);
                graphic.fill({ color });
                graphic.stroke({ color: 0x654321, width: 0.3 });
                break;
            case 'wall':
                color = 0x404040;
                const width = 10 * obstacleData.scale;
                const height = 1;
                graphic.rect(-width, -height, width * 2, height * 2);
                graphic.fill({ color });
                graphic.stroke({ color: 0x202020, width: 0.2 });
                break;
        }

        this.app.stage.addChild(graphic);

        return {
            sprite: graphic,
            position: Vec(obstacleData.x, obstacleData.y),
            rotation: obstacleData.rotation
        };
    }

    private createLootSprite(lootData: LootData): RenderObject {
        const graphic = new PIXI.Graphics();

        let color = 0xFFD700;

        if (lootData.type.includes('ammo')) {
            color = 0xFFA500;
            graphic.rect(-1, -0.5, 2, 1);
            graphic.fill({ color });
        } else {
            // Weapon
            color = 0xFFD700;
            graphic.rect(-1.5, -0.3, 3, 0.6);
            graphic.fill({ color });
        }

        graphic.stroke({ color: 0x000000, width: 0.1 });

        this.app.stage.addChild(graphic);

        return {
            sprite: graphic,
            position: Vec(lootData.x, lootData.y),
            rotation: 0
        };
    }
}
