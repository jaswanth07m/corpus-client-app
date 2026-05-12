import React from 'react';
import { useTranslation } from 'react-i18next';
import { Type, Mic, Video, FileText, Image } from 'lucide-react';
import { NetworkStrengthIndicator } from '@/components/NetworkStrengthIndicator';

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
    color: '#00A36C',
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
}) => {
  const { t } = useTranslation();
  const activeType = selectedType;

  const handleMediaSelect = (
    type: 'text' | 'audio' | 'video' | 'image' | 'document',
  ) => {
    onSelect(type);
  };

  // Wheel view
  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center px-4">
      {/* Network indicator — top-right corner, above the wheel */}
      <div className="absolute top-3 right-4 md:top-4 md:right-6 z-50">
        <NetworkStrengthIndicator />
      </div>
      {/* Wheel Container - Responsive sizing */}
      <div className="relative w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] md:w-[480px] md:h-[480px]">
        {/* Outer glow effect */}
        <div className="absolute inset-[-30px] rounded-full bg-gradient-to-br from-emerald-200 via-blue-100 to-emerald-100 opacity-50 blur-3xl animate-pulse z-0" />

        {/* Outer decorative rings - behind the segments */}
        <div className="absolute inset-[-12px] rounded-full border-[6px] border-white shadow-2xl z-0" />
        <div className="absolute inset-[-4px] rounded-full border-2 border-slate-200/50 z-0" />
        <div className="absolute inset-0 rounded-full border-4 border-white shadow-xl bg-gradient-to-br from-white to-slate-50 z-0" />

        {/* Colored segments background with icons - in front of decorative rings */}
        <svg
          className="absolute inset-0 w-full h-full drop-shadow-lg z-20"
          viewBox="0 0 100 100"
        >
          <defs>
            {mediaTypes.map((media) => (
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
            const gapAngle = 1; // Increased gap between segments to prevent visual overlap
            const effectiveSegmentAngle = segmentAngle - gapAngle;
            const startAngle = index * segmentAngle + gapAngle / 2 - 90; // Adjusted to account for removed rotation
            const endAngle = startAngle + effectiveSegmentAngle;
            const isSegmentActive = activeType === media.type;

            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;
            const innerRadius = 32; // Increased for larger center circle
            const outerRadius = 48; // Consistent outer radius to prevent visual overlap

            const x1 = 50 + outerRadius * Math.cos(startRad);
            const y1 = 50 + outerRadius * Math.sin(startRad);
            const x2 = 50 + outerRadius * Math.cos(endRad);
            const y2 = 50 + outerRadius * Math.sin(endRad);
            const x3 = 50 + innerRadius * Math.cos(endRad);
            const y3 = 50 + innerRadius * Math.sin(endRad);
            const x4 = 50 + innerRadius * Math.cos(startRad);
            const y4 = 50 + innerRadius * Math.sin(startRad);

            const largeArc = effectiveSegmentAngle > 180 ? 1 : 0;

            const path = `
              M ${x1} ${y1}
              A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}
              L ${x3} ${y3}
              A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}
              Z
            `;

            // Calculate position for icon inside the segment - better positioned within the segment
            const midAngle = (startAngle + endAngle) / 2;
            const midRad = (midAngle * Math.PI) / 180;
            const iconRadius = ((innerRadius + outerRadius) / 2) * 1.0; // Position icon 65% from center to fit better inside the segment
            const iconX = 50 + iconRadius * Math.cos(midRad);
            const iconY = 50 + iconRadius * Math.sin(midRad);

            return (
              <g key={media.type}>
                <path
                  d={path}
                  fill={`url(#gradient-${media.type})`}
                  className="cursor-pointer transition-all duration-300"
                  style={{
                    filter: isSegmentActive
                      ? 'brightness(1.2) drop-shadow(0 6px 12px rgba(0,0,0,0.25)) saturate(1.1)'
                      : 'brightness(1) drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                    transformOrigin: '50% 50%',
                  }}
                  onClick={() => handleMediaSelect(media.type)}
                />
                {/* White background circle - smaller */}
                <circle
                  r="5.5"
                  fill="white"
                  opacity="0.95"
                  transform={`translate(${iconX}, ${iconY})`}
                />
                {/* Icon inside the segment - smaller size */}
                <foreignObject
                  x={iconX - 5.5}
                  y={iconY - 5.5}
                  width="11"
                  height="11"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleMediaSelect(media.type)}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    {media.type === 'image' && (
                      <Image size={7} color={media.color} strokeWidth={2.5} />
                    )}
                    {media.type === 'text' && (
                      <Type size={7} color={media.color} strokeWidth={2.5} />
                    )}
                    {media.type === 'audio' && (
                      <Mic size={7} color={media.color} strokeWidth={2.5} />
                    )}
                    {media.type === 'video' && (
                      <Video size={7} color={media.color} strokeWidth={2.5} />
                    )}
                    {media.type === 'document' && (
                      <FileText
                        size={7}
                        color={media.color}
                        strokeWidth={2.5}
                      />
                    )}
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>

        {/* Center circle with instructions - Responsive sizing */}
        <div
          id="tour-media-type-wheel"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[160px] h-[160px] sm:w-[220px] sm:h-[220px] md:w-[260px] md:h-[260px] rounded-full bg-white shadow-2xl flex flex-col items-center justify-center z-30 transition-all duration-300"
          style={{
            boxShadow: `0 8px 32px rgba(0,0,0,0.12), inset 0 2px 12px rgba(0,0,0,0.05)`,
          }}
        >
          {/* Title */}
          <h3 className="text-sm sm:text-base md:text-lg font-bold text-center px-3 text-slate-800 leading-tight mb-2">
            {t('common.selectMediaType')}
          </h3>

          {/* Description */}
          <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-600 text-center px-3 leading-snug font-medium mb-2">
            {t('ui.tap.any.colored.section')}
          </p>

          {/* Click indicator */}
          <div className="flex items-center gap-1 text-[8px] sm:text-[9px] md:text-xs font-semibold text-emerald-600">
            <svg
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-pulse"
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
            <span>{t('common.to.choose')}</span>
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
    </div>
  );
};

export default MediaTypeWheel;
