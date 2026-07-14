import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileCheck,
  Mic,
  AudioLines,
  FileType,
  ArrowLeft,
  MessageSquare,
  Image,
  Video,
  Brain,
  Database,
  BookOpen,
  Workflow,
  Tags,
} from 'lucide-react';
import { NetworkStrengthIndicator } from '@/components/NetworkStrengthIndicator';

const AnnotationsDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const annotationTools = [
    {
      id: 'peer-review',
      title: t('tools.peerReview', 'Peer Review'),
      description: t(
        'tools.peerReviewDescription',
        "Review other users' contributions and provide feedback.",
      ),
      icon: <FileCheck className="h-8 w-8 text-emerald-600" />,
      path: '/peer-review',
    },
    {
      id: 'image-review',
      title: t('tools.imageAnnotation', 'Image Annotation'),
      description: t(
        'tools.imageAnnotationDescription',
        'Annotate objects, regions, and patterns in images.',
      ),
      icon: <Image className="h-8 w-8 text-emerald-600" />,
      path: '/tools/image-review',
    },
    {
      id: 'image-annotation',
      title: t('tools.imageAnnotation'),
      description: t('tools.imageAnnotationDescription'),
      icon: <Image className="h-8 w-8 text-emerald-600" />,
      path: '/tools/image-annotation',
    },
    {
      id: 'audio-review',
      title: t('tools.audioTool', 'Audio Tool'),
      description: t(
        'tools.audioToolDescription',
        'Review and annotate audio recordings.',
      ),
      icon: <AudioLines className="h-8 w-8 text-amber-600" />,
      path: '/tools/audio-review',
    },
    {
      id: 'video-review',
      title: t('tools.videoTool', 'Video Tool'),
      description: t(
        'tools.videoToolDescription',
        'Review and annotate video content.',
      ),
      icon: <Video className="h-8 w-8 text-red-600" />,
      path: '/tools/video-review',
    },
    {
      id: 'read-speech',
      title: t('tools.readSpeech', 'Read Speech'),
      description: t(
        'tools.readSpeechDescription',
        'Record your voice reading displayed sentences.',
      ),
      icon: <Mic className="h-8 w-8 text-sky-600" />,
      path: '/tools/read-speech',
    },
    {
      id: 'doc-digitization',
      title: t('tools.docDigitization'),
      description: t('tools.docDigitizationDescription'),
      icon: <FileCheck className="h-8 w-8 text-blue-600" />,
      path: '/tools/doc-digitization',
    },
    {
      id: 'transcription',
      title: t('tools.transcription'),
      description: t('tools.transcriptionDescription'),
      icon: <Mic className="h-8 w-8 text-yellow-600" />,
      path: '/tools/transcription',
      comingSoon: true,
    },
    {
      id: 'extraction',
      title: t('tools.textExtraction'),
      description: t('tools.textExtractionDescription'),
      icon: <FileType className="h-8 w-8 text-purple-600" />,
      path: '/tools/extraction',
      comingSoon: true,
    },
    {
      id: 'ask-your-corpus',
      title: t('tools.askYourCorpus', 'Ask Your Corpus'),
      description: t(
        'tools.askYourCorpusDescription',
        'Retrieval-Augmented Generation for intelligent document querying.',
      ),
      icon: <Brain className="h-8 w-8 text-indigo-600" />,
      path: '/tools/ask-your-corpus',
      comingSoon: true,
    },
    {
      id: 'story-generator',
      title: t('tools.storyGenerator', 'Story Generator'),
      description: t(
        'tools.storyGeneratorDescription',
        'Automatically generate engaging stories from collected data.',
      ),
      icon: <BookOpen className="h-8 w-8 text-pink-600" />,
      path: '/tools/story-generator',
      comingSoon: true,
    },
    {
      id: 'agent-workflows',
      title: t('tools.agentWorkflows', 'Agent Workflows'),
      description: t(
        'tools.agentWorkflowsDescription',
        'Design and manage automated AI agent processes.',
      ),
      icon: <Workflow className="h-8 w-8 text-cyan-600" />,
      path: '/tools/workflows',
      comingSoon: true,
    },
    {
      id: 'metadata-index',
      title: t('tools.metadataIndex', 'Metadata Index'),
      description: t(
        'tools.metadataIndexDescription',
        'Advanced indexing and search for community metadata.',
      ),
      icon: <Tags className="h-8 w-8 text-orange-600" />,
      path: '/tools/metadata-index',
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
                  {t('tools.heading')}
                </h1>
              </div>
            </div>
            <NetworkStrengthIndicator />
          </div>
        </div>
      </div>

      <div className="flex-grow max-w-7xl mx-auto p-4 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {annotationTools.map((tool) => (
            <div
              key={tool.id}
              id={
                tool.id === 'doc-digitization'
                  ? 'tour-doc-digitization-tool'
                  : tool.id === 'peer-review'
                    ? 'tour-peer-review-tool'
                    : tool.id === 'image-review'
                      ? 'tour-image-review-tool'
                      : tool.id === 'audio-review'
                        ? 'tour-audio-review-tool'
                        : tool.id === 'video-review'
                          ? 'tour-video-review-tool'
                          : tool.id === 'read-speech'
                            ? 'tour-read-speech-tool'
                            : tool.comingSoon && tool.id === 'ask-your-corpus'
                              ? 'tour-future-tools'
                              : undefined
              }
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
                      {t('tools.planned')}
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
                    ? t('tools.comingSoonDescription')
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
