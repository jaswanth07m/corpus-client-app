# Content Upload Specifications

This document outlines the specifications for uploading content to the Corpus platform, including details on chunking, metadata, and validation rules.

## Chunked Uploads

Large files are uploaded in chunks to ensure reliability and allow for resumable uploads.

- **Chunk Size:** 5MB (5 _ 1024 _ 1024 bytes)
- **Max Retry Attempts per Chunk:** 5
- **Retry Delay:** Exponential backoff starting at 1 second.

### Chunk Upload Endpoint

- **URL:** `/records/upload/chunk`
- **Method:** `POST`
- **Headers:**
  - `Authorization: Bearer <token>`
- **Form Data:**
  - `chunk`: The binary data of the file chunk.
  - `filename`: Original name of the file.
  - `chunk_index`: The zero-based index of the current chunk.
  - `total_chunks`: Total number of chunks for the file.
  - `upload_uuid`: A unique identifier for the entire file upload session.

### Finalize Upload Endpoint

- **URL:** `/records/upload`
- **Method:** `POST`
- **Headers:**
  - `Authorization: Bearer <token>`
- **Form Data:**
  - `upload_uuid`: The unique identifier for the upload session.
  - `title`: The title of the content (mandatory, minimum 8 characters).
  - `description`: A detailed description of the content (mandatory, minimum 32 characters).
  - `category_id`: The ID of the category the content belongs to.
  - `user_id`: The ID of the user uploading the content.
  - `media_type`: Type of media (e.g., `text`, `audio`, `video`, `image`).
  - `latitude`: Latitude of the content's location.
  - `longitude`: Longitude of the content's location.
  - `use_uid_filename`: Boolean flag (currently `false`).
  - `total_chunks`: Total number of chunks.
  - `filename`: Original name of the file.

## Content Metadata and Validation

The following fields are required for all content uploads:

- **Title:**
  - **Mandatory:** Yes
  - **Minimum Length:** 8 characters
- **Description:**
  - **Mandatory:** Yes
  - **Minimum Length:** 32 characters
- **Category:**
  - **Mandatory:** Yes
  - Must be one of the predefined categories.
- **Location (Latitude, Longitude):**
  - **Mandatory:** Yes
  - Must be valid geographical coordinates.
- **Media File/Content:**
  - **Mandatory:** Yes (unless `media_type` is `text` and `textContent` is provided).
  - Supported formats vary by media type (e.g., `audio/webm`, `video/webm`, `image/jpeg`, `text/plain`).

## Error Handling

The API will return appropriate HTTP status codes and error messages for validation failures (e.g., missing mandatory fields, invalid data formats, length constraints not met).
