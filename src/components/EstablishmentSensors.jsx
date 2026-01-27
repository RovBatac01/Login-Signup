import React, { useState, useContext, useEffect } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import styles from '../styles/Components Css/CalendarComponent.module.css'; // Use CSS Modules

const CalendarComponent = () => {
  const { theme } = useContext(ThemeContext);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Simulated event data for demonstration
  // In a real app, you would fetch this from an API based on the month/year
  const simulatedEvents = {
    // Format: 'YYYY-MM-DD': [{ id, title, time, type }]
    '2025-05-01': [{ id: 1, title: 'New Year', time: 'All day', type: 'holiday' }],
    '2025-05-03': [
      { id: 2, title: 'Review workplace safety', time: '10:00 - 11:00 AM', type: 'meeting' },
      { id: 3, title: 'Team alignment', time: '11:00 - 11:30 AM', type: 'meeting' },
      { id: 4, title: 'Project debrief', time: '1:00 - 2:00 PM', type: 'task' },
    ],
    '2025-05-04': [{ id: 5, title: 'Breakfast with Steven', time: '8:00 - 9:00 AM', type: 'personal' }],
    '2025-05-05': [{ id: 6, title: 'Lunch with Steven', time: '2:00 - 3:00 PM', type: 'personal' }],
    '2025-05-06': [{ id: 7, title: 'Collaboration session', time: '11:00 - 12:00 PM', type: 'meeting' }],
    '2025-05-08': [{ id: 8, title: 'Weekly Stand Up', time: '10:00 - 11:00 AM', type: 'meeting' }],
    '2025-05-09': [{ id: 9, title: 'Collaboration session', time: '11:00 - 12:00 PM', type: 'meeting' }],
    '2025-05-10': [{ id: 10, title: 'Review workplace safety', time: '1:00 - 2:00 PM', type: 'meeting' }],
    '2025-05-11': [{ id: 11, title: 'Breakfast with Steven', time: '8:00 - 9:00 AM', type: 'personal' }],
    '2025-05-12': [{ id: 12, title: 'Lunch with Steven', time: '2:00 - 3:00 PM', type: 'personal' }],
    // Example for previous/next month:
    '2025-04-26': [{ id: 13, title: 'Planning meeting', time: '9:00 AM', type: 'meeting' }],
    '2025-04-27': [{ id: 14, title: 'Client call', time: '2:00 PM', type: 'personal' }],
    '2025-04-30': [{ id: 15, title: 'Project Review', time: 'All day', type: 'task' }],
  };


  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0); // Last day of current month

    const days = [];
    // Add days from previous month to fill the first week
    const firstDayOfWeek = firstDay.getDay(); // 0 (Sunday) to 6 (Saturday)
    const startOffset = (firstDayOfWeek === 0) ? 6 : firstDayOfWeek - 1; // Adjust for Monday start (0=Sunday, 1=Monday...)

    for (let i = startOffset; i > 0; i--) {
      const prevDay = new Date(firstDay);
      prevDay.setDate(firstDay.getDate() - i);
      days.push({
        date: prevDay,
        isCurrentMonth: false,
      });
    }

    // Add days of the current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Add days from next month to fill the last week
    const totalDays = days.length;
    const endOffset = (7 - (totalDays % 7)) % 7;
    for (let i = 1; i <= endOffset; i++) {
      const nextDay = new Date(lastDay);
      nextDay.setDate(lastDay.getDate() + i);
      days.push({
        date: nextDay,
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const days = getDaysInMonth(currentDate);

  const goToPreviousMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(prevDate.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(prevDate.getMonth() + 1);
      return newDate;
    });
  };

  const formatMonthYear = (date) => {
    return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  };

  const dayOfWeekNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  const today = new Date();
  const isToday = (date) => {
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  return (
    <div className={`${styles.calendarContainer} ${theme}`}>
      <div className={styles.calendarHeader}>
        <div className={styles.monthNavigation}>
          <span className={styles.currentMonthYear}>
            {formatMonthYear(currentDate)}
          </span>
          <button onClick={goToPreviousMonth} className={styles.navButton}>&lt;</button>
          <button onClick={goToNextMonth} className={styles.navButton}>&gt;</button>
        </div>
        <button className={styles.addEventButton}>Add event</button>
      </div>

      <div className={styles.calendarGrid}>
        {/* Weekday Headers */}
        {dayOfWeekNames.map(day => (
          <div key={day} className={styles.weekdayHeader}>{day}</div>
        ))}

        {/* Days of the Month */}
        {days.map((dayObj, index) => {
          const dateString = dayObj.date.toISOString().slice(0, 10);
          const eventsForDay = simulatedEvents[dateString] || [];
          const isSelected = isToday(dayObj.date) && dayObj.isCurrentMonth; // Only highlight today if it's in the current month view

          return (
            <div
              key={index}
              className={`${styles.calendarDay} ${
                dayObj.isCurrentMonth ? styles.currentMonthDay : styles.otherMonthDay
              } ${isSelected ? styles.today : ''}`}
            >
              <div className={styles.dayNumber}>{dayObj.date.getDate()}</div>
              <div className={styles.eventsList}>
                {eventsForDay.slice(0, 3).map(event => ( // Show max 3 events, then "and X more"
                  <div key={event.id} className={`${styles.eventItem} ${styles[event.type]}`}>
                    <span className={styles.eventTitle}>{event.title}</span>
                    {event.time && <span className={styles.eventTime}>{event.time}</span>}
                  </div>
                ))}
                {eventsForDay.length > 3 && (
                  <div className={styles.moreEvents}>
                    {`And ${eventsForDay.length - 3} more`}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.calendarFooter}>
        <p className={styles.footerText}>
          Here all your planned events. You will find information for each event as well as you can planned new one.
        </p>
      </div>
    </div>
  );
};

export default CalendarComponent;