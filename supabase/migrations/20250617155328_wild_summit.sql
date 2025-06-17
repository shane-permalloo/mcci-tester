/*
  # Beta Feedback System

  1. New Tables
    - `beta_feedback`
      - `id` (uuid, primary key)
      - `device_type` (enum: ios, android, huawei)
      - `device_model` (text)
      - `feedback_type` (enum: bug_report, suggestion, general_comment)
      - `comment` (text)
      - `is_anonymous` (boolean)
      - `email` (text, optional for non-anonymous feedback)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on feedback table
    - Allow public insert for feedback submission
    - Allow authenticated users to view all feedback
*/

-- Create feedback type enum
CREATE TYPE feedback_type AS ENUM ('bug_report', 'suggestion', 'general_comment');

-- Create beta_feedback table
CREATE TABLE IF NOT EXISTS beta_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_type device_type NOT NULL,
  device_model text NOT NULL,
  feedback_type feedback_type NOT NULL,
  comment text NOT NULL,
  is_anonymous boolean DEFAULT false,
  email text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE beta_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for beta_feedback
CREATE POLICY "Anyone can submit feedback"
  ON beta_feedback
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view all feedback"
  ON beta_feedback
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_beta_feedback_device_type ON beta_feedback(device_type);
CREATE INDEX IF NOT EXISTS idx_beta_feedback_feedback_type ON beta_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_beta_feedback_created_at ON beta_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_beta_feedback_is_anonymous ON beta_feedback(is_anonymous);