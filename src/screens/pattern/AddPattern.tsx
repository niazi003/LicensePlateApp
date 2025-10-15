import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRoute } from '@react-navigation/native';
import { AppDispatch, RootState } from '../../redux/store';
import { createPattern } from '../../redux/patterns/patternsSlice';
import { fetchPlates } from '../../redux/plates/platesSlice';
import { selectAllPlatesArray, selectPlatesLoading } from '../../redux/plates/platesSelectors';
import { Pattern, getNextSerialId, generateUniqueIdSafe } from '../../database/helpers';

interface Plate {
  plate_id?: number;
  external_id?: string;
  name?: string;
  state?: string;
}

type AddPatternRoute = {
  params?: {
    plateId?: number;
  };
};

const AddPattern = () => {
  const route = useRoute<AddPatternRoute>();
  const preselectedPlateId = route.params?.plateId;
  const dispatch = useDispatch<AppDispatch>();
  const plates = useSelector(selectAllPlatesArray);
  const platesLoading = useSelector(selectPlatesLoading);

  const [formData, setFormData] = useState({
    plate_id: preselectedPlateId || 0,
    external_id: '',
    serial_id: '',
    unique_id: '',
    pattern: '',
    separator: '',
    type: '',
    series_years: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPlateModal, setShowPlateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoGenerating, setAutoGenerating] = useState(false);

  useEffect(() => {
    // Fetch plates when component mounts
    if (plates.length === 0) {
      dispatch(fetchPlates());
    }
  }, [dispatch, plates.length]);

  // Auto-generate fields when plate is selected
  useEffect(() => {
    const autoGenerateFields = async () => {
      if (formData.plate_id && formData.plate_id > 0) {
        setAutoGenerating(true);
        try {
          const selectedPlate = plates.find(p => p.plate_id === formData.plate_id);
          if (!selectedPlate) return;

          const nextSerialId = await getNextSerialId(formData.plate_id);
          const uniqueId = await generateUniqueIdSafe(formData.plate_id, nextSerialId);
          
          setFormData(prev => ({
            ...prev,
            external_id: selectedPlate.external_id || '',
            serial_id: nextSerialId,
            unique_id: uniqueId,
          }));
        } catch (error) {
          console.error('Error auto-generating fields:', error);
        } finally {
          setAutoGenerating(false);
        }
      }
    };

    autoGenerateFields();
  }, [formData.plate_id, plates]);

  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.plate_id) {
      Alert.alert('Validation Error', 'Please select a license plate');
      return false;
    }
    if (!formData.pattern.trim()) {
      Alert.alert('Validation Error', 'Pattern is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const patternData: Pattern = {
        plate_id: formData.plate_id,
        external_id: formData.external_id.trim() || undefined,
        serial_id: formData.serial_id.trim() || undefined,
        unique_id: formData.unique_id.trim() || undefined,
        pattern: formData.pattern.trim(),
        separator: formData.separator.trim() || undefined,
        type: formData.type.trim() || undefined,
        series_years: formData.series_years.trim() || undefined,
      };

      await dispatch(createPattern(patternData)).unwrap();
      
      Alert.alert(
        'Success',
        'Pattern added successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setFormData({
                plate_id: 0,
                external_id: '',
                serial_id: '',
                unique_id: '',
                pattern: '',
                separator: '',
                type: '',
                series_years: '',
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error creating pattern:', error);
      Alert.alert(
        'Error',
        'Failed to add pattern. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedPlate = plates.find(plate => plate.plate_id === formData.plate_id);

  // Filter plates based on search query
  const filteredPlates = plates.filter(plate => 
    plate.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plate.state?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePlateSelect = (plate: any) => {
    handleInputChange('plate_id', plate.plate_id);
    setShowPlateModal(false);
    setSearchQuery('');
  };

  const PlateItem = ({ plate }: { plate: any }) => (
    <TouchableOpacity
      style={styles.plateItem}
      onPress={() => handlePlateSelect(plate)}
    >
      <Text style={styles.plateName}>{plate.name}</Text>
      <Text style={styles.plateState}>{plate.state}</Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerCard}>
        <Text style={styles.title}>Add New Pattern</Text>
        {selectedPlate && (
          <Text style={styles.subTitle}>
            for {selectedPlate.name} ({selectedPlate.state})
          </Text>
        )}
      </View>

      <View style={styles.card}>
        {/* Plate Selection */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>License Plate *</Text>
          {platesLoading ? (
            <ActivityIndicator size="small" color="#007bff" />
          ) : preselectedPlateId ? (
            <View style={[styles.input, styles.readOnlyInput]}>
              <Text style={styles.readOnlyText}>
                {selectedPlate 
                  ? `${selectedPlate.name} (${selectedPlate.state})` 
                  : 'Loading plate...'
                }
              </Text>
            </View>
          ) : (
            <View style={styles.dropdown}>
              <TouchableOpacity
                style={[
                  styles.dropdownButton,
                  !formData.plate_id && styles.dropdownButtonPlaceholder
                ]}
                onPress={() => setShowPlateModal(true)}
              >
                <Text style={[
                  styles.dropdownText,
                  !formData.plate_id && styles.dropdownTextPlaceholder
                ]}>
                  {selectedPlate 
                    ? `${selectedPlate.name} (${selectedPlate.state})` 
                    : 'Select a license plate'
                  }
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Auto-generated fields info */}
        {autoGenerating && (
          <View style={styles.infoContainer}>
            <ActivityIndicator size="small" color="#007bff" />
            <Text style={styles.infoText}>Auto-generating IDs...</Text>
          </View>
        )}

        {formData.plate_id > 0 && (
          <>
            {/* External ID - Auto-generated, read-only */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>External ID (Auto-generated)</Text>
              <View style={[styles.input, styles.readOnlyInput]}>
                <Text style={styles.readOnlyText}>{formData.external_id || 'Generating...'}</Text>
              </View>
            </View>

            {/* Serial ID - Auto-generated, read-only */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Serial ID (Auto-generated)</Text>
              <View style={[styles.input, styles.readOnlyInput]}>
                <Text style={styles.readOnlyText}>{formData.serial_id || 'Generating...'}</Text>
              </View>
            </View>

            {/* Unique ID - Auto-generated, read-only */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Unique ID (Auto-generated)</Text>
              <View style={[styles.input, styles.readOnlyInput]}>
                <Text style={styles.readOnlyText}>{formData.unique_id || 'Generating...'}</Text>
              </View>
            </View>
          </>
        )}

        {/* Number Pattern */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Pattern *</Text>
          <TextInput
            style={styles.input}
            value={formData.pattern}
            onChangeText={(text) => handleInputChange('pattern', text)}
            placeholder="e.g., #aaa###, ######a#"
            placeholderTextColor="#999"
          />
        </View>

        {/* Separator */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Separator</Text>
          <TextInput
            style={styles.input}
            value={formData.separator}
            onChangeText={(text) => handleInputChange('separator', text)}
            placeholder="e.g., -, (space), or leave empty"
            placeholderTextColor="#999"
          />
        </View>

        {/* Type */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Type</Text>
          <TextInput
            style={styles.input}
            value={formData.type}
            onChangeText={(text) => handleInputChange('type', text)}
            placeholder="e.g., Passenger, Truck, Trailer"
            placeholderTextColor="#999"
          />
        </View>

        {/* Series Years */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Years</Text>
          <TextInput
            style={styles.input}
            value={formData.series_years}
            onChangeText={(text) => handleInputChange('series_years', text)}
            placeholder="e.g., 2011-present, 1998-2000"
            placeholderTextColor="#999"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
          ) : (
            <Text style={styles.submitButtonText}>Add Pattern</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Plate Selection Modal */}
      <Modal
        visible={showPlateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select License Plate</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowPlateModal(false);
                setSearchQuery('');
              }}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search plates..."
              placeholderTextColor="#999"
            />
          </View>

          <FlatList
            data={filteredPlates}
            keyExtractor={(item) => item.plate_id?.toString() || ''}
            renderItem={({ item }) => <PlateItem plate={item} />}
            style={styles.platesList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 10,
    borderRadius: 10,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subTitle: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 10,
    borderRadius: 10,
    elevation: 2,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  dropdownButton: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownButtonPlaceholder: {
    backgroundColor: '#f9f9f9',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownTextPlaceholder: {
    color: '#999',
  },
  readOnlyInput: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ccc',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#666',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e7f3ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007bff',
  },
  submitButton: {
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#6c757d',
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    elevation: 2,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 10,
    marginHorizontal: 10,
    borderRadius: 10,
    elevation: 2,
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  platesList: {
    flex: 1,
    margin: 10,
  },
  plateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 1,
  },
  plateName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  plateState: {
    fontSize: 14,
    color: '#666',
  },
});

export default AddPattern;
