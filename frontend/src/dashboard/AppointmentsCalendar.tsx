import React, { useState, useEffect, useCallback, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventInput } from '@fullcalendar/core';
import { getAppointments, deleteAppointment } from '../shared/api/appointmentService';
import { Appointment } from './types';
import AppointmentForm from './AppointmentForm';
import './Appointments.css';
import axios from '../shared/api/axios';
import { API_ENDPOINTS } from '../shared/api/api.config';

// SVG icons
const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"></polyline>
    <polyline points="23 20 23 14 17 14"></polyline>
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
  </svg>
);

interface AppointmentsCalendarProps {
  userRole: string;
  userId?: string;
}

type CalendarViewType = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';

const AppointmentsCalendar: React.FC<AppointmentsCalendarProps> = ({ userRole, userId }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [events, setEvents] = useState<EventInput[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calendarView, setCalendarView] = useState<CalendarViewType>('timeGridWeek');
  
  // Reference to the calendar instance
  const calendarRef = useRef<any>(null);
  
  // State for form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | undefined>(undefined);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Handle doctor-specific view if the user is a doctor
  const isDoctorView = userRole === 'MEDECIN' && userId;

  // Handle view change from dropdown
  const handleViewChange = (newView: CalendarViewType) => {
    setCalendarView(newView);
    
    // Update the calendar view if calendar is already rendered
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(newView);
    }
  };

  // Fetch appointments
  const fetchAppointments = useCallback(async (startDate: string, endDate: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // If doctor view, fetch only doctor's appointments
      const doctorId = isDoctorView ? userId : undefined;
      // Use the new includeAllStatuses parameter to get all appointments regardless of status
      const appointmentsData = await getAppointments(startDate, endDate, doctorId, true);
      
      console.log('Appointments data from API:', appointmentsData);
      setAppointments(appointmentsData);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Erreur lors du chargement des rendez-vous. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  }, [isDoctorView, userId]);

  // Convert appointments to calendar events
  useEffect(() => {
    const formattedEvents = appointments.map(appointment => {
      // Create a new Date object from the appointment's dateHeure
      const startTime = new Date(appointment.dateHeure);
      console.log(`Raw appointment time for #${appointment.id}:`, appointment.dateHeure);
      console.log(`Parsed as Date object:`, startTime.toString());
      
      const endTime = new Date(startTime.getTime() + appointment.durationMinutes * 60000);
      
      console.log(`Processing appointment #${appointment.id} time:`, startTime.toLocaleString());
      
      // Use the complete patient object
      const patientName = appointment.patient ? 
        `${appointment.patient.prenom} ${appointment.patient.nom}` : 
        (appointment.prenomPatient && appointment.nomPatient ? 
          `${appointment.prenomPatient} ${appointment.nomPatient}` : 
          (appointment.idPatient ? `RDV #${String(appointment.id).substring(0, 4)}` : 'Sans patient'));
      
      // Use the complete doctor object
      const doctorName = appointment.medecin ? 
        `Dr. ${appointment.medecin.prenom} ${appointment.medecin.nom}` : 
        (appointment.nomMedecin ? 
          `${appointment.nomMedecin}` : 
          'Sans médecin');
      
      // Add specialty if available
      const specialtyInfo = appointment.medecin?.nomSpecialite || appointment.specialiteMedecin || '';
      const doctorWithSpecialty = specialtyInfo ? `${doctorName} (${specialtyInfo})` : doctorName;
      
      // Get appointment type from either typeVisit or typeVisite
      const appointmentType = appointment.typeVisit || appointment.typeVisite || '';
      console.log(`Appointment ID ${appointment.id} - Type:`, appointmentType);
      console.log(`  typeVisit: ${appointment.typeVisit}, typeVisite: ${appointment.typeVisite}`);
      
      // Get appointment status if available
      const appointmentStatus = appointment.status || 'PLANIFIE';
      console.log(`Appointment ID ${appointment.id} - Status:`, appointmentStatus);
      
      return {
        id: appointment.id,
        title: patientName,
        start: startTime,
        end: endTime,
        extendedProps: {
          appointment,
          doctor: doctorWithSpecialty,
          type: appointmentType,
          status: appointmentStatus
        },
        backgroundColor: getAppointmentColor(appointmentType),
        borderColor: getAppointmentColor(appointmentType),
        // Make sure all appointments are displayed regardless of status
        display: 'auto'
      };
    });
    
    setEvents(formattedEvents);
  }, [appointments]);

  // Add a function to get color based on appointment type
  const getAppointmentColor = (type: string): string => {
    switch (type?.toUpperCase()) {
      case 'CONSULTATION':
        return '#1E513B'; // Primary green color
      case 'SUIVI':
        return '#8338ec'; // Purple for follow-ups
      case 'CONTROLE':
        return '#ffbe0b'; // Yellow for check-ups
      default:
        return '#1E513B'; // Default color
    }
  };

  // Handle date range change in calendar
  const handleDatesSet = (info: any) => {
    const startDate = info.startStr.slice(0, 19);
    const endDate = info.endStr.slice(0, 19);
    fetchAppointments(startDate, endDate);
  };

  // Handle click on a date/time slot - fix timezone issues
  const handleDateClick = (info: any) => {
    // Prevent doctors from creating appointments
    if (userRole === 'MEDECIN') {
      return; // Early return for doctors - no appointment creation allowed
    }
    
    const clickedDate = info.date;
    const now = new Date();
    
    // Prevent creating appointments in the past
    if (clickedDate < now) {
      // Display a message or toast notification
      alert("Impossible de créer un rendez-vous dans le passé.");
      return;
    }
    
    // Make sure we fully reset state for a new appointment
    setSelectedAppointment(undefined);
    setSelectedDate(clickedDate);
    
    // Log the exact clicked time for debugging
    console.log('Clicked time for new appointment:', clickedDate.toLocaleTimeString());
    
    // Open the form only after resetting state
    openForm();
  };

  // Handle click on an event
  const handleEventClick = (info: any) => {
    // Prevent default event behavior
    info.jsEvent.preventDefault();
    info.jsEvent.stopPropagation();

    // Prevent doctors from editing appointments
    if (userRole === 'MEDECIN') {
      return; // Early return for doctors - no appointment editing allowed
    }

    // Close all popovers first
    document.querySelectorAll('.fc-popover, .fc-daygrid-more-popover, .fc-more-popover').forEach(el => {
      // Force removal from DOM
      el.remove();
    });

    // Only proceed with appointment handling after a delay to ensure popovers are gone
    setTimeout(() => {
      if (info.event.extendedProps.appointment) {
        const appointment = info.event.extendedProps.appointment;
        
        // Create a deep copy of the appointment to avoid reference issues
        const appointmentCopy = JSON.parse(JSON.stringify(appointment));
        
        // Use the appointment data as is
        setSelectedAppointment(appointmentCopy);
        setSelectedDate(undefined);
        
        // Open the form
        openForm();
      }
    }, 150); // Increased delay to ensure UI cleanup is complete
  };

  // Open form and overlay
  const openForm = () => {
    setIsFormOpen(true);
    setIsOverlayVisible(true);
  };

  // Close form and overlay
  const closeForm = () => {
    setIsFormOpen(false);
    setIsOverlayVisible(false);
    
    // Ensure all form state is reset on close
    setSelectedDate(undefined);
    setSelectedAppointment(undefined);
  };

  // Handle appointment save
  const handleAppointmentSaved = (appointment: Appointment) => {
    console.log('handleAppointmentSaved called with appointment:', appointment);
    console.log('selectedAppointment?.id:', selectedAppointment?.id);
    
    try {
      // Simply use the appointment as returned by the API
      // Let's keep a minimal approach
      console.log('Using appointment data:', appointment);
      
    // Update appointment list immediately after saving
    setAppointments(prevAppointments => {
      // If updating existing appointment
      if (appointment.id && selectedAppointment?.id) {
          console.log('Updating existing appointment in state');
          const updatedAppointments = prevAppointments.map(apt => 
          apt.id === appointment.id ? appointment : apt
        );
          console.log('Updated appointments state:', updatedAppointments);
          return updatedAppointments;
      }
      // If creating new appointment
        console.log('Adding new appointment to state');
        const newAppointments = [...prevAppointments, appointment];
        console.log('New appointments state:', newAppointments);
        return newAppointments;
    });
      
      // Update events to reflect changes
      console.log('Appointment saved successfully, refreshing events...');
    
    // Clear selection state to ensure next appointment form opens fresh
    setSelectedDate(undefined);
    setSelectedAppointment(undefined);
      console.log('Appointment selection reset');
      
    } catch (error) {
      console.error('Error handling saved appointment:', error);
    }
  };

  // Handle appointment deletion
  const handleDeleteAppointment = () => {
    if (!selectedAppointment?.id) {
      console.error('No appointment ID found for deletion');
      return;
    }
    
    setShowDeleteConfirm(true);
  };
  
  // Confirm delete execution
  const confirmDelete = async () => {
    if (!selectedAppointment?.id) return;
    
    try {
      setIsDeleting(true);
      setDeleteError(null);
      
      // Call the delete appointment API
      await deleteAppointment(selectedAppointment.id);
      
      // Update local state to remove the deleted appointment
      setAppointments(prevAppointments => 
        prevAppointments.filter(apt => apt.id !== selectedAppointment.id)
      );
      
      setShowDeleteConfirm(false);
      closeForm();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      setDeleteError('Erreur lors de la suppression du rendez-vous');
    } finally {
      setIsDeleting(false);
    }
  };

  // Render event content
  const renderEventContent = (eventInfo: any) => {
    const doctorName = eventInfo.event.extendedProps.doctor;
    const appointment = eventInfo.event.extendedProps.appointment;
    const appointmentType = eventInfo.event.extendedProps.type;
    const currentView = calendarRef.current?.getApi().view.type;
    
    // Month view - simplified Google Calendar style
    if (currentView === 'dayGridMonth') {
      // Determine dot color: orange for 'LATE', blue for normal
      const status = eventInfo.event.extendedProps.status;
      const dotColor = status === 'LATE' ? '#ff5722' : '#1A73E8';
      return (
        <div className="appointment-event month-view">
          <div
            className="appointment-event-dot"
            style={{ backgroundColor: dotColor, width: '8px', height: '8px' }}
          />
          <div className="appointment-event-title" style={{ fontSize: '14px', marginLeft: '4px' }}>
            {eventInfo.event.title}
          </div>
        </div>
      );
    } 
    
    // Day view - more detailed but still clean
    else if (currentView === 'timeGridDay') {
      return (
        <div className="appointment-event day-view">
          <div className="appointment-event-header">{eventInfo.event.title}</div>
          {appointmentType && (
            <div className="appointment-event-type">{appointmentType}</div>
          )}
          <div className="appointment-event-time">
            {new Date(eventInfo.event.start).toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit'
            })}
            {' - '}
            {new Date(eventInfo.event.end).toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit'
            })}
          </div>
          <div className="appointment-event-doctor">{doctorName}</div>
          {appointment.commentaire && (
            <div className="appointment-event-comment">
              {appointment.commentaire}
            </div>
          )}
        </div>
      );
    }
    
    // Week view - simplified like Google Calendar
    else {
      return (
        <div className="appointment-event week-view">
          <div className="appointment-event-header">{eventInfo.event.title}</div>
          {appointmentType && (
            <div className="appointment-event-type">{appointmentType}</div>
          )}
          <div className="appointment-event-time">
            {new Date(eventInfo.event.start).toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit'
            })}
          </div>
        </div>
      );
    }
  };

  // Handle refresh button click
  const handleRefresh = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const view = calendarApi.view;
      fetchAppointments(
        view.activeStart.toISOString(),
        view.activeEnd.toISOString()
      );
    }
  };

  return (
    <>
      {/* Title section with view filter and refresh button */}
      <div className="main-title-section">
        <div className="title-area">
          <CalendarIcon />
          <h1>Rendez-vous</h1>
        </div>
        <div className="calendar-actions">
          {/* Replace dropdown with button group - Show for all users now */}
          <div className="view-selector">
            <button 
              className={`view-button ${calendarView === 'timeGridDay' ? 'active' : ''}`}
              onClick={() => handleViewChange('timeGridDay')}
            >
              Jour
            </button>
            <button 
              className={`view-button ${calendarView === 'timeGridWeek' ? 'active' : ''}`}
              onClick={() => handleViewChange('timeGridWeek')}
            >
              Semaine
            </button>
            <button 
              className={`view-button ${calendarView === 'dayGridMonth' ? 'active' : ''}`}
              onClick={() => handleViewChange('dayGridMonth')}
            >
              Mois
            </button>
          </div>
          <button 
            className="refresh-button"
            onClick={handleRefresh}
          >
            <RefreshIcon /> Actualiser
          </button>
        </div>
      </div>
      
      {/* Calendar container */}
      <div className="calendar-container">
        {error ? (
          <div className="error-container">
            <p>{error}</p>
            <button 
              className="refresh-button"
              onClick={handleRefresh}
            >
              Réessayer
            </button>
          </div>
        ) : (
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={calendarView}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: ''
            }}
            buttonText={{
              today: 'Aujourd\'hui'
            }}
            moreLinkText={(num) => `+${num}`}
            events={events}
            datesSet={handleDatesSet}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            height="auto"
            allDaySlot={false}
            slotMinTime="08:00:00"
            slotMaxTime="19:00:00"
            slotDuration="00:15:00"
            slotLabelInterval="01:00:00"
            selectable={userRole !== 'MEDECIN'} // Disable selection for doctors
            selectMirror={userRole !== 'MEDECIN'} // Disable selection mirror for doctors
            editable={userRole !== 'MEDECIN'} // Disable event editing for doctors
            eventStartEditable={userRole !== 'MEDECIN'} // Disable event start time editing for doctors
            eventDurationEditable={userRole !== 'MEDECIN'} // Disable event duration editing for doctors
            dayMaxEvents={userRole !== 'MEDECIN' ? 5 : true} // Limit to 5 events per day for agent, true for doctor
            nowIndicator={true} // Add back the red time indicator line
            locale="fr"
          />
        )}
      </div>
      
      {/* Appointment Form */}
      <AppointmentForm
        isOpen={isFormOpen}
        onClose={closeForm}
        selectedDate={selectedDate}
        selectedAppointment={selectedAppointment}
        onAppointmentSaved={handleAppointmentSaved}
        extraActions={selectedAppointment?.id && (
          <button
            type="button"
            className="delete-btn"
            onClick={handleDeleteAppointment}
            disabled={isDeleting}
          >
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </button>
        )}
        deleteError={deleteError}
        userRole={userRole}
      />
      
      {/* Overlay for form */}
      <div 
        className={`overlay ${isOverlayVisible ? 'visible' : ''}`}
        onClick={closeForm}
      />
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          <div className="overlay visible" onClick={() => setShowDeleteConfirm(false)} />
          <div className="delete-confirmation-modal">
            <div className="delete-confirmation-header">
              <h3>Confirmation de suppression</h3>
            </div>
            <div className="delete-confirmation-content">
              <p>Êtes-vous sûr de vouloir supprimer ce rendez-vous ?</p>
              <p>Cette action est irréversible.</p>
            </div>
            <div className="delete-confirmation-actions">
              <button 
                className="cancel-btn" 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Annuler
              </button>
              <button 
                className="delete-btn" 
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Suppression...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default AppointmentsCalendar; 