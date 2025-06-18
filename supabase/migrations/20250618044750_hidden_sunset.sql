/*
  # Add Feedback Status and Development Estimate

  1. New Columns
    - `status` (enum: to_discuss, low, high, to_implement) - Default: to_discuss
    - `development_estimate` (integer) - Man days estimate for implementation
    - `updated_at` (timestamp) - Track when feedback was last updated

  2. Security
    - Update existing policies to allow status and estimate updates
    - Add indexes for better performance on status filtering
*/

-- Create feedback status enum
CREATE TYPE feedback_status AS ENUM ('to_discuss', 'low', 'high', 'to_implement');

-- Add new columns to beta_feedback table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'beta_feedback' AND column_name = 'status'
  ) THEN
    ALTER TABLE beta_feedback ADD COLUMN status feedback_status DEFAULT 'to_discuss';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'beta_feedback' AND column_name = 'development_estimate'
  ) THEN
    ALTER TABLE beta_feedback ADD COLUMN development_estimate integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'beta_feedback' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE beta_feedback ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create policy for authenticated users to update feedback status and estimates
CREATE POLICY "Authenticated users can update feedback status and estimates"
  ON beta_feedback
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_beta_feedback_status ON beta_feedback(status);
CREATE INDEX IF NOT EXISTS idx_beta_feedback_updated_at ON beta_feedback(updated_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_beta_feedback_updated_at
  BEFORE UPDATE ON beta_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_updated_at();