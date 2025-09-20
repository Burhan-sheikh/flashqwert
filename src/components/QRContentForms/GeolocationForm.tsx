import React from 'react';
import { GeolocationContent } from '../../types/qrContentTypes';
import { MapPin, AlertCircle, Navigation } from 'lucide-react';

interface GeolocationFormProps {
  content: GeolocationContent;
  onChange: (content: GeolocationContent) => void;
  errors?: { [key: string]: string };
}

const GeolocationForm: React.FC<GeolocationFormProps> = ({ content, onChange, errors = {} }) => {
  const handleChange = (field: keyof GeolocationContent, value: string | number) => {
    onChange({ ...content, [field]: value });
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          handleChange('latitude', position.coords.latitude);
          handleChange('longitude', position.coords.longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your current location. Please enter coordinates manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
          <MapPin className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Location</h3>
          <p className="text-sm text-gray-600">Share geographic coordinates and location info</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={content.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Office Location"
            className={`w-full rounded-lg border p-3 focus:ring-2 focus:ring-red-500 transition-colors ${
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Latitude <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              value={content.latitude || ''}
              onChange={(e) => handleChange('latitude', parseFloat(e.target.value) || 0)}
              placeholder="40.7128"
              className={`w-full rounded-lg border p-3 focus:ring-2 focus:ring-red-500 transition-colors ${
                errors.latitude ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              required
            />
            {errors.latitude && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.latitude}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Longitude <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              value={content.longitude || ''}
              onChange={(e) => handleChange('longitude', parseFloat(e.target.value) || 0)}
              placeholder="-74.0060"
              className={`w-full rounded-lg border p-3 focus:ring-2 focus:ring-red-500 transition-colors ${
                errors.longitude ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              required
            />
            {errors.longitude && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.longitude}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location Label
          </label>
          <input
            type="text"
            value={content.label}
            onChange={(e) => handleChange('label', e.target.value)}
            placeholder="Main Office"
            className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-red-500 transition-colors"
          />
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={getCurrentLocation}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors text-sm font-medium"
          >
            <Navigation className="w-4 h-4" />
            Use Current Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeolocationForm;