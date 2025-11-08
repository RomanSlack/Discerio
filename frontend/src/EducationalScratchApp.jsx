import { useState, useCallback, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import Popup from './components/Popup';
import HintSystem from './components/HintSystem';
import InfoCard from './components/InfoCard';
import ChallengePanel from './components/ChallengePanel';
import LessonContent from './components/LessonContent';
import SimulationSandbox from './components/SimulationSandbox';
import ChallengeSelector from './components/ChallengeSelector';
import { challenges } from './data/challenges';

/**
 * EducationalScratchApp - Full Educational Experience
 * Interactive, hands-on learning for Agentic AI concepts
 */
function EducationalScratchApp() {
  // State management for nodes (blocks on canvas)
  const [nodes, setNodes] = useState([]);

  // State management for connections between nodes
  const [connections, setConnections] = useState([]);

  // State for editing popup
  const [editingNode, setEditingNode] = useState(null);

  // State for debug trail with enhanced educational messages
  const [debugTrail, setDebugTrail] = useState([
    {
      timestamp: Date.now(),
      type: 'info',
      message: 'Agent initialized. Ready to learn!',
      phase: 'start'
    }
  ]);

  // State for last action (for hint system)
  const [lastAction, setLastAction] = useState(null);

  // State for current challenge
  const [currentChallenge, setCurrentChallenge] = useState(challenges[0]); // Start with first challenge

  // State for current lesson focus
  const [lessonFocus, setLessonFocus] = useState('perception');

  // State for challenge selector
  const [showChallengeSelector, setShowChallengeSelector] = useState(false);

  // State for right panel view toggle ('debug' or 'lesson')
  const [rightPanelView, setRightPanelView] = useState('debug');

  // State for right panel collapsed/expanded
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  // State for right panel width (resizable)
  const [panelWidth, setPanelWidth] = useState(384); // 384px = w-96
  const [isResizing, setIsResizing] = useState(false);

  // Counter for generating unique IDs
  const nextIdRef = useRef(1);
  const getNextId = () => nextIdRef.current++;

  /**
   * Add enhanced debug message with educational context
   */
  const addDebugMessage = useCallback((type, message, phase = null) => {
    setDebugTrail(prev => [
      ...prev,
      { timestamp: Date.now(), type, message, phase }
    ].slice(-15)); // Keep last 15 messages
  }, []);

  /**
   * Handle dropping a new block from sidebar onto canvas
   */
  const handleDropBlock = useCallback((blockData) => {
    const newNode = {
      id: getNextId(),
      label: blockData.label,
      description: blockData.description,
      color: blockData.color,
      x: blockData.x,
      y: blockData.y,
    };

    setNodes(prev => [...prev, newNode]);
    addDebugMessage('info', `✅ ${blockData.label} block added to your agent`, 'build');

    // Provide contextual feedback
    if (blockData.label === 'SENSE' && nodes.length === 0) {
      addDebugMessage('success', 'Great start! SENSE helps your agent perceive the world', 'build');
    }
  }, [addDebugMessage, nodes.length]);

  /**
   * Handle block movement within canvas
   */
  const handleBlockMove = useCallback((blockId, x, y) => {
    setNodes(prevNodes =>
      prevNodes.map(node =>
        node.id === blockId ? { ...node, x, y } : node
      )
    );
  }, []);

  /**
   * Handle block click to open edit popup
   */
  const handleBlockClick = useCallback((node) => {
    setEditingNode(node);
  }, []);

  /**
   * Handle saving edited node data
   */
  const handleNodeEdit = useCallback((id, updates) => {
    setNodes(prevNodes =>
      prevNodes.map(node =>
        node.id === id ? { ...node, ...updates } : node
      )
    );
    setEditingNode(null);
  }, []);

  /**
   * Handle deleting a node and its connections
   */
  const handleNodeDelete = useCallback((id) => {
    setNodes(prevNodes => prevNodes.filter(node => node.id !== id));
    setConnections(prevConnections =>
      prevConnections.filter(conn => conn.from !== id && conn.to !== id)
    );
    setEditingNode(null);
    addDebugMessage('info', 'Block removed from agent', 'build');
  }, [addDebugMessage]);

  /**
   * Handle creating a connection between blocks
   */
  const handleConnectionCreate = useCallback((fromId, toId) => {
    const connectionExists = connections.some(
      conn => (conn.from === fromId && conn.to === toId) ||
              (conn.from === toId && conn.to === fromId)
    );

    if (!connectionExists) {
      setConnections(prev => [...prev, { from: fromId, to: toId }]);
      addDebugMessage('success', 'Blocks connected! Your agent logic is taking shape', 'build');
    }
  }, [connections, addDebugMessage]);

  /**
   * Handle deleting a connection
   */
  const handleConnectionDelete = useCallback((from, to) => {
    setConnections(prevConnections =>
      prevConnections.filter(conn => !(conn.from === from && conn.to === to))
    );
  }, []);


  /**
   * Export agent logic as JSON
   */
  const exportAgent = useCallback(() => {
    const data = {
      nodes: nodes.map(({ id, label, description, x, y, color }) => ({
        id,
        label,
        description,
        position: { x, y },
        category: color?.replace('category-', '')
      })),
      connections: connections.map(({ from, to }) => ({ from, to }))
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'my-agent.json';
    link.click();
    URL.revokeObjectURL(url);
    addDebugMessage('success', '💾 Agent logic exported successfully!', 'export');
  }, [nodes, connections, addDebugMessage]);

  /**
   * Handle challenge selection
   */
  const handleChallengeSelect = useCallback((challenge) => {
    setCurrentChallenge(challenge);
    addDebugMessage('info', `🎮 Challenge started: ${challenge.title}`, 'challenge');
    addDebugMessage('info', `💡 ${challenge.hint}`, 'challenge');

    // Reset agent position for new challenge
    setAgentPos({ x: 20, y: 50 });
  }, [addDebugMessage]);

  /**
   * Handle panel resize start
   */
  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  /**
   * Handle panel resize move
   */
  const handleResizeMove = useCallback((e) => {
    if (isResizing) {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 300 && newWidth <= 600) {
        setPanelWidth(newWidth);
      }
    }
  }, [isResizing]);

  /**
   * Handle panel resize end
   */
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Set up resize event listeners
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  return (
    <div className="w-full h-screen flex bg-gray-50 relative">
      {/* Left Sidebar - Scratch-style */}
      <Sidebar onBlockDragStart={(block, category) => {
        console.log('Dragging:', block.label);
      }} />

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col relative">
        <Canvas
          nodes={nodes}
          connections={connections}
          onDropBlock={handleDropBlock}
          onBlockMove={handleBlockMove}
          onBlockClick={handleBlockClick}
          onConnectionCreate={handleConnectionCreate}
          onConnectionDelete={handleConnectionDelete}
        />

        {/* Control Buttons */}
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <button
            onClick={() => setShowChallengeSelector(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-lg flex items-center gap-2"
            title="Select a challenge"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            Challenges
          </button>
          <button
            onClick={exportAgent}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-lg flex items-center gap-2"
            title="Export agent logic as JSON"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        </div>

        {/* Hint System */}
        <HintSystem nodes={nodes} lastAction={lastAction} />
      </div>

      {/* Right Panel - Enhanced Sandbox & Debug Trail */}
      {!isPanelCollapsed ? (
        <div
          className="bg-white border-l-2 border-gray-300 flex flex-col shadow-xl relative"
          style={{ width: `${panelWidth}px` }}
        >
          {/* Resize Handle */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-indigo-500 transition-colors z-10"
            onMouseDown={handleResizeStart}
            title="Drag to resize"
          />

          {/* Collapse Button */}
          <button
            onClick={() => setIsPanelCollapsed(true)}
            className="absolute top-2 left-2 z-20 p-1.5 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors shadow-sm"
            title="Collapse panel"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>

          {/* Simulation Sandbox */}
          <div className="h-1/2 border-b border-gray-200">
            <SimulationSandbox
              nodes={nodes}
              challenge={currentChallenge}
              onSuccess={() => {
                addDebugMessage('success', '🎉 Challenge completed!', 'success');
                setLastAction({ type: 'success' });
              }}
              onFailure={() => {
                addDebugMessage('error', '❌ Challenge failed. Try again!', 'error');
                setLastAction({ type: 'failure' });
              }}
            />
          </div>

        {/* Toggle Tabs */}
        <div className="border-b border-gray-200 flex">
          <button
            onClick={() => setRightPanelView('debug')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              rightPanelView === 'debug'
                ? 'bg-white text-indigo-600 border-b-2 border-indigo-600'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            🔍 Debug Trail
          </button>
          <button
            onClick={() => setRightPanelView('lesson')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              rightPanelView === 'lesson'
                ? 'bg-white text-indigo-600 border-b-2 border-indigo-600'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            📚 Lesson
          </button>
        </div>

        {/* Conditional Content Based on Toggle */}
        {rightPanelView === 'debug' ? (
          /* Debug Trail View */
          <div className="flex-1 p-4 overflow-y-auto">
            <h3 className="text-sm font-bold text-gray-700 mb-2">Debug Trail</h3>
            <p className="text-xs text-gray-500 mb-3">Watch how your agent thinks and acts</p>
            <div className="space-y-2">
              {debugTrail.map((entry, idx) => (
                <div
                  key={idx}
                  className={`text-xs p-2 rounded border-l-4 ${
                    entry.type === 'sense' ? 'bg-blue-50 border-blue-500' :
                    entry.type === 'plan' ? 'bg-yellow-50 border-yellow-500' :
                    entry.type === 'act' ? 'bg-green-50 border-green-500' :
                    entry.type === 'reflect' ? 'bg-purple-50 border-purple-500' :
                    entry.type === 'error' ? 'bg-red-50 border-red-500' :
                    entry.type === 'success' ? 'bg-emerald-50 border-emerald-500' :
                    entry.type === 'warning' ? 'bg-orange-50 border-orange-500' :
                    'bg-gray-50 border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-700 capitalize mb-1 flex items-center justify-between">
                    <span>{entry.type}</span>
                    <span className="text-gray-400 text-xs">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-gray-600">{entry.message}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Lesson Content View */
          <LessonContent nodes={nodes} />
        )}
      </div>
      ) : (
        /* Collapsed Panel - Expand Button */
        <button
          onClick={() => setIsPanelCollapsed(false)}
          className="fixed top-1/2 right-0 transform -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-l-lg shadow-lg hover:bg-indigo-700 transition-all z-50"
          title="Expand panel"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Edit Popup Modal */}
      {editingNode && (
        <Popup
          node={editingNode}
          onSave={handleNodeEdit}
          onDelete={handleNodeDelete}
          onClose={() => setEditingNode(null)}
        />
      )}

      {/* Info Card */}
      <InfoCard lesson={lessonFocus} />

      {/* Challenge Panel */}
      <ChallengePanel
        onChallengeSelect={handleChallengeSelect}
        currentChallenge={currentChallenge}
      />

      {/* Challenge Selector Modal */}
      {showChallengeSelector && (
        <ChallengeSelector
          currentChallenge={currentChallenge}
          onSelectChallenge={(challenge) => {
            setCurrentChallenge(challenge);
            addDebugMessage('info', `🎮 Challenge selected: ${challenge.title}`, 'challenge');
          }}
          onClose={() => setShowChallengeSelector(false)}
        />
      )}
    </div>
  );
}

export default EducationalScratchApp;
