import React from 'react';
import { Link } from 'react-router-dom';
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
  const annotationTools = [
    {
      id: 'proofreading',
      title: 'Proofreading',
      description: 'Review and correct OCR text from documents',
      icon: <FileCheck className="h-8 w-8 text-blue-600" />,
      path: '/annotations/proofreading',
    },
    {
      id: 'transcription',
      title: 'Transcription',
      description: 'Convert audio and video content to text',
      icon: <Mic className="h-8 w-8 text-yellow-600" />,
      path: '/annotations/transcription',
      comingSoon: true,
    },
    {
      id: 'extraction',
      title: 'Text Extraction',
      description: 'Extract text from images and documents',
      icon: <FileType className="h-8 w-8 text-purple-600" />,
      path: '/annotations/extraction',
      comingSoon: true,
    },
    {
      id: 'audio-proofreading',
      title: 'Audio Proofreading',
      description: 'Listen and correct transcribed audio content',
      icon: <AudioLines className="h-8 w-8 text-green-600" />,
      path: '/annotations/audio-proofreading',
      comingSoon: true,
    },
    {
      id: 'peer-review',
      title: 'Peer Review',
      description: "Review and rate your peer's uploads",
      icon: <MessageSquare className="h-8 w-8 text-green-600" />,
      path: '/peer-review',
      comingSoon: false,
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
                  Annotations Dashboard
                </h1>
                <p className="text-slate-600 text-base">
                  Select an annotation tool to get started
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-grow max-w-7xl mx-auto p-8 w-full">
        <div className="mb-12 text-center">
          <div className="inline-block mb-6">
            <span className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
              <FileCheck className="w-8 h-8 text-white" />
            </span>
          </div>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Annotation Tools
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed">
            Access all annotation and proofreading tools from this central hub.
            Choose the tool that best fits your current task.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {annotationTools.map((tool) => (
            <div
              key={tool.id}
              className={`group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl border-2 border-slate-200 hover:border-emerald-400 transition-all duration-300 hover:-translate-y-2 ${
                tool.comingSoon ? 'opacity-60' : ''
              }`}
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 group-hover:scale-110 transition-transform duration-300">
                  {tool.icon}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  {tool.title}
                </h3>
                {tool.comingSoon && (
                  <span className="inline-block bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                    Coming Soon
                  </span>
                )}
                <p className="text-slate-600 text-base leading-relaxed mb-6">
                  {tool.description}
                </p>
                {tool.comingSoon ? (
                  <button
                    className="w-full px-6 py-3 bg-slate-200 text-slate-500 rounded-xl font-semibold cursor-not-allowed"
                    disabled
                  >
                    Coming Soon
                  </button>
                ) : (
                  <Link to={tool.path} className="w-full">
                    <button className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                      Access Tool →
                    </button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Section */}
      <div className="bg-slate-50 border-t border-slate-200 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Need Additional Tools?
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto mb-6">
              We're continuously adding new annotation tools to help with
              various tasks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnotationsDashboard;
