import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Clock, Sun, Moon } from 'lucide-react';
import '../styles/Components Css/CalendarComponent.css'; // Import the CSS file
import { useTheme } from '../context/ThemeContext'; // Import the custom hook to use theme context (Adjust path if necessary)

// Define your backend API base URL
const API_BASE_URL = 'https://login-signup-3470.onrender.com'; // Make sure this matches your backend
// const API_BASE_URL = 'http://localhost:5000';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState({});
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    time: '',
    description: '',
    date: null
  });
  const [showEventList, setShowEventList] = useState(false);
  const [loading, setLoading] = useState(true); // Added loading state
  const [error, setError] = useState(null);   // Added error state

  const { theme, toggleTheme } = useTheme();

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getDateKey = (date) => {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  };

  // Helper function to format date for backend (YYYY-MM-DD)
  const formatDateToYYYYMMDD = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // --- API Interaction Functions ---

  // Function to fetch all events from the backend and organize them by date
  const fetchEventsFromBackend = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // FIXED: Change to /events (remove the -all suffix and api/ prefix)
      console.log("Fetching events from:", `${API_BASE_URL}/api/events`);
      const response = await fetch(`${API_BASE_URL}/api/events`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const allEvents = await response.json();
      console.log("Fetched events:", allEvents);

      const organizedEvents = {};
      allEvents.forEach(event => {
        const eventDate = new Date(event.event_date);
        const dateKey = getDateKey(eventDate);
        if (!organizedEvents[dateKey]) {
          organizedEvents[dateKey] = [];
        }
        organizedEvents[dateKey].push({
          id: event.id,
          title: event.title,
          time: event.time,
          description: event.description,
          date: eventDate,
        });
      });
      
      setEvents(organizedEvents);
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setError('Failed to load events. Please try again.');
      setEvents({}); // Clear events on error
    } finally {
      setLoading(false);
    }
  }, []); 

  useEffect(() => {
    fetchEventsFromBackend();
  }, [fetchEventsFromBackend]);

  // Modified handleAddEvent to interact with the backend
  const handleAddEvent = async () => {
    if (!newEvent.title.trim() || !newEvent.date) return;

    setLoading(true);
    setError(null);
    try {
      const eventData = {
        title: newEvent.title.trim(),
        time: newEvent.time || null,
        description: newEvent.description.trim() || null,
        event_date: formatDateToYYYYMMDD(newEvent.date),
      };

      // FIXED: Change to /event (no api/ prefix)
      console.log("Adding event:", eventData);
      const response = await fetch(`${API_BASE_URL}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      fetchEventsFromBackend();
      closeEventModal();
    } catch (err) {
      console.error('Error adding event:', err);
      setError('Failed to add event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Modified handleDeleteEvent to interact with the backend
  const handleDeleteEvent = async (eventId, dateKey) => {
    setLoading(true);
    setError(null);
    try {
      // FIXED: Change to /event/:id (no api/ prefix)
      console.log("Deleting event:", eventId);
      const response = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      fetchEventsFromBackend();
    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Failed to delete event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- End API Interaction Functions ---

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    setShowEventList(true);
  };

  const openEventModal = (date = null) => {
    const eventDate = date || selectedDate || new Date();
    setNewEvent({
      title: '',
      time: '',
      description: '',
      date: eventDate
    });
    setShowEventModal(true);
  };

  const closeEventModal = () => {
    setShowEventModal(false);
    setNewEvent({
      title: '',
      time: '',
      description: '',
      date: null
    });
  };

  const hasEvents = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateKey = getDateKey(date);
    return events[dateKey] && events[dateKey].length > 0;
  };

  const getEventsForDate = (date) => {
    const dateKey = getDateKey(date);
    return events[dateKey] || [];
  };

  const isToday = (day) => {
    const today = new Date();
    return today.getDate() === day &&
           today.getMonth() === currentDate.getMonth() &&
           today.getFullYear() === currentDate.getFullYear();
  };

  const isSelected = (day) => {
    if (!selectedDate) return false;
    return selectedDate.getDate() === day &&
           selectedDate.getMonth() === currentDate.getMonth() &&
           selectedDate.getFullYear() === currentDate.getFullYear();
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-empty-day"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const classNames = [
        'calendar-day',
        isToday(day) ? 'today' : '',
        isSelected(day) ? 'selected' : '',
        hasEvents(day) ? 'has-events' : ''
      ].filter(Boolean).join(' ');

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          className={classNames}
        >
          <span className="day-number">{day}</span>
          {hasEvents(day) && <div className="event-indicator"></div>}
        </button>
      );
    }

    return days;
  };

  const formatSelectedDate = () => {
    if (!selectedDate) return 'No date selected';
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="calendar-container">
      {/* Header */}
      <div className="calendar-header">
        <button
          onClick={() => navigateMonth(-1)}
          className="nav-button"
        >
          <ChevronLeft className="nav-icon" />
        </button>

        <h2 className="month-year">
          {months[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>

        <button
          onClick={() => navigateMonth(1)}
          className="nav-button"
        >
          <ChevronRight className="nav-icon" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="weekdays">
        {weekdays.map(day => (
          <div key={day} className="weekday">
            <span>{day}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="calendar-grid">
        {renderCalendarDays()}
      </div>

      {/* Loading and Error Indicators */}
      {loading && <p className="loading-indicator">Loading events...</p>}
      {error && <p className="error-indicator">{error}</p>}

      {/* Selected date display and add event button */}
      <div className="selected-date-display">
        <div className="date-info">
          <p className="selected-label">Selected Date:</p>
          <p className="selected-value">{formatSelectedDate()}</p>
        </div>
        {selectedDate && (
          <button
            onClick={() => openEventModal()}
            className="add-event-btn"
          >
            <Plus className="plus-icon" />
            Add Event
          </button>
        )}
      </div>

      {/* Event List */}
      {showEventList && selectedDate && (
        <div className="event-list">
          <div className="event-list-header">
            <h3>Events for {formatSelectedDate()}</h3>
            <button
              onClick={() => setShowEventList(false)}
              className="close-btn"
            >
              <X className="close-icon" />
            </button>
          </div>
          <div className="events">
            {getEventsForDate(selectedDate).length === 0 ? (
              <p className="no-events">No events for this date</p>
            ) : (
              getEventsForDate(selectedDate).map(event => (
                <div key={event.id} className="event-item">
                  <div className="event-content">
                    <div className="event-title">{event.title}</div>
                    {event.time && (
                      <div className="event-time">
                        <Clock className="time-icon" />
                        {event.time}
                      </div>
                    )}
                    {event.description && (
                      <div className="event-description">{event.description}</div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteEvent(event.id, getDateKey(selectedDate))}
                    className="delete-event-btn"
                  >
                    <X className="delete-icon" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Event Modal - **NEW UNIQUE CLASS NAMES** */}
      {showEventModal && (
        <div className="my-app-calendar-event-modal-overlay">
          <div className="my-app-calendar-event-modal">
            <div className="my-app-calendar-event-modal-header">
              <h3>Add New Event</h3>
              <button onClick={closeEventModal} className="my-app-calendar-event-modal-close-btn">
                <X className="close-icon" />
              </button>
            </div>
            <div className="my-app-calendar-event-modal-body">
              <div className="my-app-calendar-event-form-group">
                <label htmlFor="event-title">Event Title *</label>
                <input
                  id="event-title"
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter event title"
                  className="my-app-calendar-event-form-input"
                />
              </div>
              <div className="my-app-calendar-event-form-group">
                <label htmlFor="event-time">Time</label>
                <input
                  id="event-time"
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                  className="my-app-calendar-event-form-input"
                />
              </div>
              <div className="my-app-calendar-event-form-group">
                <label htmlFor="event-description">Description</label>
                <textarea
                  id="event-description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter event description"
                  className="my-app-calendar-event-form-textarea"
                  rows="3"
                />
              </div>
              <div className="my-app-calendar-event-form-group">
                <label>Date</label>
                <div className="my-app-calendar-event-date-display">
                  📅
                  {newEvent.date ? newEvent.date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'No date selected'}
                </div>
              </div>
            </div>
            <div className="my-app-calendar-event-modal-footer">
              <button onClick={closeEventModal} className="my-app-calendar-event-cancel-btn">
                Cancel
              </button>
              <button
                onClick={handleAddEvent}
                className="my-app-calendar-event-save-btn"
                disabled={!newEvent.title.trim()}
              >
                Add Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}