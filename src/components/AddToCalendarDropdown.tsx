import React, { useState, useRef, useEffect } from 'react';
import { Booking } from '../types';
import {
  CalendarPlus,
  Calendar as CalendarIcon,
  Download,
  ExternalLink,
  Check,
  ChevronDown
} from 'lucide-react';
import {
  downloadICSFile,
  getGoogleCalendarUrl,
  getOutlookCalendarUrl,
  getYahooCalendarUrl
} from '../services/calendarService';

interface AddToCalendarDropdownProps {
  booking: Booking;
  variant?: 'compact' | 'full' | 'primary';
  className?: string;
}

export const AddToCalendarDropdown: React.FC<AddToCalendarDropdownProps> = ({
  booking,
  variant = 'compact',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleDownloadICS = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadICSFile(booking);
    setDownloaded(true);
    setTimeout(() => {
      setDownloaded(false);
      setIsOpen(false);
    }, 1600);
  };

  const handleOpenLink = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      {variant === 'primary' ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/20 active:scale-[0.98]"
        >
          <CalendarPlus className="w-4 h-4 text-blue-200" />
          <span>Add Stay to Calendar</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      ) : variant === 'full' ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          className="w-full bg-slate-800/90 hover:bg-slate-750 text-slate-200 hover:text-white font-bold py-2 px-3 rounded-xl text-xs border border-slate-700/80 transition-all flex items-center justify-between gap-2 shadow-sm"
        >
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-blue-400" />
            <span>Add to Calendar</span>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          className="inline-flex items-center gap-1.5 bg-blue-950/70 hover:bg-blue-900/70 text-blue-300 hover:text-blue-200 font-bold px-3 py-1.5 rounded-xl border border-blue-800/60 transition-all shadow-sm active:scale-95 text-xs"
          title="Add stay to Apple, Google or Outlook Calendar"
        >
          <CalendarPlus className="w-3.5 h-3.5 text-blue-400" />
          <span>Calendar</span>
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 bottom-full sm:bottom-auto sm:top-full mb-2 sm:mb-0 sm:mt-2 w-64 bg-slate-900/98 backdrop-blur-xl border border-slate-700/90 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in text-slate-200 space-y-1"
        >
          <div className="px-2.5 py-1.5 border-b border-slate-800 text-[11px] font-bold text-slate-400 flex items-center justify-between">
            <span>Select Calendar</span>
            <span className="text-[10px] text-blue-400 font-medium">{booking.checkIn}</span>
          </div>

          {/* Option 1: Native Apple & iCal (.ics) */}
          <button
            type="button"
            onClick={handleDownloadICS}
            className="w-full text-left flex items-center justify-between p-2 rounded-xl hover:bg-slate-800 text-xs font-semibold transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-slate-800 group-hover:bg-slate-700 flex items-center justify-center text-slate-200 shrink-0">
                {downloaded ? <Check className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4 text-blue-400" />}
              </div>
              <div>
                <div className="text-white text-xs font-bold">Apple / Native iCal</div>
                <div className="text-[10px] text-slate-400 font-normal">Download universal .ics file</div>
              </div>
            </div>
            {downloaded ? (
              <span className="text-[10px] text-emerald-400 font-bold">Saved</span>
            ) : (
              <span className="text-[10px] text-blue-400 font-mono">.ICS</span>
            )}
          </button>

          {/* Option 2: Google Calendar */}
          <button
            type="button"
            onClick={(e) => handleOpenLink(e, getGoogleCalendarUrl(booking))}
            className="w-full text-left flex items-center justify-between p-2 rounded-xl hover:bg-slate-800 text-xs font-semibold transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <span className="text-xs font-black">G</span>
              </div>
              <div>
                <div className="text-white text-xs font-bold">Google Calendar</div>
                <div className="text-[10px] text-slate-400 font-normal">Add directly online</div>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400" />
          </button>

          {/* Option 3: Outlook Live / Office 365 */}
          <button
            type="button"
            onClick={(e) => handleOpenLink(e, getOutlookCalendarUrl(booking))}
            className="w-full text-left flex items-center justify-between p-2 rounded-xl hover:bg-slate-800 text-xs font-semibold transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 group-hover:bg-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <span className="text-xs font-black">O</span>
              </div>
              <div>
                <div className="text-white text-xs font-bold">Outlook / Office 365</div>
                <div className="text-[10px] text-slate-400 font-normal">Web calendar event</div>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400" />
          </button>

          {/* Option 4: Yahoo Calendar */}
          <button
            type="button"
            onClick={(e) => handleOpenLink(e, getYahooCalendarUrl(booking))}
            className="w-full text-left flex items-center justify-between p-2 rounded-xl hover:bg-slate-800 text-xs font-semibold transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                <span className="text-xs font-black">Y!</span>
              </div>
              <div>
                <div className="text-white text-xs font-bold">Yahoo Calendar</div>
                <div className="text-[10px] text-slate-400 font-normal">Add to Yahoo schedule</div>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-400" />
          </button>
        </div>
      )}
    </div>
  );
};
