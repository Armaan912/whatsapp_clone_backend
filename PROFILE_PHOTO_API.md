# Profile Photo API Documentation

## Overview
This API provides endpoints for managing user profile photos in the WhatsApp Web Clone backend.

## Endpoints

### 1. Upload Profile Photo
**POST** `/api/users/profile-photo`

**Authentication:** Required (Bearer token)

**Request:**
- Content-Type: `multipart/form-data`
- Body: Form data with `profilePhoto` field containing the image file

**File Requirements:**
- File type: Image files only (JPEG, PNG, GIF, etc.)
- Maximum size: 5MB
- Field name: `profilePhoto`

**Response:**
```json
{
  "message": "Profile photo updated successfully",
  "user": {
    "id": "user_id",
    "username": "username",
    "mobile": "mobile",
    "profilePic": "/uploads/profile-photos/profile-user_id-timestamp.jpg",
    "bio": "bio",
    "isOnline": true,
    "lastSeen": "2024-01-01T00:00:00.000Z"
  },
  "profilePic": "/uploads/profile-photos/profile-user_id-timestamp.jpg"
}
```

### 2. Delete Profile Photo
**DELETE** `/api/users/profile-photo`

**Authentication:** Required (Bearer token)

**Response:**
```json
{
  "message": "Profile photo deleted successfully",
  "user": {
    "id": "user_id",
    "username": "username",
    "mobile": "mobile",
    "profilePic": null,
    "bio": "bio",
    "isOnline": true,
    "lastSeen": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. Get Profile Photo
**GET** `/api/users/profile-photo/:filename`

**Authentication:** Not required (Public endpoint)

**Response:** The actual image file

**Example:** `/api/users/profile-photos/profile-user_id-timestamp.jpg`

### 4. Update Profile (including profilePic URL)
**PUT** `/api/users/profile`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "username": "new_username",
  "mobile": "new_mobile",
  "bio": "new_bio",
  "profilePic": "/uploads/profile-photos/filename.jpg"
}
```

## File Storage

- **Location:** `backend/uploads/profile-photos/`
- **Naming Convention:** `profile-{userId}-{timestamp}-{random}.{extension}`
- **Access:** Files are served statically at `/uploads/profile-photos/`

## Features

- **Automatic Cleanup:** Old profile photos are automatically deleted when a new one is uploaded
- **File Validation:** Only image files are accepted
- **Size Limiting:** 5MB maximum file size
- **Unique Naming:** Prevents filename conflicts
- **Static Serving:** Profile photos are accessible via direct URLs

## Error Handling

- **400 Bad Request:** Invalid file type, missing file, file too large
- **401 Unauthorized:** Missing or invalid authentication token
- **404 Not Found:** User not found, profile photo not found
- **500 Internal Server Error:** Server-side errors

## Usage Examples

### Frontend (JavaScript)
```javascript
// Upload profile photo
const formData = new FormData();
formData.append('profilePhoto', fileInput.files[0]);

const response = await fetch('/api/users/profile-photo', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

// Delete profile photo
const response = await fetch('/api/users/profile-photo', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Display profile photo
const img = document.createElement('img');
img.src = user.profilePic || '/default-avatar.png';
```

### cURL Examples
```bash
# Upload profile photo
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "profilePhoto=@/path/to/photo.jpg" \
  http://localhost:5000/api/users/profile-photo

# Delete profile photo
curl -X DELETE \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/users/profile-photo
```

## Notes

- Profile photos are automatically managed - old files are cleaned up
- The system supports all common image formats
- Files are served with appropriate MIME types
- Profile photo URLs are stored in the user's profilePic field
- The existing profile update endpoint can also update profilePic URLs
