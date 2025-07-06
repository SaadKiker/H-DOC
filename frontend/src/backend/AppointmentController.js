/**
 * This file provides implementation details for the backend.
 * 
 * NOTE: This is only an example and documentation for backend implementation.
 * The actual implementation should be in the appropriate backend project.
 */

/**
 * Permanently delete an appointment from the database.
 * 
 * API Endpoint: DELETE /api/appointments/permanent-delete/:id
 * 
 * This endpoint completely removes the appointment record from the database 
 * instead of just setting its status to "ANNULER".
 * 
 * Implementation should:
 * 1. Validate the appointment ID
 * 2. Check if the user has permission to delete this appointment
 * 3. Delete the appointment record from the database
 * 4. Return a success message
 * 
 * Example implementation:
 * 
 * ```
 * router.delete('/appointments/permanent-delete/:id', async (req, res) => {
 *   try {
 *     const id = req.params.id;
 *     
 *     // Validate appointment exists
 *     const appointment = await Appointment.findById(id);
 *     if (!appointment) {
 *       return res.status(404).json({ message: "Appointment not found" });
 *     }
 *     
 *     // Delete the appointment permanently
 *     await Appointment.deleteOne({ _id: id });
 *     
 *     return res.status(200).json({ 
 *       message: "Appointment permanently deleted from the database" 
 *     });
 *   } catch (error) {
 *     console.error('Error permanently deleting appointment:', error);
 *     return res.status(500).json({ 
 *       message: "An error occurred while deleting the appointment" 
 *     });
 *   }
 * });
 * ```
 */ 