# Challenge System Implementation Guide

## Overview
A complete challenge-based learning system where users drag and drop blocks to create AI agents that must complete specific objectives (like crossing terrain and collecting items).

---

## Architecture

### Backend (`backend/`)

#### 1. **Challenge Schema** ([challenges.py](backend/challenges.py))

**Core Models:**
- `Challenge`: Complete challenge definition with objectives, constraints, and rewards
- `Objective`: Specific goals (reach zone, collect item, defeat enemy, etc.)
- `BlockConstraint`: Limits on which blocks can be used
- `WinCondition`: Criteria for completing the challenge

**Challenge Registry:**
```python
CHALLENGES = {
    "challenge_001_collect_item": CHALLENGE_COLLECT_ITEM,
    # Add more challenges here...
}
```

**First Challenge: "Cross the Terrain and Collect the Item"**
- **Objective 1**: Reach goal zone at (50, 0) within 15 units
- **Objective 2**: Collect the health pack using the `collect` tool
- **Allowed Blocks**: move, collect, plan
- **Max Blocks**: 10
- **Time Limit**: 120 seconds
- **Difficulty**: Easy

#### 2. **Challenge Endpoints** ([main.py](backend/main.py) lines 779-959)

**GET `/challenges`**
- Returns list of all available challenges
- Includes objectives, constraints, difficulty, time limits

**GET `/challenges/{challenge_id}`**
- Returns detailed info for a specific challenge
- Includes map objects, spawn position, hints

**POST `/check-challenge-progress`**
- Checks agent progress in real-time
- Updates objectives completed
- Checks win/fail conditions
- Returns completion status

**Helper Functions:**
- `check_objective_completion()`: Validates if specific objective is met
- `check_win_condition()`: Determines if challenge is complete
- `validate_blocks_for_challenge()`: Validates blocks against constraints

#### 3. **Modified Agent Deployment** ([main.py](backend/main.py) lines 962-1058)

**POST `/add-agent`** (Enhanced)
- Accepts `challenge_id` parameter
- Validates blocks against challenge constraints before deployment
- Initializes `ChallengeState` for tracking progress
- Returns validation errors if blocks don't meet requirements

**Challenge State Tracking:**
```python
class ChallengeState(BaseModel):
    challenge_id: str
    agent_id: str
    start_time: float
    objectives_completed: List[str]
    is_completed: bool
    is_failed: bool
    elapsed_time: float
    item_collected: bool
```

#### 4. **Progress Integration** ([main.py](backend/main.py) lines 1569-1580)

**In `/next-step-for-agents`:**
- After each agent step, automatically checks challenge progress
- Logs when objectives are completed
- Logs when challenge is won

---

### Frontend (`frontend/src/app/builder/page.jsx`)

#### 1. **Challenge State Management** (Lines 96-102)

```javascript
const [challengeId, setChallengeId] = useState(null);
const [challenge, setChallenge] = useState(null);
const [validationErrors, setValidationErrors] = useState([]);
const [showHints, setShowHints] = useState(false);
const [challengeProgress, setChallengeProgress] = useState(null);
const [showCompletionModal, setShowCompletionModal] = useState(false);
```

#### 2. **URL Parameter Handling** (Lines 133-157)

- Checks for `?challenge=challenge_001_collect_item` in URL
- Auto-loads challenge data from backend
- Fetches challenge objectives, constraints, hints

#### 3. **Block Validation** (Lines 738-786)

**`validateBlocks()` Function:**
- Checks allowed blocks
- Validates max block count
- Ensures required blocks are present
- Checks for forbidden blocks
- Updates UI with validation errors

#### 4. **Deployment with Challenge** (Lines 822-906)

**Modified `handleDeploy()`:**
- Runs validation before deployment
- Includes `challenge_id` in payload
- Shows error toast if validation fails
- Deploys to backend with challenge context

#### 5. **Progress Polling** (Lines 788-820)

**useEffect Hook:**
- Polls `/check-challenge-progress` every 1 second
- Updates progress display in real-time
- Shows completion modal when challenge is won
- Tracks elapsed time and objectives completed

#### 6. **Challenge Banner UI** (Lines 929-1022)

**Banner Components:**
- **Title & Difficulty Badge**: Shows challenge name and difficulty
- **Description**: Explains the challenge goal
- **Objectives List**: Shows each objective with checkmarks when completed
- **Progress Tracker**: Displays objectives completed and elapsed time
- **Constraints Display**: Shows allowed blocks and limits
- **Validation Errors**: Red box showing any block validation errors
- **Hints Toggle**: Button to show/hide hints
- **Hints Panel**: Expandable section with helpful tips

#### 7. **Completion Modal** (Lines 1024-1053)

**Success Modal:**
- Appears when challenge is completed
- Shows completion time
- Offers "Continue Building" option
- Shows "Next Challenge" button if available
- Green themed with celebration emoji

---

## User Workflow

### Step 1: Access Challenge
```
Navigate to: http://localhost:3001/builder?challenge=challenge_001_collect_item
```

### Step 2: View Challenge Info
- Challenge banner appears at top
- Shows objectives:
  - ○ Reach the goal zone on the other side
  - ○ Collect the health pack
- Shows constraints:
  - Allowed: move, collect, plan
  - Max: 10 blocks

### Step 3: Build Agent
1. Drag **On Start** action block to canvas
2. Drag **Agent** block and connect to On Start
3. Configure Agent:
   - Model: GPT-4o Mini
   - System Prompt: "You are a resourceful explorer..."
   - User Prompt: "Move toward (50, 0) and collect items..."
4. Drag **Move** tool and connect to Agent
5. Drag **Collect** tool and connect to Agent
6. Connect Move and Collect back to Agent (creates loop)

### Step 4: Deploy
- Click "DEPLOY AGENT" button
- Backend validates blocks
- If valid: Agent deploys successfully
- If invalid: Error toast shows validation failures

### Step 5: Watch Execution
- Agent spawns in game at (-50, 0)
- LLM decides to move toward goal
- Progress updates in real-time:
  - Time: 10.5s / 120s
  - Progress: 1/2 objectives (reached zone)
- Agent uses collect tool near item
- Progress updates: 2/2 objectives complete!

### Step 6: Challenge Complete
- 🎉 Completion modal appears
- Shows final time: 15.23s
- Options:
  - "Continue Building" - keep editing
  - "Next Challenge →" - move to next challenge

---

## How to Add New Challenges

### 1. Define Challenge in `challenges.py`

```python
CHALLENGE_NEW = Challenge(
    id="challenge_002_combat",
    title="Defeat the Enemy Bot",
    description="Use combat strategies to defeat an enemy agent",
    difficulty="medium",
    challenge_type=ChallengeType.COMBAT,

    map_objects=[
        MapObject(
            type="enemy",
            position={"x": 30, "y": 0},
            properties={"health": 100, "weapon": "pistol"}
        )
    ],

    spawn_position={"x": -30, "y": 0},
    map_bounds={"min_x": -50, "max_x": 50, "min_y": -30, "max_y": 30},

    objectives=[
        Objective(
            id="obj_defeat_enemy",
            type=ObjectiveType.DEFEAT_ENEMY,
            description="Defeat the enemy bot",
            target={"enemy_id": "enemy_bot_001"},
            required=True,
            reward_xp=200
        )
    ],

    win_condition=WinCondition(
        type="all_objectives",
        objectives=["obj_defeat_enemy"],
        time_limit=180.0
    ),

    block_constraints=BlockConstraint(
        allowed_blocks=["move", "attack", "plan"],
        max_blocks=8,
        required_blocks=["attack"]
    ),

    hints=[
        "The enemy has 100 health",
        "Use the attack tool to deal damage",
        "Move strategically to avoid taking damage"
    ],

    tutorial_text="Connect attack tool to your agent...",

    next_challenge_id="challenge_003_advanced",
    prerequisite_challenges=["challenge_001_collect_item"]
)

# Add to registry
CHALLENGES["challenge_002_combat"] = CHALLENGE_NEW
```

### 2. Implement Objective Checker (if custom)

If you have a new objective type, add logic in `check_objective_completion()`:

```python
elif objective.type == ObjectiveType.DEFEAT_ENEMY:
    kills = game_state.get("kills", [])
    target_enemy = objective.target["enemy_id"]
    return target_enemy in kills
```

### 3. Test Your Challenge

1. Navigate to: `http://localhost:3001/builder?challenge=challenge_002_combat`
2. Verify:
   - Challenge info displays correctly
   - Block constraints work
   - Objectives track properly
   - Completion modal appears

---

## Key Features

