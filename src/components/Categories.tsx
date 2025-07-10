import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, LogOut, Grid3X3, Calendar, User, FileText, Upload, MapPin, Type, Mic, Video, Image, X, Check, AlertCircle, Camera } from 'lucide-react';
import { toast } from "sonner";
import ContentInput from "./ContentInput";

// ADD THE JWT DECODER FUNCTION HERE - RIGHT AFTER IMPORTS
const decodeJWTToken = (token: string): any => {
  try {
    // JWT tokens have 3 parts separated by dots: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT token format');
    }

    // Decode the payload (second part)
    const payload = parts[1];
    
    // Add padding if needed (JWT base64 encoding might not have padding)
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    
    // Decode base64
    const decodedPayload = atob(paddedPayload);
    
    // Parse JSON
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
};

interface Category {
  id: string;
  name: string;
  title: string;
  description: string;
  published: boolean;
  rank: number;
  created_at: string;
  updated_at: string;
}

interface CategoriesProps {
  token: string;
  onBack: () => void;
  onLogout: () => void;
  onProfile: () => void;
  onContentInput: (categoryId: string, categoryName: string) => void;
}

interface UploadOption {
  type: 'text' | 'audio' | 'video' | 'image';
  icon: React.ReactNode;
  title: string;
  description: string;
  accept: string;
}

