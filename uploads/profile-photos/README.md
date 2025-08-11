# Profile Photos Directory

This directory stores user profile photos uploaded through the API.

## Structure
- Profile photos are automatically stored here when users upload them
- Files are named with the pattern: `profile-{userId}-{timestamp}-{random}.{extension}`
- Old photos are automatically cleaned up when new ones are uploaded

## Access
- Photos are served statically at `/uploads/profile-photos/`
- Example: `/uploads/profile-photos/profile-user123-1234567890-987654321.jpg`

## File Management
- The system automatically handles file cleanup
- Only image files are accepted (JPEG, PNG, GIF, etc.)
- Maximum file size: 5MB
- Files are validated for type and size before storage

## Security
- Only authenticated users can upload photos
- Files are validated to prevent malicious uploads
- Old files are automatically removed to save storage space
