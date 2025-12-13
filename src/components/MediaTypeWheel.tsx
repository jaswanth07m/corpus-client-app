import React, { useState } from 'react';
import { Type, Mic, Video, FileText, Image } from 'lucide-react';
import BottomNav from './BottomNav';

interface MediaType {
  type: 'text' | 'audio' | 'video' | 'image' | 'document';
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}

interface MediaTypeWheelProps {
  onSelect: (type: 'text' | 'audio' | 'video' | 'image' | 'document') => void;
  selectedType: 'text' | 'audio' | 'video' | 'image' | 'document' | null;
  onCategorySelect?: (categoryId: string, categoryName: string) => void;
}

const mediaTypes: MediaType[] = [
  {
    type: 'image',
    icon: <Image className="w-5 h-5 sm:w-6 sm:h-6" />,
    title: 'Images',
    description: 'Upload photos, illustrations, or graphics',
    color: '#10b981',
    bgColor: 'bg-emerald-500',
  },
  {
    type: 'text',
    icon: <Type className="w-5 h-5 sm:w-6 sm:h-6" />,
    title: 'Text Input',
    description: 'Type your content directly',
    color: '#64748b',
    bgColor: 'bg-slate-500',
  },
  {
    type: 'audio',
    icon: <Mic className="w-5 h-5 sm:w-6 sm:h-6" />,
    title: 'Audio Recording',
    description: 'Record or upload audio content',
    color: '#f59e0b',
    bgColor: 'bg-amber-500',
  },
  {
    type: 'video',
    icon: <Video className="w-5 h-5 sm:w-6 sm:h-6" />,
    title: 'Video Content',
    description: 'Record or upload video files',
    color: '#ef4444',
    bgColor: 'bg-red-500',
  },
  {
    type: 'document',
    icon: <FileText className="w-5 h-5 sm:w-6 sm:h-6" />,
    title: 'Document Upload',
    description: 'Upload PDF, DOCX, or text files',
    color: '#06b6d4',
    bgColor: 'bg-cyan-500',
  },
];

