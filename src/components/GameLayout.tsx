'use client'

import { useState, useEffect } from 'react'
import GameGrid from './GameGrid'
import MobileUI from './MobileUI'
import { useGameStore } from '@/stores/gameStore'

export default function GameLayout() {
  const [activeTab, setActiveTab] = useState<'land' | 'buildings' | 'convoy' | 'quests' | 'raids'>('land')
  const [selectedTile, setSelectedTile] = useState<string | null>(null)
  const { updateConvoys, updateBambooProduction, updateQuests, updateSeedCrafting, updateTroopTraining, generateRaidCamps } = useGameStore()

  // Auto-update convoys, bamboo production, quests, seed crafting, and raids every 5 seconds
  useEffect(() => {
    // Generate initial raids on first load
    generateRaidCamps()
    
    const interval = setInterval(() => {
      updateConvoys()
      updateBambooProduction()
      updateQuests()
      updateSeedCrafting()
      updateTroopTraining()
      generateRaidCamps() // Check for daily refresh
    }, 5000)

    return () => clearInterval(interval)
  }, [updateConvoys, updateBambooProduction, updateQuests, updateSeedCrafting, updateTroopTraining, generateRaidCamps])

  return (
    <div className="bg-gradient-to-br from-green-800 via-green-900 to-green-950 flex flex-col overflow-hidden px-2 pb-2" style={{ height: '100dvh' }}>
      <div className="h-full w-full border-2 border-green-600/30 border-t-0 rounded-b-lg overflow-hidden flex flex-col">
      {/* Force landscape orientation hint */}
      <div className="portrait:flex portrait:items-center portrait:justify-center portrait:bg-black/80 portrait:text-white portrait:text-center portrait:p-8 hidden">
        <div>
          <div className="text-6xl mb-4">📱</div>
          <h2 className="text-xl font-bold mb-2">Please rotate your device</h2>
          <p className="text-sm opacity-75">Bamboo Lands is best played in landscape mode</p>
        </div>
      </div>

      {/* Game content - hidden in portrait */}
      <div className="flex-1 flex flex-row landscape:flex portrait:hidden">
        {/* Main Game Area - takes up most of the screen */}
        <div className="flex-1 relative">
          <GameGrid selectedTile={selectedTile} onTileSelect={setSelectedTile} />
        </div>

        {/* Mobile UI Panel - right side */}
        <div className="w-1/4 h-full bg-black/20 backdrop-blur-sm border-l border-green-700/50">
          <MobileUI activeTab={activeTab} onTabChange={setActiveTab} selectedTile={selectedTile} />
        </div>
      </div>
      </div>
    </div>
  )
}
