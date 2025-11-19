import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileCheck, Type, Eye, CheckCircle, ArrowLeft } from 'lucide-react';

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
      icon: <Type className="h-8 w-8 text-green-600" />,
      path: '/annotations/transcription',
      comingSoon: true,
    },
    {
      id: 'validation',
      title: 'Validation',
      description: 'Validate and verify content accuracy',
      icon: <Eye className="h-8 w-8 text-purple-600" />,
      path: '/annotations/validation',
      comingSoon: true,
    },
    {
      id: 'review',
      title: 'Review',
      description: 'Review and approve content submissions',
      icon: <CheckCircle className="h-8 w-8 text-orange-600" />,
      path: '/annotations/review',
      comingSoon: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header with back button */}
      <div className="gradient-purple text-white p-4 sm:p-6 rounded-b-3xl shadow-xl">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 w-10 h-10 rounded-full"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">
                  Annotations Dashboard
                </h1>
                <p className="text-purple-100 text-sm sm:text-base">
                  Select an annotation tool to get started
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Annotation Tools
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Access all annotation and proofreading tools from this central hub.
            Choose the tool that best fits your current task.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {annotationTools.map((tool) => (
            <Card
              key={tool.id}
              className={`cursor-pointer hover:shadow-lg transition-all duration-200 border-0 rounded-2xl overflow-hidden hover:scale-[1.02] ${
                tool.comingSoon ? 'opacity-70' : ''
              }`}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="flex items-center space-x-4">
                  {tool.icon}
                  <div>
                    <CardTitle className="text-xl">{tool.title}</CardTitle>
                    {tool.comingSoon && (
                      <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full mt-1">
                        Coming Soon
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{tool.description}</p>
                <Link to={tool.path} className="w-full">
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled={tool.comingSoon}
                  >
                    {tool.comingSoon ? 'Coming Soon' : 'Access Tool'}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Need Additional Tools?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-6">
            We're continuously adding new annotation tools to help with various
            tasks. If you need a specific tool that's not listed here, please
            reach out to our support team.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnnotationsDashboard;
