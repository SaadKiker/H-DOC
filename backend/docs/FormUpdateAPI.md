# Form Update API Documentation

## Update a Complete Form Model with Sections and Fields

This API allows you to update a form model along with all its sections and fields. The update is comprehensive, meaning:
- Sections or fields missing from the request but present in the database will be deleted
- New sections or fields will be created
- Existing sections or fields will be updated

### Endpoint

```
PUT /api/formulaires/modeles/complet
```

### Headers
```
Content-Type: application/json
Authorization: Bearer {token}
```

### Request Body Structure

```json
{
  "idModele": 1,                    // Required - ID of form to update
  "nom": "Updated Form Name",
  "description": "Updated description",
  "idSpecialite": 1,
  "prix": 35.00,
  "sections": [                     // Optional - All existing sections will be replaced by these
    {
      "idSection": 1,               // Include ID for existing sections, null for new ones
      "nom": "Section Name",
      "description": "Section description",
      "ordreAffichage": 1,
      "champs": [                   // Optional - All existing fields will be replaced by these
        {
          "idChamp": 1,             // Include ID for existing fields, null for new ones
          "nom": "Field Name",
          "estObligatoire": true,
          "typeChamp": "text",
          "placeholder": "Enter value",
          "ordreAffichage": 1,
          "valeursPossibles": null,
          "unite": "units"
        }
      ],
      "sousSections": [             // Optional - All existing subsections will be replaced by these
        {
          "idSection": 3,           // Include ID for existing subsections, null for new ones
          "nom": "Subsection Name",
          "description": "Subsection description",
          "ordreAffichage": 1,
          "champs": [...]           // Same structure as above
        }
      ]
    }
  ]
}
```

### Complete Request Body Example

```json
{
  "idModele": 5,
  "nom": "Formulaire Médical Général Modifié",
  "description": "Version mise à jour du formulaire médical général",
  "idSpecialite": 1,
  "prix": 35.50,
  "sections": [
    {
      "idSection": 10,
      "nom": "Paramètres Vitaux Modifiés",
      "description": "Section modifiée pour les paramètres vitaux",
      "ordreAffichage": 1,
      "champs": [
        {
          "idChamp": 20,
          "nom": "Tension artérielle",
          "estObligatoire": true,
          "typeChamp": "text",
          "placeholder": "Ex: 120/80",
          "ordreAffichage": 1,
          "unite": "mmHg"
        },
        {
          "idChamp": 21,
          "nom": "Température corporelle",
          "estObligatoire": true,
          "typeChamp": "number",
          "placeholder": "Ex: 37.2",
          "ordreAffichage": 2,
          "unite": "°C"
        },
        {
          "nom": "Saturation en oxygène",
          "estObligatoire": false,
          "typeChamp": "number",
          "placeholder": "Ex: 98",
          "ordreAffichage": 3,
          "unite": "%"
        }
      ]
    },
    {
      "idSection": 11,
      "nom": "Diagnostic",
      "description": "Section pour le diagnostic médical",
      "ordreAffichage": 2,
      "champs": [
        {
          "idChamp": 22,
          "nom": "Symptômes",
          "estObligatoire": true,
          "typeChamp": "textarea",
          "placeholder": "Décrivez les symptômes du patient",
          "ordreAffichage": 1
        },
        {
          "idChamp": 23,
          "nom": "Diagnostic principal",
          "estObligatoire": true,
          "typeChamp": "text",
          "placeholder": "Entrez le diagnostic principal",
          "ordreAffichage": 2
        }
      ],
      "sousSections": [
        {
          "idSection": 15,
          "nom": "Examens Complémentaires",
          "description": "Examens à réaliser",
          "ordreAffichage": 1,
          "champs": [
            {
              "idChamp": 30,
              "nom": "Type d'examen",
              "estObligatoire": false,
              "typeChamp": "select",
              "valeursPossibles": "Radiographie,Échographie,IRM,Scanner,Prise de sang,Analyse d'urine",
              "ordreAffichage": 1
            },
            {
              "idChamp": 31,
              "nom": "Date prévue",
              "estObligatoire": false,
              "typeChamp": "date",
              "ordreAffichage": 2
            }
          ]
        },
        {
          "nom": "Prescription",
          "description": "Médicaments prescrits",
          "ordreAffichage": 2,
          "champs": [
            {
              "nom": "Médicament",
              "estObligatoire": false,
              "typeChamp": "text",
              "placeholder": "Nom du médicament",
              "ordreAffichage": 1
            },
            {
              "nom": "Posologie",
              "estObligatoire": false,
              "typeChamp": "text",
              "placeholder": "Ex: 1 comprimé matin et soir",
              "ordreAffichage": 2
            }
          ]
        }
      ]
    }
  ]
}
```

