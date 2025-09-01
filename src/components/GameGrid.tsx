'use client'

import { useState, useEffect } from 'react'
import { useGesture } from '@use-gesture/react'
import { useGameStore } from '@/stores/gameStore'
import NurseryPopup from './NurseryPopup'
import BarracksPopup from './BarracksPopup'

// Game world is 15x15 square grid (rotated 45 degrees)
const GRID_SIZE = 15
const TILE_SIZE = 48

interface Tile {
  id: string
  type: 'empty' | 'building' | 'bamboo'
  building?: {
    name: string
    level: number
    icon: string
  }
  resource?: {
    type: 'bamboo'
    amount: number
    stored: number
  }
}

interface GameGridProps {
  selectedTile?: string | null
  onTileSelect?: (tileId: string | null) => void
}

export default function GameGrid({ selectedTile, onTileSelect }: GameGridProps) {
  const { tiles: gameTiles, collectBamboo, updateBambooProduction, collectCraftedSeed, timeSpeed } = useGameStore()
  const [forceUpdate, setForceUpdate] = useState(0)

  // Force re-render every 10 seconds to update bamboo images
  useEffect(() => {
    const interval = setInterval(() => {
      setForceUpdate(prev => prev + 1)
    }, 10000)
    return () => clearInterval(interval)
  }, [])
  
  // Create visual tiles from game state
  const tiles = []
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const tileId = `${x},${y}`
      const gameTile = gameTiles[tileId]
      tiles.push({
        id: tileId,
        type: gameTile?.type || 'empty',
        building: gameTile?.building,
        resource: gameTile?.bamboo ? { 
          type: 'bamboo' as const, 
          amount: gameTile.bamboo.production,
          stored: Math.floor(gameTile.bamboo.stored || 0)
        } : undefined
      })
    }
  }
  const [isDragging, setIsDragging] = useState(false)
  const [nurseryPopup, setNurseryPopup] = useState<{
    tileId: string;
  } | null>(null)
  const [barracksPopup, setBarracksPopup] = useState<{
    tileId: string;
  } | null>(null)

  // Pan and zoom state for mobile navigation
  const [transform, setTransform] = useState({ 
    x: 0, 
    y: 0, 
    scale: 1 
  })

  // Touch gestures for pan and zoom
  const bind = useGesture({
    onDrag: ({ offset: [x, y], pinching }) => {
      if (!pinching) {
        setTransform(prev => ({ ...prev, x, y }))
        setIsDragging(true)
      }
    },
    onDragEnd: () => {
      setIsDragging(false)
    },
    onPinch: ({ offset: [scale] }) => {
      setTransform(prev => ({ 
        ...prev, 
        scale: Math.min(Math.max(0.5, scale), 3) 
      }))
    }
  }, {
    drag: { 
      from: () => [transform.x, transform.y],
      bounds: { 
        left: -GRID_SIZE * TILE_SIZE / 2, 
        right: GRID_SIZE * TILE_SIZE / 2,
        top: -GRID_SIZE * TILE_SIZE / 2, 
        bottom: GRID_SIZE * TILE_SIZE / 2 
      }
    },
    pinch: { 
      from: () => [transform.scale, 0] 
    }
  })

  const handleTileClick = (tileId: string, event: React.MouseEvent) => {
    if (!isDragging && onTileSelect) {
      // First update bamboo production, then check for collection
      updateBambooProduction()
      
      const tile = tiles.find(t => t.id === tileId)
      
      // Check for bamboo collection
      if (tile && tile.type === 'bamboo' && tile.resource && tile.resource.stored > 0) {
        const collected = collectBamboo(tileId)
        if (collected > 0) {
          onTileSelect(selectedTile === tileId ? null : tileId)
          return
        }
      }
      
      // Check for Nursery - show popup instead of just selecting
      if (tile && tile.type === 'building' && tile.building?.name === 'Nursery') {
        setNurseryPopup({ tileId })
        return
      }
      
      // Check for Barracks - show popup instead of just selecting
      if (tile && tile.type === 'building' && tile.building?.name === 'Barracks') {
        setBarracksPopup({ tileId })
        return
      }
      
      onTileSelect(selectedTile === tileId ? null : tileId)
    }
  }

  const getTileContent = (tile: Tile) => {
    switch (tile.type) {
      case 'building':
        // Show HQ images based on level
        if (tile.building?.name === 'HQ') {
          const level = tile.building.level || 1
          return (
            <div className="flex flex-col items-center">
              <img 
                src={`/images/hq-${level}.PNG`} 
                alt={`HQ Level ${level}`}
                className="w-8 h-8 object-contain"
                style={{ transform: 'rotate(-45deg)' }}
              />
              <div className="text-xs text-white bg-black/50 px-1 rounded">
                L{level}
              </div>
            </div>
          )
        }
        
        // Show Barracks images based on level
        if (tile.building?.name === 'Barracks') {
          const level = tile.building.level || 1
          return (
            <div className="flex flex-col items-center">
              <img 
                src={`/images/barracks-${level}.jpeg`} 
                alt={`Barracks Level ${level}`}
                className="w-8 h-8 object-contain"
                style={{ transform: 'rotate(-45deg)' }}
              />
              <div className="text-xs text-white bg-black/50 px-1 rounded">
                L{level}
              </div>
            </div>
          )
        }
        
        // Show Nursery seed crafting progress
        if (tile.building?.name === 'Nursery') {
          const gameTile = gameTiles[tile.id]
          const seedCrafting = gameTile?.building?.seedCrafting
          
          return (
            <div className="flex flex-col items-center text-center">
              <div className="text-lg">🌱</div>
              {seedCrafting && (
                <div className="text-xs">
                  {seedCrafting.completed ? (
                    <div className="text-green-300 bg-green-900/50 px-1 rounded">Ready!</div>
                  ) : (
                    <div className="text-yellow-300 bg-yellow-900/50 px-1 rounded">
                      {Math.ceil((seedCrafting.startTime + seedCrafting.duration - Date.now()) / (60 * 1000))}m
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        }
        
        const getBuildingIcon = (name?: string) => {
          switch (name) {
            case 'Depot': return '📦'
            case 'Barracks': return '🏰'
            default: return '🏗️'
          }
        }
        return (
          <div className="text-lg">{getBuildingIcon(tile.building?.name)}</div>
        )
      case 'bamboo':
        const getBambooImage = () => {
          const gameTile = gameTiles[tile.id]
          if (!gameTile?.bamboo) return 1
          
          // Use plantedAt if available, otherwise fall back to lastCollected for backward compatibility
          const plantedTime = gameTile.bamboo.plantedAt || gameTile.bamboo.lastCollected
          const timeSincePlanted = Date.now() - plantedTime
          const effectiveTime = timeSpeed.enabled ? 
            timeSincePlanted * timeSpeed.multiplier : 
            timeSincePlanted
          const secondsElapsed = effectiveTime / 1000
          
          const stage = secondsElapsed >= 180 ? 4 : secondsElapsed >= 120 ? 3 : secondsElapsed >= 60 ? 2 : 1
          
          // Log bamboo status for debugging
          if (gameTile.bamboo.stored > 0 || secondsElapsed > 175) {
            console.log(`Tile ${tile.id}: ${secondsElapsed.toFixed(1)}s, stage ${stage}, stored: ${gameTile.bamboo.stored.toFixed(2)}, plantedAt: ${gameTile.bamboo.plantedAt}, lastCollected: ${gameTile.bamboo.lastCollected}`)
          }
          
          // Each stage lasts 60 seconds, total 180 seconds (3 minutes) to full growth
          return stage
        }
        
        const bambooStage = getBambooImage()
        
        return (
          <div className="text-xs text-green-300 flex flex-col items-center">
            <img 
              key={`${tile.id}-${bambooStage}-${forceUpdate}`}
              src={`/images/bamboo-grow-${bambooStage}.PNG`} 
              alt={`Bamboo stage ${bambooStage}`}
              className="w-8 h-8 object-contain"
              style={{ transform: 'rotate(-45deg)' }}
            />
            <div className="text-center">
              <div className="text-[10px]">{tile.resource?.amount || 20}/hr</div>
              {tile.resource && tile.resource.stored > 0 && (
                <div className="text-yellow-300 font-bold text-[10px]">
                  +{tile.resource.stored}
                </div>
              )}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-green-800 to-green-900">
      {/* Grid Container */}
      <div
        {...bind()}
        className="absolute inset-0 touch-none"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: 'center center',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
      >
        <div 
          className="relative mx-auto my-auto"
          style={{ 
            width: GRID_SIZE * TILE_SIZE,
            height: GRID_SIZE * TILE_SIZE,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(45deg)'
          }}
        >
          {/* Grid Lines */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Vertical lines */}
            {Array.from({ length: GRID_SIZE + 1 }, (_, i) => (
              <div
                key={`v-${i}`}
                className="absolute w-px bg-green-700/30 h-full"
                style={{ left: i * TILE_SIZE }}
              />
            ))}
            {/* Horizontal lines */}
            {Array.from({ length: GRID_SIZE + 1 }, (_, i) => (
              <div
                key={`h-${i}`}
                className="absolute h-px bg-green-700/30 w-full"
                style={{ top: i * TILE_SIZE }}
              />
            ))}
          </div>

          {/* Tiles */}
          {tiles.map((tile, index) => {
            const x = index % GRID_SIZE
            const y = Math.floor(index / GRID_SIZE)
            const isSelected = selectedTile === tile.id
            
            return (
              <div
                key={tile.id}
                className={`absolute border border-green-700/20 transition-all duration-150 flex items-center justify-center text-center cursor-pointer select-none ${
                  isSelected 
                    ? 'bg-yellow-400/30 border-yellow-400 shadow-lg scale-105 z-10' 
                    : tile.type === 'empty' 
                      ? 'bg-green-800/40 hover:bg-green-700/50' 
                      : 'bg-green-700/60 hover:bg-green-600/60'
                }`}
                style={{
                  left: x * TILE_SIZE,
                  top: y * TILE_SIZE,
                  width: TILE_SIZE,
                  height: TILE_SIZE
                }}
                onClick={(event) => handleTileClick(tile.id, event)}
              >
                {getTileContent(tile)}
                
                {/* Tile coordinates (debug) */}
                {isSelected && (
                  <div className="absolute -top-6 left-0 text-xs text-yellow-300 font-mono">
                    {x},{y}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile Controls Overlay */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <button
          className="bg-black/50 text-white p-2 rounded-lg text-sm backdrop-blur-sm"
          onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
        >
          Reset View
        </button>
        <div className="bg-black/50 text-white px-2 py-1 rounded text-xs backdrop-blur-sm">
          Zoom: {transform.scale.toFixed(1)}x
        </div>
      </div>

      {/* Selected tile info */}
      {selectedTile && (
        <div className="absolute bottom-4 left-4 bg-black/70 text-white p-3 rounded-lg backdrop-blur-sm">
          <div className="text-sm font-bold">Tile: {selectedTile}</div>
          <div className="text-xs opacity-75">Tap to deselect</div>
        </div>
      )}

      {/* Nursery Popup */}
      {nurseryPopup && (
        <NurseryPopup
          tileId={nurseryPopup.tileId}
          onClose={() => setNurseryPopup(null)}
        />
      )}

      {/* Barracks Popup */}
      {barracksPopup && (
        <BarracksPopup
          tileId={barracksPopup.tileId}
          onClose={() => setBarracksPopup(null)}
        />
      )}
    </div>
  )
}