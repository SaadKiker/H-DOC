# Form Deletion API Documentation

## Delete a Form Model with All Sections and Fields

This API allows you to delete a form model along with all its sections and fields.

### Endpoint

```
DELETE /api/formulaires/modeles/{idModele}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| idModele  | Integer | Yes | The ID of the form model to delete |

### Headers
```
Authorization: Bearer {token}
```

### Request Example

```http
DELETE /api/formulaires/modeles/5 HTTP/1.1
Host: your-api-domain.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Successful Response Example (HTTP 200 OK)

```json
{
  "status": "success",
  "message": "Modèle de formulaire supprimé avec succès"
}
```

### Error Response Examples

#### Form Not Found (HTTP 404 Not Found)

```json
{
  "status": "error",
  "message": "Formulaire non trouvé avec l'ID: 5"
}
```

#### Form In Use (HTTP 409 Conflict)

```json
{
  "status": "error",
  "message": "Ce modèle de formulaire est déjà utilisé dans des formulaires soumis et ne peut pas être supprimé."
}
```

#### Server Error (HTTP 500 Internal Server Error)

```json
{
  "status": "error",
  "message": "Erreur lors de la suppression du formulaire: [détails de l'erreur]"
}
```

### Notes

- The deletion is cascading - all sections and fields associated with the form model will also be deleted
- The form cannot be deleted if it's already being used in submitted patient forms
- When a form is deleted, it's permanently removed from the database 