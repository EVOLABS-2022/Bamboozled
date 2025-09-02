-- Supabase Database Schema for Bamboo Lands
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create game_saves table for storing player game states
CREATE TABLE game_saves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL,
  game_state JSONB NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster lookups by player_id
CREATE INDEX idx_game_saves_player_id ON game_saves(player_id);
CREATE INDEX idx_game_saves_last_updated ON game_saves(last_updated);

-- Enable Row Level Security
ALTER TABLE game_saves ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own save data
CREATE POLICY "Users can manage their own game saves" ON game_saves
  FOR ALL USING (auth.uid() = player_id);

-- Enable real-time subscriptions (optional)
ALTER PUBLICATION supabase_realtime ADD TABLE game_saves;

-- Create a function to automatically update the last_updated timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update last_updated on every update
CREATE TRIGGER update_game_saves_updated_at 
    BEFORE UPDATE ON game_saves
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();