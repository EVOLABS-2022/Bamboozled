'use client'

import React, { useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import RaidsTab from './RaidsTab'

interface MobileUIProps {
  activeTab: 'land' | 'buildings' | 'convoy' | 'quests' | 'raids'
  onTabChange: (tab: 'land' | 'buildings' | 'convoy' | 'quests' | 'raids') => void
  selectedTile?: string | null
}

export default function MobileUI({ activeTab, onTabChange, selectedTile }: MobileUIProps) {
  const { player, getMaxBambooStorage, timeSpeed, setTimeSpeedEnabled, setTimeSpeedMultiplier } = useGameStore()
  const maxStorage = getMaxBambooStorage()
  const tabs = [
    { id: 'land' as const, name: 'Land' },
    { id: 'buildings' as const, name: 'Build' },
    { id: 'convoy' as const, name: 'Trade' },
    { id: 'quests' as const, name: 'Quests' },
    { id: 'raids' as const, name: 'Raids' },
  ]

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-green-800/50 p-3 border-b border-green-700/50 flex-shrink-0">
        <h1 className="text-white text-lg font-bold">Bamboo Lands</h1>
        <div className="flex items-center gap-3 mt-1 text-sm">
          <div className="text-green-300">🎋 {player.bamboo.toLocaleString()}</div>
          <div className="text-yellow-300">🌱 {player.seeds}</div>
          <div className="text-purple-300">🔮 {player.charms}</div>
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs">
          <div className="text-orange-300 flex items-center gap-1">
            <img 
              src="/images/warrior.png" 
              alt="Warriors"
              className="w-4 h-4 object-contain"
            />
            {player.troops.warrior}
          </div>
          <div className="text-blue-300 flex items-center gap-1">
            <img 
              src="/images/archer.jpeg" 
              alt="Archers"
              className="w-4 h-4 object-contain"
            />
            {player.troops.archer}
          </div>
          <div className="text-cyan-300 flex items-center gap-1">
            <img 
              src="/images/monk.png" 
              alt="Monks"
              className="w-4 h-4 object-contain"
            />
            {player.troops.monk}
          </div>
          <div className="text-red-300 flex items-center gap-1">
            <img 
              src="/images/CF156F0F-159A-4ED8-998B-3038B0DCE742_1_201_a.jpeg" 
              alt="Bombers"
              className="w-4 h-4 object-contain"
            />
            {player.troops.bomber}
          </div>
        </div>
        <div className="mt-1 text-xs text-gray-300">
          Storage: {player.bamboo.toLocaleString()} / {maxStorage.toLocaleString()}
        </div>
      </div>

      {/* Speed Control Panel (Development/Testing) */}
      <div className="bg-red-900/30 border-b border-red-700/50 flex-shrink-0">
        <div className="flex items-center justify-between p-2">
          <span className="text-red-300 text-xs font-medium">⚡ Dev Speed Control</span>
          <button
            onClick={() => setTimeSpeedEnabled(!timeSpeed.enabled)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              timeSpeed.enabled 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-600 text-gray-300'
            }`}
          >
            {timeSpeed.enabled ? 'ON' : 'OFF'}
          </button>
        </div>
        {timeSpeed.enabled && (
          <div className="flex items-center gap-2 px-2 pb-2">
            <span className="text-xs text-red-300">1x</span>
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={timeSpeed.multiplier}
              onChange={(e) => setTimeSpeedMultiplier(Number(e.target.value))}
              className="flex-1 h-1 bg-red-800 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs text-red-300">50x</span>
            <span className="text-xs text-white font-medium">{timeSpeed.multiplier}x</span>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-black/30 flex-shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 py-2 px-2 text-center transition-all ${
              activeTab === tab.id
                ? 'bg-green-600 text-white border-b-2 border-green-400'
                : 'text-green-200 hover:bg-green-700/50'
            }`}
          >
            <div className="text-sm font-medium">{tab.name}</div>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-scroll p-4" style={{ height: '1px' }}>
        {activeTab === 'land' && <LandTab selectedTile={selectedTile} />}
        {activeTab === 'buildings' && <BuildingsTab selectedTile={selectedTile} />}
        {activeTab === 'convoy' && <ConvoyTab />}
        {activeTab === 'quests' && <QuestsTab />}
        {activeTab === 'raids' && <RaidsTab />}
      </div>
    </div>
  )
}

function LandTab({ selectedTile }: { selectedTile?: string | null }) {
  const { plantBamboo, player, tiles, collectAllBamboo, updateBambooProduction, getMaxBambooStorage } = useGameStore()
  
  const handlePlant = () => {
    if (selectedTile) {
      const success = plantBamboo(selectedTile)
      if (!success) {
        alert('Cannot plant bamboo here. Need 1 seed and an empty tile.')
      }
    } else {
      alert('Please select a tile first!')
    }
  }
  
  const handleCollectAll = () => {
    updateBambooProduction()
    
    // Check if there's bamboo available before trying to collect
    const totalAvailable = Object.values(tiles).reduce((total, tile) => {
      if (tile && tile.type === 'bamboo' && tile.bamboo) {
        return total + Math.floor(tile.bamboo.stored || 0)
      }
      return total
    }, 0)
    
    const collected = collectAllBamboo()
    if (collected === 0) {
      if (totalAvailable === 0) {
        alert('No bamboo ready to collect!')
      } else {
        const maxStorage = getMaxBambooStorage()
        alert(`Storage full! You have ${player.bamboo}/${maxStorage} bamboo. Build or upgrade Depot for more storage.`)
      }
    }
  }

  const selectedTileData = selectedTile ? tiles[selectedTile] : null
  const canPlant = selectedTile && player.seeds >= 1 && (!selectedTileData || selectedTileData.type === 'empty')
  
  // Calculate total available bamboo to collect
  const totalAvailable = Object.values(tiles).reduce((total, tile) => {
    if (tile && tile.type === 'bamboo' && tile.bamboo) {
      return total + Math.floor(tile.bamboo.stored || 0)
    }
    return total
  }, 0)
  
  return (
    <div className="space-y-4">
      <h3 className="text-white font-bold text-lg">Land Management</h3>
      
      <div className="bg-green-900/30 p-3 rounded-lg border border-green-700/30">
        <h4 className="text-green-300 font-medium mb-2">Selected Tile</h4>
        <p className="text-sm text-gray-300 mb-3">
          {selectedTile ? `Tile: ${selectedTile}` : 'No tile selected. Tap a tile on the grid to select it.'}
        </p>
        {selectedTileData && (
          <p className="text-xs text-blue-300 mb-2">
            Type: {selectedTileData.type === 'empty' ? 'Empty' : selectedTileData.type}
          </p>
        )}
        
        <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled>
          Upgrade Tile
        </button>
      </div>

      <div className="bg-amber-900/30 p-3 rounded-lg border border-amber-700/30">
        <h4 className="text-amber-300 font-medium mb-2">Plant Bamboo</h4>
        <p className="text-sm text-gray-300 mb-3">Plant bamboo on empty tiles to generate resources over time.</p>
        
        <button 
          onClick={handlePlant}
          disabled={!canPlant}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Plant (1 🌱) {!canPlant && '- Need empty tile & 1 seed'}
        </button>
      </div>

      {/* Collect All Bamboo */}
      <div className="bg-yellow-900/30 p-3 rounded-lg border border-yellow-700/30">
        <h4 className="text-yellow-300 font-medium mb-2">Collect Bamboo</h4>
        <p className="text-sm text-gray-300 mb-3">
          {totalAvailable > 0 
            ? `${totalAvailable} bamboo ready to collect! Tap individual tiles or collect all.`
            : 'No bamboo ready to collect. Plant bamboo and wait for it to grow.'}
        </p>
        
        <button 
          onClick={handleCollectAll}
          disabled={totalAvailable === 0}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Collect All ({totalAvailable} 🎋)
        </button>
      </div>
    </div>
  )
}

function BuildingsTab({ selectedTile }: { selectedTile?: string | null }) {
  const { buildOnTile, player, tiles, canPlaceBuilding, canUpgradeBuilding, upgradeBuilding, getBuildingUpgradeCost } = useGameStore()
  
  const buildings = [
    { name: 'HQ', icon: '🏛️', bambooCost: 500, seedCost: 1, description: 'Command center' },
    { name: 'Depot', icon: '📦', bambooCost: 300, seedCost: 0, description: 'Storage facility' },
    { name: 'Nursery', icon: '🌱', bambooCost: 600, seedCost: 0, description: 'Craft seeds' },
    { name: 'Barracks', icon: '🏰', bambooCost: 250, seedCost: 0, description: 'Train troops' },
  ]

  const handleBuild = (buildingName: string) => {
    if (selectedTile) {
      const success = buildOnTile(selectedTile, buildingName)
      if (!success) {
        alert('Cannot build here. Check requirements: empty tile, sufficient resources, and proper spacing.')
      }
    } else {
      alert('Please select a tile first!')
    }
  }

  const handleUpgrade = () => {
    if (selectedTile) {
      const success = upgradeBuilding(selectedTile)
      if (!success) {
        alert('Cannot upgrade building. Check requirements: sufficient seeds and upgradeable building.')
      }
    }
  }


  const selectedTileData = selectedTile ? tiles[selectedTile] : null
  const upgradeCost = selectedTile ? getBuildingUpgradeCost(selectedTile) : null
  const canUpgrade = selectedTile ? canUpgradeBuilding(selectedTile) : false

  return (
    <div className="space-y-4">
      <h3 className="text-white font-bold text-lg">Buildings</h3>
      
      {selectedTile ? (
        <div className="bg-blue-900/30 p-3 rounded-lg border border-blue-700/30">
          <h4 className="text-blue-300 font-medium mb-2">Selected Tile: {selectedTile}</h4>
          <p className="text-xs text-gray-300 mb-2">
            {selectedTileData?.type === 'empty' ? 'Empty tile - ready for building' : 
             selectedTileData?.type === 'bamboo' ? 'Has bamboo - cannot build' :
             selectedTileData?.type === 'building' ? `Has ${selectedTileData.building?.name} (Level ${selectedTileData.building?.level})` : 'Unknown'}
          </p>
          
          {/* Building Upgrade Section */}
          {selectedTileData?.type === 'building' && upgradeCost && (
            <div className="mt-3 p-2 bg-purple-900/30 rounded border border-purple-700/30">
              <h5 className="text-purple-300 text-sm font-medium mb-1">Upgrade Available</h5>
              <p className="text-xs text-gray-300 mb-2">
                {selectedTileData.building?.name} Level {selectedTileData.building?.level} → {(selectedTileData.building?.level || 1) + 1}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-yellow-300">
                  Cost: {[
                    upgradeCost.seeds ? `${upgradeCost.seeds} 🌱` : null,
                    upgradeCost.bamboo ? `${upgradeCost.bamboo} 🎋` : null
                  ].filter(Boolean).join(' + ')}
                </span>
                <button
                  onClick={handleUpgrade}
                  disabled={!canUpgrade}
                  className="bg-purple-600 hover:bg-purple-700 text-white py-1 px-3 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Upgrade
                </button>
              </div>
            </div>
          )}
          
          {selectedTileData?.type === 'building' && !upgradeCost && (selectedTileData.building?.name === 'HQ' || selectedTileData.building?.name === 'Depot') && (
            <div className="mt-2 p-2 bg-green-900/30 rounded border border-green-700/30">
              <p className="text-sm text-green-300">🏆 Max Level Reached!</p>
            </div>
          )}
          
          {/* Depot Storage Information */}
          {selectedTileData?.type === 'building' && selectedTileData.building?.name === 'Depot' && (
            <div className="mt-3 p-2 bg-blue-900/30 rounded border border-blue-700/30">
              <h5 className="text-blue-300 text-sm font-medium mb-1">📦 Storage Capacity</h5>
              <p className="text-xs text-gray-300">
                Level {selectedTileData.building.level} Depot provides:
              </p>
              <p className="text-sm text-blue-300 font-medium">
                +{selectedTileData.building.level === 1 ? '500' : selectedTileData.building.level === 2 ? '1,500' : selectedTileData.building.level === 3 ? '3,000' : '5,000'} storage capacity
              </p>
            </div>
          )}
          
          {/* Nursery Information - Seed crafting moved to popup */}
          {selectedTileData?.type === 'building' && selectedTileData.building?.name === 'Nursery' && (
            <div className="mt-3 p-2 bg-green-900/30 rounded border border-green-700/30">
              <h5 className="text-green-300 text-sm font-medium mb-1">🌱 Nursery</h5>
              <p className="text-xs text-gray-300">
                Click on the Nursery tile to craft seeds from bamboo
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-600/30">
          <p className="text-sm text-gray-300">Select a tile to place buildings</p>
        </div>
      )}
      
      <div className="space-y-3">
        {buildings.map(building => {
          const canBuild = selectedTile && 
            player.bamboo >= building.bambooCost && 
            player.seeds >= building.seedCost &&
            canPlaceBuilding?.(selectedTile) !== false &&
            (!selectedTileData || selectedTileData.type === 'empty')
            
          return (
            <div key={building.name} className="bg-gray-800/40 p-3 rounded-lg border border-gray-600/30">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{building.icon}</span>
                <div className="flex-1">
                  <h4 className="text-white font-medium">{building.name}</h4>
                  <p className="text-xs text-gray-400">{building.description}</p>
                </div>
              </div>
              <div className="text-sm text-green-300 mb-2">
                Cost: {building.bambooCost} 🎋 {building.seedCost > 0 ? `+ ${building.seedCost} 🌱` : ''}
              </div>
              <button 
                onClick={() => handleBuild(building.name)}
                disabled={!canBuild}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Build {!canBuild && '- Check requirements'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ConvoyTab() {
  const { dispatchConvoy, player, convoys, updateConvoys, getSafeRouteBonus } = useGameStore()
  const [selectedType, setSelectedType] = useState<'porter' | 'raft'>('porter')
  const [bambooAmount, setBambooAmount] = useState(150)
  const [duration, setDuration] = useState(15)

  // Update convoys on render
  React.useEffect(() => {
    updateConvoys()
  }, [updateConvoys])

  const handleDispatch = () => {
    const success = dispatchConvoy(selectedType, bambooAmount, duration)
    if (!success) {
      alert(`Not enough bamboo! Need ${bambooAmount} 🎋`)
    }
  }

  const convoyTypes = {
    porter: {
      name: 'Porter Convoy',
      icon: '🚛',
      minCapacity: 100,
      maxCapacity: 500,
      minDuration: 10,
      maxDuration: 60,
      maxFailureRate: 25, // 25% max failure = 75% min success
      minFailureRate: 5,  // 5% min failure = 95% max success
    },
    raft: {
      name: 'Raft Convoy',
      icon: '🚣',
      minCapacity: 200,
      maxCapacity: 1000,
      minDuration: 3,
      maxDuration: 30,
      maxFailureRate: 35, // 35% max failure = 65% min success  
      minFailureRate: 10, // 10% min failure = 90% max success
    }
  }

  const selectedConvoy = convoyTypes[selectedType]
  
  // Calculate risk and reward based on duration
  // Risk decreases with time (longer trips = safer)
  // Reward increases with time (longer trips = more profit)
  const durationProgress = (duration - selectedConvoy.minDuration) / (selectedConvoy.maxDuration - selectedConvoy.minDuration)
  
  // Risk calculation: starts at max risk, decreases to min risk
  let failureRate = selectedConvoy.maxFailureRate - (durationProgress * (selectedConvoy.maxFailureRate - selectedConvoy.minFailureRate))
  
  // Apply Safe Route bonus from raids
  const safeRouteBonus = getSafeRouteBonus('convoy-route')
  const originalFailureRate = failureRate
  if (safeRouteBonus > 0) {
    failureRate = Math.max(failureRate * 0.7, failureRate - safeRouteBonus)
  }
  
  const successRate = 100 - failureRate
  
  // Reward calculation: increases with duration
  // Short trips: 10-20% profit, Long trips: 30-60% profit
  const baseProfit = selectedType === 'porter' ? 0.1 : 0.15 // Base 10% or 15%
  const maxProfit = selectedType === 'porter' ? 0.5 : 0.7   // Max 50% or 70%
  const profitRate = baseProfit + (durationProgress * (maxProfit - baseProfit))
  
  const estimatedProfit = Math.floor(bambooAmount * profitRate)
  const canDispatch = player.bamboo >= bambooAmount

  return (
    <div className="space-y-4">
      <h3 className="text-white font-bold text-lg">Trade Convoys</h3>
      
      {/* Convoy Type Selection */}
      <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-600/30">
        <h4 className="text-gray-300 font-medium mb-2">Select Convoy Type</h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setSelectedType('porter')
              setBambooAmount(150)
              setDuration(15)
            }}
            className={`p-2 rounded transition-colors text-sm ${
              selectedType === 'porter' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            🚛 Porter (Land)
          </button>
          <button
            onClick={() => {
              setSelectedType('raft')
              setBambooAmount(300)
              setDuration(15)
            }}
            className={`p-2 rounded transition-colors text-sm ${
              selectedType === 'raft' 
                ? 'bg-cyan-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            🚣 Raft (River)
          </button>
        </div>
      </div>

      {/* Parameters */}
      <div className="bg-green-900/30 p-3 rounded-lg border border-green-700/30">
        <h4 className="text-green-300 font-medium mb-2">{selectedConvoy.icon} {selectedConvoy.name}</h4>
        
        {/* Bamboo Amount Slider */}
        <div className="mb-3">
          <label className="block text-sm text-gray-300 mb-1">
            Bamboo Amount: {bambooAmount} 🎋
          </label>
          <input
            type="range"
            min={selectedConvoy.minCapacity}
            max={Math.min(selectedConvoy.maxCapacity, player.bamboo)}
            value={bambooAmount}
            onChange={(e) => setBambooAmount(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Duration Slider */}
        <div className="mb-3">
          <label className="block text-sm text-gray-300 mb-1">
            Duration: {duration} minutes
          </label>
          <input
            type="range"
            min={selectedConvoy.minDuration}
            max={selectedConvoy.maxDuration}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
          <div>Success: {Math.round(successRate)}%</div>
          <div>Est. Profit: +{estimatedProfit} 🎋</div>
          <div>Total Return: ~{bambooAmount + estimatedProfit} 🎋</div>
          <div>Risk Level: {failureRate < 15 ? 'Low' : failureRate < 30 ? 'Medium' : 'High'}</div>
        </div>

        {/* Safe Route Bonus */}
        {safeRouteBonus > 0 && (
          <div className="bg-green-900/30 p-2 rounded mb-3 border border-green-700/50">
            <div className="text-green-300 text-sm font-medium flex items-center gap-2">
              🛡️ Safe Route Active
            </div>
            <div className="text-xs text-green-200">
              -{safeRouteBonus.toFixed(0)}% failure rate from cleared camps
              {originalFailureRate !== failureRate && (
                <span className="text-green-400">
                  {' '}({originalFailureRate.toFixed(0)}% → {failureRate.toFixed(0)}%)
                </span>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleDispatch}
          disabled={!canDispatch}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Dispatch {selectedConvoy.name} {!canDispatch && `- Need ${bambooAmount} 🎋`}
        </button>
      </div>

      {/* Active Convoys */}
      <div className="bg-yellow-900/30 p-3 rounded-lg border border-yellow-700/30">
        <h4 className="text-yellow-300 font-medium mb-2">Active Convoys</h4>
        {convoys.length > 0 ? (
          <div className="space-y-2">
            {convoys.map(convoy => {
              const timeLeft = Math.max(0, convoy.startTime + convoy.duration - Date.now())
              const progress = 1 - (timeLeft / convoy.duration)
              const minutesLeft = Math.ceil(timeLeft / (60 * 1000))
              
              return (
                <div key={convoy.id} className="bg-yellow-800/30 p-2 rounded">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">
                      {convoy.type === 'porter' ? '🚛' : '🚣'} {convoy.bambooAmount} 🎋
                    </span>
                    <span className="text-xs">{minutesLeft}m left</span>
                  </div>
                  <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-yellow-500 h-full transition-all duration-300"
                      style={{ width: `${Math.min(100, progress * 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-300">No convoys currently active.</p>
        )}
      </div>
    </div>
  )
}

function QuestsTab() {
  const { quests, canGamble, gambleBamboo, player } = useGameStore()
  const [wager, setWager] = useState(100)
  const [multiplier, setMultiplier] = useState(2)
  const [lastGambleResult, setLastGambleResult] = useState<string | null>(null)

  const canGambleNow = canGamble()
  const timeUntilNextGamble = canGambleNow ? 0 : Math.ceil(60 - ((Date.now() - player.lastGamble) / (1000 * 60)))

  const handleGamble = () => {
    if (canGambleNow && player.bamboo >= wager) {
      const result = gambleBamboo(wager, multiplier)
      if (result.won) {
        setLastGambleResult(`🎉 Won ${result.payout} bamboo!`)
      } else {
        setLastGambleResult(`💸 Lost ${wager} bamboo. Better luck next time!`)
      }
      setTimeout(() => setLastGambleResult(null), 5000)
    }
  }

  const formatReward = (reward: { bamboo?: number; seeds?: number; charms?: number }) => {
    const parts = []
    if (reward.bamboo) parts.push(`${reward.bamboo} 🎋`)
    if (reward.seeds) parts.push(`${reward.seeds} 🌱`)
    if (reward.charms) parts.push(`${reward.charms} 🔮`)
    return parts.join(' + ')
  }

  return (
    <div className="space-y-4">
      <h3 className="text-white font-bold text-lg">Quests & Games</h3>
      
      {/* DEBUG: Test scrolling with extra content */}
      <div className="bg-red-900/20 p-2 rounded border border-red-500/30">
        <div className="text-red-300 text-xs">DEBUG: Scroll Test</div>
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className="text-gray-400 text-xs py-1">Test line {i + 1}</div>
        ))}
      </div>
      
      {/* Gambling Mini-Game */}
      <div className="bg-orange-900/30 p-3 rounded-lg border border-orange-700/30">
        <h4 className="text-orange-300 font-medium mb-2">🎰 Lucky Bamboo (Hourly)</h4>
        <p className="text-sm text-gray-300 mb-3">Wager bamboo for a chance to multiply your investment!</p>
        
        {lastGambleResult && (
          <div className="bg-black/30 p-2 rounded mb-3 text-center text-sm font-bold">
            {lastGambleResult}
          </div>
        )}
        
        {canGambleNow ? (
          <>
            <div className="mb-3">
              <label className="block text-sm text-gray-300 mb-1">
                Wager: {wager} 🎋
              </label>
              <input
                type="range"
                min="50"
                max={Math.min(1000, player.bamboo)}
                value={wager}
                onChange={(e) => setWager(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm text-gray-300 mb-1">
                Multiplier: {multiplier}x (Win Chance: {Math.max(5, 50 - (multiplier - 2) * 10)}%)
              </label>
              <input
                type="range"
                min="2"
                max="10"
                value={multiplier}
                onChange={(e) => setMultiplier(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <button
              onClick={handleGamble}
              disabled={player.bamboo < wager}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Gamble {wager} 🎋 for {wager * multiplier} 🎋
            </button>
          </>
        ) : (
          <div className="text-center text-gray-300">
            Next gamble available in {timeUntilNextGamble} minutes
          </div>
        )}
      </div>
      
      {/* Quests */}
      <div className="space-y-3">
        <h4 className="text-white font-medium">Active Quests</h4>
        {quests.map(quest => (
          <div key={quest.id} className={`p-3 rounded-lg border ${
            quest.completed 
              ? 'bg-green-900/30 border-green-700/30' 
              : 'bg-purple-900/30 border-purple-700/30'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              {quest.completed && <span className="text-green-400">✅</span>}
              <h5 className={`font-medium ${quest.completed ? 'text-green-300' : 'text-purple-300'}`}>
                {quest.title}
              </h5>
            </div>
            <p className="text-sm text-gray-300 mb-2">{quest.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-300">
                Reward: {formatReward(quest.reward)}
              </span>
              <span className={`text-sm ${quest.completed ? 'text-green-300' : 'text-yellow-300'}`}>
                {quest.progress}/{quest.target} {quest.completed && '✅'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
