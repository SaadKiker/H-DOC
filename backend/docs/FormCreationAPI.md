# Form Creation API Documentation

## Create a Complete Form Model with Sections and Fields

This API allows you to create a full form model with its sections and fields in a single request.

### Endpoint

```
POST /api/formulaires/modeles/complet
```

### Headers
```
Content-Type: application/json
Authorization: Bearer {token}
```

### Request Body Example

```json
{
  "nom": "Formulaire Médical Général",
  "description": "Formulaire pour la collecte des informations médicales générales",
  "idSpecialite": 1,
  "prix": 25.00,
  "sections": [
    {
      "nom": "Paramètres Vitaux",
      "description": "Section pour la collecte des paramètres vitaux du patient",
      "ordreAffichage": 1,
      "champs": [
        {
          "nom": "Tension artérielle",
          "estObligatoire": true,
          "typeChamp": "text",
          "placeholder": "Ex: 120/80",
          "ordreAffichage": 1,
          "unite": "mmHg"
        },
        {
          "nom": "Température",
          "estObligatoire": true,
          "typeChamp": "number",
          "placeholder": "Ex: 37.2",
          "ordreAffichage": 2,
          "unite": "°C"
        },
        {
          "nom": "Fréquence cardiaque",
          "estObligatoire": true,
          "typeChamp": "number",
          "placeholder": "Ex: 75",
          "ordreAffichage": 3,
          "unite": "bpm"
        }
      ]
    },
    {
      "nom": "Diagnostic",
      "description": "Section pour le diagnostic médical",
      "ordreAffichage": 2,
      "champs": [
        {
          "nom": "Symptômes",
          "estObligatoire": true,
          "typeChamp": "textarea",
          "placeholder": "Décrivez les symptômes du patient",
          "ordreAffichage": 1
        },
        {
          "nom": "Diagnostic principal",
          "estObligatoire": true,
          "typeChamp": "text",
          "placeholder": "Entrez le diagnostic principal",
          "ordreAffichage": 2
        }
      ],
      "sousSections": [
        {
          "nom": "Examens Complémentaires",
          "description": "Examens à réaliser",
          "ordreAffichage": 1,
          "champs": [
            {
              "nom": "Type d'examen",
              "estObligatoire": false,
              "typeChamp": "select",
              "valeursPossibles": "Radiographie,Échographie,IRM,Scanner,Prise de sang",
              "ordreAffichage": 1
            },
            {
              "nom": "Date prévue",
              "estObligatoire": false,
              "typeChamp": "date",
              "ordreAffichage": 2
            }
          ]
        }
      ]
    }
  ]
}
```

### Response Example

```json
[
  {
    "idSection": 1,
    "idModele": 1,
    "nom": "Paramètres Vitaux",
    "description": "Section pour la collecte des paramètres vitaux du patient",
    "ordreAffichage": 1,
    "idParentSection": null,
    "sousSections": [],
    "champs": [
      {
        "idChamp": 1,
        "idSection": 1,
        "nom": "Tension artérielle",
        "estObligatoire": true,
        "typeChamp": "text",
        "placeholder": "Ex: 120/80",
        "ordreAffichage": 1,
        "valeursPossibles": null,
        "unite": "mmHg"
      },
      {
        "idChamp": 2,
        "idSection": 1,
        "nom": "Température",
        "estObligatoire": true,
        "typeChamp": "number",
        "placeholder": "Ex: 37.2",
        "ordreAffichage": 2,
        "valeursPossibles": null,
        "unite": "°C"
      },
      {
        "idChamp": 3,
        "idSection": 1,
        "nom": "Fréquence cardiaque",
        "estObligatoire": true,
        "typeChamp": "number",
        "placeholder": "Ex: 75",
        "ordreAffichage": 3,
        "valeursPossibles": null,
        "unite": "bpm"
      }
    ]
  },
  {
    "idSection": 2,
    "idModele": 1,
    "nom": "Diagnostic",
    "description": "Section pour le diagnostic médical",
    "ordreAffichage": 2,
    "idParentSection": null,
    "sousSections": [
      {
        "idSection": 3,
        "idModele": 1,
        "nom": "Examens Complémentaires",
        "description": "Examens à réaliser",
        "ordreAffichage": 1,
        "idParentSection": 2,
        "sousSections": [],
        "champs": [
          {
            "idChamp": 6,
            "idSection": 3,
            "nom": "Type d'examen",
            "estObligatoire": false,
            "typeChamp": "select",
            "placeholder": null,
            "ordreAffichage": 1,
            "valeursPossibles": "Radiographie,Échographie,IRM,Scanner,Prise de sang",
            "unite": null
          },
          {
            "idChamp": 7,
            "idSection": 3,
            "nom": "Date prévue",
            "estObligatoire": false,
            "typeChamp": "date",
            "placeholder": null,
            "ordreAffichage": 2,
            "valeursPossibles": null,
            "unite": null
          }
        ]
      }
    ],
    "champs": [
      {
        "idChamp": 4,
        "idSection": 2,
        "nom": "Symptômes",
        "estObligatoire": true,
        "typeChamp": "textarea",
        "placeholder": "Décrivez les symptômes du patient",
        "ordreAffichage": 1,
        "valeursPossibles": null,
        "unite": null
      },
      {
        "idChamp": 5,
        "idSection": 2,
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

- `201 Created`: The form model was successfully created
- `400 Bad Request`: Invalid input data
- `500 Internal Server Error`: Server error occurred

### Notes

- The response includes the complete structure of the created form with all generated IDs
- Nested sections can be created by using the `sousSections` array
- Each field (`champ`) must have a unique `ordreAffichage` value within its section
- Similarly, each section must have a unique `ordreAffichage` within its parent (or at the root level)
- `valeursPossibles` should be a comma-separated list of options for select/radio/checkbox fields
- `estObligatoire` determines if the field is required when filling out the form 