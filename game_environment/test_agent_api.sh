#!/bin/bash

# Test script for AI Agent API
# Make sure the game server is running first: bun dev:server

BASE_URL="http://localhost:8000"

echo "========================================="
echo "Testing AI Agent API"
echo "========================================="
echo ""

# Test 1: Check server status
echo "1. Checking server status..."
curl -s -X GET "$BASE_URL/api/status" | jq '.'
echo ""
echo ""

# Test 2: Register first agent
echo "2. Registering agent 'bot_001'..."
curl -s -X POST "$BASE_URL/api/agent/register" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "bot_001",
    "username": "Test Bot 1"
  }' | jq '.'
echo ""
echo ""

# Test 3: Register second agent
echo "3. Registering agent 'bot_002'..."
curl -s -X POST "$BASE_URL/api/agent/register" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "bot_002",
    "username": "Test Bot 2"
  }' | jq '.'
echo ""
echo ""

# Test 4: Get agent state
echo "4. Getting state for bot_001..."
curl -s -X GET "$BASE_URL/api/agent/state/bot_001" | jq '.'
echo ""
echo ""

# Test 5: Move bot_001 forward
echo "5. Moving bot_001 forward (x: 20, y: 0)..."
curl -s -X POST "$BASE_URL/api/agent/command" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "bot_001",
    "action": {
      "tool_type": "move",
      "parameters": {
        "x": 20,
        "y": 0
      }
    }
  }' | jq '.game_state.position'
echo ""
echo ""

sleep 1

# Test 6: Move bot_001 to the right
echo "6. Moving bot_001 to the right (x: 0, y: 15)..."
curl -s -X POST "$BASE_URL/api/agent/command" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "bot_001",
    "action": {
      "tool_type": "move",
      "parameters": {
        "x": 0,
        "y": 15
      }
    }
  }' | jq '.game_state.position'
echo ""
echo ""

sleep 1

# Test 7: Collect items
echo "7. Attempting to collect nearby items..."
curl -s -X POST "$BASE_URL/api/agent/command" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "bot_001",
    "action": {
      "tool_type": "collect",
      "parameters": {}
    }
  }' | jq '.game_state.inventory'
echo ""
echo ""

# Test 8: Get nearby agents
echo "8. Checking for nearby agents..."
curl -s -X GET "$BASE_URL/api/agent/state/bot_001" | jq '.game_state.nearby_agents'
echo ""
echo ""

# Test 9: Attack another agent (if visible)
echo "9. Attempting to attack bot_002..."
curl -s -X POST "$BASE_URL/api/agent/command" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "bot_001",
    "action": {
      "tool_type": "attack",
      "parameters": {
        "target_player_id": "bot_002"
      }
    }
  }' | jq '.action_received'
echo ""
echo ""

# Test 10: Plan action
echo "10. Setting a plan for bot_001..."
curl -s -X POST "$BASE_URL/api/agent/command" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "bot_001",
    "action": {
      "tool_type": "plan",
      "parameters": {
        "plan": "Explore the map and collect weapons"
      }
    }
  }' | jq '.success'
echo ""
echo ""

# Test 11: Check server status again
echo "11. Checking server status (should show 2 AI agents)..."
curl -s -X GET "$BASE_URL/api/status" | jq '.'
echo ""
echo ""

# Test 12: Remove agents
echo "12. Removing bot_001..."
curl -s -X DELETE "$BASE_URL/api/agent/bot_001" | jq '.'
echo ""
echo ""

echo "13. Removing bot_002..."
curl -s -X DELETE "$BASE_URL/api/agent/bot_002" | jq '.'
echo ""
echo ""

# Test 13: Final status check
echo "14. Final status check (should show 0 AI agents)..."
curl -s -X GET "$BASE_URL/api/status" | jq '.'
echo ""
echo ""

echo "========================================="
echo "All tests completed!"
echo "========================================="
