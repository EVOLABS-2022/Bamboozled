'use client'

import { useGameStore } from '@/stores/gameStore'

interface DepotPopupProps {
  tileId: string
  onClose: () => void
}

export default function DepotPopup({ tileId, onClose }: DepotPopupProps) {
  const { tiles, upgradeBuilding, getBuildingUpgradeCost, canUpgradeBuilding, getMaxBambooStorage } = useGameStore()
  
  const tile = tiles[tileId]
  
  if (!tile || tile.type !== 'building' || tile.building?.name !== 'Depot') {
    return null
  }

  const building = tile.building
  const currentLevel = building.level || 1
  const upgradeCost = getBuildingUpgradeCost(tileId)
  const canUpgrade = canUpgradeBuilding(tileId)

  const handleUpgrade = () => {
    const success = upgradeBuilding(tileId)
    if (!success) {
      alert('Cannot upgrade Depot. Check requirements: sufficient seeds.')
    }
  }

  const getStorageCapacity = (level: number) => {
    switch (level) {
      case 1: return 500
      case 2: return 1500
      case 3: return 3000
      case 4: return 5000
      default: return 500
    }
  }

  const currentCapacity = getStorageCapacity(currentLevel)
  const nextCapacity = getStorageCapacity(currentLevel + 1)
  const totalStorage = getMaxBambooStorage()

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
            📦 Storage Depot Level {currentLevel}
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
          {/* Current Storage Info */}
          <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-700/30">
            <h3 className="text-blue-300 font-medium mb-2">Storage Facility</h3>
            <p className="text-gray-300 text-sm mb-3">
              Secure storage for your bamboo resources. Higher levels provide increased capacity.
            </p>
            <div className="text-white space-y-2">
              <div className="flex justify-between">
                <span>Current Level:</span>
                <span className="text-blue-300 font-bold">{currentLevel}</span>
              </div>
              <div className="flex justify-between">
                <span>This Depot Capacity:</span>
                <span className="text-green-300 font-bold">{currentCapacity.toLocaleString()} 🎋</span>
              </div>
              <div className="flex justify-between">
                <span>Total Base Storage:</span>
                <span className="text-yellow-300 font-bold">{totalStorage.toLocaleString()} 🎋</span>
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
                <div className="bg-green-900/30 p-3 rounded border border-green-700/30">
                  <div className="text-green-300 font-medium mb-1">Storage Increase:</div>
                  <div className="flex justify-between text-white">
                    <span>{currentCapacity.toLocaleString()} 🎋</span>
                    <span>→</span>
                    <span className="text-green-300 font-bold">{nextCapacity.toLocaleString()} 🎋</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    +{(nextCapacity - currentCapacity).toLocaleString()} additional storage
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleUpgrade}
                disabled={!canUpgrade}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {canUpgrade ? 'Upgrade Storage Depot' : 'Insufficient Resources'}
              </button>
            </div>
          ) : (
            <div className="bg-green-900/30 p-4 rounded-lg border border-green-700/30 text-center">
              <div className="text-green-300 font-bold text-lg mb-2">🏆 Maximum Level Reached!</div>
              <p className="text-gray-300">This depot is operating at maximum storage capacity.</p>
              <p className="text-sm text-gray-400 mt-2">Build additional depots for more storage space.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
