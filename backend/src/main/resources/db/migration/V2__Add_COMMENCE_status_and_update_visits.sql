-- Update the status field with new values and modify existing data

-- Rename commentaire column to note if it exists or add note column if neither exists
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM information_schema.columns 
               WHERE table_name = 'rendez_vous' AND column_name = 'commentaire') THEN
        ALTER TABLE rendez_vous RENAME COLUMN commentaire TO note;
    ELSIF NOT EXISTS (SELECT FROM information_schema.columns 
                     WHERE table_name = 'rendez_vous' AND column_name = 'note') THEN
        ALTER TABLE rendez_vous ADD COLUMN note TEXT;
    END IF;
END $$;

-- Add check constraint to validate status values
ALTER TABLE rendez_vous 
DROP CONSTRAINT IF EXISTS rendez_vous_status_check;

ALTER TABLE rendez_vous
ADD CONSTRAINT rendez_vous_status_check 
CHECK (status IN ('PLANIFIE', 'LATE', 'COMMENCE', 'TERMINE', 'ANNULE', 'ABSENCE'));

-- Update appointments that are linked to visits to have COMMENCE status
UPDATE rendez_vous 
SET status = 'COMMENCE' 
WHERE id_rdv IN (
    SELECT id_rdv 
    FROM visite 
    WHERE id_rdv IS NOT NULL
);

-- Set any existing COMPLETE status records to TERMINE
UPDATE rendez_vous
SET status = 'TERMINE'
WHERE status = 'COMPLETE';

-- Add a comment explaining the status values
COMMENT ON COLUMN rendez_vous.status IS 'Appointment status: PLANIFIE (scheduled), LATE (patient is late), COMMENCE (visit started), TERMINE (completed), ANNULE (cancelled), ABSENCE (no-show)'; 

-- Add a comment for the note column
COMMENT ON COLUMN rendez_vous.note IS 'Notes or comments about the appointment'; 