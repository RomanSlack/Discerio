import { Vec, type Vector } from "../../common/src/utils/vector";
import { Numeric } from "../../common/src/utils/math";

export class Camera {
    position: Vector = Vec(0, 0);
    zoom: number = 5; // Current zoom level

    // Zoom controls
    private targetZoom: number = 5; // Smooth zoom target
    private minZoom: number = 2;    // Most zoomed out (wider view)
    private maxZoom: number = 10;   // Most zoomed in (closer view)
    private zoomEnabled: boolean = false; // Only enabled for spectators

    // Free cam mode
    private freeCamEnabled: boolean = false;
    private freeCamPosition: Vector = Vec(0, 0);
    private freeCamVelocity: Vector = Vec(0, 0);
    private readonly freeCamSpeed: number = 0.5; // Speed of free cam movement
    private readonly freeCamDrag: number = 0.85; // Smooth deceleration

    constructor(private width: number, private height: number) {}

    update(targetPosition: Vector): void {
        if (this.freeCamEnabled) {
            // Free cam mode - don't follow player
            // Apply velocity and drag for smooth movement
            this.freeCamPosition = Vec.add(this.freeCamPosition, this.freeCamVelocity);
            this.freeCamVelocity = Vec.scale(this.freeCamVelocity, this.freeCamDrag);
            this.position = this.freeCamPosition;
        } else {
            // Normal mode - smooth camera follow player
            this.position = Vec.lerp(this.position, targetPosition, 0.1);
        }

        // Smooth zoom transition
        this.zoom = Numeric.lerp(this.zoom, this.targetZoom, 0.1);
    }

    // Toggle free cam mode
    toggleFreeCam(): void {
        this.freeCamEnabled = !this.freeCamEnabled;
        if (this.freeCamEnabled) {
            // Entering free cam - save current position
            this.freeCamPosition = Vec.clone(this.position);
            this.freeCamVelocity = Vec(0, 0);
        }
    }

    // Move free cam with WASD
    moveFreeCam(direction: Vector): void {
        if (this.freeCamEnabled) {
            const movement = Vec.scale(direction, this.freeCamSpeed);
            this.freeCamVelocity = Vec.add(this.freeCamVelocity, movement);
        }
    }

    // Check if in free cam mode
    isFreeCamEnabled(): boolean {
        return this.freeCamEnabled;
    }

    // Enable zoom (for spectators)
    enableZoom(): void {
        this.zoomEnabled = true;
    }

    // Set zoom level (with mouse wheel)
    adjustZoom(delta: number): void {
        if (!this.zoomEnabled) return;

        this.targetZoom = Numeric.clamp(
            this.targetZoom + delta,
            this.minZoom,
            this.maxZoom
        );
    }

    worldToScreen(worldPos: Vector): Vector {
        const screenX = (worldPos.x - this.position.x) * this.zoom + this.width / 2;
        const screenY = (worldPos.y - this.position.y) * this.zoom + this.height / 2;
        return Vec(screenX, screenY);
    }

    screenToWorld(screenPos: Vector): Vector {
        const worldX = (screenPos.x - this.width / 2) / this.zoom + this.position.x;
        const worldY = (screenPos.y - this.height / 2) / this.zoom + this.position.y;
        return Vec(worldX, worldY);
    }

    resize(width: number, height: number): void {
        this.width = width;
        this.height = height;
    }
}
