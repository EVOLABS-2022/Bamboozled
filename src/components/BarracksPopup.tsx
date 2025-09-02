'use client'

import { useState } from 'react'
import { useGameStore } from '@/stores/gameStore'

interface BarracksPopupProps {
  tileId: string
  onClose: () => void
}

export default function BarracksPopup({ tileId, onClose }: BarracksPopupProps) {
  const { tiles, player, canTrainTroop, startTroopTraining, collectTrainedTroops, getTroopTrainingCost, getBuildingUpgradeCost, canUpgradeBuilding, upgradeBuilding } = useGameStore()
  const [selectedTroop, setSelectedTroop] = useState<'warrior' | 'archer' | 'monk' | 'bomber'>('warrior')
  const [quantity, setQuantity] = useState(1)
  
  const tile = tiles[tileId]
  if (!tile || tile.type !== 'building' || tile.building?.name !== 'Barracks') {
    return null
  }

  const training = tile.building.troopTraining
  const cost = getTroopTrainingCost(selectedTroop, quantity)
  const currentLevel = tile.building.level
  const upgradeCost = getBuildingUpgradeCost(tileId)

  const handleStartTraining = () => {
    const success = startTroopTraining(tileId, selectedTroop, quantity)
    if (!success) {
      alert('Cannot train troops. Check requirements: enough bamboo and no active training.')
    }
  }

  const handleCollectTroops = () => {
    const success = collectTrainedTroops(tileId)
    if (!success) {
      alert('No troops ready to collect.')
    }
  }

  const handleUpgrade = () => {
    const success = upgradeBuilding(tileId)
    if (!success) {
      alert('Cannot upgrade. Check requirements.')
    }
  }

  const troopTypes = [
    { id: 'warrior' as const, name: 'Warrior', icon: '⚔️', image: '/images/warrior.png', cost: 50, time: 2, description: 'Fast melee brawler' },
    { id: 'archer' as const, name: 'Archer', icon: '🏹', image: '/images/archer.jpeg', cost: 100, time: 3, description: 'Ranged attacker' },
    { id: 'monk' as const, name: 'Monk', icon: '🧘', image: '/images/monk.png', cost: 150, time: 4, description: 'Support healer' },
    { id: 'bomber' as const, name: 'Bomber', icon: '💣', image: '/images/CF156F0F-159A-4ED8-998B-3038B0DCE742_1_201_a.jpeg', cost: 200, time: 5, description: 'AoE specialist' }
  ]

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      
      {/* Full Screen Popup */}
      <div className="fixed inset-4 bg-amber-900/95 backdrop-blur-sm z-50 flex flex-col rounded-lg border border-amber-700/50"
           style={{
             right: '324px' // Account for sidebar width (w-80 = 320px) + margin
           }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-amber-700/50 flex-shrink-0">
          <h2 className="text-white text-xl font-bold flex items-center gap-3">
            🏰 Barracks Level {currentLevel}
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

          {/* Current Troops and Troop Selection Side by Side */}
          <div className="mb-4 grid grid-cols-2 gap-4">
            {/* Current Troops */}
            <div className="p-3 bg-amber-900/50 rounded-lg border border-amber-700/50">
              <h4 className="text-amber-200 font-medium mb-2">Your Army</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {troopTypes.map(troop => (
                  <div key={troop.id} className="text-center">
                    <img 
                      src={troop.image} 
                      alt={troop.name}
                      className="w-8 h-8 object-contain mx-auto"
                    />
                    <div className="text-amber-100">{player.troops[troop.id]}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Troop Selection */}
            <div className="p-3 bg-amber-900/50 rounded-lg border border-amber-700/50">
              <h4 className="text-amber-200 font-medium mb-2">Select Troop Type</h4>
              <div className="grid grid-cols-2 gap-2">
                {troopTypes.map(troop => (
                  <button
                    key={troop.id}
                    onClick={() => setSelectedTroop(troop.id)}
                    className={`p-2 rounded text-sm transition-colors text-left ${
                      selectedTroop === troop.id
                        ? 'bg-amber-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <img 
                        src={troop.image} 
                        alt={troop.name}
                        className="w-6 h-6 object-contain"
                      />
                      <div>
                        <div className="font-medium text-xs">{troop.name}</div>
                        <div className="text-xs opacity-75">{troop.cost} 🎋 • {troop.time}m</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Training Status or Selection */}
          {training ? (
            training.completed ? (
              <div className="space-y-3">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-green-300 mb-2">
                    <span className="text-lg">✅</span>
                    <span className="font-medium">
                      {training.quantity} {troopTypes.find(t => t.id === training.troopType)?.name}(s) ready!
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={handleCollectTroops}
                  className="w-full bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded-lg transition-colors font-medium"
                >
                  Collect Troops
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-yellow-300 mb-2">
                    <span className="text-lg">⏳</span>
                    <span className="text-sm">
                      Training {training.quantity} {troopTypes.find(t => t.id === training.troopType)?.name}(s)...
                    </span>
                  </div>
                  <div className="text-xs text-yellow-200 mb-2">
                    {Math.ceil((training.startTime + training.duration - Date.now()) / (60 * 1000))} min left
                  </div>
                  
                  <div className="bg-yellow-600/30 rounded-full h-3 overflow-hidden border border-yellow-600/50">
                    <div 
                      className="bg-yellow-400 h-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(100, ((Date.now() - training.startTime) / training.duration) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
                
                <p className="text-amber-100 text-xs text-center">
                  Your troops are training! Come back when ready.
                </p>
              </div>
            )
          ) : (
            <div className="space-y-4">

              {/* Quantity Selection */}
              <div className="space-y-2">
                <h4 className="text-amber-200 font-medium">Quantity (1-10)</h4>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full h-2 bg-amber-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-amber-200">
                  <span>1</span>
                  <span className="font-medium">Training: {quantity}</span>
                  <span>10</span>
                </div>
              </div>

              {/* Cost Display */}
              <div className="bg-amber-900/50 rounded-lg p-3 border border-amber-700/50">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-amber-200">Total Cost:</span>
                  <span className="text-white font-medium">{cost.bamboo} 🎋</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-amber-200">Training Time:</span>
                  <span className="text-white font-medium">{Math.ceil(cost.time / 60000)}m</span>
                </div>
              </div>

              {/* Train Button */}
              <button
                onClick={handleStartTraining}
                disabled={!canTrainTroop(tileId, selectedTroop, quantity)}
                className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-gray-600 disabled:text-gray-400 text-white py-2 px-4 rounded-lg transition-colors font-medium"
              >
                Start Training ({cost.bamboo} 🎋)
              </button>
              
              {!canTrainTroop(tileId, selectedTroop, quantity) && (
                <p className="text-red-300 text-xs text-center">
                  Need {cost.bamboo} bamboo to train troops
                </p>
              )}
            </div>
          )}

          {/* Upgrade Section */}
          {upgradeCost ? (
            <div className="bg-purple-900/30 p-4 rounded-lg border border-purple-700/30">
              <h3 className="text-purple-300 font-medium mb-2">Upgrade Available</h3>
              <div className="mb-3">
                <div className="text-white mb-2">
                  Level {currentLevel} → Level {currentLevel + 1}
                </div>
                <div className="text-gray-300 text-sm mb-3">
                  Unlock enhanced training capabilities and increased capacity.
                </div>
                <div className="flex gap-4 text-sm">
                  {upgradeCost.seeds && (
                    <span className="text-green-300">🌱 {upgradeCost.seeds} Seeds</span>
                  )}
                  {upgradeCost.bamboo && (
                    <span className="text-yellow-300">🎋 {upgradeCost.bamboo} Bamboo</span>
                  )}
                </div>
              </div>
              
              <button
                onClick={handleUpgrade}
                disabled={!canUpgradeBuilding(tileId)}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:text-gray-400 text-white py-2 px-4 rounded-lg transition-colors font-medium"
              >
                Upgrade to Level {currentLevel + 1}
              </button>
              
              {!canUpgradeBuilding(tileId) && (
                <p className="text-red-300 text-xs text-center mt-2">
                  Insufficient resources or HQ level too low
                </p>
              )}
            </div>
          ) : (
            <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700/30">
              <h3 className="text-gray-300 font-medium mb-2">Maximum Level</h3>
              <p className="text-gray-400 text-sm">This barracks is fully upgraded!</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