const Categories: React.FC<CategoriesProps> = ({ token, onBack, onLogout, onProfile, onContentInput }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [uploadMode, setUploadMode] = useState<'text' | 'audio' | 'video' | 'image' | null>(null);
  const [title, setTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [uploading, setUploading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [locationRequested, setLocationRequested] = useState(false);
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [userId, setUserId] = useState<string>('');

  const uploadOptions: UploadOption[] = [
    {
      type: 'text',
      icon: <Type className="h-8 w-8" />,
      title: 'Text Input',
      description: 'Type your content',
      accept: ''
    },
    {
      type: 'audio',
      icon: <Mic className="h-8 w-8" />,
      title: 'Audio Recording',
      description: 'Record your voice',
      accept: 'audio/*'
    },
    {
      type: 'video',
      icon: <Video className="h-8 w-8" />,
      title: 'Video Content',
      description: 'Record or upload video',
      accept: 'video/*'
    },
    {
      type: 'image',
      icon: <Camera className="h-8 w-8" />,
      title: 'Photo Capture',
      description: 'Take or upload photos',
      accept: 'image/*'
    }
  ];

  useEffect(() => {
    fetchCategories();
    fetchUserProfile();
  }, []);

  // REPLACE YOUR EXISTING fetchUserProfile FUNCTION WITH THIS
  const fetchUserProfile = async () => {
    try {
      // First try to decode user ID from JWT token
      const tokenPayload = decodeJWTToken(token);
      if (tokenPayload) {
        console.log('JWT Token payload:', tokenPayload);
        // Common JWT payload fields for user ID
        const userId = tokenPayload.sub || tokenPayload.user_id || tokenPayload.id || tokenPayload.uid;
        if (userId) {
          console.log('User ID from token:', userId);
          setUserId(userId.toString());
          return; // Exit early if we got the user ID from token
        }
      }

      // Fallback: Try to fetch from API
      const response = await fetch('https://backend2.swecha.org/api/v1/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('User profile response:', userData);
        
        // Try multiple possible field names for user ID
        const userId = userData.id || userData.uid || userData.user_id || userData.sub;
        if (userId) {
          setUserId(userId.toString());
        } else {
          console.error('User ID not found in profile response:', userData);
          toast.error("User ID not found. Please try logging in again.");
        }
      } else {
        console.error('Failed to fetch user profile, status:', response.status);
        const errorData = await response.json().catch(() => ({}));
        console.error('Profile fetch error:', errorData);
      }
    } catch (error) {
      console.error('User profile error:', error);
      toast.error("Failed to get user information. Please try logging in again.");
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('https://backend2.swecha.org/api/v1/categories/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Categories Response:', data);
        const publishedCategories = data
          .filter((cat: Category) => cat.published)
          .sort((a: Category, b: Category) => a.rank - b.rank);
        setCategories(publishedCategories);
      } else {
        toast.error("Failed to fetch categories");
      }
    } catch (error) {
      console.error('Categories Error:', error);
      toast.error("Network error. Please try again.");
    }
    setLoading(false);
  };

  const getCategoryIcon = (name: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'fables': '📚',
      'events': '🎉',
      'music': '🎵',
      'places': '🏛️',
      'food': '🍽️',
      'people': '👥',
      'literature': '📖',
      'architecture': '🏗️',
      'skills': '⚡',
      'images': '🖼️',
      'culture': '🎭',
      'flora_&_fauna': '🌿',
      'education': '🎓',
      'vegetation': '🌱',
      'folk_songs': '🎶',
      'traditional_skills': '🛠️',
      'local_cultural_history': '🏛️',
      'local_history': '📜',
      'food_agriculture': '🌾',
      'old_newspapers': '📰',
      'folk tales': '📓'
    };
    return iconMap[name] || '📂';
  };

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
    setShowUploadOptions(true);
  };

  const handleUploadOptionSelect = (option: UploadOption) => {
    setUploadMode(option.type);
    setShowUploadOptions(false);
    if (!locationRequested && !location) {
      requestLocation();
    }
  };

  const requestLocation = () => {
    setLocationError('');
    setLocationRequested(true);
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      toast.error("Geolocation not supported");
      setShowManualLocation(true);
      return;
    }

    toast.info("Requesting location access...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Location obtained:', position.coords);
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationError('');
        setShowManualLocation(false);
        toast.success("Location access granted!");
      },
      (error) => {
        console.error('Location error:', error);
        let errorMessage = 'Location access failed. ';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access or enter manually.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
            break;
        }
        
        setLocationError(errorMessage);
        toast.error(errorMessage);
        setShowManualLocation(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000
      }
    );
  };

  const handleManualLocationSubmit = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    
    if (isNaN(lat) || isNaN(lng)) {
      toast.error("Please enter valid latitude and longitude values");
      return;
    }
    
    if (lat < -90 || lat > 90) {
      toast.error("Latitude must be between -90 and 90");
      return;
    }
    
    if (lng < -180 || lng > 180) {
      toast.error("Longitude must be between -180 and 180");
      return;
    }
    
    setLocation({ lat, lng });
    setLocationError('');
    setShowManualLocation(false);
    toast.success("Location set manually!");
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedCategory || !title.trim()) {
      toast.error("Please provide a title");
      return;
    }

    if (!location) {
      toast.error("Location is required. Please enable location access or enter manually.");
      if (!showManualLocation) {
        setShowManualLocation(true);
      }
      return;
    }

    if (!userId) {
      toast.error("User ID not found. Please try logging in again.");
      return;
    }

    // For text uploads, create a text file
    let fileToUpload = selectedFile;
    if (uploadMode === 'text') {
      if (!textContent.trim()) {
        toast.error("Please enter text content");
        return;
      }
      // Create a text file from the content
      const textBlob = new Blob([textContent], { type: 'text/plain' });
      fileToUpload = new File([textBlob], 'text-content.txt', { type: 'text/plain' });
    } else if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category_id', selectedCategory.id);
      formData.append('user_id', userId);
      formData.append('media_type', uploadMode || '');
      formData.append('latitude', location.lat.toString());
      formData.append('longitude', location.lng.toString());
      formData.append('use_uid_filename', 'false');
      
      if (fileToUpload) {
        formData.append('file', fileToUpload);
      }

      // Use the single upload endpoint
      const endpoint = 'https://backend2.swecha.org/api/v1/records/upload';

      console.log('Uploading to:', endpoint);
      console.log('Form data entries:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Upload successful:', result);
        toast.success("Content uploaded successfully!");
        handleBack();
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Upload failed' }));
        console.error('Upload failed:', errorData);
        toast.error(errorData.detail || errorData.message || "Upload failed. Please try again.");
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Network error. Please check your connection and try again.");
    }

    setUploading(false);
  };

  const handleBack = () => {
    setSelectedCategory(null);
    setShowUploadOptions(false);
    setUploadMode(null);
    setTitle('');
    setTextContent('');
    setSelectedFile(null);
    setLocationRequested(false);
    setLocation(null);
    setLocationError('');
    setShowManualLocation(false);
    setManualLat('');
    setManualLng('');
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setShowUploadOptions(false);
    setUploadMode(null);
    setTitle('');
    setTextContent('');
    setSelectedFile(null);
    setLocationRequested(false);
    setLocation(null);
    setLocationError('');
    setShowManualLocation(false);
    setManualLat('');
    setManualLng('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Upload Interface
  if (uploadMode && selectedCategory) {
    return (
      <ContentInput
        uploadMode={uploadMode}
        selectedCategory={selectedCategory}
        title={title}
        setTitle={setTitle}
        textContent={textContent}
        setTextContent={setTextContent}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
        location={location}
        setLocation={setLocation}
        locationError={locationError}
        setLocationError={setLocationError}
        showManualLocation={showManualLocation}
        setShowManualLocation={setShowManualLocation}
        manualLat={manualLat}
        setManualLat={setManualLat}
        manualLng={manualLng}
        setManualLng={setManualLng}
        uploading={uploading}
        token={token}
        userId={userId}
        onBack={handleBack}
        onUpload={handleUpload}
        requestLocation={requestLocation}
        handleManualLocationSubmit={handleManualLocationSubmit}
        handleFileSelect={handleFileSelect}
      />
    );
  }

  // Upload Options Modal
  if (showUploadOptions && selectedCategory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Header */}
        <div className="gradient-purple text-white p-4 sm:p-6 rounded-b-3xl shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 w-10 h-10 rounded-full"
                onClick={handleBackToCategories}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold mb-1">
                  {selectedCategory.title}
                </h1>
                <p className="text-purple-100 text-sm sm:text-base">
                  Choose how you'd like to contribute
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Options */}
        <div className="px-4 sm:px-6 py-6 sm:py-8">
          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {uploadOptions.map((option) => (
                <Card
                  key={option.type}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-purple-300 rounded-2xl"
                  onClick={() => handleUploadOptionSelect(option)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="text-purple-600 mb-4 flex justify-center">
                      {option.icon}
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{option.title}</h3>
                    <p className="text-gray-600 text-sm">{option.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Categories View
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="gradient-purple text-white p-4 sm:p-6 rounded-b-3xl shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold mb-1">Categories</h1>
              <p className="text-purple-100 text-sm sm:text-base">
                Choose a category to contribute content
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 w-10 h-10 rounded-full"
              onClick={onProfile}
            >
              <User className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 w-10 h-10 rounded-full"
              onClick={onLogout}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {categories.map((category) => (
              <Card
                key={category.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 border-0 rounded-2xl overflow-hidden hover:scale-105"
                onClick={() => handleCategoryClick(category)}
              >
                <CardContent className="p-6">
                  <div className="text-4xl mb-4 text-center">
                    {getCategoryIcon(category.name)}
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-center text-gray-800">
                    {category.title}
                  </h3>
                  <p className="text-gray-600 text-sm text-center line-clamp-3">
                    {category.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;