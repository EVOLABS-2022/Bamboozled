import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface Quest {
  id: string
  title: string
  description: string
  reward: { bamboo?: number; seeds?: number; charms?: number }
  progress: number
  target: number
  completed: boolean
  type: 'build' | 'plant' | 'convoy' | 'collect'
  requirement?: string
}

interface RaidUnit {
  id: string
  type: 'warrior' | 'archer' | 'monk' | 'bomber'
  hp: number
  maxHp: number
  dps: number
  position: { lane: number; progress: number } // 0-100%
  status: 'alive' | 'dead'
}

interface RaidAbility {
  id: 'smoke' | 'rally' | 'heal' | 'snare' | 'thunder'
  name: string
  description: string
  cooldown: number
  lastUsed: number
}

interface RaidDefense {
  type: 'watch_post' | 'horn_tower' | 'spike_tile'
  hp: number
  maxHp: number
  dps?: number
  position: { lane: number; progress: number }
  status: 'active' | 'destroyed'
}

interface RaidCamp {
  id: string
  tier: 1 | 2 | 3 | 4 | 5
  position: { x: number; y: number } // map coordinates
  defenses: RaidDefense[]
  rewards: {
    bamboo: number
    seedChance: number
    charmChance: number
  }
  clearedToday: boolean
  stars: number // 0-3 performance rating
  safeRouteExpiry?: number // timestamp when buff expires
}

interface ActiveRaid {
  campId: string
  startTime: number
  duration: number // 90000ms = 90s
  units: RaidUnit[]
  abilities: RaidAbility[]
  coreHp: number
  maxCoreHp: number
  status: 'active' | 'victory' | 'defeat'
  timeLeft: number
}

interface GameState {
  player: {
    bamboo: number
    seeds: number
    charms: number
    stats: {
      buildingsBuilt: number
      bambooPlanted: number
      convoysCompleted: number
      bambooCollected: number
    }
    lastGamble: number
    raids: {
      attemptsUsed: number
      stars: number
      lastRefresh: number
    }
    troops: {
      warrior: number
      archer: number
      monk: number
      bomber: number
    }
  }
  timeSpeed: {
    enabled: boolean
    multiplier: number
  }
  tiles: Record<string, {
    type: 'empty' | 'bamboo' | 'building'
    building?: {
      name: string
      level: number
      seedCrafting?: {
        startTime: number
        duration: number
        completed: boolean
      }
      troopTraining?: {
        troopType: 'warrior' | 'archer' | 'monk' | 'bomber'
        startTime: number
        duration: number
        completed: boolean
        quantity: number
      }
    }
    bamboo?: {
      level: number
      production: number
      stored: number
      lastCollected: number
      plantedAt: number
    }
  }>
  convoys: Array<{
    id: string
    type: 'porter' | 'raft'
    startTime: number
    duration: number
    originalDuration: number
    bambooAmount: number
    status: 'active' | 'completed' | 'failed'
  }>
  quests: Quest[]
  raids: {
    availableCamps: RaidCamp[]
    activeRaid: ActiveRaid | null
    lastDailyRefresh: number
  }
}

interface GameActions {
  // Basic resource management
  addBamboo: (amount: number) => void
  spendBamboo: (amount: number) => boolean
  addSeeds: (amount: number) => void
  spendSeeds: (amount: number) => boolean
  getMaxBambooStorage: () => number
  getCurrentBambooStorage: () => number
  
  // Tile management
  plantBamboo: (tileId: string) => boolean
  buildOnTile: (tileId: string, buildingName: string) => boolean
  canPlaceBuilding: (tileId: string) => boolean
  collectBamboo: (tileId: string) => number
  collectAllBamboo: () => number
  updateBambooProduction: () => void
  
  // Building upgrade system
  canUpgradeBuilding: (tileId: string) => boolean
  upgradeBuilding: (tileId: string) => boolean
  getBuildingUpgradeCost: (tileId: string) => { seeds?: number; bamboo?: number } | null
  
  // Seed crafting system
  canCraftSeed: (tileId: string) => boolean
  startSeedCrafting: (tileId: string) => boolean
  collectCraftedSeed: (tileId: string) => boolean
  updateSeedCrafting: () => void
  
  // Convoy system
  dispatchConvoy: (type: 'porter' | 'raft', bambooAmount: number, duration?: number) => boolean
  updateConvoys: () => void
  
  // Quest system
  updateQuests: () => void
  completeQuest: (questId: string) => void
  
  // Gambling system
  canGamble: () => boolean
  gambleBamboo: (wager: number, multiplier: number) => { won: boolean; payout: number }
  
  // Time Speed Control (for testing)
  setTimeSpeedEnabled: (enabled: boolean) => void
  setTimeSpeedMultiplier: (multiplier: number) => void
  getEffectiveTime: (duration: number) => number
  
  // Raid system
  generateRaidCamps: () => void
  startRaid: (campId: string, selectedUnits: string[], selectedAbilities: string[]) => boolean
  updateActiveRaid: () => void
  useRaidAbility: (abilityId: string, position?: { x: number; y: number }) => boolean
  endRaid: (result: 'victory' | 'defeat' | 'timeout') => void
  canAccessTier: (tier: number) => boolean
  getRaidAttempts: () => { current: number; max: number }
  spendRaidAttempt: () => boolean
  getSafeRouteBonus: (convoyPath: string) => number
  
  // Troop training system
  canTrainTroop: (tileId: string, troopType: 'warrior' | 'archer' | 'monk' | 'bomber', quantity: number) => boolean
  startTroopTraining: (tileId: string, troopType: 'warrior' | 'archer' | 'monk' | 'bomber', quantity: number) => boolean
  collectTrainedTroops: (tileId: string) => boolean
  updateTroopTraining: () => void
  getTroopTrainingCost: (troopType: 'warrior' | 'archer' | 'monk' | 'bomber', quantity: number) => { bamboo: number; time: number }
  
  // Save/Load system
  saveGame: () => Promise<void>
  loadGame: (userId: string) => Promise<void>
  startAutoSave: (userId: string) => void
  stopAutoSave: () => void
}

