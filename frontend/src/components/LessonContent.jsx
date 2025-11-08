/**
 * LessonContent Component
 * Displays educational content explaining Agentic AI concepts
 */
function LessonContent({ nodes }) {
  const lessons = {
    sense: {
      title: '👁️ Sense',
      tagline: 'Perceive the environment',
      description: 'Agents gather information from their surroundings through sensors, APIs, and data inputs.',
      keyPoints: [
        'Collects data from environment',
        'Detects obstacles and targets',
        'Real-time monitoring'
      ],
      example: 'Self-driving cars use cameras to detect obstacles',
      tryThis: 'Drag a SENSE block to help your agent see!'
    },
    plan: {
      title: '🧠 Plan',
      tagline: 'Think and decide',
      description: 'Agents analyze data, evaluate options, and choose the best action. This is where intelligence happens.',
      keyPoints: [
        'Breaks goals into steps',
        'Weighs different options',
        'Predicts outcomes'
      ],
      example: 'Chess AI evaluates millions of moves to find the best one',
      tryThis: 'Connect SENSE → PLAN for smart decisions!'
    },
    act: {
      title: '⚡ Act',
      tagline: 'Execute the plan',
      description: 'Agents execute their decisions and interact with the environment to achieve goals.',
      keyPoints: [
        'Converts plans to actions',
        'Manipulates the environment',
        'Creates feedback loops'
      ],
      example: 'Robot arm picks and places objects based on its plan',
      tryThis: 'Add ACT to see your agent move in the sandbox!'
    },
    reflect: {
      title: '💭 Reflect',
      tagline: 'Learn and improve',
      description: 'Agents analyze outcomes, update memory, and improve future performance through learning.',
      keyPoints: [
        'Evaluates what worked',
        'Stores successful strategies',
        'Adapts based on experience'
      ],
      example: 'AlphaGo learns from game outcomes to play better',
      tryThis: 'Complete the cycle with REFLECT for learning!'
    }
  };

  // Determine primary lesson to display
  const getCurrentLesson = () => {
    if (nodes.length === 0) {
      return {
        title: '🎓 Get Started',
        tagline: 'Build your first agent',
        description: 'Agents perceive, think, act, and learn in a continuous cycle.',
        keyPoints: [
          'Drag blocks from the sidebar',
          'Connect them in order',
          'Click Run to see it work'
        ],
        example: 'Try building: SENSE → PLAN → ACT → REFLECT',
        tryThis: 'Drag your first block to begin!'
      };
    }

    // Show lesson for most recently added block
    const lastBlock = nodes[nodes.length - 1];
    const blockType = lastBlock.label.toLowerCase();

    if (lessons[blockType]) {
      return lessons[blockType];
    }

    // Default to sense if block type doesn't match
    return lessons.sense;
  };

  const currentLesson = getCurrentLesson();

  // Additional guidance based on current setup
  const getGuidance = () => {
    const blockTypes = nodes.map(n => n.label);
    const hasSense = blockTypes.includes('SENSE');
    const hasPlan = blockTypes.includes('PLAN');
    const hasAct = blockTypes.includes('ACT');
    const hasReflect = blockTypes.includes('REFLECT');

    if (hasSense && hasPlan && hasAct && hasReflect) {
      return { type: 'success', message: 'Complete! Click "Run Agent" to test' };
    }
    if (hasAct && !hasSense) {
      return { type: 'warning', message: 'Add SENSE before ACT' };
    }
    if (hasSense && hasAct && !hasPlan) {
      return { type: 'info', message: 'Add PLAN for smarter decisions' };
    }
    if (hasAct && !hasReflect) {
      return { type: 'info', message: 'Add REFLECT to enable learning' };
    }

    return null;
  };

  const guidance = getGuidance();
  const guidanceStyles = {
    success: 'bg-green-50 border-l-4 border-green-500 text-green-800',
    warning: 'bg-orange-50 border-l-4 border-orange-500 text-orange-800',
    info: 'bg-blue-50 border-l-4 border-blue-500 text-blue-800'
  };

  return (
    <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-br from-white to-gray-50">
      {/* Lesson Header */}
      <div className="mb-4 pb-3 border-b-2 border-indigo-100">
        <h2 className="text-xl font-bold text-gray-900 mb-1">{currentLesson.title}</h2>
        <p className="text-sm text-indigo-600">{currentLesson.tagline}</p>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-700 mb-4 leading-relaxed">{currentLesson.description}</p>

      {/* Key Points */}
      <div className="mb-4 bg-white rounded-lg p-3 shadow-sm border border-gray-100">
        <h3 className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">What it does:</h3>
        <ul className="space-y-1.5">
          {currentLesson.keyPoints.map((point, idx) => (
            <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Example */}
      <div className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
        <h3 className="text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Example:</h3>
        <p className="text-sm text-gray-700 italic">{currentLesson.example}</p>
      </div>

      {/* Try This */}
      <div className="mb-4 bg-indigo-600 text-white rounded-lg p-3 shadow-md">
        <p className="text-xs font-bold mb-1">💡 Try This:</p>
        <p className="text-sm">{currentLesson.tryThis}</p>
      </div>

      {/* Current Progress Guidance */}
      {guidance && (
        <div className={`rounded-lg p-3 mb-4 ${guidanceStyles[guidance.type]}`}>
          <p className="text-sm font-medium">{guidance.message}</p>
        </div>
      )}

      {/* SPAR Cycle Diagram - Compact */}
      <div className="bg-white rounded-lg p-3 border-2 border-gray-200">
        <h3 className="text-xs font-bold text-gray-700 mb-2 text-center uppercase tracking-wide">Agent Cycle</h3>
        <div className="space-y-1">
          <div className={`flex items-center gap-2 p-2 rounded-md transition-all ${nodes.some(n => n.label === 'SENSE') ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}>
            <span className="text-base">👁️</span>
            <span className="text-xs font-medium">SENSE</span>
          </div>
          <div className="text-center text-gray-300 text-xs">↓</div>
          <div className={`flex items-center gap-2 p-2 rounded-md transition-all ${nodes.some(n => n.label === 'PLAN') ? 'bg-yellow-500 text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}>
            <span className="text-base">🧠</span>
            <span className="text-xs font-medium">PLAN</span>
          </div>
          <div className="text-center text-gray-300 text-xs">↓</div>
          <div className={`flex items-center gap-2 p-2 rounded-md transition-all ${nodes.some(n => n.label === 'ACT') ? 'bg-green-500 text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}>
            <span className="text-base">⚡</span>
            <span className="text-xs font-medium">ACT</span>
          </div>
          <div className="text-center text-gray-300 text-xs">↓</div>
          <div className={`flex items-center gap-2 p-2 rounded-md transition-all ${nodes.some(n => n.label === 'REFLECT') ? 'bg-purple-500 text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}>
            <span className="text-base">💭</span>
            <span className="text-xs font-medium">REFLECT</span>
          </div>
          <div className="text-center text-gray-400 text-xs mt-1">↻ Repeat</div>
        </div>
      </div>
    </div>
  );
}

export default LessonContent;
