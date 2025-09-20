import React from 'react';
import { ExportStyle } from './types';

interface ExportStyleSelectorProps {
  onStyleSelect: (style: ExportStyle) => void;
}

const ExportStyleSelector: React.FC<ExportStyleSelectorProps> = ({ onStyleSelect }) => {
  const exportStyles = [
    {
      id: 'standard' as ExportStyle,
      title: 'Standard',
      description: 'Ideal for archiving — includes QR name, URL, timestamp, and more.'
    },
    
    {
      id: 'grid' as ExportStyle,
      title: 'Grid Layout',
      description: 'Best for bulk sharing — multiple QR codes per page in a clean grid layout.'
    }
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-center text-gray-800">
        Choose Export Style
      </h2>
      <ul>
        {exportStyles.map((style) => (
          <li
            key={style.id}
            className="py-4 px-6 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
            onClick={() => onStyleSelect(style.id)}
          >
            <h3 className="text-lg font-semibold text-gray-800">{style.title}</h3>
            <p className="text-sm text-gray-600">{style.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ExportStyleSelector;
