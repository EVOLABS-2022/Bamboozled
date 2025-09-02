'use client'

import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import GameLayout from '@/components/GameLayout'
import Auth from '@/components/Auth'
import { useGameStore } from '@/stores/gameStore'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const { startAutoSave, stopAutoSave } = useGameStore()

  useEffect(() => {
    if (user) {
      // Start auto-save when user logs in
      startAutoSave(user.id)
    } else {
      // Stop auto-save when user logs out
      stopAutoSave()
    }

    // Cleanup on unmount
    return () => stopAutoSave()
  }, [user, startAutoSave, stopAutoSave])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (!user) {
    return <Auth onAuth={setUser} />
  }

  return (
    <>
      <Auth onAuth={setUser} />
      <GameLayout user={user} onSignOut={handleSignOut} />
    </>
  )
}
