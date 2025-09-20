import React from 'react';
import { EventContent } from '../../types/qrContentTypes';
import { Calendar, MapPin, Clock, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface EventRedirectProps {
  content: EventContent;
  qrData: any;
  onContinue: () => void;
}

const EventRedirect: React.FC<EventRedirectProps> = ({ content, qrData, onContinue }) => {
  const generateCalendarUrl = () => {
    const startDate = content.allDay 
      ? content.startDate.replace(/-/g, '')
      : `${content.startDate.replace(/-/g, '')}T${content.startTime.replace(/:/g, '')}00`;
    const endDate = content.allDay 
      ? content.endDate.replace(/-/g, '')
      : `${content.endDate.replace(/-/g, '')}T${content.endTime.replace(/:/g, '')}00`;

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: content.title,
      dates: `${startDate}/${endDate}`,
      details: content.description,
      location: content.location,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  return (
    <div className="text-center">
      <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Calendar className="w-10 h-10 text-purple-600" />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{content.title}</h2>
      
      {content.description && (
        <p className="text-gray-600 mb-6">{content.description}</p>
      )}

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6 space-y-4">
        <div className="flex items-center gap-3 text-purple-800">
          <Clock className="w-5 h-5" />
          <div className="text-left">
            <p className="font-medium">
              {content.allDay ? 'All Day Event' : `${content.startTime} - ${content.endTime}`}
            </p>
            <p className="text-sm">
              {format(new Date(content.startDate), 'MMMM d, yyyy')}
              {content.startDate !== content.endDate && 
                ` - ${format(new Date(content.endDate), 'MMMM d, yyyy')}`
              }
            </p>
          </div>
        </div>

        {content.location && (
          <div className="flex items-center gap-3 text-purple-800">
            <MapPin className="w-5 h-5" />
            <p className="text-left">{content.location}</p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <button
          onClick={() => window.open(generateCalendarUrl(), '_blank')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Add to Google Calendar
        </button>
        
        <button
          onClick={onContinue}
          className="block w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default EventRedirect;