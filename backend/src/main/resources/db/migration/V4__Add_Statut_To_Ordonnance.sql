-- Add statut column to ordonnance table
ALTER TABLE ordonnance ADD COLUMN statut VARCHAR(50) DEFAULT 'en_cours';

-- Add comment explaining the status values
COMMENT ON COLUMN ordonnance.statut IS 'Status of the ordonnance: en_cours (being actively edited), finalise (completed and PDF generated)';

-- Update existing ordonnances to finalise status since they all have PDFs generated
UPDATE ordonnance SET statut = 'finalise' WHERE url IS NOT NULL; 