export const useGameStore = create<GameState & GameActions>()(
  immer((set, get) => ({
    // Initial state
    player: {
      bamboo: 1000,
      seeds: 5,
      charms: 1,
      stats: {
        buildingsBuilt: 0,
        bambooPlanted: 0,
        convoysCompleted: 0,
        bambooCollected: 0
      },
      lastGamble: 0,
      raids: {
        attemptsUsed: 0,
        stars: 0,
        lastRefresh: Date.now()
      },
      troops: {
        warrior: 0,
        archer: 0,
        monk: 0,
        bomber: 0
      }
    },
    timeSpeed: {
      enabled: false,
      multiplier: 1
    },
    tiles: {},
    convoys: [],
    raids: {
      availableCamps: [],
      activeRaid: null,
      lastDailyRefresh: Date.now()
    },
    quests: [
      {
        id: 'first-hq',
        title: 'First Steps',
        description: 'Build your first HQ',
        reward: { bamboo: 100 },
        progress: 0,
        target: 1,
        completed: false,
        type: 'build',
        requirement: 'HQ'
      },
      {
        id: 'green-thumb',
        title: 'Green Thumb',
        description: 'Plant 5 bamboo tiles',
        reward: { seeds: 1 },
        progress: 0,
        target: 5,
        completed: false,
        type: 'plant'
      },
      {
        id: 'trade-routes',
        title: 'Trade Routes',
        description: 'Complete 3 successful convoys',
        reward: { bamboo: 300 },
        progress: 0,
        target: 3,
        completed: false,
        type: 'convoy'
      }
    ],

    // Actions
    addBamboo: (amount) => set(state => {
      const maxStorage = get().getMaxBambooStorage()
      const canAdd = Math.max(0, Math.min(amount, maxStorage - state.player.bamboo))
      state.player.bamboo += canAdd
    }),

    spendBamboo: (amount) => {
      const state = get()
      if (state.player.bamboo >= amount) {
        set(state => {
          state.player.bamboo -= amount
        })
        return true
      }
      return false
    },

    addSeeds: (amount) => set(state => {
      state.player.seeds += amount
    }),

    spendSeeds: (amount) => {
      const state = get()
      if (state.player.seeds >= amount) {
        set(state => {
          state.player.seeds -= amount
        })
        return true
      }
      return false
    },

    plantBamboo: (tileId) => {
      const state = get()
      if (state.player.seeds >= 1 && (!state.tiles[tileId] || state.tiles[tileId].type === 'empty')) {
        set(state => {
          const now = Date.now()
          state.player.seeds -= 1
          state.player.stats.bambooPlanted += 1
          state.tiles[tileId] = {
            type: 'bamboo',
            bamboo: {
              level: 1,
              production: 20, // bamboo per hour (1 every 3 minutes)
              stored: 0,
              lastCollected: now,
              plantedAt: now
            }
          }
        })
        get().updateQuests()
        return true
      }
      return false
    },

    canPlaceBuilding: (tileId) => {
      const state = get()
      
      // Tile must be empty (undefined tiles are empty)
      const currentTile = state.tiles[tileId]
      if (currentTile && currentTile.type !== 'empty') {
        return false
      }
      
      // Parse coordinates
      const [x, y] = tileId.split(',').map(Number)
      
      // Check adjacent tiles (8-directional) for building spacing rule
      const adjacentOffsets = [
        [-1, -1], [0, -1], [1, -1],
        [-1,  0],          [1,  0],
        [-1,  1], [0,  1], [1,  1]
      ]
      
      for (const [dx, dy] of adjacentOffsets) {
        const adjX = x + dx
        const adjY = y + dy
        const adjTileId = `${adjX},${adjY}`
        const adjTile = state.tiles[adjTileId]
        
        // Buildings must have at least 1 empty space between them
        if (adjTile && adjTile.type === 'building') {
          return false
        }
      }
      
      return true
    },

    buildOnTile: (tileId, buildingName) => {
      const state = get()
      const cost = getBuildingCost(buildingName)
      
      if (state.player.bamboo >= cost.bamboo && 
          state.player.seeds >= cost.seeds &&
          get().canPlaceBuilding(tileId)) {
        set(state => {
          state.player.bamboo -= cost.bamboo
          state.player.seeds -= cost.seeds
          state.player.stats.buildingsBuilt += 1
          state.tiles[tileId] = {
            type: 'building',
            building: {
              name: buildingName,
              level: 1
            }
          }
        })
        get().updateQuests()
        return true
      }
      return false
    },

    dispatchConvoy: (type, bambooAmount, duration) => {
      const state = get()
      if (state.player.bamboo >= bambooAmount) {
        const originalDuration = duration ? duration * 60 * 1000 : (type === 'porter' ? 15 * 60 * 1000 : 25 * 60 * 1000)
        const effectiveDuration = state.timeSpeed.enabled ? 
          originalDuration / state.timeSpeed.multiplier : 
          originalDuration
        const convoy = {
          id: Date.now().toString(),
          type,
          startTime: Date.now(),
          duration: effectiveDuration,
          originalDuration: originalDuration,
          bambooAmount,
          status: 'active' as const
        }
        
        set(state => {
          state.player.bamboo -= bambooAmount
          state.convoys.push(convoy)
        })
        return true
      }
      return false
    },

    updateConvoys: () => set(state => {
      const now = Date.now()
      
      // Process completed convoys
      const completedConvoys = state.convoys.filter(convoy => {
        if (convoy.status !== 'active') return false
        
        // Calculate effective time elapsed since convoy started
        const timeElapsed = now - convoy.startTime
        const effectiveTimeElapsed = state.timeSpeed.enabled ? 
          timeElapsed * state.timeSpeed.multiplier : 
          timeElapsed
        
        return effectiveTimeElapsed >= convoy.duration
      })
      
      completedConvoys.forEach(convoy => {
        // Get convoy type parameters
        const convoyParams = convoy.type === 'porter' 
          ? { minDuration: 10, maxDuration: 60, maxFailureRate: 25, minFailureRate: 5, baseProfit: 0.1, maxProfit: 0.5 }
          : { minDuration: 3, maxDuration: 30, maxFailureRate: 35, minFailureRate: 10, baseProfit: 0.15, maxProfit: 0.7 }
        
        // Use the stored original duration (in milliseconds)
        const originalDurationMinutes = convoy.originalDuration / (60 * 1000)
        
        // Calculate duration progress (0 = min duration, 1 = max duration)
        const durationProgress = Math.max(0, Math.min(1, 
          (originalDurationMinutes - convoyParams.minDuration) / (convoyParams.maxDuration - convoyParams.minDuration)
        ))
        
        // Risk decreases with time
        let failureRate = convoyParams.maxFailureRate - (durationProgress * (convoyParams.maxFailureRate - convoyParams.minFailureRate))
        
        // Apply Safe Route bonus from cleared raid camps
        const safeRouteBonus = get().getSafeRouteBonus('convoy-route') // Simplified route
        failureRate = Math.max(failureRate * 0.7, failureRate - safeRouteBonus) // Cap at 30% reduction
        
        const successRate = (100 - failureRate) / 100
        
        console.log(`Convoy ${convoy.id}: ${convoy.type}, originalDuration: ${originalDurationMinutes.toFixed(1)}min, progress: ${durationProgress.toFixed(2)}, failureRate: ${failureRate.toFixed(1)}%, successRate: ${(successRate * 100).toFixed(1)}%`)
        
        const success = Math.random() < successRate
        
        if (success) {
          // Reward increases with time
          const profitRate = convoyParams.baseProfit + (durationProgress * (convoyParams.maxProfit - convoyParams.baseProfit))
          const profit = Math.floor(convoy.bambooAmount * profitRate)
          
          // Return original bamboo + profit
          const totalReturn = convoy.bambooAmount + profit
          const maxStorage = get().getMaxBambooStorage()
          const canAdd = Math.max(0, Math.min(totalReturn, maxStorage - state.player.bamboo))
          state.player.bamboo += canAdd
          state.player.stats.convoysCompleted += 1
          console.log(`✅ Convoy SUCCESS! Wagered: ${convoy.bambooAmount}, Profit: ${profit}, Total returned: ${convoy.bambooAmount + profit}, Actually added: ${canAdd}`)
        } else {
          // Failed convoy - lose max 25% of bamboo, return 75%
          const returnedBamboo = Math.floor(convoy.bambooAmount * 0.75) // Get 75% back (lose max 25%)
          const maxStorage = get().getMaxBambooStorage()
          const canAdd = Math.max(0, Math.min(returnedBamboo, maxStorage - state.player.bamboo))
          state.player.bamboo += canAdd
          console.log(`❌ Convoy FAILED! Wagered: ${convoy.bambooAmount}, Returned: ${returnedBamboo}, Actually added: ${canAdd}, Lost: ${convoy.bambooAmount - canAdd}`)
        }
      })
      
      // Remove completed convoys
      state.convoys = state.convoys.filter(convoy => {
        if (convoy.status !== 'active') return false
        
        // Calculate effective time elapsed since convoy started
        const timeElapsed = now - convoy.startTime
        const effectiveTimeElapsed = state.timeSpeed.enabled ? 
          timeElapsed * state.timeSpeed.multiplier : 
          timeElapsed
        
        return effectiveTimeElapsed < convoy.duration
      })
    }),

    updateBambooProduction: () => set(state => {
      const now = Date.now()
      
      Object.keys(state.tiles).forEach(tileId => {
        const tile = state.tiles[tileId]
        if (tile && tile.type === 'bamboo' && tile.bamboo) {
          // Migrate old bamboo tiles that don't have plantedAt
          if (!tile.bamboo.plantedAt) {
            tile.bamboo.plantedAt = tile.bamboo.lastCollected
          }
          
          // Only produce bamboo if below 100 limit
          if (tile.bamboo.stored < 100) {
            const timeSinceLastCollection = now - tile.bamboo.lastCollected
            const effectiveTime = state.timeSpeed.enabled ? 
              timeSinceLastCollection * state.timeSpeed.multiplier : 
              timeSinceLastCollection
            const hoursElapsed = effectiveTime / (1000 * 60 * 60)
            const newBamboo = hoursElapsed * tile.bamboo.production
            
            // Cap the stored amount at 100
            tile.bamboo.stored = Math.min(100, tile.bamboo.stored + newBamboo)
          }
          
          tile.bamboo.lastCollected = now
        }
      })
    }),

    collectBamboo: (tileId) => {
      const state = get()
      const tile = state.tiles[tileId]
      
      if (tile && tile.type === 'bamboo' && tile.bamboo) {
        const collected = Math.floor(tile.bamboo.stored)
        const remainingFractional = tile.bamboo.stored - collected
        console.log(`Collecting bamboo from ${tileId}: ${collected} bamboo, stored: ${tile.bamboo.stored}, remaining: ${remainingFractional.toFixed(2)}`)
        if (collected > 0) {
          const maxStorage = get().getMaxBambooStorage()
          const canCollect = Math.max(0, Math.min(collected, maxStorage - state.player.bamboo))
          const leftOnTile = collected - canCollect
          
          console.log(`Storage check: current ${state.player.bamboo}/${maxStorage}, can collect: ${canCollect}, left on tile: ${leftOnTile}`)
          
          set(state => {
            state.player.bamboo += canCollect
            state.tiles[tileId].bamboo!.stored = remainingFractional + leftOnTile // Keep fractional part + uncollectable amount
            if (canCollect > 0) {
              state.tiles[tileId].bamboo!.lastCollected = Date.now()
              state.tiles[tileId].bamboo!.plantedAt = Date.now() // Reset growth timer
              state.player.stats.bambooCollected += canCollect
            }
          })
          
          if (canCollect > 0) {
            console.log(`Reset plantedAt for ${tileId} to ${Date.now()}`)
          }
          return canCollect
        }
      }
      return 0
    },

    collectAllBamboo: () => {
      const state = get()
      let totalAvailable = 0
      
      Object.keys(state.tiles).forEach(tileId => {
        const tile = state.tiles[tileId]
        if (tile && tile.type === 'bamboo' && tile.bamboo && tile.bamboo.stored >= 1) {
          const collected = Math.floor(tile.bamboo.stored)
          totalAvailable += collected
        }
      })
      
      if (totalAvailable > 0) {
        const maxStorage = get().getMaxBambooStorage()
        const canCollect = Math.max(0, Math.min(totalAvailable, maxStorage - state.player.bamboo))
        let remainingToCollect = canCollect
        
        console.log(`Collect All: ${totalAvailable} available, ${canCollect} can collect due to storage`)
        
        set(state => {
          Object.keys(state.tiles).forEach(tileId => {
            const tile = state.tiles[tileId]
            if (tile && tile.type === 'bamboo' && tile.bamboo && tile.bamboo.stored >= 1 && remainingToCollect > 0) {
              const collected = Math.floor(tile.bamboo.stored)
              const toTake = Math.min(collected, remainingToCollect)
              const leftOnTile = collected - toTake
              const remainingFractional = tile.bamboo.stored - collected
              
              tile.bamboo.stored = remainingFractional + leftOnTile // Keep fractional part + what couldn't be collected
              if (toTake > 0) {
                tile.bamboo.plantedAt = Date.now() // Reset growth timer only if collected
                tile.bamboo.lastCollected = Date.now()
              }
              remainingToCollect -= toTake
            }
          })
          
          state.player.bamboo += canCollect
          state.player.stats.bambooCollected += canCollect
        })
        
        return canCollect
      }
      
      return 0
    },

    updateQuests: () => set(state => {
      state.quests.forEach(quest => {
        if (quest.completed) return

        switch (quest.type) {
          case 'build':
            if (quest.requirement) {
              // Count specific building type
              const buildingCount = Object.values(state.tiles).filter(tile => 
                tile?.type === 'building' && tile.building?.name === quest.requirement
              ).length
              quest.progress = buildingCount
            } else {
              quest.progress = state.player.stats.buildingsBuilt
            }
            break
          case 'plant':
            quest.progress = state.player.stats.bambooPlanted
            break
          case 'convoy':
            quest.progress = state.player.stats.convoysCompleted
            break
          case 'collect':
            quest.progress = state.player.stats.bambooCollected
            break
        }

        if (quest.progress >= quest.target && !quest.completed) {
          quest.completed = true
          // Auto-complete quest and give rewards
          if (quest.reward.bamboo) {
            const maxStorage = get().getMaxBambooStorage()
            const canAdd = Math.max(0, Math.min(quest.reward.bamboo, maxStorage - state.player.bamboo))
            state.player.bamboo += canAdd
            console.log(`Quest reward: ${quest.reward.bamboo} bamboo, added: ${canAdd}`)
          }
          if (quest.reward.seeds) state.player.seeds += quest.reward.seeds  
          if (quest.reward.charms) state.player.charms += quest.reward.charms
        }
      })
    }),

    completeQuest: (questId) => set(state => {
      const quest = state.quests.find(q => q.id === questId)
      if (quest && !quest.completed) {
        quest.completed = true
        if (quest.reward.bamboo) {
          const maxStorage = get().getMaxBambooStorage()
          const canAdd = Math.max(0, Math.min(quest.reward.bamboo, maxStorage - state.player.bamboo))
          state.player.bamboo += canAdd
          console.log(`Manual quest completion reward: ${quest.reward.bamboo} bamboo, added: ${canAdd}`)
        }
        if (quest.reward.seeds) state.player.seeds += quest.reward.seeds
        if (quest.reward.charms) state.player.charms += quest.reward.charms
      }
    }),

    canGamble: () => {
      const state = get()
      const now = Date.now()
      const timeSinceLastGamble = now - state.player.lastGamble
      const effectiveTime = state.timeSpeed.enabled ? 
        timeSinceLastGamble * state.timeSpeed.multiplier : 
        timeSinceLastGamble
      const minutesSinceLastGamble = effectiveTime / (1000 * 60)
      return minutesSinceLastGamble >= 15 || state.player.lastGamble === 0
    },

    gambleBamboo: (wager, multiplier) => {
      const state = get()
      if (!get().canGamble() || state.player.bamboo < wager) {
        return { won: false, payout: 0 }
      }

      set(state => {
        state.player.bamboo -= wager
        state.player.lastGamble = Date.now()
      })

      // Simple gambling: higher multiplier = lower chance
      // 2x = 45% chance, 3x = 30% chance, 5x = 18% chance, 10x = 9% chance
      const winChance = Math.max(0.05, 0.5 - (multiplier - 2) * 0.1)
      const won = Math.random() < winChance

      if (won) {
        const payout = wager * multiplier
        set(state => {
          const maxStorage = get().getMaxBambooStorage()
          const canAdd = Math.max(0, Math.min(payout, maxStorage - state.player.bamboo))
          state.player.bamboo += canAdd
          console.log(`Gambling win: ${payout} bamboo, added: ${canAdd}`)
        })
        return { won: true, payout }
      }

      return { won: false, payout: 0 }
    },

    getBuildingUpgradeCost: (tileId) => {
      const state = get()
      const tile = state.tiles[tileId]
      
      if (!tile || tile.type !== 'building' || !tile.building) {
        return null
      }

      const currentLevel = tile.building.level
      if (currentLevel >= 4) {
        return null // Max level reached
      }

      // Building upgrade costs
      if (tile.building.name === 'HQ') {
        // HQ upgrade costs: level 2 = 3 seeds, level 3 = 5 seeds, level 4 = 10 seeds
        const upgradeCosts = {
          1: { seeds: 3 }, // Level 1 -> 2
          2: { seeds: 5 }, // Level 2 -> 3
          3: { seeds: 10 } // Level 3 -> 4
        }
        return upgradeCosts[currentLevel as keyof typeof upgradeCosts] || null
      }
      
      if (tile.building.name === 'Depot') {
        // Depot upgrade costs: level 2 = 1 seed, level 3 = 3 seeds, level 4 = 5 seeds
        const upgradeCosts = {
          1: { seeds: 1 }, // Level 1 -> 2
          2: { seeds: 3 }, // Level 2 -> 3
          3: { seeds: 5 } // Level 3 -> 4
        }
        return upgradeCosts[currentLevel as keyof typeof upgradeCosts] || null
      }
      
      if (tile.building.name === 'Barracks') {
        // Barracks upgrade costs: level 2 = 1000 bamboo, level 3 = 1750 bamboo, level 4 = 2500 bamboo
        const upgradeCosts = {
          1: { bamboo: 1000 }, // Level 1 -> 2
          2: { bamboo: 1750 }, // Level 2 -> 3  
          3: { bamboo: 2500 } // Level 3 -> 4
        }
        return upgradeCosts[currentLevel as keyof typeof upgradeCosts] || null
      }

      return null
    },

    canUpgradeBuilding: (tileId) => {
      const state = get()
      const upgradeCost = get().getBuildingUpgradeCost(tileId)
      
      if (!upgradeCost) {
        return false
      }

      // Find HQ level
      const hqTile = Object.values(state.tiles).find(tile => tile.building?.name === 'HQ')
      const hqLevel = hqTile?.building?.level || 1

      // Get current building level and target level
      const tile = state.tiles[tileId]
      const currentLevel = tile?.building?.level || 1
      const targetLevel = currentLevel + 1

      // Check HQ level restriction
      const hqAllowsUpgrade = targetLevel <= hqLevel

      // Check if player has enough seeds (if required)
      const hasSeeds = !upgradeCost.seeds || state.player.seeds >= upgradeCost.seeds
      
      // Check if player has enough bamboo (if required)
      const hasBamboo = !upgradeCost.bamboo || state.player.bamboo >= upgradeCost.bamboo
      
      return hasSeeds && hasBamboo && hqAllowsUpgrade
    },

    upgradeBuilding: (tileId) => {
      const state = get()
      const upgradeCost = get().getBuildingUpgradeCost(tileId)
      
      if (!upgradeCost || !get().canUpgradeBuilding(tileId)) {
        return false
      }

      set(state => {
        // Spend seeds if required
        if (upgradeCost.seeds) {
          state.player.seeds -= upgradeCost.seeds
        }
        
        // Spend bamboo if required
        if (upgradeCost.bamboo) {
          state.player.bamboo -= upgradeCost.bamboo
        }
        
        if (state.tiles[tileId] && state.tiles[tileId].building) {
          state.tiles[tileId].building!.level += 1
        }
      })

      return true
    },

    canCraftSeed: (tileId) => {
      const state = get()
      const tile = state.tiles[tileId]
      
      if (!tile || tile.type !== 'building' || tile.building?.name !== 'Nursery') {
        return false
      }

      // Check if already crafting or has completed seed ready
      if (tile.building.seedCrafting) {
        return false
      }

      return state.player.bamboo >= 20
    },

    startSeedCrafting: (tileId) => {
      const state = get()
      if (!get().canCraftSeed(tileId)) {
        return false
      }

      set(state => {
        state.player.bamboo -= 20
        if (state.tiles[tileId] && state.tiles[tileId].building) {
          const baseDuration = 10 * 60 * 1000 // 10 minutes in milliseconds
          const effectiveDuration = state.timeSpeed.enabled ? 
            baseDuration / state.timeSpeed.multiplier : 
            baseDuration
          state.tiles[tileId].building!.seedCrafting = {
            startTime: Date.now(),
            duration: effectiveDuration,
            completed: false
          }
        }
      })

      return true
    },

    collectCraftedSeed: (tileId) => {
      const state = get()
      const tile = state.tiles[tileId]
      
      if (!tile || tile.type !== 'building' || !tile.building?.seedCrafting?.completed) {
        return false
      }

      set(state => {
        state.player.seeds += 1
        if (state.tiles[tileId] && state.tiles[tileId].building) {
          delete state.tiles[tileId].building!.seedCrafting
        }
      })

      return true
    },

    updateSeedCrafting: () => set(state => {
      const now = Date.now()
      
      Object.keys(state.tiles).forEach(tileId => {
        const tile = state.tiles[tileId]
        if (tile && tile.type === 'building' && tile.building?.seedCrafting && !tile.building.seedCrafting.completed) {
          const craftingEndTime = tile.building.seedCrafting.startTime + tile.building.seedCrafting.duration
          if (now >= craftingEndTime) {
            tile.building.seedCrafting.completed = true
          }
        }
      })
    }),

    getMaxBambooStorage: () => {
      const state = get()
      let maxStorage = 1000 // Base storage without Depot
      
      // Find all Depot buildings and add their storage capacity
      Object.values(state.tiles).forEach(tile => {
        if (tile && tile.type === 'building' && tile.building?.name === 'Depot') {
          const level = tile.building.level || 1
          // Depot storage: Level 1 = +500, Level 2 = +1500, Level 3 = +3000, Level 4 = +6000
          const storageBonus = {
            1: 500,
            2: 1500, 
            3: 3000,
            4: 6000
          }
          maxStorage += storageBonus[level as keyof typeof storageBonus] || 500
        }
      })
      
      return maxStorage
    },

    getCurrentBambooStorage: () => {
      const state = get()
      return state.player.bamboo
    },

    setTimeSpeedEnabled: (enabled) => set(state => {
      state.timeSpeed.enabled = enabled
    }),

    setTimeSpeedMultiplier: (multiplier) => set(state => {
      state.timeSpeed.multiplier = Math.max(0.1, Math.min(50, multiplier)) // Clamp between 0.1x and 50x
    }),

    getEffectiveTime: (duration) => {
      const state = get()
      if (!state.timeSpeed.enabled) {
        return duration
      }
      return duration / state.timeSpeed.multiplier
    },

    // Raid system implementations
    generateRaidCamps: () => set(state => {
      const now = Date.now()
      const oneDayMs = 24 * 60 * 60 * 1000
      
      // Check if we need to refresh camps (once per day)
      if (now - state.raids.lastDailyRefresh > oneDayMs) {
        state.raids.lastDailyRefresh = now
        state.player.raids.attemptsUsed = 0 // Reset daily attempts
        
        // Generate 6-10 camps around player border
        const numCamps = 6 + Math.floor(Math.random() * 5)
        const newCamps: RaidCamp[] = []
        
        for (let i = 0; i < numCamps; i++) {
          const tier = Math.min(5, 1 + Math.floor(Math.random() * 3)) as 1 | 2 | 3 | 4 | 5
          const rewards = getRaidRewards(tier)
          
          newCamps.push({
            id: `camp_${now}_${i}`,
            tier,
            position: { 
              x: Math.random() * 10 - 5, // Random position near border
              y: Math.random() * 10 - 5 
            },
            defenses: generateRaidDefenses(tier),
            rewards,
            clearedToday: false,
            stars: 0
          })
        }
        
        state.raids.availableCamps = newCamps
      }
    }),

    canAccessTier: (tier) => {
      const state = get()
      const hqLevel = getHQLevel(state)
      
      if (tier <= 2) return true
      if (tier <= 4) return hqLevel >= 3
      return hqLevel >= 5
    },

    getRaidAttempts: () => {
      const state = get()
      const bonusFromStars = Math.floor(state.player.raids.stars / 6) * 1
      const maxAttempts = 3 + Math.min(2, bonusFromStars)
      
      console.log('Raid attempts debug:', {
        attemptsUsed: state.player.raids.attemptsUsed,
        stars: state.player.raids.stars,
        bonusFromStars,
        maxAttempts,
        current: maxAttempts - state.player.raids.attemptsUsed
      })
      
      return {
        current: maxAttempts - state.player.raids.attemptsUsed,
        max: maxAttempts
      }
    },

    spendRaidAttempt: () => {
      const attempts = get().getRaidAttempts()
      if (attempts.current <= 0) return false
      
      set(state => {
        state.player.raids.attemptsUsed += 1
      })
      return true
    },

    startRaid: (campId, selectedUnits, selectedAbilities) => {
      const state = get()
      const camp = state.raids.availableCamps.find(c => c.id === campId)
      
      if (!camp || state.raids.activeRaid || !get().spendRaidAttempt()) {
        return false
      }
      
      // Validate unit costs (max 10 points) and troop availability
      const unitCosts = { warrior: 2, archer: 3, monk: 3, bomber: 4 }
      const totalCost = selectedUnits.reduce((sum, unit) => sum + unitCosts[unit as keyof typeof unitCosts], 0)
      if (totalCost > 10) return false
      
      // Count required troops by type
      const requiredTroops = { warrior: 0, archer: 0, monk: 0, bomber: 0 }
      selectedUnits.forEach(unit => {
        const troopType = unit as keyof typeof requiredTroops
        requiredTroops[troopType]++
      })
      
      // Check if player has enough trained troops
      const hasEnoughTroops = Object.entries(requiredTroops).every(([type, required]) => 
        state.player.troops[type as keyof typeof state.player.troops] >= required
      )
      
      if (!hasEnoughTroops) return false
      
      // Create raid units with HQ scaling
      const hqLevel = getHQLevel(state)
      const statMultiplier = 1 + (hqLevel - 1) * 0.08 // +8% per HQ level
      
      const raidUnits: RaidUnit[] = selectedUnits.map((type, index) => ({
        id: `unit_${index}`,
        type: type as 'warrior' | 'archer' | 'monk' | 'bomber',
        ...getUnitStats(type as 'warrior' | 'archer' | 'monk' | 'bomber', statMultiplier),
        position: { lane: index % 3, progress: 0 },
        status: 'alive' as const
      }))
      
      // Create abilities
      const raidAbilities: RaidAbility[] = selectedAbilities.map(id => ({
        id: id as 'smoke' | 'rally' | 'heal' | 'snare' | 'thunder',
        ...getRaidAbilityData(id),
        lastUsed: 0
      }))
      
      // Start the raid and consume troops
      set(state => {
        // Consume troops
        Object.entries(requiredTroops).forEach(([type, required]) => {
          const troopType = type as keyof typeof state.player.troops
          state.player.troops[troopType] -= required
        })
        
        state.raids.activeRaid = {
          campId,
          startTime: Date.now(),
          duration: 90000, // 90 seconds
          units: raidUnits,
          abilities: raidAbilities,
          coreHp: 500,
          maxCoreHp: 500,
          status: 'active',
          timeLeft: 90000
        }
      })
      
      return true
    },

    updateActiveRaid: () => set(state => {
      const raid = state.raids.activeRaid
      if (!raid || raid.status !== 'active') return
      
      const now = Date.now()
      const elapsed = now - raid.startTime
      raid.timeLeft = Math.max(0, raid.duration - elapsed)
      
      // Check for timeout
      if (raid.timeLeft <= 0) {
        get().endRaid('timeout')
        return
      }
      
      // Simple battle simulation - units advance and attack
      raid.units.forEach(unit => {
        if (unit.status === 'alive') {
          unit.position.progress = Math.min(100, unit.position.progress + 1)
          
          // If unit reaches core, deal damage
          if (unit.position.progress >= 100) {
            raid.coreHp = Math.max(0, raid.coreHp - unit.dps * 0.1)
          }
        }
      })
      
      // Check for victory
      if (raid.coreHp <= 0) {
        get().endRaid('victory')
      }
    }),

    useRaidAbility: (abilityId, position) => {
      const state = get()
      const raid = state.raids.activeRaid
      if (!raid) return false
      
      const ability = raid.abilities.find(a => a.id === abilityId)
      if (!ability) return false
      
      const now = Date.now()
      if (now - ability.lastUsed < ability.cooldown) return false
      
      // Apply ability effect (simplified)
      set(state => {
        const currentRaid = state.raids.activeRaid!
        const currentAbility = currentRaid.abilities.find(a => a.id === abilityId)!
        currentAbility.lastUsed = now
        
        // Apply effects based on ability type
        switch (abilityId) {
          case 'heal':
            currentRaid.units.forEach(unit => {
              if (unit.status === 'alive') {
                unit.hp = Math.min(unit.maxHp, unit.hp + 120)
              }
            })
            break
          case 'rally':
            // Speed boost applied in battle logic
            break
          // Add other ability effects as needed
        }
      })
      
      return true
    },

    endRaid: (result) => set(state => {
      const raid = state.raids.activeRaid
      if (!raid) return
      
      const camp = state.raids.availableCamps.find(c => c.id === raid.campId)
      if (!camp) return
      
      // Calculate rewards
      let bambooReward = 0
      let seedReward = 0
      let charmReward = 0
      
      if (result === 'victory') {
        const timeBonus = raid.timeLeft > 45000 ? 1.15 : 1 // <45s bonus
        bambooReward = Math.floor(camp.rewards.bamboo * timeBonus)
        
        // Seed chance roll
        if (Math.random() * 100 < camp.rewards.seedChance) {
          seedReward = 1
        }
        
        // Charm chance roll
        if (Math.random() * 100 < camp.rewards.charmChance) {
          charmReward = 1
        }
        
        // Calculate stars (simplified)
        let stars = 1 // Base for victory
        if (raid.timeLeft > 45000) stars++ // Time bonus
        if (raid.units.filter(u => u.status === 'alive').length >= raid.units.length - 1) stars++ // Low casualties
        
        camp.stars = Math.max(camp.stars, stars)
        state.player.raids.stars += stars - camp.stars // Add only new stars
        camp.clearedToday = true
        
        // Apply Safe Route buff
        camp.safeRouteExpiry = Date.now() + (45 * 60 * 1000) // 45 minutes
        
      } else if (result === 'timeout') {
        // Fail safety: 30% of bamboo reward
        bambooReward = Math.floor(camp.rewards.bamboo * 0.3)
      }
      
      // Award rewards
      if (bambooReward > 0) {
        get().addBamboo(bambooReward)
      }
      if (seedReward > 0) {
        get().addSeeds(seedReward)
      }
      if (charmReward > 0) {
        state.player.charms += charmReward
      }
      
      // Return surviving troops
      if (raid.units) {
        const survivorsByType = { warrior: 0, archer: 0, monk: 0, bomber: 0 }
        raid.units.forEach(unit => {
          if (unit.status === 'alive') {
            survivorsByType[unit.type]++
          }
        })
        
        Object.entries(survivorsByType).forEach(([type, count]) => {
          const troopType = type as keyof typeof state.player.troops
          state.player.troops[troopType] += count
        })
      }
      
      // Clear active raid
      state.raids.activeRaid = null
    }),

    getSafeRouteBonus: (convoyPath) => {
      const state = get()
      const now = Date.now()
      
      let bonus = 0
      state.raids.availableCamps.forEach(camp => {
        if (camp.safeRouteExpiry && camp.safeRouteExpiry > now) {
          // Simplified: assume any cleared camp provides 20% reduction
          bonus += 20
        }
      })
      
      return Math.min(30, bonus) // Cap total reduction
    },

    // Troop training system implementations
    getTroopTrainingCost: (troopType, quantity) => {
      const baseCosts = {
        warrior: { bamboo: 50, time: 2 }, // 2 minutes per warrior
        archer: { bamboo: 100, time: 3 }, // 3 minutes per archer
        monk: { bamboo: 150, time: 4 }, // 4 minutes per monk
        bomber: { bamboo: 200, time: 5 } // 5 minutes per bomber
      }
      
      const baseCost = baseCosts[troopType]
      return {
        bamboo: baseCost.bamboo * quantity,
        time: baseCost.time * quantity * 60 * 1000 // Convert to milliseconds
      }
    },

    canTrainTroop: (tileId, troopType, quantity) => {
      const state = get()
      const tile = state.tiles[tileId]
      
      if (!tile || tile.type !== 'building' || tile.building?.name !== 'Barracks') {
        return false
      }
      
      // Check if already training
      if (tile.building.troopTraining && !tile.building.troopTraining.completed) {
        return false
      }
      
      // Check resources
      const cost = get().getTroopTrainingCost(troopType, quantity)
      return state.player.bamboo >= cost.bamboo && quantity > 0 && quantity <= 10
    },

    startTroopTraining: (tileId, troopType, quantity) => {
      const state = get()
      
      if (!get().canTrainTroop(tileId, troopType, quantity)) {
        return false
      }
      
      const cost = get().getTroopTrainingCost(troopType, quantity)
      
      set(state => {
        state.player.bamboo -= cost.bamboo
        
        const tile = state.tiles[tileId]
        if (tile && tile.building) {
          tile.building.troopTraining = {
            troopType,
            startTime: Date.now(),
            duration: cost.time,
            completed: false,
            quantity
          }
        }
      })
      
      return true
    },

    collectTrainedTroops: (tileId) => {
      const state = get()
      const tile = state.tiles[tileId]
      
      if (!tile || tile.type !== 'building' || 
          !tile.building?.troopTraining || 
          !tile.building.troopTraining.completed) {
        return false
      }
      
      const training = tile.building.troopTraining
      
      set(state => {
        // Add troops to player inventory
        state.player.troops[training.troopType] += training.quantity
        
        // Clear training
        const currentTile = state.tiles[tileId]
        if (currentTile && currentTile.building) {
          currentTile.building.troopTraining = undefined
        }
      })
      
      return true
    },

    updateTroopTraining: () => set(state => {
      const now = Date.now()
      
      Object.values(state.tiles).forEach(tile => {
        if (tile && tile.type === 'building' && 
            tile.building?.troopTraining && 
            !tile.building.troopTraining.completed) {
          
          const training = tile.building.troopTraining
          const elapsed = now - training.startTime
          const effectiveElapsed = state.timeSpeed.enabled ? 
            elapsed * state.timeSpeed.multiplier : elapsed
          
          if (effectiveElapsed >= training.duration) {
            training.completed = true
          }
        }
      })
    }),

    // Save/Load system
    saveGame: (() => {
      let autoSaveInterval: NodeJS.Timeout | null = null
      let currentUserId: string | null = null

      const saveGame = async () => {
        if (!currentUserId) return
        
        try {
          const { supabase } = await import('@/lib/supabase')
          const gameState = get()
          
          // Remove functions from state before saving
          const stateToSave = {
            player: gameState.player,
            tiles: gameState.tiles,
            convoys: gameState.convoys,
            quests: gameState.quests,
            timeSpeed: gameState.timeSpeed,
            raidCamps: gameState.raidCamps,
            activeRaid: gameState.activeRaid
          }

          const { error } = await supabase
            .from('game_saves')
            .upsert({
              player_id: currentUserId,
              game_state: stateToSave,
              last_updated: new Date().toISOString(),
              version: 1
            })

          if (error) {
            console.error('Save failed:', error)
          } else {
            console.log('Game saved successfully')
          }
        } catch (error) {
          console.error('Save error:', error)
        }
      }

      // Expose additional methods on saveGame function
      ;(saveGame as any).setUserId = (userId: string) => { currentUserId = userId }
      ;(saveGame as any).startAutoSave = () => {
        if (autoSaveInterval) clearInterval(autoSaveInterval)
        autoSaveInterval = setInterval(saveGame, 30000)
      }
      ;(saveGame as any).stopAutoSave = () => {
        if (autoSaveInterval) {
          clearInterval(autoSaveInterval)
          autoSaveInterval = null
        }
      }

      return saveGame
    })(),

    loadGame: async (userId: string) => {
      try {
        const { supabase } = await import('@/lib/supabase')
        
        const { data, error } = await supabase
          .from('game_saves')
          .select('*')
          .eq('player_id', userId)
          .order('last_updated', { ascending: false })
          .limit(1)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Load failed:', error)
          return
        }

        if (data && data.game_state) {
          set((state) => {
            // Restore saved state
            Object.assign(state, data.game_state)
          })
          console.log('Game loaded successfully')
        } else {
          console.log('No saved game found, using default state')
        }
      } catch (error) {
        console.error('Load error:', error)
      }
    },

    startAutoSave: (userId: string) => {
      const store = get()
      ;(store.saveGame as any).setUserId(userId)
      
      // Load game first
      store.loadGame(userId)
      
      // Start auto-save
      ;(store.saveGame as any).startAutoSave()
      
      console.log('Auto-save started for user:', userId)
    },

    stopAutoSave: () => {
      const store = get()
      ;(store.saveGame as any).stopAutoSave()
      console.log('Auto-save stopped')
    }
  }))
)

