import React from 'react';
import { EventContent } from '../../types/qrContentTypes';
import { Calendar, AlertCircle, Clock, MapPin } from 'lucide-react';

interface EventFormProps {
  content: EventContent;
  onChange: (content: EventContent) => void;
  errors?: { [key: string]: string };
}

const EventForm: React.FC<EventFormProps> = ({ content, onChange, errors = {} }) => {
  const handleChange = (field: keyof EventContent, value: string | boolean) => {
    onChange({ ...content, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <Calendar className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Calendar Event</h3>
          <p className="text-sm text-gray-600">Create an event that can be added to calendars</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={content.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Conference 2024"
            className={`w-full rounded-lg border p-3 focus:ring-2 focus:ring-purple-500 transition-colors ${
              errors.title ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            required
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.title}
            </p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={content.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Event description and details"
            rows={3}
            className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-purple-500 transition-colors resize-none"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            Location
          </label>
          <input
            type="text"
            value={content.location}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="123 Main St, City, State"
            className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-purple-500 transition-colors"
          />
        </div>

        <div className="md:col-span-2">
          <label className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={content.allDay}
              onChange={(e) => handleChange('allDay', e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <span className="text-sm font-medium text-gray-700">All Day Event</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={content.startDate}
            onChange={(e) => handleChange('startDate', e.target.value)}
            className={`w-full rounded-lg border p-3 focus:ring-2 focus:ring-purple-500 transition-colors ${
              errors.startDate ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            required
          />
        </div>

        {!content.allDay && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Start Time
            </label>
            <input
              type="time"
              value={content.startTime}
              onChange={(e) => handleChange('startTime', e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-purple-500 transition-colors"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={content.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
            className={`w-full rounded-lg border p-3 focus:ring-2 focus:ring-purple-500 transition-colors ${
              errors.endDate ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            required
          />
        </div>

        {!content.allDay && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              End Time
            </label>
            <input
              type="time"
              value={content.endTime}
              onChange={(e) => handleChange('endTime', e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-purple-500 transition-colors"
            />
          </div>
        )}

        <div className="md:col-span-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={content.reminder}
              onChange={(e) => handleChange('reminder', e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <span className="text-sm font-medium text-gray-700">Add reminder notification</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default EventForm;