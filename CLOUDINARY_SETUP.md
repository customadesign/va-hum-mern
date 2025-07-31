# Cloudinary Setup for File Uploads

This application uses Cloudinary for storing profile pictures and videos in production to ensure persistence on platforms like Render.

## Setup Instructions

1. **Create a Cloudinary Account**
   - Go to [Cloudinary](https://cloudinary.com/)
   - Sign up for a free account

2. **Get Your Credentials**
   - After signing in, go to your Dashboard
   - You'll find your credentials:
     - Cloud Name
     - API Key
     - API Secret

3. **Add Environment Variables**
   Add these to your Render environment variables:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Install Dependencies**
   The required packages are already in package.json:
   - cloudinary
   - multer-storage-cloudinary

5. **How It Works**
   - In production (when NODE_ENV=production and Cloudinary credentials are set), uploads go to Cloudinary
   - In development, uploads are stored locally in the uploads folder
   - The URLs returned will automatically point to the correct location

## File Organization in Cloudinary

Files are organized in folders:
- `linkage-va-hub/avatars` - Profile pictures
- `linkage-va-hub/covers` - Cover images
- `linkage-va-hub/videos` - Video introductions

## Benefits

1. **Persistence**: Files remain available even after server restarts
2. **CDN**: Cloudinary provides a global CDN for fast loading
3. **Optimization**: Images are automatically optimized
4. **Transformations**: Can resize/crop images on the fly

## Testing

To test if Cloudinary is working:
1. Set your environment variables
2. Upload a profile picture
3. Check if the URL starts with `https://res.cloudinary.com/`
4. Verify the image persists after server restart