function getBuildingCost(buildingName: string) {
  const costs = {
    'HQ': { bamboo: 500, seeds: 1 },
    'Depot': { bamboo: 300, seeds: 0 },
    'Nursery': { bamboo: 600, seeds: 0 },
    'Barracks': { bamboo: 250, seeds: 0 },
  }
  return costs[buildingName as keyof typeof costs] || { bamboo: 0, seeds: 0 }
}

// Raid helper functions
function getHQLevel(state: GameState): number {
  let maxLevel = 1
  Object.values(state.tiles).forEach(tile => {
    if (tile && tile.type === 'building' && tile.building?.name === 'HQ') {
      maxLevel = Math.max(maxLevel, tile.building.level || 1)
    }
  })
  return maxLevel
}

function getRaidRewards(tier: 1 | 2 | 3 | 4 | 5) {
  const rewards = {
    1: { bamboo: 400, seedChance: 10, charmChance: 5 },
    2: { bamboo: 1000, seedChance: 20, charmChance: 5 },
    3: { bamboo: 2200, seedChance: 35, charmChance: 5 },
    4: { bamboo: 4000, seedChance: 50, charmChance: 5 },
    5: { bamboo: 7000, seedChance: 65, charmChance: 5 }
  }
  return rewards[tier]
}

function generateRaidDefenses(tier: 1 | 2 | 3 | 4 | 5): RaidDefense[] {
  const defenses: RaidDefense[] = []
  
  // Watch Posts
  const watchPosts = Math.min(2 + tier, 6)
  for (let i = 0; i < watchPosts; i++) {
    defenses.push({
      type: 'watch_post',
      hp: 50,
      maxHp: 50,
      dps: 20,
      position: { lane: i % 3, progress: 50 + Math.random() * 40 },
      status: 'active'
    })
  }
  
  // Horn Towers (T2+)
  if (tier >= 2) {
    const hornTowers = tier >= 4 ? 2 : 1
    for (let i = 0; i < hornTowers; i++) {
      defenses.push({
        type: 'horn_tower',
        hp: 40,
        maxHp: 40,
        dps: 0, // Buff tower
        position: { lane: Math.floor(Math.random() * 3), progress: 30 + Math.random() * 30 },
        status: 'active'
      })
    }
  }
  
  // Spike Tiles
  const spikes = tier * 2
  for (let i = 0; i < spikes; i++) {
    defenses.push({
      type: 'spike_tile',
      hp: 1,
      maxHp: 1,
      position: { lane: Math.floor(Math.random() * 3), progress: 20 + Math.random() * 60 },
      status: 'active'
    })
  }
  
  return defenses
}

