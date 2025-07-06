# Doctor-Patient Relationship Based Access Control

## Overview

This feature implements a security control that restricts doctors to only searching for and viewing patients with whom they have an established clinical relationship. This relationship is determined by the existence of at least one visit (past or present) between the doctor and patient.

## Implementation Details

### Access Control Logic

1. When a user searches for patients using the `/api/patients` endpoint:
   - If the user has role "AGENT" or "ADMIN" → all matching patients are returned
   - If the user has role "MEDECIN" → only patients who have at least one visit record with this doctor are returned

2. The filter logic:
   - Retrieves all patient IDs associated with the doctor from the visit history
   - Filters any search results to only include patients from this allowed list
   - Returns empty results if the doctor has no established patient relationships

### API Changes

The patient search endpoint now accepts two optional headers:
- `X-User-ID`: UUID of the authenticated user
- `X-User-Role`: Role of the authenticated user (AGENT, MEDECIN, or ADMIN)

If these headers are not provided, the API defaults to the previous unrestricted behavior for backward compatibility.

## Using the Feature

### Frontend Configuration

To implement this feature, the frontend should:

1. Set the appropriate headers on all patient search requests:

```javascript
// Example axios request
const searchPatients = async (query) => {
  const response = await axios.get(`/api/patients?query=${query}`, {
    headers: {
      'X-User-ID': currentUser.id,
      'X-User-Role': currentUser.role
    }
  });
  return response.data;
};
```

2. Handle empty results appropriately:
   - For doctors with no patients, display a message like "No patients found. You can only view patients with whom you have a clinical relationship."

### Testing the Feature

To test this feature:

1. Login as a doctor user
2. Attempt to search for a patient who doesn't have any visits with you
   - Expected: No results returned
3. Create a visit with a patient
4. Search for that patient 
   - Expected: The patient appears in search results
5. Login as an agent user
6. Search for the same patient
   - Expected: The patient appears in search results regardless of visit history

## Security Considerations

1. This is a server-side access control mechanism. Even if the frontend doesn't set the headers, the backend enforces the restrictions when proper headers are present.

2. The feature validates the user role and ID at the API level.

3. There are no bypass mechanisms - access is strictly enforced based on clinical relationships.

4. Future improvements could include:
   - Extending this control to other patient endpoints (patient details, document access, etc.)
   - Adding audit logging for all patient data access attempts 