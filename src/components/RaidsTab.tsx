'use client'

import React, { useState, useEffect } from 'react'
import { useGameStore } from '@/stores/gameStore'

export default function RaidsTab() {
  const { 
    raids, 
    player,
    generateRaidCamps, 
    startRaid, 
    updateActiveRaid,
    canAccessTier,
    getRaidAttempts,
    endRaid
  } = useGameStore()

  const [selectedCamp, setSelectedCamp] = useState<string | null>(null)
  const [selectedUnits, setSelectedUnits] = useState<string[]>([])
  const [selectedAbilities, setSelectedAbilities] = useState<string[]>([])

  // Generate camps on component mount
  useEffect(() => {
    generateRaidCamps()
  }, [generateRaidCamps])

  // Update active raid timer
  useEffect(() => {
    if (!raids.activeRaid) return
    
    const interval = setInterval(() => {
      updateActiveRaid()
    }, 1000)
    
    return () => clearInterval(interval)
  }, [raids.activeRaid, updateActiveRaid])

  const attempts = getRaidAttempts()
  
  const unitTypes = [
    { id: 'warrior', name: 'Warrior', cost: 2, icon: '⚔️', image: '/images/warrior.png', description: '100 HP, 1 DPS, melee fighter' },
    { id: 'archer', name: 'Archer', cost: 3, icon: '🏹', image: '/images/archer.jpeg', description: '70 HP, 5 DPS, ranged' },
    { id: 'monk', name: 'Monk', cost: 3, icon: '🧘', image: '/images/monk.png', description: '80 HP, 10 DPS, support' },
    { id: 'bomber', name: 'Bomber', cost: 4, icon: '💣', image: '/images/bomber.jpeg', description: '60 HP, 15 DPS, AoE' }
  ]

  const abilityTypes = [
    { id: 'smoke', name: 'Smoke Bomb', icon: '💨', description: '3s dodge (-75% damage)' },
    { id: 'rally', name: 'Rally Drum', icon: '🥁', description: '+25% speed for 6s' },
    { id: 'heal', name: 'Gourd Heal', icon: '🫗', description: 'Heal 120 HP in area' },
    { id: 'snare', name: 'Snare Trap', icon: '🪤', description: 'Root enemies for 2s' },
    { id: 'thunder', name: 'Thunderclap', icon: '⚡', description: '0.75s global stun' }
  ]

  const getTierColor = (tier: number) => {
    const colors = ['', 'text-green-400', 'text-blue-400', 'text-purple-400', 'text-orange-400', 'text-red-400']
    return colors[tier] || 'text-gray-400'
  }

  const getTierName = (tier: number) => {
    const names = ['', 'Novice', 'Veteran', 'Elite', 'Champion', 'Legendary']
    return names[tier] || 'Unknown'
  }

  const handleUnitToggle = (unitId: string) => {
    const unitCosts = { warrior: 2, archer: 3, monk: 3, bomber: 4 }
    const currentCost = selectedUnits.reduce((sum, id) => sum + unitCosts[id as keyof typeof unitCosts], 0)
    const unitCost = unitCosts[unitId as keyof typeof unitCosts]
    
    if (selectedUnits.includes(unitId)) {
      setSelectedUnits(prev => prev.filter(id => id !== unitId))
    } else if (currentCost + unitCost <= 10) {
      // Check if player has this troop type available
      const troopType = unitId as keyof typeof player.troops
      const currentlySelected = selectedUnits.filter(u => u === unitId).length
      const hasAvailable = player.troops[troopType] > currentlySelected
      
      if (hasAvailable) {
        setSelectedUnits(prev => [...prev, unitId])
      }
    }
  }

  const handleAbilityToggle = (abilityId: string) => {
    if (selectedAbilities.includes(abilityId)) {
      setSelectedAbilities(prev => prev.filter(id => id !== abilityId))
    } else if (selectedAbilities.length < 2) {
      setSelectedAbilities(prev => [...prev, abilityId])
    }
  }

  const handleStartRaid = () => {
    if (!selectedCamp || selectedUnits.length === 0 || selectedAbilities.length !== 2) return
    
    const success = startRaid(selectedCamp, selectedUnits, selectedAbilities)
    if (success) {
      // Reset selections
      setSelectedCamp(null)
      setSelectedUnits([])
      setSelectedAbilities([])
    } else {
      alert('Failed to start raid. Check requirements.')
    }
  }

  // Show active raid screen
  if (raids.activeRaid) {
    return (
      <div className="space-y-4">
        <h3 className="text-white font-bold text-lg">🏴‍☠️ Raid in Progress</h3>
        
        <div className="bg-red-900/30 p-4 rounded-lg border border-red-700/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-red-300 font-medium">Time Left</span>
            <span className="text-white font-bold text-xl">
              {Math.ceil(raids.activeRaid.timeLeft / 1000)}s
            </span>
          </div>
          
          <div className="bg-red-600/30 rounded-full h-3 mb-3">
            <div 
              className="bg-red-400 h-full rounded-full transition-all duration-1000"
              style={{ width: `${(raids.activeRaid.timeLeft / raids.activeRaid.duration) * 100}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-red-300">Core Health</span>
            <span className="text-white">{raids.activeRaid.coreHp}/{raids.activeRaid.maxCoreHp}</span>
          </div>
          
          <div className="bg-green-600/30 rounded-full h-3 mt-1">
            <div 
              className="bg-green-400 h-full rounded-full"
              style={{ width: `${(raids.activeRaid.coreHp / raids.activeRaid.maxCoreHp) * 100}%` }}
            />
          </div>
        </div>
        
        {/* Abilities */}
        <div className="bg-blue-900/30 p-3 rounded-lg border border-blue-700/30">
          <h4 className="text-blue-300 font-medium mb-2">Abilities</h4>
          <div className="grid grid-cols-2 gap-2">
            {raids.activeRaid.abilities.map(ability => {
              const cooldownLeft = Math.max(0, ability.cooldown - (Date.now() - ability.lastUsed))
              const isReady = cooldownLeft === 0
              
              return (
                <button
                  key={ability.id}
                  onClick={() => useGameStore.getState().useRaidAbility(ability.id)}
                  disabled={!isReady}
                  className={`p-2 rounded text-sm transition-colors ${
                    isReady 
                      ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                      : 'bg-gray-600 text-gray-400'
                  }`}
                >
                  {ability.name}
                  {!isReady && <div className="text-xs">{Math.ceil(cooldownLeft / 1000)}s</div>}
                </button>
              )
            })}
          </div>
        </div>
        
        {/* Units Status */}
        <div className="bg-green-900/30 p-3 rounded-lg border border-green-700/30">
          <h4 className="text-green-300 font-medium mb-2">Units</h4>
          <div className="space-y-2">
            {raids.activeRaid.units.map(unit => (
              <div key={unit.id} className="flex items-center justify-between text-sm">
                <span className="text-green-200">{unit.type} (Lane {unit.position.lane + 1})</span>
                <span className="text-white">{unit.hp}/{unit.maxHp} HP</span>
              </div>
            ))}
          </div>
        </div>
        
        <button
          onClick={() => endRaid('defeat')}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
        >
          Retreat
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-white font-bold text-lg">🏴‍☠️ Bandit Raids</h3>
      
      {/* Attempts Counter */}
      <div className="bg-yellow-900/30 p-3 rounded-lg border border-yellow-700/30">
        <div className="flex items-center justify-between">
          <span className="text-yellow-300 font-medium">Daily Attempts</span>
          <span className="text-white font-bold">{attempts.current}/{attempts.max}</span>
        </div>
        <div className="text-xs text-gray-300 mt-1">
          ⭐ {player.raids.stars} stars earned (+{Math.floor(player.raids.stars / 6)} bonus attempts)
        </div>
      </div>

      {/* Available Camps */}
      <div className="space-y-3">
        <h4 className="text-white font-medium">Available Camps</h4>
        {raids.availableCamps.length === 0 ? (
          <div className="bg-gray-800/30 p-3 rounded-lg text-center text-gray-300">
            No camps available. Check back daily!
          </div>
        ) : (
          raids.availableCamps.map(camp => (
            <div 
              key={camp.id} 
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedCamp === camp.id
                  ? 'bg-blue-900/50 border-blue-500'
                  : camp.clearedToday
                    ? 'bg-green-900/30 border-green-700/50'
                    : canAccessTier(camp.tier)
                      ? 'bg-gray-800/40 border-gray-600/30 hover:bg-gray-700/40'
                      : 'bg-gray-900/50 border-gray-700/30 opacity-50'
              }`}
              onClick={() => canAccessTier(camp.tier) && !camp.clearedToday && setSelectedCamp(camp.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`font-medium ${getTierColor(camp.tier)}`}>
                  T{camp.tier} {getTierName(camp.tier)} Camp
                </span>
                {camp.clearedToday && (
                  <span className="text-green-400 text-sm">✅ Cleared</span>
                )}
                {!canAccessTier(camp.tier) && (
                  <span className="text-red-400 text-sm">🔒 Locked</span>
                )}
              </div>
              
              <div className="text-sm text-gray-300 grid grid-cols-2 gap-2">
                <div>Reward: {camp.rewards.bamboo} 🎋</div>
                <div>Seed: {camp.rewards.seedChance}%</div>
                <div>Stars: {'⭐'.repeat(camp.stars)}</div>
                <div>Defenses: {camp.defenses.length}</div>
              </div>
              
              {camp.safeRouteExpiry && camp.safeRouteExpiry > Date.now() && (
                <div className="text-green-300 text-xs mt-1">
                  🛡️ Safe Route: {Math.ceil((camp.safeRouteExpiry - Date.now()) / 60000)}m left
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Squad Selection */}
      {selectedCamp && (
        <>
          <div className="bg-purple-900/30 p-3 rounded-lg border border-purple-700/30">
            <h4 className="text-purple-300 font-medium mb-2">Select Squad (Max 10 pts)</h4>
            <div className="text-xs text-gray-300 mb-2">
              Current: {selectedUnits.reduce((sum, id) => sum + ({ warrior: 2, archer: 3, monk: 3, bomber: 4 }[id as keyof typeof unitTypes] || 0), 0)}/10 pts
            </div>
            <div className="grid grid-cols-2 gap-2">
              {unitTypes.map(unit => {
                const available = player.troops[unit.id as keyof typeof player.troops]
                const selected = selectedUnits.filter(u => u === unit.id).length
                const canSelect = available > selected
                
                return (
                  <button
                    key={unit.id}
                    onClick={() => handleUnitToggle(unit.id)}
                    disabled={!canSelect && !selectedUnits.includes(unit.id)}
                    className={`p-2 rounded text-sm transition-colors ${
                      selectedUnits.includes(unit.id)
                        ? 'bg-purple-600 text-white'
                        : canSelect
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                          : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <img 
                        src={unit.image} 
                        alt={unit.name}
                        className="w-4 h-4 object-contain"
                      />
                      {unit.name} ({unit.cost}pt)
                    </div>
                    <div className="text-xs">{selected}/{available} available</div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="bg-orange-900/30 p-3 rounded-lg border border-orange-700/30">
            <h4 className="text-orange-300 font-medium mb-2">Select Abilities (Choose 2)</h4>
            <div className="text-xs text-gray-300 mb-2">
              Selected: {selectedAbilities.length}/2
            </div>
            <div className="grid grid-cols-1 gap-2">
              {abilityTypes.map(ability => (
                <button
                  key={ability.id}
                  onClick={() => handleAbilityToggle(ability.id)}
                  className={`p-2 rounded text-sm transition-colors text-left ${
                    selectedAbilities.includes(ability.id)
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  {ability.icon} {ability.name}
                  <div className="text-xs opacity-75">{ability.description}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleStartRaid}
            disabled={selectedUnits.length === 0 || selectedAbilities.length !== 2 || attempts.current <= 0}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:text-gray-400 text-white py-3 px-4 rounded-lg transition-colors font-medium"
          >
            Start Raid! ({attempts.current} attempts left)
          </button>
        </>
      )}
    </div>
  )
}