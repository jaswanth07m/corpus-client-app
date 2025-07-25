# Chunked Upload Implementation Plan

## 📋 Overview

This document outlines the step-by-step implementation plan for chunked file upload functionality in the frontend. The system will allow large files to be uploaded in smaller chunks with retry logic and resumption capability.

## 🎯 Requirements

- **Chunk-based uploads**: Files uploaded in configurable chunk sizes (10MB maximum per chunk)
- **Retry logic**: Failed chunks retried at least 3 times with exponential backoff

- **Progress tracking**: Real-time upload progress feedback
- **Error handling**: Graceful handling of network failures and upload errors
- **Backward compatibility**: Existing upload functionality continues to work

## 🏗️ Implementation Plan

### Phase 1: State Management & Configuration

#### Step 1.1: Add New State Variables

Add the following state variables to the `Categories` component:

```typescript
// Upload state management
const [uploadUuid, setUploadUuid] = useState<string>('');
const [uploadedChunks, setUploadedChunks] = useState<Set<number>>(new Set());
const [uploadProgress, setUploadProgress] = useState<number>(0);
const [isUploading, setIsUploading] = useState<boolean>(false);
```

#### Step 1.2: Add Configuration Constants

Add configuration constants at the top of the component:

```typescript
// Upload configuration
const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB maximum per chunk
const MAX_RETRY_ATTEMPTS = 5; // Maximum retry attempts per chunk
const RETRY_DELAY_MS = 1000; // Base delay for exponential backoff
```

### Phase 2: Core Upload Logic

#### Step 2.1: Create Chunk Upload Function

```typescript
const uploadChunk = async (
  chunk: Blob,
  chunkIndex: number,
  totalChunks: number,
  uploadUuid: string,
  filename: string,
): Promise<boolean> => {
  const maxRetries = MAX_RETRY_ATTEMPTS;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('filename', filename);
      formData.append('chunk_index', chunkIndex.toString());
      formData.append('total_chunks', totalChunks.toString());
      formData.append('upload_uuid', uploadUuid);

      const response = await fetch(`${BACKEND_URL}/records/upload/chunk`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Upload failed (attempt ${attempt + 1}):`, errorData);

        if (response.status === 401 || response.status === 403) {
          handleSessionExpiration(
            'Session expired during upload. Please login again.',
          );
          return false;
        }
      }
    } catch (error) {
      console.error(`Upload error (attempt ${attempt + 1}):`, error);
    }

    attempt++;
    if (attempt < maxRetries) {
      // Exponential backoff
      const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return false;
};
```

#### Step 2.2: Create Lazy Chunk Reading Function

```typescript
const readChunk = async (file: File, chunkIndex: number): Promise<Blob> => {
  const start = chunkIndex * CHUNK_SIZE;
  const end = Math.min(start + CHUNK_SIZE, file.size);
  return file.slice(start, end);
};

