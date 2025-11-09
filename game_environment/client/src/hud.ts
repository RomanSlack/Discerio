export class HUD {
    private healthFill: HTMLElement;
    private healthText: HTMLElement;
    private weaponName: HTMLElement;
    private ammoCurrent: HTMLElement;
    private ammoReserve: HTMLElement;
    private killFeed: HTMLElement;
    private freeCamIndicator: HTMLElement;
    private xpContainer: HTMLElement;
    private leaderboard: HTMLElement;

    constructor() {
        this.healthFill = document.getElementById('health-fill')!;
        this.healthText = document.getElementById('health-text')!;
        this.weaponName = document.getElementById('weapon-name')!;
        this.ammoCurrent = document.getElementById('ammo-current')!;
        this.ammoReserve = document.getElementById('ammo-reserve')!;
        this.killFeed = document.getElementById('kill-feed')!;

        // Create free cam indicator if it doesn't exist
        this.freeCamIndicator = document.getElementById('freecam-indicator') || this.createFreeCamIndicator();

        // Create XP display
        this.xpContainer = this.createXPDisplay();

        // Create leaderboard (hidden by default)
        this.leaderboard = this.createLeaderboard();
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

    private createXPDisplay(): HTMLElement {
        const container = document.createElement('div');
        container.id = 'xp-display';
        container.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 20px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 8px 12px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 14px;
            z-index: 100;
            border: 2px solid rgba(255, 215, 0, 0.6);
            min-width: 200px;
        `;

        // Level display
        const levelText = document.createElement('div');
        levelText.id = 'xp-level';
        levelText.style.cssText = `
            font-weight: bold;
            margin-bottom: 4px;
            color: #FFD700;
            font-size: 15px;
        `;
        levelText.textContent = 'Level 0';

        // XP bar container
        const xpBarBg = document.createElement('div');
        xpBarBg.style.cssText = `
            width: 100%;
            height: 16px;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid rgba(255, 215, 0, 0.3);
            position: relative;
        `;

        // XP bar fill
        const xpBarFill = document.createElement('div');
        xpBarFill.id = 'xp-fill';
        xpBarFill.style.cssText = `
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, #FFD700 0%, #FFA500 100%);
            transition: width 0.3s ease;
            border-radius: 8px;
        `;

        // XP text overlay
        const xpText = document.createElement('div');
        xpText.id = 'xp-text';
        xpText.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: bold;
            color: white;
            text-shadow: 1px 1px 2px black;
        `;
        xpText.textContent = '0 / 100';

        xpBarBg.appendChild(xpBarFill);
        xpBarBg.appendChild(xpText);
        container.appendChild(levelText);
        container.appendChild(xpBarBg);

        document.body.appendChild(container);
        return container;
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

    updateXP(xp: number, level: number): void {
        const levelText = document.getElementById('xp-level')!;
        const xpFill = document.getElementById('xp-fill')!;
        const xpText = document.getElementById('xp-text')!;

        // Update level display
        levelText.textContent = `Level ${level}`;

        // Calculate XP progress within current level
        const xpInCurrentLevel = xp % 100;
        const xpNeededForNextLevel = 100;
        const progressPercent = (xpInCurrentLevel / xpNeededForNextLevel) * 100;

        // Update progress bar
        xpFill.style.width = `${progressPercent}%`;
        xpText.textContent = `${xpInCurrentLevel} / ${xpNeededForNextLevel}`;
    }

    private createLeaderboard(): HTMLElement {
        const container = document.createElement('div');
        container.id = 'leaderboard';
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.85);
            color: white;
            padding: 10px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
            z-index: 100;
            border: 2px solid rgba(255, 215, 0, 0.6);
            display: none;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
            cursor: pointer;
            transition: all 0.2s ease;
        `;

        // Title with toggle indicator
        const title = document.createElement('div');
        title.id = 'leaderboard-title';
        title.style.cssText = `
            font-size: 13px;
            font-weight: bold;
            color: #FFD700;
            display: flex;
            align-items: center;
            justify-content: space-between;
            user-select: none;
        `;
        title.innerHTML = '<span id="leaderboard-header">🏆 TOP PLAYER</span><span id="leaderboard-toggle">▼</span>';

        // Entries container
        const entriesContainer = document.createElement('div');
        entriesContainer.id = 'leaderboard-entries';
        entriesContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-top: 8px;
        `;

        // Add click handler for toggle
        let isExpanded = false;
        container.addEventListener('click', () => {
            isExpanded = !isExpanded;
            const toggle = document.getElementById('leaderboard-toggle');

            if (isExpanded) {
                entriesContainer.style.display = 'flex';
                if (toggle) toggle.textContent = '▲';
            } else {
                entriesContainer.style.display = 'none';
                if (toggle) toggle.textContent = '▼';
            }
        });

        container.appendChild(title);
        container.appendChild(entriesContainer);
        document.body.appendChild(container);

        // Start minimized
        entriesContainer.style.display = 'none';

        return container;
    }

    updateLeaderboard(players: Array<{ id: number; username: string; xp: number; level: number; dead: boolean; kills?: number }>): void {
        const entriesContainer = document.getElementById('leaderboard-entries');
        const headerElement = document.getElementById('leaderboard-header');
        if (!entriesContainer) return;

        // Sort players by XP (descending)
        const sorted = [...players].sort((a, b) => (b.xp || 0) - (a.xp || 0));

        // Update header with top player info
        if (sorted.length > 0 && headerElement) {
            const topPlayer = sorted[0];
            const killsText = (topPlayer.kills !== undefined && topPlayer.kills > 0) ? ` ${topPlayer.kills}💀` : '';
            headerElement.innerHTML = `👑 ${topPlayer.username}${killsText} - ${topPlayer.xp}xp`;
        } else if (headerElement) {
            headerElement.textContent = '🏆 TOP PLAYER';
        }

        // Clear existing entries
        entriesContainer.innerHTML = '';

        // Helper function to create player entry
        const createEntry = (player: any, index: number) => {
            const isTop3 = index < 3;
            const entry = document.createElement('div');

            // Different styling for top 3 vs rest
            const backgrounds = ['rgba(255, 215, 0, 0.2)', 'rgba(192, 192, 192, 0.15)', 'rgba(205, 127, 50, 0.15)'];
            const borders = ['rgba(255, 215, 0, 0.5)', 'rgba(192, 192, 192, 0.4)', 'rgba(205, 127, 50, 0.4)'];

            entry.style.cssText = `
                padding: ${isTop3 ? '8px 10px' : '5px 8px'};
                background: ${isTop3 && index < 3 ? backgrounds[index] : 'rgba(255, 255, 255, 0.05)'};
                border-radius: 6px;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.3s ease;
                border: 1.5px solid ${isTop3 && index < 3 ? borders[index] : 'rgba(255, 255, 255, 0.1)'};
                ${player.dead ? 'opacity: 0.5;' : ''}
                ${isTop3 ? 'box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);' : ''}
            `;

            // Rank/Medal/Crown
            const rank = document.createElement('span');
            const medals = ['👑', '🥈', '🥉'];
            rank.style.cssText = `
                font-size: ${isTop3 ? '18px' : '12px'};
                font-weight: bold;
                min-width: ${isTop3 ? '28px' : '22px'};
                text-align: center;
            `;
            rank.textContent = index < 3 ? medals[index] : `#${index + 1}`;

            // Player name with kills
            const name = document.createElement('span');
            name.style.cssText = `
                flex: 1;
                font-weight: ${isTop3 ? 'bold' : 'normal'};
                color: ${index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#FFFFFF'};
                font-size: ${isTop3 ? '13px' : '11px'};
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            `;
            const killsText = (player.kills !== undefined && player.kills > 0) ? ` (${player.kills}💀)` : '';
            name.textContent = player.username + killsText + (player.dead ? ' ☠️' : '');

            // XP display
            const xp = document.createElement('span');
            xp.style.cssText = `
                font-weight: bold;
                color: ${index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#87CEEB'};
                font-size: ${isTop3 ? '11px' : '10px'};
                background: rgba(0, 0, 0, 0.4);
                padding: 2px 5px;
                border-radius: 3px;
                min-width: 45px;
                text-align: center;
            `;
            xp.textContent = `${player.xp || 0}`;

            entry.appendChild(rank);
            entry.appendChild(name);
            entry.appendChild(xp);

            return entry;
        };

        // Populate all players in single scrollable container
        sorted.forEach((player, index) => {
            entriesContainer.appendChild(createEntry(player, index));
        });
    }

    showLeaderboard(): void {
        this.leaderboard.style.display = 'block';
    }

    hideLeaderboard(): void {
        this.leaderboard.style.display = 'none';
    }
}
