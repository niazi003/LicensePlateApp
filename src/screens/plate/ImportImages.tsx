import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  selectImageFolder,
  scanFolderStructure,
  importImages,
  getImportStats,
  ImportProgress,
  ImportResult,
  ImageFile,
} from '../../services/imageImportService';

const ImportImages = () => {
  const navigation = useNavigation();
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [importing, setImporting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [stats, setStats] = useState({ totalPlates: 0, platesWithImages: 0 });
  const [showResults, setShowResults] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Load stats on component mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const currentStats = await getImportStats();
      setStats(currentStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSelectFolder = async () => {
    try {
      const folderPath = await selectImageFolder();
      if (folderPath) {
        setSelectedFolder(folderPath);
        setImages([]);
        setImportResult(null);
        setShowResults(false);
        console.log('Selected folder path:', folderPath);
      } else {
        Alert.alert(
          'No Folder Selected', 
          'Please select a folder containing your plate images organized in the required structure.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Error Selecting Folder', 
        'Failed to select folder. Please ensure you have the necessary permissions and try again.'
      );
      console.error('Error selecting folder:', error);
    }
  };

  const handleScanFolder = async () => {
    if (!selectedFolder) return;

    try {
      setScanning(true);
      setProgress(null);
      
      const scannedImages = await scanFolderStructure(selectedFolder, (progress) => {
        setProgress(progress);
      });
      
      setImages(scannedImages);
      setScanning(false);
      setProgress(null);
      
      if (scannedImages.length === 0) {
        Alert.alert(
          'No Images Found',
          'No supported image files found in the selected folder. Please ensure your folder structure follows: Country/State/PlateID/PatternID/image.png'
        );
      }
    } catch (error) {
      setScanning(false);
      setProgress(null);
      Alert.alert('Error', 'Failed to scan folder structure');
      console.error('Error scanning folder:', error);
    }
  };

  const handleImportImages = async () => {
    if (images.length === 0) return;

    try {
      setImporting(true);
      setProgress(null);
      
      const result = await importImages(images, (progress) => {
        setProgress(progress);
      });
      
      setImportResult(result);
      setShowResults(true);
      setImporting(false);
      setProgress(null);
      
      // Refresh stats
      await loadStats();
      
      // Clear images list
      setImages([]);
      setSelectedFolder(null);
      
    } catch (error) {
      setImporting(false);
      setProgress(null);
      Alert.alert('Error', 'Failed to import images');
      console.error('Error importing images:', error);
    }
  };

  const handleCloseResults = () => {
    setShowResults(false);
    setImportResult(null);
  };

  const getFolderName = (path: string) => {
    return path.split('/').pop() || 'Selected Folder';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Import Images</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.title}>Import Plate Images</Text>
      
      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>📁 Folder Structure Required</Text>
        <Text style={styles.instructionsText}>
          Your folder should be organized as:
        </Text>
        <Text style={styles.folderStructure}>
          📂 LicensePlateImages{'\n'}
          └── 📂 Country (e.g., US, Canada){'\n'}
          &nbsp;&nbsp;&nbsp;&nbsp;└── 📂 State (e.g., California, New York){'\n'}
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── 📂 Plate ID (e.g., US-California-1){'\n'}
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── 📂 Pattern ID (e.g., US-California-1-1){'\n'}
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── 🖼️ image.png
        </Text>
        <Text style={styles.instructionsNote}>
          Supported formats: PNG, JPG, JPEG, GIF, BMP, WEBP
        </Text>
      </View>

      {/* Current Stats */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>📊 Current Status</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statsLabel}>Total Plates:</Text>
          <Text style={styles.statsValue}>{stats.totalPlates}</Text>
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.statsLabel}>Plates with Images:</Text>
          <Text style={styles.statsValue}>{stats.platesWithImages}</Text>
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.statsLabel}>Coverage:</Text>
          <Text style={styles.statsValue}>
            {stats.totalPlates > 0 
              ? `${Math.round((stats.platesWithImages / stats.totalPlates) * 100)}%`
              : '0%'
            }
          </Text>
        </View>
      </View>

      {/* Folder Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Select Folder</Text>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleSelectFolder}
          disabled={scanning || importing}
        >
          <Text style={styles.buttonText}>
            {selectedFolder ? `📁 ${getFolderName(selectedFolder)}` : '📁 Select Image Folder'}
          </Text>
        </TouchableOpacity>
        
        {selectedFolder && (
          <Text style={styles.folderPathText}>
            Path: {selectedFolder}
          </Text>
        )}
        
        {selectedFolder && (
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleScanFolder}
            disabled={scanning || importing}
          >
            <Text style={styles.secondaryButtonText}>
              {scanning ? '🔍 Scanning...' : '🔍 Scan Folder Structure'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Progress */}
      {progress && (
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>
            {progress.status === 'scanning' && '🔍 Scanning Folder'}
            {progress.status === 'processing' && '⚙️ Processing Images'}
            {progress.status === 'updating' && '💾 Updating Database'}
            {progress.status === 'completed' && '✅ Completed'}
            {progress.status === 'error' && '❌ Error'}
          </Text>
          <Text style={styles.progressMessage}>{progress.message}</Text>
          <Text style={styles.progressFile}>{progress.currentFile}</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(progress.current / progress.total) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {progress.current} / {progress.total}
          </Text>
        </View>
      )}

      {/* Images Preview */}
      {images.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Preview Images ({images.length} found)</Text>
          <View style={styles.imagesPreview}>
            {images.slice(0, 10).map((image, index) => (
              <View key={index} style={styles.imageItem}>
                <Text style={styles.imagePath}>
                  {image.country} / {image.state} / Plate ID: {image.plateId} / Pattern ID: {image.patternId}
                </Text>
                <Text style={styles.imageName}>{image.name}</Text>
                <Text style={styles.imageSize}>{formatFileSize(image.size)}</Text>
              </View>
            ))}
            {images.length > 10 && (
              <Text style={styles.moreImages}>
                ... and {images.length - 10} more images
              </Text>
            )}
          </View>
          
          <TouchableOpacity
            style={[styles.button, styles.successButton]}
            onPress={handleImportImages}
            disabled={importing}
          >
            <Text style={styles.buttonText}>
              {importing ? '⏳ Importing...' : '📥 Import Images'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results Modal */}
      <Modal
        visible={showResults}
        transparent
        animationType="slide"
        onRequestClose={handleCloseResults}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.resultsModal}>
            <Text style={styles.resultsTitle}>
              {importResult?.success ? '✅ Import Completed' : '❌ Import Failed'}
            </Text>
            
            {importResult && (
              <>
                <View style={styles.resultsStats}>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Images Processed:</Text>
                    <Text style={styles.resultValue}>{importResult.processed}</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Database Updated:</Text>
                    <Text style={styles.resultValue}>{importResult.updated}</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Errors:</Text>
                    <Text style={styles.resultValue}>{importResult.errors.length}</Text>
                  </View>
                </View>
                
                <Text style={styles.resultsMessage}>{importResult.message}</Text>
                
                {importResult.errors.length > 0 && (
                  <View style={styles.errorsContainer}>
                    <Text style={styles.errorsTitle}>Errors:</Text>
                    <ScrollView style={styles.errorsList}>
                      {importResult.errors.map((error, index) => (
                        <Text key={index} style={styles.errorText}>• {error}</Text>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </>
            )}
            
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleCloseResults}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSpacer: {
    width: 60, // Same width as back button to center title
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  instructionsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  folderStructure: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  instructionsNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  statsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statsLabel: {
    fontSize: 14,
    color: '#666',
  },
  statsValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#007bff',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#007bff',
  },
  successButton: {
    backgroundColor: '#28a745',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  folderPathText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontFamily: 'monospace',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 4,
  },
  progressCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  progressMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  progressFile: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007bff',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  imagesPreview: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  imagePath: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '500',
  },
  imageName: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  imageSize: {
    fontSize: 12,
    color: '#999',
  },
  moreImages: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  resultsModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  resultsStats: {
    marginBottom: 16,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
  },
  resultValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  resultsMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorsContainer: {
    marginBottom: 16,
  },
  errorsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 8,
  },
  errorsList: {
    maxHeight: 150,
  },
  errorText: {
    fontSize: 12,
    color: '#dc3545',
    marginBottom: 4,
  },
});

export default ImportImages;
