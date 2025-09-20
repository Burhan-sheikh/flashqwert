import React, { useState } from 'react';
import { HexColorPicker } from 'react-colorful';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange }) => {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        <div 
          className="w-10 h-10 rounded-md border border-gray-300 cursor-pointer"
          style={{ backgroundColor: color }}
          onClick={() => setShowPicker(!showPicker)}
        />
        <input
          type="text"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-lg border-gray-300 border p-2 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      
      {showPicker && (
        <div className="absolute z-10 mt-2">
          <div 
            className="fixed inset-0" 
            onClick={() => setShowPicker(false)}
          />
          <div className="relative">
            <HexColorPicker 
              color={color} 
              onChange={onChange} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;