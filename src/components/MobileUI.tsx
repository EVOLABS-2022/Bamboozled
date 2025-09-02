'use client'

import React, { useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import RaidsTab from './RaidsTab'

interface MobileUIProps {
  activeTab: 'land' | 'buildings' | 'convoy' | 'quests' | 'raids' | 'settings'
  onTabChange: (tab: 'land' | 'buildings' | 'convoy' | 'quests' | 'raids' | 'settings') => void
  selectedTile?: string | null
  user?: any
  onSignOut?: () => void
}

export default function MobileUI({ activeTab, onTabChange, selectedTile, user, onSignOut }: MobileUIProps) {
  const { player, getMaxBambooStorage, timeSpeed, setTimeSpeedEnabled, setTimeSpeedMultiplier } = useGameStore()
  const [popupTab, setPopupTab] = useState<'land' | 'buildings' | 'convoy' | 'quests' | 'raids' | 'settings' | null>(null)
  const maxStorage = getMaxBambooStorage()
  const tabs = [
    { id: 'land' as const, name: 'Land', icon: '🌿' },
    { id: 'buildings' as const, name: 'Build', icon: '🏗️' },
    { id: 'convoy' as const, name: 'Trade', icon: '🚛' },
    { id: 'quests' as const, name: 'Quests', icon: '⚔️' },
    { id: 'raids' as const, name: 'Raids', icon: '🏴‍☠️' },
    { id: 'settings' as const, name: 'Settings', icon: '⚙️' },
  ]

  return (
    <div 
      className={`h-full flex flex-col transition-all duration-300 relative bg-black/20 backdrop-blur-sm border-l border-green-700/50 ${popupTab ? 'w-72' : 'w-auto'}`}
      onClick={(e) => e.stopPropagation()}
    >


      {/* Horizontal Tab Navigation */}
      <div className={`flex bg-black/30 flex-shrink-0 ${!popupTab ? 'flex-col w-16' : ''}`}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setPopupTab(tab.id)}
            className={`py-2 px-2 text-center transition-all bg-green-800/50 hover:bg-green-700/50 text-green-200 border-green-700/50 ${
              !popupTab
                ? 'border-b last:border-b-0 w-full' 
                : 'flex-1 border-r last:border-r-0'
            }`}
          >
            <div className="text-lg mb-1">{tab.icon}</div>
            {popupTab && <div className="text-xs font-medium">{tab.name}</div>}
          </button>
        ))}
      </div>
      
      
      {/* Tab Content Popup */}
      {popupTab && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setPopupTab(null)}
          />
          
          {/* Popup Content */}
          <div className="fixed inset-0 bg-green-900/95 backdrop-blur-sm z-50 flex flex-col">
            {/* Popup Header */}
            <div className="flex items-center justify-between p-4 border-b border-green-700/50 flex-shrink-0">
              <h2 className="text-white text-lg font-bold flex items-center gap-2">
                {tabs.find(t => t.id === popupTab)?.icon}
                {tabs.find(t => t.id === popupTab)?.name}
              </h2>
              <button 
                onClick={() => setPopupTab(null)}
                className="text-white hover:text-red-300 text-xl font-bold"
              >
                ×
              </button>
            </div>
            
            {/* Popup Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4">
              {popupTab === 'land' && <LandTab selectedTile={selectedTile} />}
              {popupTab === 'buildings' && <BuildingsTab selectedTile={selectedTile} />}
              {popupTab === 'convoy' && <ConvoyTab />}
              {popupTab === 'quests' && <QuestsTab />}
              {popupTab === 'raids' && <RaidsTab />}
              {popupTab === 'settings' && <SettingsTab user={user} onSignOut={onSignOut} timeSpeed={timeSpeed} setTimeSpeedEnabled={setTimeSpeedEnabled} setTimeSpeedMultiplier={setTimeSpeedMultiplier} />}
            </div>
          </div>
        </>
      )}
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
  const { buildOnTile, player, tiles, canPlaceBuilding } = useGameStore()
  
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

  const selectedTileData = selectedTile ? tiles[selectedTile] : null

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
          
          {/* Building Action Info */}
          {selectedTileData?.type === 'building' && (
            <div className="mt-3 p-2 bg-blue-900/30 rounded border border-blue-700/30">
              <p className="text-sm text-blue-300">
                Click on the building to manage and upgrade
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

function SettingsTab({ user, onSignOut, timeSpeed, setTimeSpeedEnabled, setTimeSpeedMultiplier }: { 
  user?: any
  onSignOut?: () => void
  timeSpeed: any
  setTimeSpeedEnabled: (enabled: boolean) => void
  setTimeSpeedMultiplier: (multiplier: number) => void
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-white font-bold text-lg">Settings</h3>
      
      {/* Account Section */}
      <div className="bg-blue-900/30 p-3 rounded-lg border border-blue-700/30">
        <h4 className="text-blue-300 font-medium mb-2">Account</h4>
        {user ? (
          <div className="space-y-3">
            <div className="text-sm text-gray-300">
              <strong>Email:</strong> {user.email}
            </div>
            <div className="text-xs text-gray-400">
              Game saves automatically every 30 seconds
            </div>
            <button
              onClick={onSignOut}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition-colors"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="text-sm text-gray-300">Not logged in</div>
        )}
      </div>

      {/* Developer Controls */}
      <div className="bg-red-900/30 p-3 rounded-lg border border-red-700/30">
        <h4 className="text-red-300 font-medium mb-2">⚡ Development Controls</h4>
        <p className="text-xs text-gray-400 mb-3">For testing and development purposes</p>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-red-300">Time Speed Multiplier</span>
            <button
              onClick={() => setTimeSpeedEnabled(!timeSpeed.enabled)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                timeSpeed.enabled 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-600 text-gray-300'
              }`}
            >
              {timeSpeed.enabled ? 'ON' : 'OFF'}
            </button>
          </div>
          
          {timeSpeed.enabled && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
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
              </div>
              <div className="text-center">
                <span className="text-sm text-white font-medium">{timeSpeed.multiplier}x Speed</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Game Info */}
      <div className="bg-green-900/30 p-3 rounded-lg border border-green-700/30">
        <h4 className="text-green-300 font-medium mb-2">Game Information</h4>
        <div className="text-sm text-gray-300 space-y-1">
          <div>Version: Alpha 1.0</div>
          <div>Auto-save: Every 30 seconds</div>
          <div>Platform: Web (Netlify + Supabase)</div>
        </div>
      </div>
    </div>
  )
}
