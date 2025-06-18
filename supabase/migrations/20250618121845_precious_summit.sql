/*
  # Add Archive and Published Status to Feedback

  1. Changes
    - Update feedback_status enum to include 'archived' and 'published'
    - These statuses will make feedback appear in the kanban board
    - Maintain backward compatibility with existing data

  2. Security
    - No changes to existing policies needed
    - Authenticated users can still update feedback status
*/

-- Add new values to the feedback_status enum
ALTER TYPE feedback_status ADD VALUE IF NOT EXISTS 'archived';
ALTER TYPE feedback_status ADD VALUE IF NOT EXISTS 'published';