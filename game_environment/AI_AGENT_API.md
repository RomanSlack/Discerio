# AI Agent API Documentation

Complete API reference for controlling AI agents programmatically in the game environment.

## Base URL

```
http://localhost:8000/api/agent
```

## Endpoints

### 1. Register New Agent

Register a new AI agent in the game. The agent will spawn at a random location with a starter pistol and ammo.

**Endpoint:** `POST /api/agent/register`

**Request Body:**
```json
{
  "agent_id": "player_123",
  "username": "AI Bot 1" // optional
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "agent_id": "player_123",
  "position": { "x": 100.5, "y": 200.3 },
  "game_state": {
    "position": { "x": 100.5, "y": 200.3 },
    "health": 100,
    "max_health": 100,
    "inventory": ["pistol"],
    "ammo": { "9mm": 45, "556mm": 0, "12g": 0 },
    "nearby_agents": [],
    "nearby_loot": [],
    "nearby_obstacles": []
  }
}
```

**Error Responses:**
- `400 Bad Request` - Missing agent_id
- `409 Conflict` - Agent with this ID already exists
- `500 Internal Server Error` - Failed to register agent

---

### 2. Send Command to Agent

Send an action command to an agent. The command will be translated to game inputs and executed in the next tick.

**Endpoint:** `POST /api/agent/command`

**Request Body:**
```json
{
  "agent_id": "player_123",
  "action": {
    "tool_type": "move",
    "parameters": {
      "x": 10,
      "y": -5
    }
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "agent_id": "player_123",
  "action_received": "move",
  "game_state": {
    "position": { "x": 110.5, "y": 195.3 },
    "health": 100,
    "max_health": 100,
    "inventory": ["pistol", "rifle"],
    "ammo": { "9mm": 30, "556mm": 60, "12g": 0 },
    "nearby_agents": [
      {
        "id": "player_456",
        "position": { "x": 130.0, "y": 200.0 },
        "distance": 20.5,
        "health": 85,
        "username": "Enemy Player"
      }
    ],
    "nearby_loot": [
      {
        "type": "shotgun",
        "position": { "x": 115.0, "y": 190.0 },
        "distance": 7.2
      }
    ],
    "nearby_obstacles": [
      {
        "type": "tree",
        "position": { "x": 120.0, "y": 195.0 },
        "distance": 9.5,
        "health": 100
      }
    ]
  }
}
```

**Error Responses:**
- `400 Bad Request` - Missing agent_id or action
- `404 Not Found` - Agent not found
- `500 Internal Server Error` - Failed to process command

---

### 3. Get Agent State

Get the current game state for a specific agent without sending a command.

**Endpoint:** `GET /api/agent/state/:agent_id`

**Response (200 OK):**
```json
{
  "success": true,
  "agent_id": "player_123",
  "game_state": {
    "position": { "x": 110.5, "y": 195.3 },
    "health": 100,
    "max_health": 100,
    "inventory": ["pistol"],
    "ammo": { "9mm": 45, "556mm": 0, "12g": 0 },
    "nearby_agents": [],
    "nearby_loot": [],
    "nearby_obstacles": []
  }
}
```

**Error Responses:**
- `400 Bad Request` - Missing agent_id
- `404 Not Found` - Agent not found

---

### 4. Remove Agent

Remove an AI agent from the game.

**Endpoint:** `DELETE /api/agent/:agent_id`

