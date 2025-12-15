import React, { useState } from 'react';
import { Type, Mic, Video, FileText, Image } from 'lucide-react';
import BottomNav from './BottomNav';
import SwechaLogo from './SwechaLogo';

interface MediaType {
  type: 'text' | 'audio' | 'video' | 'image' | 'document';
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}

interface Category {
  id: string;
  name: string;
  emoji: string;
  title: string;
  description: string;
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

// Categories data with emojis
const categoriesData: Category[] = [
  {
    id: 'fables',
    name: 'fables',
    emoji: '📚',
    title: 'Fables',
    description:
      'Traditional stories with moral lessons and mythical characters',
  },
  {
    id: 'events',
    name: 'events',
    emoji: '🎉',
    title: 'Events',
    description: 'Happenings, celebrations, and special occasions',
  },
  {
    id: 'music',
    name: 'music',
    emoji: '🎵',
    title: 'Music',
    description: 'Musical content, songs, instruments, and audio experiences',
  },
  {
    id: 'places',
    name: 'places',
    emoji: '🏛️',
    title: 'Places',
    description: 'Locations, landmarks, and geographical content',
  },
  {
    id: 'food',
    name: 'food',
    emoji: '🍽️',
    title: 'Food',
    description: 'Culinary content, recipes, and food-related information',
  },
  {
    id: 'people',
    name: 'people',
    emoji: '👥',
    title: 'People',
    description: 'Individuals, personalities, and human-related content',
  },
  {
    id: 'literature',
    name: 'literature',
    emoji: '📖',
    title: 'Literature',
    description: 'Books, poems, writings, and literary works',
  },
  {
    id: 'architecture',
    name: 'architecture',
    emoji: '🏗️',
    title: 'Architecture',
    description: 'Buildings, structures, and architectural designs',
  },
  {
    id: 'skills',
    name: 'skills',
    emoji: '⚡',
    title: 'Skills',
    description: 'Abilities, talents, and learning resources',
  },
  {
    id: 'images',
    name: 'images',
    emoji: '🖼️',
    title: 'Images',
    description: 'Visual content, pictures, and graphic materials',
  },
  {
    id: 'culture',
    name: 'culture',
    emoji: '🎭',
    title: 'Culture',
    description: 'Cultural traditions, customs, and heritage',
  },
  {
    id: 'flora_fauna',
    name: 'flora_&_fauna',
    emoji: '🌿',
    title: 'Flora & Fauna',
    description: 'Plants, animals, and natural life forms',
  },
  {
    id: 'education',
    name: 'education',
    emoji: '🎓',
    title: 'Education',
    description: 'Learning materials, courses, and educational content',
  },
  {
    id: 'vegetation',
    name: 'vegetation',
    emoji: '🌱',
    title: 'Vegetation',
    description: 'Plant life, gardening, and botanical content',
  },
  {
    id: 'folk_tales',
    name: 'folk tales',
    emoji: '📓',
    title: 'Folk Tales',
    description: 'Stories passed orally across generations',
  },
  {
    id: 'folk_songs',
    name: 'folk_songs',
    emoji: '🎶',
    title: 'Folk Songs',
    description:
      'Documenting traditional music reflecting the cultural heritage of the region',
  },
  {
    id: 'traditional_skills',
    name: 'traditional_skills',
    emoji: '🛠️',
    title: 'Traditional Skills',
    description:
      'Gathering data on local artisanal and craft practices (e.g., weaving, pottery)',
  },
  {
    id: 'local_cultural_history',
    name: 'local_cultural_history',
    emoji: '🏛️',
    title: 'Local Cultural History',
    description:
      'Collecting data on cultural events, rituals, and customs that define the local communities',
  },
  {
    id: 'local_history',
    name: 'local_history',
    emoji: '📜',
    title: 'Local History',
    description:
      'Compiling historical events and figures significant to your region',
  },
  {
    id: 'food_agriculture',
    name: 'food_agriculture',
    emoji: '🌾',
    title: 'Food & Agriculture',
    description:
      'Documenting traditional recipes and cooking methods, along with their cultural significance',
  },
  {
    id: 'old_newspapers',
    name: 'old_newspapers',
    emoji: '📰',
    title: 'Newspapers Older Than 1980s',
    description: 'From libraries or archives, scanned or physical copies',
  },
];

const MediaTypeWheel: React.FC<MediaTypeWheelProps> = ({
  onSelect,
  selectedType,
  onCategorySelect,
}) => {
  const [hoveredType, setHoveredType] = useState<string | null>(null);
  const [showCategories, setShowCategories] = useState(false);
  const [selectedMediaForCategories, setSelectedMediaForCategories] = useState<
    string | null
  >(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [showUploadForm, setShowUploadForm] = useState(false);

  const activeType = hoveredType || selectedType;
  const activeMedia =
    mediaTypes.find((m) => m.type === activeType) || mediaTypes[0];

  const handleMediaSelect = (
    type: 'text' | 'audio' | 'video' | 'image' | 'document',
  ) => {
    setSelectedMediaForCategories(type);
    setShowCategories(true);
    onSelect(type);
  };

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
    setShowUploadForm(true);
    // Notify parent component
    if (onCategorySelect) {
      onCategorySelect(category.id, category.name);
    }
  };

  const handleBackToWheel = () => {
    setShowCategories(false);
    setSelectedMediaForCategories(null);
    setShowUploadForm(false);
    setSelectedCategory(null);
  };

  const handleBackToCategories = () => {
    setShowUploadForm(false);
    setSelectedCategory(null);
  };

  // Categories and Upload view - shown after media type selection
  if (showCategories && selectedMediaForCategories) {
    const selectedMedia = mediaTypes.find(
      (m) => m.type === selectedMediaForCategories,
    );

    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Instagram-like Header */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-50 shadow-sm">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <button
              onClick={handleBackToWheel}
              className="p-2 hover:bg-slate-100 rounded-lg transition-all duration-200"
            >
              <svg
                className="w-6 h-6 text-slate-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-bold text-slate-900">
                Select Category
              </h1>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-xs text-slate-500">Media:</span>
                <div
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: `${selectedMedia?.color}30`,
                    color: 'white',
                  }}
                >
                  {selectedMedia?.title}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout: Categories + Upload Form */}
        <div className="flex-1 px-6 py-8 pb-24 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Categories */}
              <div>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-slate-900 mb-3">
                    Choose a Category
                  </h2>
                  <p className="text-slate-600 text-base">
                    Select the category that best fits your content
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-h-[calc(100vh-300px)] overflow-y-auto pr-2 custom-scrollbar">
                  {categoriesData.map((category) => (
                    <div
                      key={category.id}
                      onClick={() => handleCategoryClick(category)}
                      className={`group cursor-pointer bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl border-2 transition-all duration-300 hover:-translate-y-1 ${
                        selectedCategory?.id === category.id
                          ? 'border-emerald-500 bg-emerald-50 shadow-lg ring-2 ring-emerald-200'
                          : 'border-slate-200 hover:border-emerald-400'
                      }`}
                    >
                      <div className="flex flex-col items-center text-center gap-2">
                        <span className="text-4xl group-hover:scale-110 transition-transform duration-300">
                          {category.emoji}
                        </span>
                        <h3
                          className={`font-bold text-lg group-hover:text-emerald-600 transition-colors ${
                            selectedCategory?.id === category.id
                              ? 'text-emerald-700'
                              : 'text-slate-900'
                          }`}
                        >
                          {category.title}
                        </h3>
                        <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
                          {category.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Upload Form Preview */}
              <div className="sticky top-8">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-slate-900 mb-3">
                    Upload Details
                  </h2>
                  <p className="text-slate-600 text-base">
                    Review your selection and proceed
                  </p>
                </div>
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200 min-h-[500px]">
                  {selectedCategory ? (
                    <div>
                      <div className="flex items-center gap-3 mb-6 pb-6 border-b">
                        <span className="text-5xl">
                          {selectedCategory.emoji}
                        </span>
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">
                            {selectedCategory.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {selectedCategory.description}
                          </p>
                        </div>
                      </div>

                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-4">
                          <div
                            className="p-3 rounded-lg"
                            style={{
                              backgroundColor: `${selectedMedia?.color}20`,
                            }}
                          >
                            {selectedMedia?.icon}
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Media Type</p>
                            <p
                              className="font-semibold"
                              style={{ color: selectedMedia?.color }}
                            >
                              {selectedMedia?.title}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 mb-6">
                        <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg">
                          <svg
                            className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0"
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
                          <div>
                            <p className="text-sm font-semibold text-gray-800">
                              Add Title & Description
                            </p>
                            <p className="text-xs text-gray-600">
                              Provide context for your content
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                          <svg
                            className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0"
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
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">
                              Location Tagging
                            </p>
                            <p className="text-xs text-gray-600">
                              GPS coordinates will be captured
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                          <svg
                            className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">
                              Upload Your File
                            </p>
                            <p className="text-xs text-gray-600">
                              Secure & encrypted storage
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (onCategorySelect) {
                            onCategorySelect(
                              selectedCategory.id,
                              selectedCategory.name,
                            );
                          }
                        }}
                        className="w-full px-8 py-5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-2xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 font-bold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center justify-center gap-3 group"
                      >
                        <span>Continue to Upload</span>
                        <svg
                          className="w-6 h-6 group-hover:translate-x-1 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-24">
                      <div className="mb-8">
                        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                          <svg
                            className="w-12 h-12 text-slate-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 11l5-5m0 0l5 5m-5-5v12"
                            />
                          </svg>
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-3">
                        Choose a Category
                      </h3>
                      <p className="text-slate-600 text-base max-w-xs mx-auto leading-relaxed mb-8">
                        Select a category from the left to see upload options
                        and continue
                      </p>
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 animate-pulse">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                        <span className="text-sm font-semibold">
                          Browse categories
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <BottomNav />
      </div>
    );
  }

  // Wheel view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col items-center justify-center py-12 px-4 pb-24">
      {/* Title */}
      <div className="text-center mb-16 animate-fade-in max-w-3xl mx-auto">
        {/* Swecha Branding */}
        <div className="mb-8">
          <SwechaLogo size="lg" showTagline={true} className="justify-center" />
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

      {/* Wheel Container - Optimized for desktop view */}
      <div className="relative w-[420px] h-[420px] sm:w-[480px] sm:h-[480px]">
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
            const innerRadius = 30; // Increased for larger center circle
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

        {/* Center circle with selected info - LARGER SIZE */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] sm:w-[260px] sm:h-[260px] rounded-full bg-white shadow-2xl flex flex-col items-center justify-center z-30 transition-all duration-300"
          style={{
            boxShadow: `0 8px 32px rgba(0,0,0,0.12), inset 0 2px 12px rgba(0,0,0,0.05)`,
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
