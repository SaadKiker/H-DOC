-- Create the modeles_formulaires table
CREATE TABLE modeles_formulaires (
    id_modele SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    id_specialite INTEGER NOT NULL,
    FOREIGN KEY (id_specialite) REFERENCES specialite(id_specialite)
);

-- Create the sections_formulaires table
CREATE TABLE sections_formulaires (
    id_section SERIAL PRIMARY KEY,
    id_modele INTEGER NOT NULL,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    ordre_affichage INTEGER NOT NULL,
    id_parent_section INTEGER,
    FOREIGN KEY (id_modele) REFERENCES modeles_formulaires(id_modele),
    FOREIGN KEY (id_parent_section) REFERENCES sections_formulaires(id_section)
);

-- Create the champs_formulaires table
CREATE TABLE champs_formulaires (
    id_champ SERIAL PRIMARY KEY,
    id_section INTEGER NOT NULL,
    nom VARCHAR(255) NOT NULL,
    est_obligatoire BOOLEAN NOT NULL DEFAULT FALSE,
    type_champ VARCHAR(50) NOT NULL,
    placeholder TEXT,
    ordre_affichage INTEGER NOT NULL,
    valeurs_possibles TEXT,
    unite VARCHAR(50),
    FOREIGN KEY (id_section) REFERENCES sections_formulaires(id_section)
);

-- Create the formulaires_patients table
CREATE TABLE formulaires_patients (
    id_formulaire SERIAL PRIMARY KEY,
    id_patient UUID NOT NULL,
    id_modele INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    id_medecin UUID NOT NULL,
    id_visite INTEGER NOT NULL,
    date_remplissage TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_patient) REFERENCES patient(id_patient),
    FOREIGN KEY (id_modele) REFERENCES modeles_formulaires(id_modele),
    FOREIGN KEY (id_medecin) REFERENCES medecin(id_medecin),
    FOREIGN KEY (id_visite) REFERENCES visite(id_visite)
);

-- Create the reponses_formulaires table
CREATE TABLE reponses_formulaires (
    id_reponse SERIAL PRIMARY KEY,
    id_formulaire INTEGER NOT NULL,
    id_champ INTEGER NOT NULL,
    valeur TEXT,
    id_section INTEGER NOT NULL,
    FOREIGN KEY (id_formulaire) REFERENCES formulaires_patients(id_formulaire),
    FOREIGN KEY (id_champ) REFERENCES champs_formulaires(id_champ),
    FOREIGN KEY (id_section) REFERENCES sections_formulaires(id_section)
); 