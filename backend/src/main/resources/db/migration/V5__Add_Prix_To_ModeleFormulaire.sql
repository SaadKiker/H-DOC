-- Add the prix column to the modeles_formulaires table
ALTER TABLE modeles_formulaires 
ADD COLUMN prix DECIMAL(10,2) DEFAULT 0.00; 