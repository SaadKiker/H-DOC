# Form Deletion - Postman Example

## Delete a Form Model

### Request Setup

**Method**: DELETE  
**URL**: `{{base_url}}/api/formulaires/modeles/5`

### Headers
```
Authorization: Bearer {{token}}
```

### Body
No body required for this request

### Environment Variables Setup
In Postman, make sure you have these environment variables:
- `base_url`: Your API base URL (e.g., `http://localhost:8080`)  
- `token`: Your authentication token

### Expected Responses

#### Successful Response (200 OK)
```json
{
  "status": "success",
  "message": "Modèle de formulaire supprimé avec succès"
}
```

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
  "message": "Ce modèle de formulaire est déjà utilisé dans des formulaires soumis et ne peut pas être supprimé."
}
```

### Postman Test Script
You can add this script to the "Tests" tab in Postman to verify the response:

```javascript
pm.test("Status code is 200 OK for successful deletion", function () {
    if (pm.response.code === 200) {
        pm.expect(pm.response.json().status).to.equal("success");
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