### Response

The response will contain the complete updated form structure with all sections and fields, including their IDs:

```json
[
  {
    "idSection": 10,
    "idModele": 5,
    "nom": "Paramètres Vitaux Modifiés",
    "description": "Section modifiée pour les paramètres vitaux",
    "ordreAffichage": 1,
    "idParentSection": null,
    "sousSections": [],
    "champs": [
      {
        "idChamp": 20,
        "idSection": 10,
        "nom": "Tension artérielle",
        "estObligatoire": true,
        "typeChamp": "text",
        "placeholder": "Ex: 120/80",
        "ordreAffichage": 1,
        "valeursPossibles": null,
        "unite": "mmHg"
      },
      {
        "idChamp": 21,
        "idSection": 10,
        "nom": "Température corporelle",
        "estObligatoire": true,
        "typeChamp": "number",
        "placeholder": "Ex: 37.2",
        "ordreAffichage": 2,
        "valeursPossibles": null,
        "unite": "°C"
      },
      {
        "idChamp": 40,
        "idSection": 10,
        "nom": "Saturation en oxygène",
        "estObligatoire": false,
        "typeChamp": "number",
        "placeholder": "Ex: 98",
        "ordreAffichage": 3,
        "valeursPossibles": null,
        "unite": "%"
      }
    ]
  },
  {
    "idSection": 11,
    "idModele": 5,
    "nom": "Diagnostic",
    "description": "Section pour le diagnostic médical",
    "ordreAffichage": 2,
    "idParentSection": null,
    "sousSections": [
      {
        "idSection": 15,
        "idModele": 5,
        "nom": "Examens Complémentaires",
        "description": "Examens à réaliser",
        "ordreAffichage": 1,
        "idParentSection": 11,
        "sousSections": [],
        "champs": [
          {
            "idChamp": 30,
            "idSection": 15,
            "nom": "Type d'examen",
            "estObligatoire": false,
            "typeChamp": "select",
            "placeholder": null,
            "ordreAffichage": 1,
            "valeursPossibles": "Radiographie,Échographie,IRM,Scanner,Prise de sang,Analyse d'urine",
            "unite": null
          },
          {
            "idChamp": 31,
            "idSection": 15,
            "nom": "Date prévue",
            "estObligatoire": false,
            "typeChamp": "date",
            "placeholder": null,
            "ordreAffichage": 2,
            "valeursPossibles": null,
            "unite": null
          }
        ]
      },
      {
        "idSection": 41,
        "idModele": 5,
        "nom": "Prescription",
        "description": "Médicaments prescrits",
        "ordreAffichage": 2,
        "idParentSection": 11,
        "sousSections": [],
        "champs": [
          {
            "idChamp": 42,
            "idSection": 41,
            "nom": "Médicament",
            "estObligatoire": false,
            "typeChamp": "text",
            "placeholder": "Nom du médicament",
            "ordreAffichage": 1,
            "valeursPossibles": null,
            "unite": null
          },
          {
            "idChamp": 43,
            "idSection": 41,
            "nom": "Posologie",
            "estObligatoire": false,
            "typeChamp": "text",
            "placeholder": "Ex: 1 comprimé matin et soir",
            "ordreAffichage": 2,
            "valeursPossibles": null,
            "unite": null
          }
        ]
      }
    ],
    "champs": [
      {
        "idChamp": 22,
        "idSection": 11,
        "nom": "Symptômes",
        "estObligatoire": true,
        "typeChamp": "textarea",
        "placeholder": "Décrivez les symptômes du patient",
        "ordreAffichage": 1,
        "valeursPossibles": null,
        "unite": null
      },
      {
        "idChamp": 23,
        "idSection": 11,
        "nom": "Diagnostic principal",
        "estObligatoire": true,
        "typeChamp": "text",
        "placeholder": "Entrez le diagnostic principal",
        "ordreAffichage": 2,
        "valeursPossibles": null,
        "unite": null
      }
    ]
  }
]
```

### Status Codes

- `200 OK`: The form model was successfully updated
- `404 Not Found`: The form model, section, or field specified in the request was not found
- `409 Conflict`: The form model is already in use and cannot be updated
- `500 Internal Server Error`: Server error occurred

### Notes

- The update is comprehensive - any sections or fields not included in the request will be deleted
- To keep existing sections or fields, include them in the request with their IDs
- To add new sections or fields, omit the ID (set to null or don't include the property)
- The update is transactional - either all changes are applied or none are
- If the form is already in use (has submitted patient forms), updates might be restricted
- Each field (`champ`) must have a unique `ordreAffichage` value within its section
- Similarly, each section must have a unique `ordreAffichage` within its parent (or at the root level) 