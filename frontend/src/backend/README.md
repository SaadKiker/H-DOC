# Backend Implementation Requirements

## Permanent Appointment Deletion

The frontend now uses a new endpoint for permanent appointment deletion: `/api/appointments/permanent-delete/:id`

### Purpose
The existing delete endpoint (`/api/appointments/:id`) only changes the appointment status to "ANNULER" but keeps the record in the database. For our use case, we need to completely remove appointments from the database.

### Implementation Details

1. Create a new DELETE endpoint: `/api/appointments/permanent-delete/:id`
2. This endpoint should:
   - Validate the appointment ID
   - Check if the user has permission to delete this appointment
   - **Permanently delete** the appointment record from the database (not just update the status)
   - Return a success message

### Example Implementation

```javascript
router.delete('/appointments/permanent-delete/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    // Validate appointment exists
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    
    // Delete the appointment permanently
    await Appointment.deleteOne({ _id: id });
    
    return res.status(200).json({ 
      message: "Appointment permanently deleted from the database" 
    });
  } catch (error) {
    console.error('Error permanently deleting appointment:', error);
    return res.status(500).json({ 
      message: "An error occurred while deleting the appointment" 
    });
  }
});
```

### Implementation Timeline
Please implement this endpoint as soon as possible, as the frontend feature depends on it. 