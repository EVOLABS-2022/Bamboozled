'use client'

import { useGameStore } from '@/stores/gameStore'

interface HqPopupProps {
  tileId: string
  onClose: () => void
}

export default function HqPopup({ tileId, onClose }: HqPopupProps) {
  const { tiles, upgradeBuilding, getBuildingUpgradeCost, canUpgradeBuilding } = useGameStore()
  
  const tile = tiles[tileId]
  
  if (!tile || tile.type !== 'building' || tile.building?.name !== 'HQ') {
    return null
  }

  const building = tile.building
  const currentLevel = building.level || 1
  const upgradeCost = getBuildingUpgradeCost(tileId)
  const canUpgrade = canUpgradeBuilding(tileId)

  const handleUpgrade = () => {
    const success = upgradeBuilding(tileId)
    if (!success) {
      alert('Cannot upgrade HQ. Check requirements: sufficient seeds.')
    }
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Popup Content */}
      <div className="fixed inset-4 bg-green-900/95 backdrop-blur-sm z-50 flex flex-col rounded-lg border border-green-700/50">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-green-700/50 flex-shrink-0">
          <h2 className="text-white text-xl font-bold flex items-center gap-3">
            🏛️ Headquarters Level {currentLevel}
          </h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-red-300 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Current Level Info */}
          <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-700/30">
            <h3 className="text-blue-300 font-medium mb-2">Command Center</h3>
            <p className="text-gray-300 text-sm mb-3">
              Your headquarters coordinates all base operations and unlocks new capabilities as you expand.
            </p>
            <div className="text-white">
              <div className="mb-2">Current Level: <span className="text-blue-300 font-bold">{currentLevel}</span></div>
              <div className="text-sm text-gray-400">
                {currentLevel === 1 && "Basic command functions available"}
                {currentLevel === 2 && "Enhanced logistics and expanded storage capacity"}
                {currentLevel === 3 && "Advanced operations and strategic capabilities"}
                {currentLevel >= 4 && "Maximum operational efficiency achieved"}
              </div>
            </div>
          </div>

          {/* Upgrade Section */}
          {upgradeCost ? (
            <div className="bg-purple-900/30 p-4 rounded-lg border border-purple-700/30">
              <h3 className="text-purple-300 font-medium mb-2">Upgrade Available</h3>
              <div className="mb-3">
                <div className="text-white mb-2">
                  Level {currentLevel} → Level {currentLevel + 1}
                </div>
                <div className="text-yellow-300 mb-3">
                  Cost: {upgradeCost.seeds ? `${upgradeCost.seeds} 🌱` : ''}
                  {upgradeCost.bamboo ? ` + ${upgradeCost.bamboo} 🎋` : ''}
                </div>
                <div className="text-sm text-gray-300 mb-4">
                  {currentLevel === 1 && "Upgrade to improve base efficiency and unlock new building types."}
                  {currentLevel === 2 && "Advanced command center with expanded operational range."}
                  {currentLevel === 3 && "Elite headquarters with maximum strategic capabilities."}
                </div>
              </div>
              
              <button
                onClick={handleUpgrade}
                disabled={!canUpgrade}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {canUpgrade ? 'Upgrade Headquarters' : 'Insufficient Resources'}
              </button>
            </div>
          ) : (
            <div className="bg-green-900/30 p-4 rounded-lg border border-green-700/30 text-center">
              <div className="text-green-300 font-bold text-lg mb-2">🏆 Maximum Level Reached!</div>
              <p className="text-gray-300">Your headquarters is operating at peak efficiency.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
