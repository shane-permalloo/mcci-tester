/*
  # Beta Testing Platform Schema

  1. New Tables
    - `beta_testers`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `full_name` (text)
      - `device_type` (enum: ios, android, huawei)
      - `device_model` (text)
      - `experience_level` (enum: beginner, intermediate, expert)
      - `status` (enum: pending, approved, invited, active, declined)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `beta_invitations`
      - `id` (uuid, primary key)
      - `tester_id` (uuid, foreign key)
      - `platform` (enum: google_play, app_store, huawei_gallery)
      - `invitation_sent_at` (timestamp)
      - `status` (enum: sent, accepted, declined, expired)
      - `invitation_link` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage data
    - Public read access for beta_testers registration
*/

-- Create custom types
CREATE TYPE device_type AS ENUM ('ios', 'android', 'huawei');
CREATE TYPE experience_level AS ENUM ('beginner', 'intermediate', 'expert');
CREATE TYPE tester_status AS ENUM ('pending', 'approved', 'invited', 'active', 'declined');
CREATE TYPE platform_type AS ENUM ('google_play', 'app_store', 'huawei_gallery');
CREATE TYPE invitation_status AS ENUM ('sent', 'accepted', 'declined', 'expired');

-- Create beta_testers table
CREATE TABLE IF NOT EXISTS beta_testers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  device_type device_type NOT NULL,
  device_model text NOT NULL,
  experience_level experience_level NOT NULL,
  status tester_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create beta_invitations table
CREATE TABLE IF NOT EXISTS beta_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tester_id uuid NOT NULL REFERENCES beta_testers(id) ON DELETE CASCADE,
  platform platform_type NOT NULL,
  invitation_sent_at timestamptz DEFAULT now(),
  status invitation_status DEFAULT 'sent',
  invitation_link text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE beta_testers ENABLE ROW LEVEL SECURITY;
ALTER TABLE beta_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for beta_testers
CREATE POLICY "Anyone can insert beta tester applications"
  ON beta_testers
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view all beta testers"
  ON beta_testers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update beta testers"
  ON beta_testers
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create policies for beta_invitations
CREATE POLICY "Authenticated users can manage beta invitations"
  ON beta_invitations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_beta_testers_email ON beta_testers(email);
CREATE INDEX IF NOT EXISTS idx_beta_testers_status ON beta_testers(status);
CREATE INDEX IF NOT EXISTS idx_beta_testers_device_type ON beta_testers(device_type);
CREATE INDEX IF NOT EXISTS idx_beta_testers_created_at ON beta_testers(created_at);
CREATE INDEX IF NOT EXISTS idx_beta_invitations_tester_id ON beta_invitations(tester_id);
CREATE INDEX IF NOT EXISTS idx_beta_invitations_platform ON beta_invitations(platform);
CREATE INDEX IF NOT EXISTS idx_beta_invitations_status ON beta_invitations(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for beta_testers
CREATE TRIGGER update_beta_testers_updated_at
  BEFORE UPDATE ON beta_testers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();