**Response (200 OK):**
```json
{
  "success": true,
  "agent_id": "player_123",
  "message": "Agent player_123 removed successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Missing agent_id
- `404 Not Found` - Agent not found

---

### 5. Server Status

Get current server status including number of players and AI agents.

**Endpoint:** `GET /api/status`

**Response (200 OK):**
```json
{
  "online": true,
  "players": 3,
  "aiAgents": 5,
  "uptime": 3600.5,
  "timestamp": 1699564800000
}
```

---

## Action Types

### Move Action

Move the agent by relative coordinates.

```json
{
  "tool_type": "move",
  "parameters": {
    "x": 10,    // relative X movement
    "y": -5     // relative Y movement
  }
}
```

**Behavior:**
- Agent will move toward the target position (current position + relative offset)
- Movement is continuous until a new command is sent
- Agent will stop when reaching the target or if collision occurs

---

### Attack Action

Attack a specific target player or agent.

```json
{
  "tool_type": "attack",
  "parameters": {
    "target_player_id": "player_456"  // Can be agent_id or player_id
  }
}
```

**Behavior:**
- Agent will aim at the target and shoot
- Shooting is continuous until a new command is sent
- If target is not found, command is ignored

**Target ID formats:**
- For AI agents: Use the `agent_id` (e.g., "player_123")
- For human players: Use "player_N" where N is the player's numeric ID

---

### Collect Action

Collect nearby items (weapons, ammo).

```json
{
  "tool_type": "collect",
  "parameters": {}
}
```

**Behavior:**
- Picks up items within 5-unit radius
- Weapons replace current weapon if inventory is full
- Ammo is added to the agent's ammo pool

---

### Plan Action

Store a strategic plan (for backend use, doesn't affect game state).

```json
{
  "tool_type": "plan",
  "parameters": {
    "plan": "Move to high ground and collect weapons"
  }
}
```

**Behavior:**
- Plan is stored in agent's command state
- Doesn't directly affect game behavior
- Useful for backend planning/reasoning systems

---

## Game State Reference

### Position
```json
"position": { "x": 110.5, "y": 195.3 }
```
- Current agent position on the map
- Map size: 512x512 units

### Health
```json
"health": 85,
"max_health": 100
```
- Current health (0-100)
- Agent dies when health reaches 0

### Inventory
```json
"inventory": ["pistol", "rifle"]
```
- Array of weapon IDs currently equipped
- Maximum 2 weapons
- Can be empty

### Ammo
```json
"ammo": {
  "9mm": 45,
  "556mm": 60,
  "12g": 8
}
```
- Ammo counts for each ammo type
- "9mm" - Pistol ammo
- "556mm" - Rifle ammo
- "12g" - Shotgun ammo

### Nearby Agents
```json
"nearby_agents": [
  {
    "id": "player_456",
    "position": { "x": 130.0, "y": 200.0 },
    "distance": 20.5,
    "health": 85,
    "username": "Enemy Player"
  }
]
```
- All agents (players and AI) within 100-unit radius
- Sorted by distance (closest first)
- Includes both human players and other AI agents

### Nearby Loot
```json
"nearby_loot": [
  {
    "type": "shotgun",
    "position": { "x": 115.0, "y": 190.0 },
    "distance": 7.2
  }
]
```
- All loot items within 100-unit radius
- Sorted by distance (closest first)
- Types: weapon names or "ammo_9mm", "ammo_556mm", "ammo_12g"

### Nearby Obstacles
```json
"nearby_obstacles": [
  {
    "type": "tree",
    "position": { "x": 120.0, "y": 195.0 },
    "distance": 9.5,
    "health": 100
  }
]
```
- All obstacles within 100-unit radius
- Sorted by distance (closest first)
- Types: "tree", "rock", "crate", "wall"
- Obstacles can be destroyed by shooting (except walls)

---

## Example Usage

### Python Example (with your backend)

```python
import requests

BASE_URL = "http://localhost:8000"

# 1. Register agent
response = requests.post(f"{BASE_URL}/api/agent/register", json={
    "agent_id": "bot_001",
    "username": "AI Agent 1"
})
data = response.json()
print(f"Agent spawned at: {data['position']}")

# 2. Move agent
response = requests.post(f"{BASE_URL}/api/agent/command", json={
    "agent_id": "bot_001",
    "action": {
        "tool_type": "move",
        "parameters": {"x": 20, "y": 10}
    }
})
game_state = response.json()["game_state"]

# 3. Check for nearby enemies
if game_state["nearby_agents"]:
    target = game_state["nearby_agents"][0]

    # 4. Attack nearest enemy
    response = requests.post(f"{BASE_URL}/api/agent/command", json={
        "agent_id": "bot_001",
        "action": {
            "tool_type": "attack",
            "parameters": {"target_player_id": target["id"]}
        }
    })

# 5. Collect nearby loot
response = requests.post(f"{BASE_URL}/api/agent/command", json={
    "agent_id": "bot_001",
    "action": {"tool_type": "collect", "parameters": {}}
})

# 6. Remove agent when done
requests.delete(f"{BASE_URL}/api/agent/bot_001")
```

---

## Integration with Backend API

Your backend (`/next-step-for-agents`) should:

1. **Call GET `/api/agent/state/:agent_id`** to get current game state
2. **Pass game state to LLM** for decision making
3. **LLM returns action** (tool_type + parameters)
4. **Call POST `/api/agent/command`** to execute the action
5. **Repeat** at desired frequency (recommended: 1-10 times per second)

**Example Flow:**
```
Backend ──┐
          │
          ├─> GET /api/agent/state/bot_001
          │   Returns: game_state
          │
          ├─> LLM decides: "move" action
          │
          └─> POST /api/agent/command
              Body: {agent_id: "bot_001", action: {tool_type: "move", ...}}
```

---

## Notes

- **Game runs at 40 TPS** (ticks per second)
- Commands are processed on the next tick
- Commands persist until a new command is sent
- Multiple agents can be controlled simultaneously
- Agent IDs must be unique
- Detection radius: 100 units
- Pickup radius: 5 units
- Map size: 512x512 units

---

## Testing

Start the game server:
```bash
cd game_environment
bun install
bun dev
```

Test with curl:
```bash
# Register agent
curl -X POST http://localhost:8000/api/agent/register \
  -H "Content-Type: application/json" \
  -d '{"agent_id": "test_bot", "username": "Test Bot"}'

# Move agent
curl -X POST http://localhost:8000/api/agent/command \
  -H "Content-Type: application/json" \
  -d '{"agent_id": "test_bot", "action": {"tool_type": "move", "parameters": {"x": 10, "y": 5}}}'

# Get state
curl http://localhost:8000/api/agent/state/test_bot

# Remove agent
curl -X DELETE http://localhost:8000/api/agent/test_bot
```
