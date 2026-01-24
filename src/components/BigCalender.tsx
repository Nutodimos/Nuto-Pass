"use client";

import { Calendar, momentLocalizer, View, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState } from "react";

const localizer = momentLocalizer(moment);

const BigCalendar = ({
  data,
}: {
  data: { title: string; start: Date; end: Date }[];
}) => {
  const [view, setView] = useState<View>(Views.WORK_WEEK);

  const handleOnChangeView = (selectedView: View) => {
    setView(selectedView);
  };

  // Custom event styling with Nuto theme
  const eventStyleGetter = () => {
    return {
      style: {
        backgroundColor: "#436275", // nutoSlate
        borderRadius: "8px",
        opacity: 0.95,
        color: "white",
        border: "none",
        display: "block",
        fontSize: "12px",
        fontWeight: "500",
        padding: "2px 6px",
      },
    };
  };

  // Custom day styling
  const dayPropGetter = (date: Date) => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    return {
      style: {
        backgroundColor: isToday ? "rgba(255, 127, 80, 0.05)" : undefined, // Light nutoOrange for today
      },
    };
  };

  return (
    <div className="nuto-calendar h-full">
      <style jsx global>{`
        /* Nuto Theme for React Big Calendar */
        .nuto-calendar .rbc-calendar {
          font-family: inherit;
        }
        
        .nuto-calendar .rbc-header {
          background: linear-gradient(135deg, #436275 0%, #2A404E 100%);
          color: white;
          padding: 12px 8px;
          font-weight: 600;
          font-size: 13px;
          border: none !important;
        }
        
        .nuto-calendar .rbc-header + .rbc-header {
          border-left: 1px solid rgba(255,255,255,0.2) !important;
        }
        
        .nuto-calendar .rbc-btn-group button {
          background: #436275;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 500;
          margin: 0 2px;
          transition: all 0.2s;
        }
        
        .nuto-calendar .rbc-btn-group button:hover {
          background: #2A404E;
        }
        
        .nuto-calendar .rbc-btn-group button.rbc-active {
          background: #FF7F50;
        }
        
        .nuto-calendar .rbc-toolbar {
          padding: 12px 0;
          margin-bottom: 12px;
        }
        
        .nuto-calendar .rbc-toolbar-label {
          font-weight: 600;
          font-size: 16px;
          color: #2A404E;
        }
        
        .nuto-calendar .rbc-time-view {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
        }
        
        .nuto-calendar .rbc-time-header {
          border-bottom: 2px solid #436275;
        }
        
        .nuto-calendar .rbc-timeslot-group {
          border-bottom: 1px solid #f1f5f9;
        }
        
        .nuto-calendar .rbc-time-content {
          border-top: none;
        }
        
        .nuto-calendar .rbc-current-time-indicator {
          background-color: #FF7F50;
          height: 2px;
        }
        
        .nuto-calendar .rbc-current-time-indicator::before {
          content: '';
          position: absolute;
          left: -6px;
          top: -4px;
          width: 10px;
          height: 10px;
          background-color: #FF7F50;
          border-radius: 50%;
        }
        
        .nuto-calendar .rbc-today {
          background-color: rgba(255, 127, 80, 0.08);
        }
        
        .nuto-calendar .rbc-time-slot {
          font-size: 11px;
          color: #7096AB;
        }
        
        .nuto-calendar .rbc-event {
          box-shadow: 0 2px 8px rgba(67, 98, 117, 0.3);
        }
        
        .nuto-calendar .rbc-event:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 12px rgba(67, 98, 117, 0.4);
        }
        
        .nuto-calendar .rbc-event-label {
          font-size: 10px;
          opacity: 0.9;
        }
        
        .nuto-calendar .rbc-event-content {
          font-size: 12px;
        }
        
        .nuto-calendar .rbc-allday-cell {
          display: none;
        }
        
        .nuto-calendar .rbc-time-header-content {
          border-left: none;
        }
      `}</style>
      <Calendar
        localizer={localizer}
        events={data}
        startAccessor="start"
        endAccessor="end"
        views={["work_week", "day"]}
        view={view}
        style={{ height: "98%" }}
        onView={handleOnChangeView}
        min={new Date(2025, 1, 0, 8, 0, 0)}
        max={new Date(2025, 1, 0, 17, 0, 0)}
        eventPropGetter={eventStyleGetter}
        dayPropGetter={dayPropGetter}
      />
    </div>
  );
};

export default BigCalendar;
