export class HUD {
    private healthFill: HTMLElement;
    private healthText: HTMLElement;
    private weaponName: HTMLElement;
    private ammoCurrent: HTMLElement;
    private ammoReserve: HTMLElement;
    private killFeed: HTMLElement;
    private freeCamIndicator: HTMLElement;

    constructor() {
        this.healthFill = document.getElementById('health-fill')!;
        this.healthText = document.getElementById('health-text')!;
        this.weaponName = document.getElementById('weapon-name')!;
        this.ammoCurrent = document.getElementById('ammo-current')!;
        this.ammoReserve = document.getElementById('ammo-reserve')!;
        this.killFeed = document.getElementById('kill-feed')!;

        // Create free cam indicator if it doesn't exist
        this.freeCamIndicator = document.getElementById('freecam-indicator') || this.createFreeCamIndicator();
    }

    private createFreeCamIndicator(): HTMLElement {
        const indicator = document.createElement('div');
        indicator.id = 'freecam-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 100, 0, 0.9);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 16px;
            font-weight: bold;
            display: none;
            z-index: 1000;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            border: 2px solid rgba(255, 150, 0, 1);
        `;
        indicator.textContent = '🎥 FREE CAM MODE - Press TAB to exit | WASD to move';
        document.body.appendChild(indicator);
        return indicator;
    }

    showSpectatorMode(): void {
        this.freeCamIndicator.textContent = '👁️ SPECTATOR MODE - TAB: Free Cam | SCROLL: Zoom';
        this.freeCamIndicator.style.background = 'rgba(100, 100, 255, 0.9)';
        this.freeCamIndicator.style.border = '2px solid rgba(150, 150, 255, 1)';
        this.freeCamIndicator.style.display = 'block';
    }

    updateHealth(health: number): void {
        const healthPercent = Math.max(0, Math.min(100, health));
        this.healthFill.style.width = `${healthPercent}%`;
        this.healthText.textContent = Math.ceil(health).toString();
    }

    updateWeapon(weaponName: string | null): void {
        this.weaponName.textContent = weaponName ?? 'Fists';
    }

    updateAmmo(current: number, reserve: number): void {
        this.ammoCurrent.textContent = current.toString();
        this.ammoReserve.textContent = reserve.toString();
    }

    addKillMessage(message: string): void {
        const element = document.createElement('div');
        element.className = 'kill-message';
        element.textContent = message;
        this.killFeed.prepend(element);

        setTimeout(() => {
            element.remove();
        }, 5000);
    }

    showDeathScreen(): void {
        document.getElementById('death-screen')!.classList.add('visible');
    }

    hideDeathScreen(): void {
        document.getElementById('death-screen')!.classList.remove('visible');
    }

    showFreeCamIndicator(): void {
        this.freeCamIndicator.style.display = 'block';
    }

    hideFreeCamIndicator(): void {
        this.freeCamIndicator.style.display = 'none';
    }
}
