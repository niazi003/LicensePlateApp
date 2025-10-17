import RNFS from 'react-native-fs';
import DocumentPicker from '@react-native-documents/picker';
import { executeSql } from '../database/db';
import { findPlateByLocationAndName, updatePlateImage, getImageStats } from '../database/helpers';

// Types for image import
export interface ImageFile {
  path: string;
  name: string;
  country: string;
  state: string;
  plateId: number;
  patternId: number;
  size: number;
  uri: string;
}

export interface ImportProgress {
  current: number;
  total: number;
  currentFile: string;
  status: 'scanning' | 'processing' | 'updating' | 'completed' | 'error';
  message: string;
}

export interface ImportResult {
  success: boolean;
  processed: number;
  updated: number;
  errors: string[];
  message: string;
}

// Supported image extensions
const SUPPORTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'];

/**
 * Select a folder for image import
 */
export const selectImageFolder = async (): Promise<string | null> => {
  try {
    // Use DocumentPicker to select a directory
    const result = await DocumentPicker.pickDirectory();
    console.log('DocumentPicker result:', result);
    
    // The result should be an array with the selected directory
    if (result && Array.isArray(result) && result.length > 0) {
      const selectedDir = result[0];
      console.log('Selected directory:', selectedDir);
      return selectedDir.uri || selectedDir.fileCopyUri || selectedDir.fileUri;
    } else if (result && result.uri) {
      // Handle single result object
      return result.uri;
    } else {
      console.warn('No valid directory selected:', result);
      return null;
    }
  } catch (error) {
    console.error('Error selecting folder:', error);
    // If DocumentPicker fails, provide a fallback
    console.log('DocumentPicker failed, using fallback directory');
    return RNFS.ExternalDirectoryPath;
  }
};

/**
 * Scan folder structure and extract image files
 * Expected structure: Country/State/PlateID/PatternID/image.png
 * Example: US/California/US-California-1/US-California-1-1/0.jpg
 */
export const scanFolderStructure = async (
  folderPath: string,
  onProgress?: (progress: ImportProgress) => void
): Promise<ImageFile[]> => {
  const images: ImageFile[] = [];
  
  try {
    onProgress?.({
      current: 0,
      total: 0,
      currentFile: 'Scanning folder structure...',
      status: 'scanning',
      message: 'Analyzing folder structure'
    });

    // Get all files recursively
    const allFiles = await getAllFilesRecursive(folderPath);
    const imageFiles = allFiles.filter(file => 
      SUPPORTED_EXTENSIONS.some(ext => file.toLowerCase().endsWith(ext))
    );

    onProgress?.({
      current: 0,
      total: imageFiles.length,
      currentFile: 'Processing images...',
      status: 'processing',
      message: `Found ${imageFiles.length} image files`
    });

    // Process each image file
    for (let i = 0; i < imageFiles.length; i++) {
      const filePath = imageFiles[i];
      const fileName = filePath.split('/').pop() || '';
      
      onProgress?.({
        current: i + 1,
        total: imageFiles.length,
        currentFile: fileName,
        status: 'processing',
        message: `Processing ${fileName}`
      });

      try {
        const imageInfo = await parseImagePath(folderPath, filePath);
        if (imageInfo) {
          const stats = await RNFS.stat(filePath);
          images.push({
            ...imageInfo,
            size: stats.size,
            uri: filePath
          });
        }
      } catch (error) {
        console.warn(`Error processing ${filePath}:`, error);
      }
    }

    return images;
  } catch (error) {
    console.error('Error scanning folder structure:', error);
    throw error;
  }
};

/**
 * Get all files recursively from a directory
 */
