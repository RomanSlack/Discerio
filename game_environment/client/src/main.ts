import { GameClient } from "./game";

const gameClient = new GameClient();
let connected = false;

async function init() {
    await gameClient.init();

    const menu = document.getElementById('menu')!;
    const playButton = document.getElementById('play-button')!;
    const spectateButton = document.getElementById('spectate-button')!;
    const usernameInput = document.getElementById('username-input')! as HTMLInputElement;
    const respawnButton = document.getElementById('respawn-button')!;

    playButton.addEventListener('click', async () => {
        if (connected) return;

        const username = usernameInput.value.trim() || 'Player';
        playButton.textContent = 'Connecting...';
        playButton.disabled = true;
        spectateButton.disabled = true;

        try {
            await gameClient.connect(username, false); // Not a spectator
            menu.classList.remove('visible');
            connected = true;
        } catch (error) {
            console.error('Failed to connect:', error);
            playButton.textContent = 'Connection Failed - Retry';
            playButton.disabled = false;
            spectateButton.disabled = false;
        }
    });

    spectateButton.addEventListener('click', async () => {
        if (connected) return;

        const username = usernameInput.value.trim() || 'Spectator';
        spectateButton.textContent = 'Connecting...';
        spectateButton.disabled = true;
        playButton.disabled = true;

        try {
            await gameClient.connect(username, true); // Join as spectator
            menu.classList.remove('visible');
            connected = true;
        } catch (error) {
            console.error('Failed to connect:', error);
            spectateButton.textContent = 'Connection Failed - Retry';
            spectateButton.disabled = false;
            playButton.disabled = false;
        }
    });

    respawnButton.addEventListener('click', () => {
        window.location.reload();
    });

    // Allow Enter key to play
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            playButton.click();
        }
    });
}

init();
