'use client'

import { useGameStore } from '@/stores/gameStore'

interface NurseryPopupProps {
  tileId: string
  onClose: () => void
}

export default function NurseryPopup({ tileId, onClose }: NurseryPopupProps) {
  const { tiles, canCraftSeed, startSeedCrafting, collectCraftedSeed } = useGameStore()
  
  const tile = tiles[tileId]
  if (!tile || tile.type !== 'building' || tile.building?.name !== 'Nursery') {
    return null
  }

  const seedCrafting = tile.building.seedCrafting

  const handleStartCrafting = () => {
    const success = startSeedCrafting(tileId)
    if (!success) {
      alert('Cannot craft seed. Need 20 bamboo and Nursery must not be busy.')
    }
    // Keep popup open after starting crafting
  }

  const handleCollectSeed = () => {
    const success = collectCraftedSeed(tileId)
    if (!success) {
      alert('No seed ready to collect.')
    }
    // Keep popup open after collecting so user can craft another seed
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      
      {/* Popup Box - Centered in map area (excludes right sidebar) */}
      <div className="fixed z-50 flex items-center justify-center pointer-events-none"
           style={{
             left: 0,
             top: 0,
             right: '320px', // Account for sidebar width (w-80 = 320px)
             bottom: 0
           }}>
        <div className="bg-green-800/95 backdrop-blur-sm border-2 border-green-600 rounded-lg p-4 shadow-xl flex flex-col pointer-events-auto min-w-80 max-w-96">
          {/* Content will naturally expand the height */}
        
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-green-200 font-bold text-lg flex items-center gap-2">
            🌱 Nursery
          </h3>
          <button
            onClick={onClose}
            className="text-green-300 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <p className="text-green-100 text-sm">
            Transform bamboo into seeds for expanding your grove!
          </p>

          {/* Dynamic content area */}
          <div className="space-y-3">
            {seedCrafting ? (
              seedCrafting.completed ? (
                <div className="space-y-2 text-center">
                  <div className="flex items-center justify-center gap-2 text-green-300">
                    <span className="text-lg">✅</span>
                    <span className="font-medium">Seed ready to collect!</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-yellow-300">
                    <span className="text-lg">⏳</span>
                    <span className="text-sm">
                      Crafting... {Math.ceil((seedCrafting.startTime + seedCrafting.duration - Date.now()) / (60 * 1000))} min left
                    </span>
                  </div>
                  <div className="bg-yellow-600/30 rounded-full h-3 overflow-hidden border border-yellow-600/50">
                    <div 
                      className="bg-yellow-400 h-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(100, ((Date.now() - seedCrafting.startTime) / seedCrafting.duration) * 100)}%` 
                      }}
                    />
                  </div>
                  <p className="text-green-100/80 text-xs text-center">
                    Your seeds are growing! Come back when ready.
                  </p>
                </div>
              )
            ) : (
              <div className="space-y-3">
                <div className="bg-green-900/50 rounded-lg p-3 border border-green-700/50">
                  <div className="text-green-200 text-sm mb-2">Recipe:</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white">20 🎋 → 1 🌱</span>
                    <span className="text-yellow-300">10 min</span>
                  </div>
                </div>
                
                {!canCraftSeed(tileId) && (
                  <p className="text-red-300 text-xs text-center">
                    Need 20 bamboo to craft seeds
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Button area */}
          <div className="mt-4">
            {seedCrafting?.completed ? (
              <button
                onClick={handleCollectSeed}
                className="w-full bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded-lg transition-colors font-medium"
              >
                Collect Seed 🌱
              </button>
            ) : !seedCrafting ? (
              <button
                onClick={handleStartCrafting}
                disabled={!canCraftSeed(tileId)}
                className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:text-gray-400 text-white py-2 px-4 rounded-lg transition-colors font-medium"
              >
                Craft Seed (20 🎋)
              </button>
            ) : (
              <div className="w-full py-2 px-4 rounded-lg bg-gray-600/50 text-gray-300 text-center font-medium">
                Crafting in progress...
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  )
}