"""
Quick test script to verify challenge system is working
"""

from challenges import CHALLENGES, get_challenge_by_id, validate_blocks_for_challenge

# Test 1: Get all challenges
print("=" * 60)
print("TEST 1: Get all challenges")
print("=" * 60)
for challenge_id, challenge in CHALLENGES.items():
    print(f"\nChallenge: {challenge.title}")
    print(f"  ID: {challenge.id}")
    print(f"  Difficulty: {challenge.difficulty}")
    print(f"  Objectives: {len(challenge.objectives)}")
    print(f"  Allowed blocks: {challenge.block_constraints.allowed_blocks}")
    print(f"  Max blocks: {challenge.block_constraints.max_blocks}")

# Test 2: Get specific challenge
print("\n" + "=" * 60)
print("TEST 2: Get specific challenge")
print("=" * 60)
challenge = get_challenge_by_id("challenge_001_collect_item")
if challenge:
    print(f"Found challenge: {challenge.title}")
    print(f"Description: {challenge.description}")
    print(f"\nObjectives:")
    for obj in challenge.objectives:
        print(f"  - {obj.description}")
    print(f"\nHints:")
    for hint in challenge.hints:
        print(f"  - {hint}")
else:
    print("Challenge not found!")

# Test 3: Validate blocks - VALID case
print("\n" + "=" * 60)
print("TEST 3: Validate blocks - VALID case")
print("=" * 60)
valid_blocks = [
    {"type": "action", "action_type": "onStart"},
    {"type": "agent", "model": "openai/gpt-4o-mini"},
    {"type": "tool", "tool_type": "move"},
    {"type": "tool", "tool_type": "collect"},
]
result = validate_blocks_for_challenge(valid_blocks, challenge)
print(f"Valid: {result['valid']}")
print(f"Errors: {result['errors']}")

# Test 4: Validate blocks - INVALID case (forbidden block)
print("\n" + "=" * 60)
print("TEST 4: Validate blocks - INVALID case (forbidden block)")
print("=" * 60)
invalid_blocks = [
    {"type": "action", "action_type": "onStart"},
    {"type": "agent", "model": "openai/gpt-4o-mini"},
    {"type": "tool", "tool_type": "move"},
    {"type": "tool", "tool_type": "attack"},  # Not allowed!
]
result = validate_blocks_for_challenge(invalid_blocks, challenge)
print(f"Valid: {result['valid']}")
print(f"Errors: {result['errors']}")

# Test 5: Validate blocks - INVALID case (missing required)
print("\n" + "=" * 60)
print("TEST 5: Validate blocks - INVALID case (missing required)")
print("=" * 60)
incomplete_blocks = [
    {"type": "action", "action_type": "onStart"},
    {"type": "agent", "model": "openai/gpt-4o-mini"},
    {"type": "tool", "tool_type": "move"},  # Missing collect!
]
result = validate_blocks_for_challenge(incomplete_blocks, challenge)
print(f"Valid: {result['valid']}")
print(f"Errors: {result['errors']}")

# Test 6: Validate blocks - INVALID case (too many blocks)
print("\n" + "=" * 60)
print("TEST 6: Validate blocks - INVALID case (too many blocks)")
print("=" * 60)
too_many_blocks = [{"type": "tool", "tool_type": "move"} for _ in range(15)]
result = validate_blocks_for_challenge(too_many_blocks, challenge)
print(f"Valid: {result['valid']}")
print(f"Errors: {result['errors']}")

print("\n" + "=" * 60)
print("ALL TESTS COMPLETED!")
print("=" * 60)