const getAllFilesRecursive = async (dirPath: string): Promise<string[]> => {
  const files: string[] = [];
  
  try {
    const items = await RNFS.readDir(dirPath);
    
    for (const item of items) {
      if (item.isDirectory()) {
        const subFiles = await getAllFilesRecursive(item.path);
        files.push(...subFiles);
      } else {
        files.push(item.path);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }
  
  return files;
};

/**
 * Parse image path to extract country, state, plate ID, and pattern ID information
 * Expected: /path/to/Country/State/PlateID/PatternID/image.png
 * Example: /path/to/US/California/US-California-1/US-California-1-1/0.jpg
 */
const parseImagePath = async (rootPath: string, filePath: string): Promise<Omit<ImageFile, 'size' | 'uri'> | null> => {
  try {
    // Remove root path and split by directory separators
    const relativePath = filePath.replace(rootPath, '').replace(/^[\/\\]/, '');
    const pathParts = relativePath.split(/[\/\\]/).filter(part => part.length > 0);
    
    // Need at least: Country/State/PlateID/PatternID/image.png
    if (pathParts.length < 5) {
      console.warn(`Invalid path structure: ${relativePath}. Expected: Country/State/PlateID/PatternID/image.png`);
      return null;
    }
    
    const country = pathParts[0];
    const state = pathParts[1];
    const plateIdStr = pathParts[2];
    const patternIdStr = pathParts[3];
    const fileName = pathParts[pathParts.length - 1];
    
    // Extract numeric IDs from the folder names
    // Plate ID: Extract number from "US-California-1" -> 1
    const plateIdMatch = plateIdStr.match(/(\d+)$/);
    if (!plateIdMatch) {
      console.warn(`Could not extract plate ID from: ${plateIdStr}`);
      return null;
    }
    const plateId = parseInt(plateIdMatch[1], 10);
    
    // Pattern ID: Extract number from "US-California-1-1" -> 1
    const patternIdMatch = patternIdStr.match(/(\d+)$/);
    if (!patternIdMatch) {
      console.warn(`Could not extract pattern ID from: ${patternIdStr}`);
      return null;
    }
    const patternId = parseInt(patternIdMatch[1], 10);
    
    return {
      path: filePath,
      name: fileName,
      country,
      state,
      plateId,
      patternId
    };
  } catch (error) {
    console.error(`Error parsing path ${filePath}:`, error);
    return null;
  }
};

/**
 * Copy image to app storage and return new URI
 */
export const copyImageToAppStorage = async (sourcePath: string, fileName: string): Promise<string> => {
  try {
    // Create app images directory if it doesn't exist
    const appImagesDir = `${RNFS.DocumentDirectoryPath}/images`;
    const dirExists = await RNFS.exists(appImagesDir);
    if (!dirExists) {
      await RNFS.mkdir(appImagesDir);
    }
    
    // Generate unique filename to avoid conflicts
    const timestamp = Date.now();
    const extension = fileName.split('.').pop() || 'png';
    const newFileName = `${timestamp}_${fileName}`;
    const destinationPath = `${appImagesDir}/${newFileName}`;
    
    // Copy file
    await RNFS.copyFile(sourcePath, destinationPath);
    
    return `file://${destinationPath}`;
  } catch (error) {
    console.error(`Error copying image ${sourcePath}:`, error);
    throw error;
  }
};

/**
 * Update plate image_uri in database (using helper function)
 */
export const updatePlateImageUri = async (plateId: number, imageUri: string): Promise<void> => {
  try {
    await updatePlateImage(plateId, imageUri);
  } catch (error) {
    console.error(`Error updating plate ${plateId} image:`, error);
    throw error;
  }
};

/**
 * Update pattern image_uri in database (if patterns have images in the future)
 */
export const updatePatternImage = async (patternId: number, imageUri: string): Promise<void> => {
  try {
    // For now, patterns don't have image_uri field, but this is ready for future use
    await executeSql(
      'UPDATE SerialPattern SET image_uri = ? WHERE pattern_id = ?',
      [imageUri, patternId]
    );
  } catch (error) {
    console.error(`Error updating pattern ${patternId} image:`, error);
    throw error;
  }
};

/**
 * Find matching plate by country, state, and name (using helper function)
 */
export const findMatchingPlate = async (country: string, state: string, plateName: string): Promise<number | null> => {
  try {
    const plate = await findPlateByLocationAndName(country, state, plateName);
    return plate?.plate_id || null;
  } catch (error) {
    console.error(`Error finding matching plate:`, error);
    return null;
  }
};

/**
 * Verify that a plate exists with the given ID
 */
export const verifyPlateExists = async (plateId: number): Promise<boolean> => {
  try {
    const result = await executeSql(
      'SELECT plate_id FROM LicensePlate WHERE plate_id = ?',
      [plateId]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error(`Error verifying plate ${plateId}:`, error);
    return false;
  }
};

/**
 * Find matching pattern by plate_id and pattern name
 */
export const findMatchingPattern = async (plateId: number, patternName: string): Promise<number | null> => {
  try {
    const result = await executeSql(
      'SELECT pattern_id FROM SerialPattern WHERE plate_id = ? AND LOWER(pattern) = LOWER(?)',
      [plateId, patternName]
    );
    
    if (result.rows.length > 0) {
      return result.rows.item(0).pattern_id;
    }
    
    return null;
  } catch (error) {
    console.error(`Error finding matching pattern:`, error);
    return null;
  }
};

/**
 * Main import function that processes all images
 */
export const importImages = async (
  images: ImageFile[],
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportResult> => {
  const result: ImportResult = {
    success: true,
    processed: 0,
    updated: 0,
    errors: [],
    message: ''
  };

  try {
    onProgress?.({
      current: 0,
      total: images.length,
      currentFile: 'Starting import...',
      status: 'updating',
      message: 'Processing images and updating database'
    });

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      onProgress?.({
        current: i + 1,
        total: images.length,
        currentFile: image.name,
        status: 'updating',
        message: `Processing ${image.name}`
      });

      try {
        // Verify plate exists with the given ID
        const plateExists = await verifyPlateExists(image.plateId);
        
        if (!plateExists) {
          result.errors.push(`Plate with ID ${image.plateId} not found in database`);
          continue;
        }

        // Copy image to app storage
        const newImageUri = await copyImageToAppStorage(image.uri, image.name);
        
        // Update plate image_uri
        await updatePlateImageUri(image.plateId, newImageUri);
        
        result.processed++;
        result.updated++;
        
      } catch (error) {
        const errorMsg = `Error processing ${image.name}: ${error}`;
        result.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    result.message = `Successfully processed ${result.processed} images. ${result.errors.length} errors occurred.`;
    
    onProgress?.({
      current: images.length,
      total: images.length,
      currentFile: 'Completed',
      status: 'completed',
      message: result.message
    });

  } catch (error) {
    result.success = false;
    result.message = `Import failed: ${error}`;
    
    onProgress?.({
      current: 0,
      total: images.length,
      currentFile: 'Error',
      status: 'error',
      message: result.message
    });
  }

  return result;
};

/**
 * Get import statistics (using helper function)
 */
export const getImportStats = async (): Promise<{ totalPlates: number; platesWithImages: number }> => {
  try {
    const stats = await getImageStats();
    return {
      totalPlates: stats.total,
      platesWithImages: stats.withImages
    };
  } catch (error) {
    console.error('Error getting import stats:', error);
    return { totalPlates: 0, platesWithImages: 0 };
  }
};
