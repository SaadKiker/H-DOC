# Form Update - Postman Example

## Update a Complete Form Model

### Request Setup

**Method**: PUT  
**URL**: `{{base_url}}/api/formulaires/modeles/complet`  

### Headers
```
Content-Type: application/json
Authorization: Bearer {{token}}
```

### Body
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

### Environment Variables Setup
In Postman, make sure you have these environment variables:
- `base_url`: Your API base URL (e.g., `http://localhost:8080`)  
- `token`: Your authentication token

### Expected Responses

#### Successful Response (200 OK)
The response will contain the complete updated form structure with all sections and fields, including their IDs.

#### Form Not Found (404 Not Found)
```json
{
  "status": "error",
  "message": "Formulaire non trouvé avec l'ID: 5"
}
```

#### Form In Use (409 Conflict)
```json
{
  "status": "error",
  "message": "Ce modèle de formulaire est déjà utilisé dans des formulaires soumis. Les modifications pourraient affecter les données existantes."
}
```

### Postman Test Script
You can add this script to the "Tests" tab in Postman to verify the response:

```javascript
pm.test("Status code is 200 OK for successful update", function () {
    pm.response.to.have.status(200);
});

pm.test("Response contains updated form structure", function () {
    if (pm.response.code === 200) {
        const responseData = pm.response.json();
        pm.expect(responseData).to.be.an('array');
        pm.expect(responseData.length).to.be.greaterThan(0);
        
        // Check first section
        const firstSection = responseData[0];
        pm.expect(firstSection).to.have.property('idSection');
        pm.expect(firstSection).to.have.property('nom');
        pm.expect(firstSection).to.have.property('champs').that.is.an('array');
    }
});

pm.test("Error message is provided for 404 Not Found", function () {
    if (pm.response.code === 404) {
        pm.expect(pm.response.json().status).to.equal("error");
        pm.expect(pm.response.json().message).to.include("non trouvé");
    }
});

pm.test("Error message is provided for 409 Conflict", function () {
    if (pm.response.code === 409) {
        pm.expect(pm.response.json().status).to.equal("error");
        pm.expect(pm.response.json().message).to.include("déjà utilisé");
    }
});
```

### Notes
When using this endpoint, remember:

1. **Complete Update**: This is a comprehensive update. If you omit a section or field that exists in the database, it will be deleted.

2. **ID Usage**:
   - Include IDs for existing sections/fields you want to update
   - Omit IDs for new sections/fields you want to create

3. **Nesting**: You can have multiple levels of nesting (section → subsection → fields)

4. **Ordering**: Make sure each section and field has a unique `ordreAffichage` within its context 