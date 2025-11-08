import { useState, useEffect, useCallback } from 'react';

/**
 * SimulationSandbox Component
 * Interactive sandbox for testing agent behavior with goals and obstacles
 */
function SimulationSandbox({ nodes, challenge, onSuccess, onFailure }) {
  const [agentPos, setAgentPos] = useState({ x: 10, y: 50 });
  const [agentDirection, setAgentDirection] = useState('right'); // right, left, up, down
  const [collectedItems, setCollectedItems] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(-1);
  const [executionLog, setExecutionLog] = useState([]);
  const [simulationState, setSimulationState] = useState('idle'); // idle, running, success, failure

  // Reset simulation
  const resetSimulation = useCallback(() => {
    setAgentPos({ x: 10, y: 50 });
    setAgentDirection('right');
    setCollectedItems([]);
    setIsRunning(false);
    setCurrentBlockIndex(-1);
    setExecutionLog([]);
    setSimulationState('idle');
  }, []);

  // Check if position collides with obstacle
  const checkCollision = useCallback((x, y) => {
    if (!challenge?.obstacles) return false;
    return challenge.obstacles.some(obs =>
      x >= obs.x && x <= obs.x + obs.width &&
      y >= obs.y && y <= obs.y + obs.height
    );
  }, [challenge]);

  // Check if position has collectible item
  const checkItem = useCallback((x, y) => {
    if (!challenge?.items) return null;
    return challenge.items.find(item =>
      Math.abs(x - item.x) < 5 && Math.abs(y - item.y) < 5 &&
      !collectedItems.includes(item.id)
    );
  }, [challenge, collectedItems]);

  // Check if goal is reached
  const checkGoal = useCallback((x, y) => {
    if (!challenge?.goal) return false;
    const distance = Math.sqrt(
      Math.pow(x - challenge.goal.x, 2) + Math.pow(y - challenge.goal.y, 2)
    );
    return distance < 8;
  }, [challenge]);

  // Check if all success criteria are met
  const checkSuccess = useCallback(() => {
    const criteria = challenge?.successCriteria;
    if (!criteria) return false;

    let allMet = true;

    // Check if agent reached goal
    if (criteria.reachGoal) {
      allMet = allMet && checkGoal(agentPos.x, agentPos.y);
    }

    // Check if all items collected
    if (criteria.collectAllItems && challenge.items) {
      allMet = allMet && collectedItems.length === challenge.items.length;
    }

    // Check if specific blocks were used
    if (criteria.useBlocks) {
      const usedBlocks = nodes.map(n => n.label);
      allMet = allMet && criteria.useBlocks.every(block => usedBlocks.includes(block));
    }

    // Check if no collisions occurred
    if (criteria.noCollisions) {
      const hasCollisionLog = executionLog.some(log => log.type === 'collision');
      allMet = allMet && !hasCollisionLog;
    }

    return allMet;
  }, [challenge, agentPos, collectedItems, nodes, executionLog, checkGoal]);

  // Execute a single block
  const executeBlock = useCallback((block, index) => {
    return new Promise((resolve) => {
      setCurrentBlockIndex(index);

      setTimeout(() => {
        switch (block.label) {
          case 'SENSE':
            // Check surroundings
            const obstacleAhead = checkCollision(agentPos.x + 10, agentPos.y);
            const itemNearby = checkItem(agentPos.x, agentPos.y);

            setExecutionLog(prev => [...prev, {
              type: 'sense',
              message: obstacleAhead ? '⚠️ Obstacle detected ahead!' : '✓ Path is clear',
              details: itemNearby ? `Item detected: ${itemNearby.type}` : null
            }]);
            break;

          case 'PLAN':
            // Analyze and decide
            const goalDirection = challenge?.goal ?
              (challenge.goal.x > agentPos.x ? 'right' : 'left') : 'right';

            setExecutionLog(prev => [...prev, {
              type: 'plan',
              message: `🧠 Planning: Move ${goalDirection} toward goal`,
              details: `Current: (${Math.round(agentPos.x)}, ${Math.round(agentPos.y)})`
            }]);
            break;

          case 'ACT':
            // Move agent
            let newX = agentPos.x;
            let newY = agentPos.y;

            switch (agentDirection) {
              case 'right':
                newX += 15;
                break;
              case 'left':
                newX -= 15;
                break;
              case 'up':
                newY -= 15;
                break;
              case 'down':
                newY += 15;
                break;
            }

            // Check for collision
            if (checkCollision(newX, newY)) {
              setExecutionLog(prev => [...prev, {
                type: 'collision',
                message: '💥 Collision! Agent hit an obstacle',
                details: 'Failed to move'
              }]);
            } else {
              setAgentPos({ x: newX, y: newY });

              // Check for items
              const item = checkItem(newX, newY);
              if (item) {
                setCollectedItems(prev => [...prev, item.id]);
                setExecutionLog(prev => [...prev, {
                  type: 'collect',
                  message: `✨ Collected: ${item.type}`,
                  details: `Items: ${collectedItems.length + 1}/${challenge.items?.length || 0}`
                }]);
              }

              setExecutionLog(prev => [...prev, {
                type: 'act',
                message: `⚡ Moved ${agentDirection}`,
                details: `Position: (${Math.round(newX)}, ${Math.round(newY)})`
              }]);
            }
            break;

          case 'REFLECT':
            // Learn from experience
            const goalReached = checkGoal(agentPos.x, agentPos.y);
            const itemsCollected = collectedItems.length;

            setExecutionLog(prev => [...prev, {
              type: 'reflect',
              message: goalReached ? '🎯 Goal reached!' : '🤔 Analyzing performance...',
              details: `Items collected: ${itemsCollected}, Goal: ${goalReached ? 'Yes' : 'No'}`
            }]);
            break;

          default:
            setExecutionLog(prev => [...prev, {
              type: 'info',
              message: `Executing: ${block.label}`,
              details: null
            }]);
        }

        resolve();
      }, 1000); // 1 second per block execution
    });
  }, [agentPos, agentDirection, collectedItems, challenge, checkCollision, checkItem, checkGoal]);

  // Run simulation
  const runSimulation = useCallback(async () => {
    if (nodes.length === 0) {
      setExecutionLog([{ type: 'error', message: '❌ No blocks to execute!', details: 'Add blocks to your agent' }]);
      return;
    }

    setIsRunning(true);
    setSimulationState('running');
    setExecutionLog([{ type: 'info', message: '🚀 Starting simulation...', details: null }]);

    // Execute each block sequentially
    for (let i = 0; i < nodes.length; i++) {
      await executeBlock(nodes[i], i);
    }

    setCurrentBlockIndex(-1);
    setIsRunning(false);

    // Check success criteria
    setTimeout(() => {
      if (checkSuccess()) {
        setSimulationState('success');
        setExecutionLog(prev => [...prev, {
          type: 'success',
          message: '🎉 Challenge Complete!',
          details: 'All criteria met'
        }]);
        if (onSuccess) onSuccess();
      } else {
        setSimulationState('failure');
        setExecutionLog(prev => [...prev, {
          type: 'failure',
          message: '❌ Challenge Failed',
          details: 'Review the success criteria'
        }]);
        if (onFailure) onFailure();
      }
    }, 500);
  }, [nodes, executeBlock, checkSuccess, onSuccess, onFailure]);

  return (
    <div className="flex flex-col h-full">
      {/* Challenge Info */}
      {challenge && (
        <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-indigo-200">
          <h3 className="text-sm font-bold text-gray-900 mb-1">{challenge.title}</h3>
          <p className="text-xs text-gray-600 mb-2">{challenge.description}</p>

          {/* Success Criteria */}
          <div className="bg-white rounded p-2 mb-2">
            <p className="text-xs font-bold text-gray-700 mb-1">Success Criteria:</p>
            <ul className="text-xs text-gray-600 space-y-0.5">
              {challenge.successCriteria?.reachGoal && (
                <li className="flex items-center gap-1">
                  <span className={checkGoal(agentPos.x, agentPos.y) ? 'text-green-600' : 'text-gray-400'}>
                    {checkGoal(agentPos.x, agentPos.y) ? '✓' : '○'}
                  </span>
                  Reach the goal
                </li>
              )}
              {challenge.successCriteria?.collectAllItems && challenge.items && (
                <li className="flex items-center gap-1">
                  <span className={collectedItems.length === challenge.items.length ? 'text-green-600' : 'text-gray-400'}>
                    {collectedItems.length === challenge.items.length ? '✓' : '○'}
                  </span>
                  Collect all items ({collectedItems.length}/{challenge.items.length})
                </li>
              )}
              {challenge.successCriteria?.useBlocks && (
                <li className="flex items-center gap-1">
                  <span className="text-gray-400">○</span>
                  Use: {challenge.successCriteria.useBlocks.join(', ')}
                </li>
              )}
              {challenge.successCriteria?.noCollisions && (
                <li className="flex items-center gap-1">
                  <span className={!executionLog.some(log => log.type === 'collision') ? 'text-green-600' : 'text-red-600'}>
                    {!executionLog.some(log => log.type === 'collision') ? '✓' : '✗'}
                  </span>
                  No collisions
                </li>
              )}
            </ul>
          </div>

          {/* Hint */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded p-2">
            <p className="text-xs text-yellow-800">
              <span className="font-bold">💡 Hint:</span> {challenge.hint}
            </p>
          </div>
        </div>
      )}

      {/* Sandbox Viewport */}
      <div className="flex-1 p-4 relative bg-gradient-to-br from-blue-50 to-purple-50 overflow-hidden">
        <div className="relative w-full h-full bg-white rounded-lg border-2 border-gray-300 overflow-hidden">
          {/* Agent */}
          <div
            className={`absolute w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all duration-500 z-20 ${
              simulationState === 'success' ? 'bg-green-600 scale-125' :
              simulationState === 'failure' ? 'bg-red-600 animate-pulse' :
              isRunning ? 'bg-indigo-600 animate-bounce' :
              'bg-indigo-600'
            }`}
            style={{
              left: `${agentPos.x}%`,
              top: `${agentPos.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
            title="Your AI Agent"
          >
            🤖
          </div>

          {/* Obstacles */}
          {challenge?.obstacles?.map((obs, idx) => (
            <div
              key={`obs-${idx}`}
              className="absolute bg-red-400 opacity-70 rounded shadow-lg"
              style={{
                left: `${obs.x}%`,
                top: `${obs.y}%`,
                width: `${obs.width}%`,
                height: `${obs.height}%`
              }}
              title="Obstacle"
            >
              <div className="w-full h-full flex items-center justify-center text-2xl">
                🚧
              </div>
            </div>
          ))}

          {/* Collectible Items */}
          {challenge?.items?.map((item, idx) => (
            !collectedItems.includes(item.id) && (
              <div
                key={`item-${idx}`}
                className="absolute w-8 h-8 flex items-center justify-center text-2xl animate-pulse z-10"
                style={{
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                title={item.type}
              >
                {item.icon || '⭐'}
              </div>
            )
          ))}

          {/* Goal */}
          {challenge?.goal && (
            <div
              className="absolute w-12 h-12 bg-green-500 rounded-full animate-pulse flex items-center justify-center text-white font-bold text-2xl shadow-lg z-10"
              style={{
                left: `${challenge.goal.x}%`,
                top: `${challenge.goal.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
              title="Goal"
            >
              🎯
            </div>
          )}

          {/* Success/Failure Overlay */}
          {simulationState === 'success' && (
            <div className="absolute inset-0 bg-green-500 bg-opacity-20 flex items-center justify-center z-30 animate-pulse">
              <div className="bg-white rounded-lg p-6 shadow-2xl">
                <p className="text-3xl font-bold text-green-600">🎉 Success!</p>
              </div>
            </div>
          )}
          {simulationState === 'failure' && (
            <div className="absolute inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center z-30">
              <div className="bg-white rounded-lg p-6 shadow-2xl">
                <p className="text-3xl font-bold text-red-600">❌ Try Again</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="p-3 bg-gray-50 border-t border-gray-200 flex gap-2">
        <button
          onClick={runSimulation}
          disabled={isRunning || nodes.length === 0}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
            isRunning || nodes.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
          </svg>
          {isRunning ? 'Running...' : 'Run Simulation'}
        </button>
        <button
          onClick={resetSimulation}
          disabled={isRunning}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            isRunning
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
        >
          Reset
        </button>
      </div>

      {/* Execution Log */}
      <div className="h-40 p-3 bg-gray-900 overflow-y-auto">
        <div className="space-y-1">
          {executionLog.map((log, idx) => (
            <div
              key={idx}
              className={`text-xs p-2 rounded font-mono ${
                log.type === 'sense' ? 'bg-blue-900 text-blue-200' :
                log.type === 'plan' ? 'bg-yellow-900 text-yellow-200' :
                log.type === 'act' ? 'bg-green-900 text-green-200' :
                log.type === 'reflect' ? 'bg-purple-900 text-purple-200' :
                log.type === 'collision' ? 'bg-red-900 text-red-200' :
                log.type === 'collect' ? 'bg-pink-900 text-pink-200' :
                log.type === 'success' ? 'bg-emerald-900 text-emerald-200' :
                log.type === 'failure' ? 'bg-red-900 text-red-200' :
                'bg-gray-800 text-gray-300'
              }`}
            >
              <div className="font-bold">{log.message}</div>
              {log.details && <div className="text-xs opacity-75 mt-0.5">{log.details}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SimulationSandbox;
