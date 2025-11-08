/**
 * Predefined Challenges for Agent Builder
 * Code.org / Minecraft Education style challenges
 */

export const challenges = [
  {
    id: 'challenge-1',
    title: '🎯 First Steps',
    difficulty: 'Beginner',
    description: 'Help your agent reach the goal. Start simple!',
    hint: 'Use SENSE to see, PLAN to think, and ACT to move',

    // Initial setup
    startPosition: { x: 10, y: 50 },
    goal: { x: 85, y: 50 },
    obstacles: [],
    items: [],

    // Success criteria
    successCriteria: {
      reachGoal: true,
      useBlocks: ['SENSE', 'PLAN', 'ACT'],
      collectAllItems: false,
      noCollisions: false
    },

    // Recommended blocks
    recommendedBlocks: ['SENSE', 'PLAN', 'ACT'],
    maxBlocks: 10
  },

  {
    id: 'challenge-2',
    title: '🚧 Navigate Obstacles',
    difficulty: 'Beginner',
    description: 'Your agent must avoid obstacles to reach the goal',
    hint: 'SENSE will help detect obstacles before moving',

    startPosition: { x: 10, y: 50 },
    goal: { x: 85, y: 50 },
    obstacles: [
      { x: 35, y: 40, width: 8, height: 25 },
      { x: 60, y: 35, width: 8, height: 30 }
    ],
    items: [],

    successCriteria: {
      reachGoal: true,
      useBlocks: ['SENSE', 'ACT'],
      collectAllItems: false,
      noCollisions: true
    },

    recommendedBlocks: ['SENSE', 'PLAN', 'ACT'],
    maxBlocks: 15
  },

  {
    id: 'challenge-3',
    title: '⭐ Collect & Reach',
    difficulty: 'Intermediate',
    description: 'Collect all stars before reaching the goal',
    hint: 'Plan your route to collect items efficiently',

    startPosition: { x: 10, y: 50 },
    goal: { x: 85, y: 50 },
    obstacles: [
      { x: 40, y: 35, width: 8, height: 35 }
    ],
    items: [
      { id: 'star-1', type: 'Star', icon: '⭐', x: 30, y: 30 },
      { id: 'star-2', type: 'Star', icon: '⭐', x: 55, y: 70 },
      { id: 'star-3', type: 'Star', icon: '⭐', x: 70, y: 50 }
    ],

    successCriteria: {
      reachGoal: true,
      useBlocks: ['SENSE', 'PLAN', 'ACT'],
      collectAllItems: true,
      noCollisions: true
    },

    recommendedBlocks: ['SENSE', 'PLAN', 'ACT', 'REFLECT'],
    maxBlocks: 20
  },

  {
    id: 'challenge-4',
    title: '💎 Diamond Hunt',
    difficulty: 'Intermediate',
    description: 'Collect all diamonds in the maze',
    hint: 'Use REFLECT to remember which paths work best',

    startPosition: { x: 10, y: 20 },
    goal: { x: 85, y: 80 },
    obstacles: [
      { x: 25, y: 10, width: 6, height: 40 },
      { x: 45, y: 30, width: 6, height: 50 },
      { x: 65, y: 10, width: 6, height: 45 }
    ],
    items: [
      { id: 'diamond-1', type: 'Diamond', icon: '💎', x: 35, y: 25 },
      { id: 'diamond-2', type: 'Diamond', icon: '💎', x: 55, y: 60 },
      { id: 'diamond-3', type: 'Diamond', icon: '💎', x: 75, y: 30 }
    ],

    successCriteria: {
      reachGoal: true,
      useBlocks: ['SENSE', 'PLAN', 'ACT', 'REFLECT'],
      collectAllItems: true,
      noCollisions: true
    },

    recommendedBlocks: ['SENSE', 'PLAN', 'ACT', 'REFLECT'],
    maxBlocks: 25
  },

  {
    id: 'challenge-5',
    title: '🏆 Master Challenge',
    difficulty: 'Advanced',
    description: 'Navigate complex obstacles, collect all items, reach the goal perfectly',
    hint: 'Use all blocks strategically. Plan carefully before acting!',

    startPosition: { x: 10, y: 10 },
    goal: { x: 85, y: 85 },
    obstacles: [
      { x: 20, y: 25, width: 8, height: 30 },
      { x: 35, y: 10, width: 8, height: 25 },
      { x: 35, y: 55, width: 8, height: 30 },
      { x: 50, y: 30, width: 8, height: 35 },
      { x: 65, y: 15, width: 8, height: 25 },
      { x: 65, y: 60, width: 8, height: 25 }
    ],
    items: [
      { id: 'gem-1', type: 'Gem', icon: '💎', x: 28, y: 15 },
      { id: 'gem-2', type: 'Gem', icon: '💎', x: 43, y: 45 },
      { id: 'gem-3', type: 'Gem', icon: '💎', x: 58, y: 25 },
      { id: 'gem-4', type: 'Gem', icon: '💎', x: 73, y: 70 },
      { id: 'star-1', type: 'Star', icon: '⭐', x: 28, y: 70 },
      { id: 'star-2', type: 'Star', icon: '⭐', x: 73, y: 45 }
    ],

    successCriteria: {
      reachGoal: true,
      useBlocks: ['SENSE', 'PLAN', 'ACT', 'REFLECT'],
      collectAllItems: true,
      noCollisions: true
    },

    recommendedBlocks: ['SENSE', 'PLAN', 'ACT', 'REFLECT'],
    maxBlocks: 30
  },

  {
    id: 'challenge-6',
    title: '🎮 Sandbox Mode',
    difficulty: 'Custom',
    description: 'Free play! Experiment with your agent in an open environment',
    hint: 'Try different block combinations and see what happens',

    startPosition: { x: 20, y: 50 },
    goal: { x: 80, y: 50 },
    obstacles: [
      { x: 45, y: 35, width: 10, height: 30 }
    ],
    items: [
      { id: 'item-1', type: 'Coin', icon: '🪙', x: 35, y: 50 },
      { id: 'item-2', type: 'Coin', icon: '🪙', x: 65, y: 50 }
    ],

    successCriteria: {
      reachGoal: false, // Optional in sandbox
      useBlocks: [],
      collectAllItems: false,
      noCollisions: false
    },

    recommendedBlocks: ['SENSE', 'PLAN', 'ACT', 'REFLECT'],
    maxBlocks: 50
  }
];

/**
 * Get challenge by ID
 */
export function getChallengeById(id) {
  return challenges.find(c => c.id === id);
}

/**
 * Get challenges by difficulty
 */
export function getChallengesByDifficulty(difficulty) {
  return challenges.filter(c => c.difficulty === difficulty);
}
