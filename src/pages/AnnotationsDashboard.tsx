import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileCheck,
  Mic,
  AudioLines,
  FileType,
  ArrowLeft,
  MessageSquare,
} from 'lucide-react';

const AnnotationsDashboard = () => {
  const navigate = useNavigate();
  const annotationTools = [
    {
      id: 'proofreading',
      title: 'Proofreading',
      description: 'Review and correct OCR text from documents',
      icon: <FileCheck className="h-8 w-8 text-blue-600" />,
      path: '/tools/proofreading',
    },
    {
      id: 'transcription',
      title: 'Transcription',
      description: 'Convert audio and video content to text',
      icon: <Mic className="h-8 w-8 text-yellow-600" />,
      path: '/tools/transcription',
      comingSoon: true,
    },
    {
      id: 'extraction',
      title: 'Text Extraction',
      description: 'Extract text from images and documents',
      icon: <FileType className="h-8 w-8 text-purple-600" />,
      path: '/tools/extraction',
      comingSoon: true,
    },
    {
      id: 'audio-proofreading',
      title: 'Audio Proofreading',
      description: 'Listen and correct transcribed audio content',
      icon: <AudioLines className="h-8 w-8 text-green-600" />,
      path: '/tools/audio-proofreading',
      comingSoon: true,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 pb-24">
      {/* Header with back button */}
      <div className="bg-white border-b border-slate-200 p-6 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <button className="p-2.5 hover:bg-slate-100 rounded-xl transition-all duration-200 border border-slate-200 hover:border-slate-300">
                  <ArrowLeft className="h-5 w-5 text-slate-700" />
                </button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  Tools
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-grow max-w-7xl mx-auto p-3 w-full">
        <div className="flex flex-wrap gap-5">
          {annotationTools.map((tool) => (
            <div
              key={tool.id}
              style={{
                width: 'calc(47% - 4px)',
              }}
              onClick={() => !tool.comingSoon && navigate(tool.path)}
              className={`relative overflow-hidden group bg-white rounded-2xl p-5 shadow-sm transition-all duration-300 border-2 ${
                tool.comingSoon
                  ? 'cursor-not-allowed border-slate-100 bg-slate-50/50'
                  : 'cursor-pointer border-slate-200 hover:border-emerald-400 hover:shadow-xl hover:-translate-y-2'
              }`}
            >
              {tool.comingSoon && (
                <>
                  <div className="absolute -top-[1px] -right-[1px] z-20">
                    <div className="bg-slate-200 text-slate-500 text-[9px] font-black px-3 py-1 rounded-bl-lg uppercase tracking-widest border-l border-b border-slate-300">
                      Planned
                    </div>
                  </div>

                  <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                      backgroundImage: `radial-gradient(#000 0.5px, transparent 0.5px)`,
                      backgroundSize: '10px 10px',
                    }}
                  ></div>
                </>
              )}

              <div
                className={`flex flex-col items-center text-center transition-all duration-300 ${tool.comingSoon ? 'opacity-40 grayscale' : ''}`}
              >
                <div
                  className={`mb-4 p-4 rounded-2xl transition-all duration-300 ${
                    tool.comingSoon
                      ? 'bg-slate-100 text-slate-400'
                      : 'bg-gradient-to-br from-slate-50 to-slate-100 group-hover:from-emerald-50 group-hover:to-emerald-100 group-hover:scale-110'
                  }`}
                >
                  {tool.icon}
                </div>

                <p
                  className={`text-md sm:text-2xl font-bold mb-2 transition-colors ${
                    tool.comingSoon
                      ? 'text-slate-400'
                      : 'text-slate-900 group-hover:text-emerald-600'
                  }`}
                >
                  {tool.title}
                </p>

                <p className="sm:block hidden text-slate-500 text-sm leading-relaxed mb-2">
                  {tool.comingSoon
                    ? 'Dataset ingestion module under calibration.'
                    : tool.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnnotationsDashboard;
