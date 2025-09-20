import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Image, Download, Layers, FolderOpen, FileSpreadsheet } from 'lucide-react';

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: <Zap size={24} />,
      title: 'Instant Generation',
      description: 'Get QR codes in seconds.',
    },
    {
      icon: <Image size={24} />,
      title: 'Logo Upload',
      description: 'Brand your codes with a logo.',
    },
    {
      icon: <Download size={24} />,
      title: 'Multiple Formats',
      description: 'Download in PNG, JPG, or PDF.',
    },
    {
      icon: <Layers size={24} />,
      title: 'Bulk Generation',
      description: 'Generate hundreds of QR codes at once.',
    },
    {
      icon: <FileSpreadsheet size={24} />,
      title: 'CSV Upload',
      description: 'Easily import data from CSV files.',
    },
    {
      icon: <FolderOpen size={24} />,
      title: 'Collection Export',
      description: 'Export entire collections in tailored PDF layouts.',
    },
  ];

  return (
    <>
      <style>{`
        .feature-card-new {
          background: white;
          border-radius: 1rem;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.05);
          display: flex;
          overflow: hidden;
          transition: transform 0.3s ease-out, box-shadow 0.3s ease;
        }

        .feature-card-new:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
        }

        .icon-column-new {
          flex: 0 0 80px;
          display: grid;
          place-items: center;
          background: #eef5ff;
          color: #3b82f6;
          transition: background-color 0.3s ease;
        }

        .feature-card-new:hover .icon-column-new {
          background-color: #dbeafe;
        }

        .icon-column-new > svg {
          transition: transform 0.3s ease;
        }

        .feature-card-new:hover .icon-column-new > svg {
          transform: scale(1.15);
        }

        .text-column-new {
          padding: 1rem;
        }

        .text-column-new h3 {
          font-size: 1.125rem;
          margin-bottom: 0.25rem;
          font-weight: 600;
          color: #111827;
        }

        .text-column-new p {
          font-size: 0.85rem;
          color: #4b5563;
          line-height: 1.5;
        }
      `}</style>

      <section className="w-full mb-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="feature-card-new w-full max-w-sm"
              >
                <div className="icon-column-new">{feature.icon}</div>
                <div className="text-column-new">
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default FeaturesSection;