### ✅ Real-Time Validation
- Validates blocks before deployment
- Shows clear error messages
- Prevents invalid agent configurations

### ✅ Live Progress Tracking
- Updates objectives in real-time
- Shows elapsed time
- Checkmarks appear as objectives complete

### ✅ Educational Scaffolding
- Hints system for struggling users
- Tutorial text for guidance
- Progressive difficulty levels

### ✅ Flexible Constraints
- Limit which tools can be used
- Set maximum block counts
- Require specific tools
- Forbid certain actions

### ✅ Multiple Objective Types
- **REACH_ZONE**: Get to a specific location
- **COLLECT_ITEM**: Pick up an item
- **DEFEAT_ENEMY**: Eliminate a target
- **AVOID_DAMAGE**: Stay above health threshold
- **USE_TOOL**: Use a specific action N times
- **SEQUENCE_ACTIONS**: Perform actions in order

### ✅ Scalable Architecture
- Easy to add new challenges
- Modular objective system
- Reusable validation logic
- Challenge progression system

---

## Testing the System

### Manual Testing Steps

1. **Start Backend:**
   ```bash
   cd backend
   # Start with poetry/uvicorn
   uvicorn main:app --reload --port 8001
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Start Game Environment:**
   ```bash
   cd game_environment/client
   npm run dev
   ```

4. **Test Challenge Flow:**
   - Go to: http://localhost:3001/builder?challenge=challenge_001_collect_item
   - Verify challenge banner appears
   - Build agent with move + collect
   - Deploy and watch execution
   - Verify objectives complete
   - Verify completion modal appears

### Test Validation

1. **Test with forbidden block (attack):**
   - Add attack tool
   - Try to deploy
   - Should show error: "These tools are not allowed: attack"

2. **Test missing required block (collect):**
   - Don't add collect tool
   - Try to deploy
   - Should show error: "Missing required tools: collect"

3. **Test too many blocks:**
   - Add 15 blocks
   - Try to deploy
   - Should show error: "Too many blocks! Maximum: 10"

---

## File Changes Summary

### Created Files:
- `backend/challenges.py` - Challenge schema and first challenge
- `backend/test_challenges.py` - Test script for validation
- `CHALLENGE_SYSTEM_GUIDE.md` - This guide

### Modified Files:
- `backend/main.py`:
  - Added challenge imports (lines 14-23)
  - Added ChallengeState model (lines 403-414)
  - Added challenge_states dict (line 417)
  - Added challenge endpoints (lines 779-959)
  - Enhanced `/add-agent` with validation (lines 795-815, 850-857)
  - Added progress checking to `/next-step-for-agents` (lines 1569-1580)
  - Added challenge_id to AgentState (line 326)
  - Added challenge_id to AddAgentRequest (line 297)

- `frontend/src/app/builder/page.jsx`:
  - Added challenge state variables (lines 96-102)
  - Added URL parameter detection (lines 136-142)
  - Added fetchChallenge function (lines 721-736)
  - Added validateBlocks function (lines 738-786)
  - Added progress polling useEffect (lines 788-820)
  - Enhanced handleDeploy with validation (lines 836-843, 890)
  - Added challenge banner UI (lines 929-1022)
  - Added completion modal (lines 1024-1053)
  - Restructured layout with wrapper div (line 928, 1939)

---

## Future Enhancements

### Possible Additions:
1. **Challenge Selection Screen**: Grid of all available challenges
2. **User Progress Tracking**: Store completion times and attempts
3. **Leaderboards**: Compare times with other users
4. **Achievements**: Unlock badges for completing challenges
5. **Custom Map Editor**: Let users create their own challenges
6. **Multiplayer Challenges**: Race against other players
7. **Adaptive Difficulty**: Adjust based on user performance
8. **Video Replays**: Record and replay challenge attempts

---

## Conclusion

The challenge system is now **fully implemented and ready to use**. Users can:
1. Load challenges via URL parameters
2. See objectives and constraints clearly
3. Build agents with real-time validation
4. Deploy and watch progress live
5. Receive success notifications when complete

The system is **scalable** and **extensible** - just add new challenges to `challenges.py` and they'll work automatically with the existing UI and validation logic.

To test immediately:
```
http://localhost:3001/builder?challenge=challenge_001_collect_item
```

Build an agent with move + collect tools, deploy it, and watch it complete the challenge! 🎉
