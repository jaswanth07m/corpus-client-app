// Streamlined Upload Form with Category Dropdown
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import BottomNav from './BottomNav';
import {
  ArrowLeft,
  Type,
  Mic,
  Video,
  Image as ImageIcon,
  FileText,
  Upload as UploadIcon,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { BACKEND_URL } from '@/lib/constants';

interface Category {
  id: string;
  name: string;
  title: string;
  description: string;
  published: boolean;
  rank: number;
}

interface UploadFormProps {
  token: string;
  onBack: () => void;
  onLogout: () => void;
  onSessionExpired?: () => void;
  preSelectedMediaType?:
    | 'text'
    | 'audio'
    | 'video'
    | 'image'
    | 'document'
    | null;
}

const UploadForm: React.FC<UploadFormProps> = ({
  token,
  onBack,
  onSessionExpired,
  preSelectedMediaType,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [textContent, setTextContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const mediaTypeIcons = {
    text: <Type className="w-6 h-6" />,
    audio: <Mic className="w-6 h-6" />,
    video: <Video className="w-6 h-6" />,
    image: <ImageIcon className="w-6 h-6" />,
    document: <FileText className="w-6 h-6" />,
  };

  const mediaTypeTitles = {
    text: 'Text Content',
    audio: 'Audio Recording',
    video: 'Video Content',
    image: 'Image Upload',
    document: 'Document Upload',
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/categories/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401 || response.status === 403) {
        if (onSessionExpired) onSessionExpired();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        const publishedCategories = data
          .filter((cat: Category) => cat.published)
          .sort((a: Category, b: Category) => a.rank - b.rank);
        setCategories(publishedCategories);
      } else {
        toast.error('Failed to fetch categories');
      }
    } catch (error) {
      console.error('Categories Error:', error);
      toast.error('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      toast.success(`File selected: ${file.name}`);
    }
  };

  const handleUpload = async () => {
    // Validation
    if (!selectedCategoryId) {
      toast.error('Please select a category');
      return;
    }
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }
    if (preSelectedMediaType === 'text' && !textContent.trim()) {
      toast.error('Please enter text content');
      return;
    }
    if (preSelectedMediaType !== 'text' && !selectedFile) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    try {
      // TODO: Implement full upload logic with location, chunking, etc.
      // For now, basic upload
      const formData = new FormData();

      if (preSelectedMediaType === 'text') {
        const textBlob = new Blob([textContent], { type: 'text/plain' });
        const textFile = new File([textBlob], 'text-content.txt', {
          type: 'text/plain',
        });
        formData.append('file', textFile);
      } else if (selectedFile) {
        formData.append('file', selectedFile);
      }

      formData.append('title', title);
      formData.append('description', description);
      formData.append('category_id', selectedCategoryId);
      formData.append('media_type', preSelectedMediaType || '');

      const response = await fetch(`${BACKEND_URL}/records/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        toast.success('Content uploaded successfully!');
        // Redirect to peer review
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Network error. Please try again.');
    }
    setUploading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="w-6 h-6 text-slate-700" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-bold text-slate-900 flex items-center justify-center gap-2">
              {preSelectedMediaType && mediaTypeIcons[preSelectedMediaType]}
              {preSelectedMediaType && mediaTypeTitles[preSelectedMediaType]}
            </h1>
          </div>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 w-full">
        <Card className="bg-white shadow-lg border-0 rounded-xl overflow-hidden">
          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Category Dropdown */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Category *
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-slate-900"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter a title for your content"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent h-32 resize-vertical"
                  placeholder="Provide a detailed description"
                />
              </div>

              {/* Content based on media type */}
              {preSelectedMediaType === 'text' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Content *
                  </label>
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent h-48 resize-vertical font-mono"
                    placeholder="Enter your text content here..."
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    File Upload *
                  </label>
                  <label className="block">
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      accept={
                        preSelectedMediaType === 'audio'
                          ? 'audio/*'
                          : preSelectedMediaType === 'video'
                            ? 'video/*'
                            : preSelectedMediaType === 'image'
                              ? 'image/*'
                              : preSelectedMediaType === 'document'
                                ? '.pdf,.doc,.docx,.txt'
                                : '*'
                      }
                      className="hidden"
                    />
                    <div className="w-full p-6 border-2 border-dashed border-slate-300 rounded-lg text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-colors">
                      <UploadIcon className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                      <span className="text-slate-600">
                        {selectedFile
                          ? selectedFile.name
                          : 'Click to upload file'}
                      </span>
                    </div>
                  </label>
                </div>
              )}

              {/* Upload Button */}
              <div className="flex justify-center pt-6">
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-medium text-lg"
                >
                  {uploading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Uploading...
                    </div>
                  ) : (
                    'Upload Content'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UploadForm;