function getUnitStats(type: 'warrior' | 'archer' | 'monk' | 'bomber', multiplier: number) {
  const baseStats = {
    warrior: { hp: 100, dps: 1 },
    archer: { hp: 70, dps: 5 },
    monk: { hp: 80, dps: 10 }, // Support unit with damage
    bomber: { hp: 60, dps: 15 }
  }
  
  const stats = baseStats[type]
  return {
    hp: Math.floor(stats.hp * multiplier),
    maxHp: Math.floor(stats.hp * multiplier),
    dps: Math.floor(stats.dps * multiplier)
  }
}

function getRaidAbilityData(id: string) {
  const abilities = {
    smoke: { name: 'Smoke Bomb', description: '3s dodge (-75% damage)', cooldown: 25000 },
    rally: { name: 'Rally Drum', description: '+25% speed for 6s', cooldown: 30000 },
    heal: { name: 'Gourd Heal', description: 'Heal 120 HP in area', cooldown: 20000 },
    snare: { name: 'Snare Trap', description: 'Root enemies for 2s', cooldown: 25000 },
    thunder: { name: 'Thunderclap', description: '0.75s global stun', cooldown: 30000 }
  }
  return abilities[id as keyof typeof abilities] || { name: 'Unknown', description: '', cooldown: 30000 }
}
