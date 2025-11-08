# AI Agent Test UI

Simple Flask web interface to test AI agent control commands.

## Quick Start

**1. Make sure the game server is running:**
```bash
cd ../game_environment
bun dev:server
```

**2. Install Flask dependencies:**
```bash
pip install flask requests
# OR
pip install -r test_ui_requirements.txt
```

**3. Run the test UI:**
```bash
python test_ui.py
```

**4. Open in browser:**
```
http://localhost:5000
```

## Features

- ✅ Real-time server status monitoring
- ✅ Register new AI agents
- ✅ Move agents with relative coordinates
- ✅ Attack other players/agents
- ✅ Collect nearby items
- ✅ Get detailed agent state
- ✅ Remove agents
- ✅ Beautiful gradient UI
- ✅ JSON response viewer

## Usage

1. **Register Agent:** Create a new AI agent with a unique ID
2. **Move Agent:** Send movement commands (relative x, y coordinates)
3. **Attack Target:** Make agent attack another player/agent by ID
4. **Collect Items:** Pick up nearby weapons and ammo
5. **Get State:** View complete game state for an agent
6. **Remove Agent:** Delete an agent from the game

## Tips

- Agent IDs must be unique (e.g., "bot_001", "bot_002")
- Movement coordinates are relative (x: 20 means move 20 units right)
- Target IDs can be other agent IDs or "player_N" for human players
- Collect works within 5-unit radius
- All responses show in formatted JSON

## Visual Testing

Open the game client to see agents move:
```bash
cd ../game_environment
bun dev:client
# Open http://localhost:3000
```

You'll see AI agents as players in the game!
