# 📁 Image Import Guide

## Overview
The License Plate App now supports bulk importing of plate images from organized folder structures on your device. This allows you to maintain your image collection in a structured way and sync it with the app.

## 📂 Required Folder Structure

Your images must be organized in the following structure:

```
📱 Device Storage
└── LicensePlateImages/
    ├── 🇺🇸 US/
    │   ├── California/
    │   │   ├── US-California-1/
    │   │   │   ├── US-California-1-1/
    │   │   │   │   ├── 0.jpg
    │   │   │   │   └── 1.png
    │   │   │   └── US-California-1-2/
    │   │   │       └── 0.jpg
    │   │   └── US-California-2/
    │   │       └── US-California-2-1/
    │   │           └── 0.jpg
    │   └── New York/
    │       └── US-NewYork-1/
    │           └── US-NewYork-1-1/
    │               └── 0.jpg
    └── 🇨🇦 Canada/
        └── Ontario/
            └── Canada-Ontario-1/
                └── Canada-Ontario-1-1/
                    └── 0.jpg
```

### Structure Rules:
- **Country**: Top-level folder (e.g., "US", "Canada", "Mexico")
- **State**: Second-level folder (e.g., "California", "New York", "Ontario")
- **Plate ID**: Third-level folder using database ID format (e.g., "US-California-1", "US-NewYork-2")
- **Pattern ID**: Fourth-level folder using database ID format (e.g., "US-California-1-1", "US-California-1-2")
- **Image File**: The actual image file (e.g., "0.jpg", "1.png", "2.jpg")

### ID Format Examples:
- **Plate ID**: `{Country}-{State}-{PlateNumber}` (e.g., "US-California-1")
- **Pattern ID**: `{Country}-{State}-{PlateNumber}-{PatternNumber}` (e.g., "US-California-1-1")
- **Image Files**: Sequential numbering starting from 0 (e.g., "0.jpg", "1.png", "2.jpg")

## 🖼️ Supported Image Formats

- PNG (.png)
- JPEG (.jpg, .jpeg)
- GIF (.gif)
- BMP (.bmp)
- WebP (.webp)

## 🚀 How to Import Images

### Step 1: Organize Your Images
1. Create a folder called `LicensePlateImages` on your device
2. Organize your images according to the structure above
3. Ensure your plate names match exactly with the plates in your app

### Step 2: Import via App
1. Open the License Plate App
2. Go to the Plates home screen
3. Tap the **+** button (FAB)
4. Select **📁 Import Images**
5. Choose your `LicensePlateImages` folder
6. Tap **🔍 Scan Folder Structure**
7. Review the found images
8. Tap **📥 Import Images**

### Step 3: Monitor Progress
- The app will show real-time progress
- Images are copied to app storage
- Database is updated with image URIs
- Results are displayed when complete

## 🔄 Updating Images

To update existing images:
1. Modify your folder structure on device
2. Re-run the import process
3. The app will update existing plates with new images

## 📊 Import Statistics

The app tracks:
- **Total Plates**: Number of plates in your database
- **Plates with Images**: Number of plates that have images
- **Coverage**: Percentage of plates with images

## ⚠️ Important Notes


### Matching Requirements:
- **Country names** must match exactly (case-insensitive)
- **State names** must match exactly (case-insensitive)  
- **Plate IDs** must match the database plate_id (extracted from folder name)
- **Pattern IDs** must match the database pattern_id (extracted from folder name)
- **Image files** are numbered sequentially (0.jpg, 1.png, 2.jpg, etc.)

### Error Handling:
- Images that don't match existing plates will be skipped
- Errors are logged and displayed in the results
- The import process continues even if some images fail

### Storage:
- Images are copied to app storage (not linked)
- Original images remain in your folder
- App storage is managed automatically

## 🛠️ Troubleshooting

### "Plate with ID X not found" errors:
- Check that the plate ID in the folder name matches a plate in your database
- Verify the plate exists in your app database
- Ensure the ID format is correct (e.g., "US-California-1")

### "No images found" message:
- Ensure your folder structure follows the required format
- Check that image files have supported extensions
- Verify the folder contains image files

### Import fails:
- Check device storage space
- Ensure app has file system permissions
- Try importing smaller batches of images

## 📱 Technical Details

### File Processing:
- Images are copied to `{AppStorage}/images/` directory
- Unique filenames are generated to prevent conflicts
- Original file metadata is preserved

### Database Updates:
- `image_uri` field is updated in the `LicensePlate` table
- Updates are atomic (all or nothing per image)
- Existing images are overwritten when re-importing

### Performance:
- Large imports are processed in batches
- Progress is reported in real-time
- Memory usage is optimized for large image collections

## 🎯 Best Practices

1. **Organize First**: Set up your folder structure before importing
2. **Test Small**: Try with a few images first to verify the structure
3. **Backup**: Keep your original images in a safe location
4. **Regular Updates**: Re-import when you add new images
5. **Consistent Naming**: Use consistent naming conventions for folders

## 🔮 Future Features

- Pattern image support (when patterns have image_uri field)
- Image optimization and compression
- Batch image editing
- Cloud sync integration
- Automatic folder monitoring

---

**Need Help?** If you encounter issues, check the error messages in the import results and ensure your folder structure matches the requirements exactly.
