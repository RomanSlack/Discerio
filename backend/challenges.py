"""
Challenge system for block builder AI agents.
Defines challenge schemas, objectives, and validation logic.
"""

from pydantic import BaseModel
from typing import List, Dict, Optional, Literal, Any
from enum import Enum


class ChallengeType(str, Enum):
    NAVIGATION = "navigation"
    COMBAT = "combat"
    COLLECTION = "collection"
    SURVIVAL = "survival"
    PUZZLE = "puzzle"


class ObjectiveType(str, Enum):
    REACH_ZONE = "reach_zone"
    COLLECT_ITEM = "collect_item"
    DEFEAT_ENEMY = "defeat_enemy"
    AVOID_DAMAGE = "avoid_damage"
    USE_TOOL = "use_tool"
    SEQUENCE_ACTIONS = "sequence_actions"


class MapObject(BaseModel):
    type: Literal["obstacle", "goal_zone", "collectible", "enemy", "log", "item"]
    position: Dict[str, float]  # {x, y}
    properties: Dict[str, Any] = {}


class Objective(BaseModel):
    id: str
    type: ObjectiveType
    description: str
    target: Optional[Dict[str, Any]] = None
    required: bool = True
    reward_xp: int = 0


class BlockConstraint(BaseModel):
    allowed_blocks: Optional[List[str]] = None
    max_blocks: Optional[int] = None
    required_blocks: Optional[List[str]] = None
    forbidden_blocks: Optional[List[str]] = None


class WinCondition(BaseModel):
    type: Literal["all_objectives", "any_objective", "custom"]
    objectives: List[str]
    time_limit: Optional[float] = None
    custom_validator: Optional[str] = None


class Challenge(BaseModel):
    id: str
    title: str
    description: str
    difficulty: Literal["easy", "medium", "hard"]
    challenge_type: ChallengeType

    # Map setup
    map_objects: List[MapObject]
    spawn_position: Dict[str, float]
    map_bounds: Dict[str, float]

    # Objectives
    objectives: List[Objective]
    win_condition: WinCondition

    # Constraints
    block_constraints: BlockConstraint

    # Hints
    hints: List[str] = []
    tutorial_text: Optional[str] = None

    # Progression
    next_challenge_id: Optional[str] = None
    prerequisite_challenges: List[str] = []


# ============================================================================
# CHALLENGE 1: Cross Terrain and Collect Item
# ============================================================================

