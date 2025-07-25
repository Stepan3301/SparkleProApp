import React, { useState, useEffect } from 'react';

interface EnhancedDateTimePickerProps {
  selectedDate: string;
  selectedTime: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
}

const EnhancedDateTimePicker: React.FC<EnhancedDateTimePickerProps> = ({
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | null>(null);
  const today = new Date();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate time slots from 8 AM to 8 PM
  const timeSlots = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM',
    '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'
  ];

  // Initialize temp selected date from props
  useEffect(() => {
    if (selectedDate) {
      setTempSelectedDate(new Date(selectedDate));
    }
  }, [selectedDate]);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const selectDate = (day: number) => {
    if (day > 0) {
      const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      
      // Don't allow past dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        return;
      }
      
      setTempSelectedDate(selectedDate);
      // Convert to YYYY-MM-DD format without timezone issues
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dayStr = String(selectedDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${dayStr}`;
      onDateChange(dateString);
    }
  };

  const selectTime = (time: string) => {
    onTimeChange(time);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const isToday = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (day: number) => {
    if (!tempSelectedDate) return false;
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return date.toDateString() === tempSelectedDate.toDateString();
  };

  const isWeekend = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return date.getDay() === 0 || date.getDay() === 6; // Sunday = 0, Saturday = 6
  };

  const isPast = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const renderCalendar = () => {
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    
    // Adjust first day: Monday = 0, Sunday = 6
    let firstDayWeekday = firstDayOfMonth.getDay();
    firstDayWeekday = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;

    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(
        <div key={`empty-${i}`} className="day-cell empty"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      let className = 'day-cell current-month';
      
      if (isToday(day)) className += ' today';
      if (isSelected(day)) className += ' selected';
      if (isWeekend(day)) className += ' weekend';
      if (isPast(day)) className += ' past';

      days.push(
        <div
          key={day}
          className={className}
          onClick={() => selectDate(day)}
        >
          {day}
          {isToday(day) && <span className="today-sparkle">✨</span>}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="enhanced-datetime-picker">
      <style>{`
        .enhanced-datetime-picker {
          position: relative;
        }

        .section-title {
          font-size: 20px;
          font-weight: 700;
          color: #2E86AB;
          margin-bottom: 20px;
          text-align: center;
          position: relative;
          z-index: 2;
        }

        .date-input {
          width: 100%;
          padding: 16px 20px;
          font-size: 16px;
          font-weight: 600;
          border: 3px solid transparent;
          background: linear-gradient(white, white) padding-box,
                      linear-gradient(135deg, #2E86AB, #A23B72) border-box;
          color: #2E86AB;
          text-align: center;
          border-radius: 15px;
          position: relative;
          z-index: 2;
          margin-bottom: 25px;
        }

        .calendar-container {
          position: relative;
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          border-radius: 15px;
          padding: 20px;
          box-shadow: 
            inset 0 2px 10px rgba(46, 134, 171, 0.05),
            0 8px 30px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(46, 134, 171, 0.1);
          z-index: 2;
          margin-bottom: 25px;
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding: 0 5px;
        }

        .nav-btn {
          width: 40px;
          height: 40px;
          border: none;
          background: linear-gradient(135deg, #2E86AB 0%, #4A90E2 100%);
          color: white;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          position: relative;
          overflow: hidden;
        }

        .nav-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(46, 134, 171, 0.4);
        }

        .month-year {
          font-size: 18px;
          font-weight: 800;
          background: linear-gradient(135deg, #2E86AB 0%, #A23B72 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-align: center;
          padding: 12px 20px;
          background-color: rgba(46, 134, 171, 0.05);
          border-radius: 15px;
          min-width: 180px;
        }

        .days-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
          margin-bottom: 12px;
        }

        .day-header {
          text-align: center;
          font-size: 11px;
          font-weight: 700;
          color: #6c757d;
          padding: 8px 2px;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 8px;
          border: 1px solid rgba(108, 117, 125, 0.1);
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
        }

        .day-cell {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 600;
          color: #6c757d;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 12px;
          position: relative;
          border: 2px solid transparent;
          background: #f8f9fa;
        }

        .day-cell.current-month {
          color: #495057;
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          border: 2px solid rgba(134, 142, 150, 0.2);
        }

        .day-cell.current-month:hover {
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          border-color: #2196f3;
          transform: scale(1.05);
          box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
        }

        .day-cell.today {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: 2px solid #10b981;
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
          animation: pulse-today 2s infinite;
          position: relative;
        }

        .today-sparkle {
          position: absolute;
          top: -3px;
          right: -3px;
          font-size: 8px;
          animation: sparkle 1.5s infinite;
        }

        .day-cell.selected {
          background: linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%);
          color: white;
          border: 2px solid #0ea5e9;
          transform: scale(1.05);
          box-shadow: 0 8px 25px rgba(14, 165, 233, 0.5);
          clip-path: polygon(15% 0%, 85% 0%, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0% 85%, 0% 15%);
        }

        .day-cell.weekend {
          color: #F24236;
        }

        .day-cell.weekend.current-month {
          background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
          border-color: rgba(242, 66, 54, 0.3);
        }

        .day-cell.past {
          opacity: 0.3;
          cursor: not-allowed;
        }

        @keyframes pulse-today {
          0%, 100% { transform: scale(1.05); box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4); }
          50% { transform: scale(1.1); box-shadow: 0 8px 30px rgba(16, 185, 129, 0.6); }
        }

        @keyframes sparkle {
          0%, 100% { opacity: 0.5; transform: scale(0.8) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.2) rotate(180deg); }
        }

        .time-section {
          margin-top: 30px;
        }

        .time-title {
          font-size: 20px;
          font-weight: 700;
          color: #10b981;
          margin-bottom: 20px;
          text-align: center;
        }

        .time-input {
          width: 100%;
          padding: 16px 20px;
          font-size: 16px;
          font-weight: 600;
          border: 3px solid transparent;
          background: linear-gradient(white, white) padding-box,
                      linear-gradient(135deg, #10b981, #0ea5e9) border-box;
          color: #10b981;
          text-align: center;
          border-radius: 15px;
          margin-bottom: 25px;
          position: relative;
          z-index: 2;
        }

        .time-slots {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          max-height: 300px;
          overflow-y: auto;
          padding-right: 5px;
          z-index: 2;
          position: relative;
        }

        .time-slots::-webkit-scrollbar {
          width: 4px;
        }

        .time-slots::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .time-slots::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #10b981, #0ea5e9);
          border-radius: 10px;
        }

        .time-slot {
          padding: 14px 20px;
          text-align: center;
          border: 2px solid rgba(16, 185, 129, 0.2);
          border-radius: 12px;
          cursor: pointer;
          background: linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%);
          color: #065f46;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .time-slot:hover {
          border-color: #10b981;
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.2);
        }

        .time-slot.selected {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border-color: #10b981;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
        }

        .time-slot.unavailable {
          opacity: 0.5;
          cursor: not-allowed;
          background: #f3f4f6;
          color: #9ca3af;
          border-color: #d1d5db;
        }

        .time-slot.unavailable:hover {
          transform: none;
          box-shadow: none;
        }
      `}</style>
      
      <h2 className="section-title">📅 Select Date</h2>
      
      <input 
        type="text" 
        className="date-input" 
        placeholder="Choose your cleaning date" 
        value={tempSelectedDate ? formatDate(tempSelectedDate) : ''}
        readOnly 
      />

      <div className="calendar-container">
        <div className="calendar-header">
          <button className="nav-btn" onClick={previousMonth}>
            <span>‹</span>
          </button>
          <div className="month-year">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </div>
          <button className="nav-btn" onClick={nextMonth}>
            <span>›</span>
          </button>
        </div>

        <div className="days-header">
          <div className="day-header">Mon</div>
          <div className="day-header">Tue</div>
          <div className="day-header">Wed</div>
          <div className="day-header">Thu</div>
          <div className="day-header">Fri</div>
          <div className="day-header">Sat</div>
          <div className="day-header">Sun</div>
        </div>

        <div className="calendar-grid">
          {renderCalendar()}
        </div>
      </div>

      {/* Time Selection Section */}
      <div className="time-section">
        <h2 className="time-title">🕐 Select Time</h2>
        
        <input 
          type="text" 
          className="time-input" 
          placeholder="Choose your preferred time" 
          value={selectedTime || ''}
          readOnly 
        />

        <div className="time-slots">
          {timeSlots.map(time => {
            const isSelected = selectedTime === time;
            
            let className = 'time-slot';
            if (isSelected) className += ' selected';

            return (
              <div 
                key={time} 
                className={className}
                onClick={() => selectTime(time)}
              >
                {time}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EnhancedDateTimePicker; 