const MediaTypeWheel: React.FC<MediaTypeWheelProps> = ({
  onSelect,
  selectedType,
  onCategorySelect,
}) => {
  const [hoveredType, setHoveredType] = useState<string | null>(null);

  const activeType = hoveredType || selectedType;
  const activeMedia =
    mediaTypes.find((m) => m.type === activeType) || mediaTypes[0];

  const handleMediaSelect = (
    type: 'text' | 'audio' | 'video' | 'image' | 'document',
  ) => {
    onSelect(type);
  };

  const handleCategoryClick = (category: Category) => {
    // Notify parent component
    if (onCategorySelect) {
      onCategorySelect(category.id, category.name);
    }
  };

  // Wheel view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col items-center justify-center py-12 px-4 pb-24">
      {/* Title */}
      <div className="text-center mb-16 animate-fade-in max-w-3xl mx-auto">
        <div className="inline-block mb-6">
          <span className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-2xl mb-4 ring-4 ring-emerald-100">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
          What would you like to upload?
        </h1>
        <p className="text-slate-600 text-xl sm:text-2xl max-w-2xl mx-auto leading-relaxed font-medium mb-8">
          Click on any colored section below to get started
        </p>

        {/* Step indicator */}
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-emerald-50 rounded-full border-2 border-emerald-200">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-sm">
            1
          </span>
          <span className="text-emerald-900 font-semibold text-base">
            Choose your media type
          </span>
        </div>
      </div>

      {/* Wheel Container - LARGER FOR BETTER SPACING */}
      <div className="relative w-[400px] h-[400px] sm:w-[500px] sm:h-[500px]">
        {/* Outer glow effect */}
        <div className="absolute inset-[-30px] rounded-full bg-gradient-to-br from-emerald-100 via-slate-100 to-amber-100 opacity-40 blur-2xl animate-pulse" />

        {/* Outer decorative rings */}
        <div className="absolute inset-[-12px] rounded-full border-[6px] border-white shadow-2xl" />
        <div className="absolute inset-[-4px] rounded-full border-2 border-slate-200/50" />
        <div className="absolute inset-0 rounded-full border-4 border-white shadow-xl bg-gradient-to-br from-white to-slate-50" />

        {/* Colored segments background */}
        <svg
          className="absolute inset-0 w-full h-full drop-shadow-lg"
          viewBox="0 0 100 100"
          style={{ transform: 'rotate(-90deg)' }}
        >
          <defs>
            {mediaTypes.map((media, index) => (
              <linearGradient
                key={`grad-${media.type}`}
                id={`gradient-${media.type}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={media.color} stopOpacity="1" />
                <stop offset="100%" stopColor={media.color} stopOpacity="0.8" />
              </linearGradient>
            ))}
          </defs>
          {mediaTypes.map((media, index) => {
            const segmentAngle = 360 / mediaTypes.length;
            const startAngle = index * segmentAngle;
            const endAngle = startAngle + segmentAngle;
            const isActive = activeType === media.type;

            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;
            const innerRadius = 24;
            const outerRadius = isActive ? 49.5 : 48;

            const x1 = 50 + outerRadius * Math.cos(startRad);
            const y1 = 50 + outerRadius * Math.sin(startRad);
            const x2 = 50 + outerRadius * Math.cos(endRad);
            const y2 = 50 + outerRadius * Math.sin(endRad);
            const x3 = 50 + innerRadius * Math.cos(endRad);
            const y3 = 50 + innerRadius * Math.sin(endRad);
            const x4 = 50 + innerRadius * Math.cos(startRad);
            const y4 = 50 + innerRadius * Math.sin(startRad);

            const largeArc = segmentAngle > 180 ? 1 : 0;

            const path = `
              M ${x1} ${y1}
              A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}
              L ${x3} ${y3}
              A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}
              Z
            `;

            return (
              <path
                key={media.type}
                d={path}
                fill={`url(#gradient-${media.type})`}
                className="cursor-pointer transition-all duration-300"
                style={{
                  filter: isActive
                    ? 'brightness(1.2) drop-shadow(0 6px 12px rgba(0,0,0,0.25)) saturate(1.1)'
                    : 'brightness(1) drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                  transformOrigin: '50% 50%',
                }}
                onMouseEnter={() => setHoveredType(media.type)}
                onMouseLeave={() => setHoveredType(null)}
                onClick={() => handleMediaSelect(media.type)}
              />
            );
          })}
        </svg>

        {/* Icon labels on segments - FIXED POSITIONING */}
        {mediaTypes.map((media, idx) => {
          const segmentAngle = 360 / mediaTypes.length;
          const midAngle = idx * segmentAngle + segmentAngle / 2 - 90;
          const radius = 95; // Increased from 75 to 95 for better spacing
          const x = Math.cos((midAngle * Math.PI) / 180) * radius;
          const y = Math.sin((midAngle * Math.PI) / 180) * radius;
          const isActive = activeType === media.type;

          return (
            <div
              key={`icon-${media.type}`}
              className={`absolute left-1/2 top-1/2 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 z-20 ${
                isActive ? 'scale-110' : 'scale-100 hover:scale-105'
              }`}
              style={{
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
              }}
              onMouseEnter={() => setHoveredType(media.type)}
              onMouseLeave={() => setHoveredType(null)}
              onClick={() => handleMediaSelect(media.type)}
            >
              {/* Icon container - cleaner design */}
              <div
                className={`p-3 sm:p-4 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? 'bg-white shadow-2xl'
                    : 'bg-white shadow-lg hover:shadow-xl'
                }`}
              >
                <div style={{ color: media.color }}>
                  {React.cloneElement(media.icon as React.ReactElement, {
                    className: 'w-6 h-6 sm:w-7 sm:h-7',
                    strokeWidth: 2.5,
                  })}
                </div>
              </div>
              {/* Label - positioned below icon */}
              <div
                className={`mt-2 px-2.5 py-1 rounded-full transition-all duration-300 ${
                  isActive ? 'bg-white shadow-lg' : 'bg-white/95 shadow-md'
                }`}
              >
                <span
                  className={`font-semibold whitespace-nowrap text-xs ${
                    isActive ? 'sm:text-sm' : 'sm:text-xs'
                  }`}
                  style={{ color: media.color }}
                >
                  {media.title.split(' ')[0]}
                </span>
              </div>
            </div>
          );
        })}

        {/* Center circle with selected info - OPTIMIZED SIZE */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[170px] h-[170px] sm:w-[210px] sm:h-[210px] rounded-full bg-white shadow-2xl flex flex-col items-center justify-center z-30 border-[6px] transition-all duration-300"
          style={{
            borderColor: activeMedia.color,
            boxShadow: `0 0 0 4px ${activeMedia.color}15, 0 12px 40px rgba(0,0,0,0.15), inset 0 2px 12px rgba(0,0,0,0.05)`,
          }}
        >
          {/* Icon */}
          <div
            className="p-4 sm:p-5 rounded-2xl mb-2 transition-all duration-500 shadow-lg"
            style={{
              backgroundColor: `${activeMedia.color}`,
            }}
          >
            <div className="text-white">
              {React.cloneElement(activeMedia.icon as React.ReactElement, {
                className: 'w-10 h-10 sm:w-12 sm:h-12',
                strokeWidth: 2.5,
              })}
            </div>
          </div>

          {/* Title */}
          <h3
            className="text-base sm:text-lg font-bold text-center px-3 transition-colors duration-300 leading-tight"
            style={{ color: activeMedia.color }}
          >
            {activeMedia.title}
          </h3>

          {/* Description */}
          <p className="text-[10px] sm:text-xs text-gray-600 text-center px-3 leading-snug mt-1.5 font-medium">
            {activeMedia.description.split(' ').slice(0, 3).join(' ')}
          </p>

          {/* Click indicator */}
          <div
            className="mt-2 flex items-center gap-1 text-[9px] sm:text-xs font-semibold"
            style={{ color: activeMedia.color }}
          >
            <svg
              className="w-3 h-3 animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
              />
            </svg>
            <span>Click to select</span>
          </div>
        </div>

        {/* Decorative elements */}
        <div
          className="absolute -right-5 top-1/4 w-5 h-5 rounded-full bg-gradient-to-br from-emerald-300 to-emerald-400 opacity-70 animate-pulse"
          style={{ animationDuration: '3s' }}
        />
        <div
          className="absolute -right-8 top-1/2 w-4 h-4 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 opacity-60 animate-pulse"
          style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}
        />
        <div
          className="absolute -left-5 bottom-1/4 w-4 h-4 rounded-full bg-gradient-to-br from-amber-300 to-amber-400 opacity-70 animate-pulse"
          style={{ animationDuration: '2.8s', animationDelay: '0.3s' }}
        />
        <div
          className="absolute -left-7 top-1/3 w-3 h-3 rounded-full bg-gradient-to-br from-cyan-300 to-cyan-400 opacity-60 animate-pulse"
          style={{ animationDuration: '3.2s', animationDelay: '0.7s' }}
        />
        <div
          className="absolute -top-4 left-1/3 w-3 h-3 rounded-full bg-gradient-to-br from-red-300 to-red-400 opacity-50 animate-pulse"
          style={{ animationDuration: '2.7s', animationDelay: '1s' }}
        />
      </div>

      {/* Instruction text */}
      <div className="mt-16 text-center max-w-2xl mx-auto">
        {/* Main instruction */}
        <div className="mb-6 p-6 bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-2xl border-2 border-emerald-200 shadow-lg">
          <div className="flex items-center justify-center gap-3 mb-3">
            <svg
              className="w-6 h-6 text-emerald-600 animate-bounce"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
              />
            </svg>
            <p className="text-emerald-900 text-lg sm:text-xl font-bold">
              Tap or click any colored section
            </p>
          </div>
          <p className="text-emerald-700 text-sm sm:text-base font-medium">
            Each color represents a different type of content you can upload
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <span className="text-sm font-bold text-slate-900">
              Secure Storage
            </span>
            <span className="text-xs text-slate-600 text-center">
              Your data is encrypted
            </span>
          </div>

          <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
              </svg>
            </div>
            <span className="text-sm font-bold text-slate-900">
              Auto Location
            </span>
            <span className="text-xs text-slate-600 text-center">
              GPS tagged automatically
            </span>
          </div>

          <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-cyan-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span className="text-sm font-bold text-slate-900">Verified</span>
            <span className="text-xs text-slate-600 text-center">
              Quality checked content
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default MediaTypeWheel;