CHALLENGE_COLLECT_ITEM = Challenge(
    id="challenge_001_collect_item",
    title="Cross the Terrain and Collect the Item",
    description="Navigate your agent across the blocked terrain to reach and collect the health pack on the other side. Use the log bridge to cross safely.",
    difficulty="easy",
    challenge_type=ChallengeType.COLLECTION,

    map_objects=[
        # Blocked terrain (walls) - creates a gap
        MapObject(
            type="obstacle",
            position={"x": 0, "y": -25},
            properties={"width": 100, "height": 10, "destructible": False, "type": "wall"}
        ),
        MapObject(
            type="obstacle",
            position={"x": 0, "y": 25},
            properties={"width": 100, "height": 10, "destructible": False, "type": "wall"}
        ),
        # Log bridge in the middle
        MapObject(
            type="log",
            position={"x": 0, "y": 0},
            properties={"width": 20, "height": 4, "is_bridge": True, "type": "log"}
        ),
        # Health pack to collect on the other side
        MapObject(
            type="item",
            position={"x": 50, "y": 0},
            properties={"item_type": "health_pack", "radius": 5}
        ),
        # Goal zone around the item
        MapObject(
            type="goal_zone",
            position={"x": 50, "y": 0},
            properties={"radius": 15, "color": "green"}
        )
    ],

    spawn_position={"x": -50, "y": 0},
    map_bounds={"min_x": -70, "max_x": 70, "min_y": -40, "max_y": 40},

    objectives=[
        Objective(
            id="obj_reach_goal",
            type=ObjectiveType.REACH_ZONE,
            description="Reach the goal zone on the other side (within 15 units of x=50, y=0)",
            target={"x": 50, "y": 0, "radius": 15},
            required=True,
            reward_xp=50
        ),
        Objective(
            id="obj_collect_item",
            type=ObjectiveType.COLLECT_ITEM,
            description="Collect the health pack",
            target={"item_position": {"x": 50, "y": 0}, "collection_radius": 15},
            required=True,
            reward_xp=50
        )
    ],

    win_condition=WinCondition(
        type="all_objectives",
        objectives=["obj_reach_goal", "obj_collect_item"],
        time_limit=120.0  # 2 minutes
    ),

    block_constraints=BlockConstraint(
        allowed_blocks=["move", "collect", "plan"],
        max_blocks=10,
        required_blocks=["move", "collect"]
    ),

    hints=[
        "The terrain is blocked above and below the log bridge.",
        "You need to navigate through the middle path where the log is located.",
        "Use the 'move' tool to position your agent toward x=50, y=0.",
        "Once near the health pack (within 15 units), use the 'collect' tool to pick it up.",
        "The agent must be close to the item (within 15 units) to collect it."
    ],

    tutorial_text=(
        "1. Connect an 'onStart' action block to an 'Agent' block.\n"
        "2. Connect the Agent to a 'Move' tool and a 'Collect' tool.\n"
        "3. Configure the agent's prompts to navigate toward (50, 0) and collect nearby items.\n"
        "4. Example system prompt: 'You are a resourceful explorer. Navigate to the goal and collect items.'\n"
        "5. Example user prompt: 'Move toward the goal at (50, 0) and collect any nearby items when close.'"
    ),

    next_challenge_id=None,  # Can add more challenges later
    prerequisite_challenges=[]
)


# ============================================================================
# Challenge Registry
# ============================================================================

CHALLENGES: Dict[str, Challenge] = {
    "challenge_001_collect_item": CHALLENGE_COLLECT_ITEM,
}


# ============================================================================
# Helper Functions
# ============================================================================

def get_challenge_by_id(challenge_id: str) -> Optional[Challenge]:
    """Get a challenge by its ID"""
    return CHALLENGES.get(challenge_id)


def get_all_challenges() -> List[Challenge]:
    """Get all available challenges"""
    return list(CHALLENGES.values())


def validate_blocks_for_challenge(blocks: List[Dict], challenge: Challenge) -> Dict[str, Any]:
    """
    Validate that blocks meet challenge constraints.

    Returns:
        Dict with 'valid' (bool) and 'errors' (list of strings)
    """
    errors = []
    constraints = challenge.block_constraints

    tool_blocks = [b for b in blocks if b.get("type") == "tool"]
    tool_types = [b.get("tool_type") for b in tool_blocks]

    # Check allowed blocks
    if constraints.allowed_blocks:
        invalid = [t for t in tool_types if t not in constraints.allowed_blocks]
        if invalid:
            errors.append(f"These tools are not allowed in this challenge: {', '.join(invalid)}")

    # Check max blocks
    if constraints.max_blocks and len(blocks) > constraints.max_blocks:
        errors.append(f"Too many blocks! Maximum allowed: {constraints.max_blocks}, you have: {len(blocks)}")

    # Check required blocks
    if constraints.required_blocks:
        missing = [t for t in constraints.required_blocks if t not in tool_types]
        if missing:
            errors.append(f"Missing required tools: {', '.join(missing)}")

    # Check forbidden blocks
    if constraints.forbidden_blocks:
        forbidden_used = [t for t in tool_types if t in constraints.forbidden_blocks]
        if forbidden_used:
            errors.append(f"These tools are forbidden in this challenge: {', '.join(forbidden_used)}")

    return {"valid": len(errors) == 0, "errors": errors}
