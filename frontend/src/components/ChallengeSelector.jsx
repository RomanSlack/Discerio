import { challenges } from '../data/challenges';

/**
 * ChallengeSelector Component
 * Let users select different challenges to solve
 */
function ChallengeSelector({ currentChallenge, onSelectChallenge, onClose }) {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'Advanced':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-300';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">Select a Challenge</h2>
              <p className="text-sm opacity-90">Choose your mission and build your agent</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Challenges Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {challenges.map((challenge) => (
              <div
                key={challenge.id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg ${
                  currentChallenge?.id === challenge.id
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
                onClick={() => {
                  onSelectChallenge(challenge);
                  onClose();
                }}
              >
                {/* Challenge Header */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900">{challenge.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                    {challenge.difficulty}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-3">{challenge.description}</p>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{Object.values(challenge.successCriteria).filter(Boolean).length} criteria</span>
                  </div>
                  {challenge.items && challenge.items.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span>⭐</span>
                      <span>{challenge.items.length} items</span>
                    </div>
                  )}
                  {challenge.obstacles && challenge.obstacles.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span>🚧</span>
                      <span>{challenge.obstacles.length} obstacles</span>
                    </div>
                  )}
                </div>

                {/* Recommended Blocks */}
                <div className="flex flex-wrap gap-1">
                  {challenge.recommendedBlocks.map((block, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded font-medium"
                    >
                      {block}
                    </span>
                  ))}
                </div>

                {/* Current Challenge Badge */}
                {currentChallenge?.id === challenge.id && (
                  <div className="mt-3 pt-3 border-t border-indigo-200">
                    <span className="text-xs font-bold text-indigo-600">✓ Currently Active</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            💡 Tip: Start with easier challenges to learn the basics, then progress to advanced ones
          </p>
        </div>
      </div>
    </div>
  );
}

export default ChallengeSelector;
