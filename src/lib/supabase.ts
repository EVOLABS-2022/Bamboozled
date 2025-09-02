import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Player {
  id: string
  email: string
  username: string
  created_at: string
}

export interface GameSave {
  id: string
  player_id: string
  game_state: any // Full game state JSON
  last_updated: string
  version: number
}
