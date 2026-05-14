-- WK Poule Database Schema

-- 1. Tournaments
CREATE TABLE IF NOT EXISTS poule_tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Matches
CREATE TABLE IF NOT EXISTS poule_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES poule_tournaments(id) ON DELETE CASCADE,
  api_match_id TEXT UNIQUE, -- ID van externe API
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  kickoff TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'scheduled', -- scheduled, live, finished
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id, home_team, away_team, kickoff)
);

-- 3. Groups (Vriendengroepen)
CREATE TABLE IF NOT EXISTS poule_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Group Members
CREATE TABLE IF NOT EXISTS poule_group_members (
  group_id UUID REFERENCES poule_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- 5. Predictions
CREATE TABLE IF NOT EXISTS poule_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id UUID REFERENCES poule_matches(id) ON DELETE CASCADE,
  home_prediction INTEGER NOT NULL,
  away_prediction INTEGER NOT NULL,
  calculated_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- Puntensysteem Berekening Functie
CREATE OR REPLACE FUNCTION calculate_prediction_points(
  pred_home INTEGER,
  pred_away INTEGER,
  real_home INTEGER,
  real_away INTEGER
) RETURNS INTEGER AS $$
DECLARE
  points INTEGER := 0;
  pred_winner INTEGER; -- 1: Home, 2: Away, 0: Draw
  real_winner INTEGER;
BEGIN
  -- 1. Exacte uitslag check
  IF pred_home = real_home AND pred_away = real_away THEN
    RETURN 10;
  END IF;

  -- Bepaal winnaars
  IF pred_home > pred_away THEN pred_winner := 1;
  ELSIF pred_away > pred_home THEN pred_winner := 2;
  ELSE pred_winner := 0;
  END IF;

  IF real_home > real_away THEN real_winner := 1;
  ELSIF real_away > real_home THEN real_winner := 2;
  ELSE real_winner := 0;
  END IF;

  -- 2. Toto (Winnaar/Gelijkspel goed)
  IF pred_winner = real_winner THEN
    points := points + 5;
  END IF;

  -- 3. Bonus Doelsaldo (bijv 2-1 voorspeld, 1-0 resultaat -> saldo +1 is gelijk)
  -- Alleen als winnaar goed is
  IF pred_winner = real_winner AND (pred_home - pred_away) = (real_home - real_away) THEN
    points := points + 2;
  END IF;

  -- 4. Bonus Doelpunten per team
  IF pred_home = real_home THEN
    points := points + 1;
  END IF;
  IF pred_away = real_away THEN
    points := points + 1;
  END IF;

  RETURN points;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger om punten te berekenen als een match-uitslag wordt ingevuld
DROP TRIGGER IF EXISTS update_points_on_match_finish ON poule_matches;
DROP FUNCTION IF EXISTS trigger_update_prediction_points();

CREATE OR REPLACE FUNCTION trigger_update_prediction_points() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'finished' AND (NEW.home_score IS NOT NULL AND NEW.away_score IS NOT NULL) THEN
    UPDATE poule_predictions
    SET calculated_points = calculate_prediction_points(home_prediction, away_prediction, NEW.home_score, NEW.away_score)
    WHERE match_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_points_on_match_finish
AFTER UPDATE ON poule_matches
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.home_score IS DISTINCT FROM NEW.home_score OR OLD.away_score IS DISTINCT FROM NEW.away_score)
EXECUTE FUNCTION trigger_update_prediction_points();

-- RLS (Row Level Security)
ALTER TABLE poule_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE poule_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE poule_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE poule_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE poule_predictions ENABLE ROW LEVEL SECURITY;

-- Verwijder bestaande policies indien ze bestaan om fouten te voorkomen
DROP POLICY IF EXISTS "Everyone can see tournaments" ON poule_tournaments;
DROP POLICY IF EXISTS "Everyone can see matches" ON poule_matches;
DROP POLICY IF EXISTS "Users can see groups they belong to" ON poule_groups;
DROP POLICY IF EXISTS "Users can create groups" ON poule_groups;
DROP POLICY IF EXISTS "Users can see and manage own predictions" ON poule_predictions;

-- Publieke leesrechten voor actieve toernooien en wedstrijden
CREATE POLICY "Everyone can see tournaments" ON poule_tournaments FOR SELECT USING (true);
CREATE POLICY "Everyone can see matches" ON poule_matches FOR SELECT USING (true);

-- Groepen: Iedereen kan groepen zien waar ze lid van zijn
CREATE POLICY "Users can see groups they belong to" ON poule_groups
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM poule_group_members
    WHERE group_id = poule_groups.id AND user_id = auth.uid()
  ) OR owner_id = auth.uid()
);

-- Iedereen kan een groep aanmaken
CREATE POLICY "Users can create groups" ON poule_groups FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Voorspellingen: Alleen eigen voorspellingen zien
CREATE POLICY "Users can see and manage own predictions" ON poule_predictions
FOR ALL USING (auth.uid() = user_id);