const getTotalChunks = (file: File): number => {
  return Math.ceil(file.size / CHUNK_SIZE);
};
```

#### Step 2.3: Create Upload Finalization Function

```typescript
const finalizeUpload = async (uploadUuid: string): Promise<boolean> => {
  try {
    const formData = new FormData();
    formData.append('upload_uuid', uploadUuid);
    formData.append('title', title);
    formData.append('category_id', selectedCategory!.id);
    formData.append('user_id', userId);
    formData.append('media_type', uploadMode || '');
    formData.append('latitude', location!.lat.toString());
    formData.append('longitude', location!.lng.toString());
    formData.append('use_uid_filename', 'false');

    const response = await fetch(`${BACKEND_URL}/records/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Upload finalized successfully:', result);
      return true;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('Upload finalization failed:', errorData);
      return false;
    }
  } catch (error) {
    console.error('Upload finalization error:', error);
    return false;
  }
};
```

### Phase 3: Enhanced Upload Handler

#### Step 3.1: Modify handleUpload Function

```typescript
const handleUpload = async () => {
  // Validation checks (existing logic)
  if (!selectedCategory || !title.trim()) {
    toast.error('Please provide a title');
    return;
  }

  if (!location) {
    toast.error(
      'Location is required. Please enable location access or enter manually.',
    );
    if (!showManualLocation) {
      setShowManualLocation(true);
    }
    return;
  }

  if (!userId) {
    toast.error('User ID not found. Please try logging in again.');
    return;
  }

  // Prepare file for upload
  let fileToUpload = selectedFile;
  if (uploadMode === 'text') {
    if (!textContent.trim()) {
      toast.error('Please enter text content');
      return;
    }
    const textBlob = new Blob([textContent], { type: 'text/plain' });
    fileToUpload = new File([textBlob], 'text-content.txt', {
      type: 'text/plain',
    });
  } else if (!selectedFile) {
    toast.error('Please select a file');
    return;
  }

  // Initialize upload state
  const newUploadUuid = uploadUuid || crypto.randomUUID();
  setUploadUuid(newUploadUuid);
  setIsUploading(true);
  setUploadProgress(0);

  try {
    // Upload chunks sequentially with lazy reading
    const success = await uploadChunksSequentially(
      fileToUpload!,
      newUploadUuid,
    );

    if (success) {
      // Finalize upload
      const finalized = await finalizeUpload(newUploadUuid);
      if (finalized) {
        toast.success('Content uploaded successfully!');
        resetUploadState();
        handleBack();
        posthog.capture('upload_success');
      } else {
        toast.error('Upload finalization failed. Please try again.');
        resetUploadState();
      }
    } else {
      toast.error('Upload failed. Please try again.');
      resetUploadState();
    }
  } catch (error) {
    console.error('Upload error:', error);
    toast.error('Network error. Please check your connection and try again.');
    resetUploadState();
    posthog.capture('upload_error');
    posthog.captureException(error);
  }

  setIsUploading(false);
};
```

#### Step 3.2: Implement Lazy Chunk Upload Sequence

```typescript
const uploadChunksSequentially = async (
  file: File,
  uploadUuid: string,
): Promise<boolean> => {
  const totalChunks = getTotalChunks(file);
  let allChunksSuccessful = true;

  for (let i = 0; i < totalChunks; i++) {
    // Skip already uploaded chunks
    if (uploadedChunks.has(i)) {
      continue;
    }

    // Read chunk lazily only when needed
    const chunk = await readChunk(file, i);

    const success = await uploadChunk(
      chunk,
      i,
      totalChunks,
      uploadUuid,
      file.name,
    );

    if (success) {
      setUploadedChunks((prev) => new Set([...prev, i]));
      // Update progress state
      const progress = ((i + 1) / totalChunks) * 100;
      setUploadProgress(progress);
    } else {
      allChunksSuccessful = false;
      break; // Stop on first failure, allow retry
    }
  }

  return allChunksSuccessful;
};
```

### Phase 4: Error Handling & User Experience

#### Step 4.1: Progress State Management

Categories manages chunked upload progress state, while ContentInput keeps its existing progress state.

```typescript
// Categories manages chunked upload state
const [uploadProgress, setUploadProgress] = useState<number>(0);
const [isUploading, setIsUploading] = useState<boolean>(false);

// ContentInput keeps its existing progress state for its own functionality
// Categories passes chunked upload progress to ContentInput for display
<ContentInput
  // ... existing props
  chunkedUploadProgress={uploadProgress} // New prop for chunked uploads
  isChunkedUploading={isUploading} // New prop for chunked uploads
  // ContentInput keeps its existing uploadProgress and uploadingFiles state
/>;
```

### Phase 5: Integration & Testing

#### Step 5.1: Component Integration

- **Categories Component**: Manages chunked upload logic and progress state
- **ContentInput Component**: Keeps existing progress state, receives chunked upload progress as additional props
- **Progress Communication**: Categories passes chunked upload progress down as new props
- **Error Handling**: Categories handles upload errors with toast messages

### Phase 6: Performance & Optimization

#### Step 6.1: Memory Management

```typescript
// Memory Management Strategy:
// - Lazy chunk reading prevents loading entire file into memory
// - Each chunk is read only when needed and garbage collected after use
// - No manual cleanup required since we don't store all chunks in memory
// - State cleanup ensures proper memory release

const resetUploadState = () => {
  // Reset Categories component upload state
  setUploadUuid('');
  setUploadedChunks(new Set());
  setUploadProgress(0);
  setIsUploading(false);
};
```

## ✅ Implementation Checklist

### Core Implementation

- [ ] Add new state variables for upload management
- [ ] Create configuration constants
- [ ] Implement `uploadChunk()` function with retry logic
- [ ] Implement `readChunk()` and `getTotalChunks()` functions for lazy reading
- [ ] Implement `finalizeUpload()` function
- [ ] Modify `handleUpload()` function for chunked uploads
- [ ] Implement `uploadChunksSequentially()` function with lazy chunk reading
- [ ] Add chunked upload progress props to ContentInput

### Error Handling

- [ ] Add retry logic with exponential backoff

### User Experience

- [ ] Implement state cleanup

### Testing

- [ ] Test successful chunked uploads
- [ ] Test retry logic with network failures

- [ ] Test large file uploads
- [ ] Test text content uploads
- [ ] Test error scenarios

## 🔧 Configuration

### Required Settings

```typescript
// Upload configuration
const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB maximum per chunk
const MAX_RETRY_ATTEMPTS = 3; // Maximum retry attempts per chunk
const RETRY_DELAY_MS = 1000; // Base delay for exponential backoff
```

## 🚀 Benefits

- **Memory Efficiency**: Lazy chunk reading prevents loading entire file into memory
- **Reliability**: Robust retry logic ensures successful uploads
- **Performance**: Efficient handling of large files without memory constraints
- **User Experience**: Clear progress feedback and error handling
- **Scalability**: Handles files of any size within limits
- **Compatibility**: Maintains existing upload functionality
- **Integration**: Seamlessly integrates with existing ContentInput progress system
