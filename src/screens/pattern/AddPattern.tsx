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
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { createPattern } from '../../redux/patterns/patternsSlice';
import { fetchPlates } from '../../redux/plates/platesSlice';
import { selectAllPlatesArray, selectPlatesLoading } from '../../redux/plates/platesSelectors';
import { Pattern } from '../../database/helpers';

interface Plate {
  plate_id?: number;
  name?: string;
  state?: string;
}

const AddPattern = () => {
  const dispatch = useDispatch<AppDispatch>();
  const plates = useSelector(selectAllPlatesArray);
  const platesLoading = useSelector(selectPlatesLoading);

  const [formData, setFormData] = useState({
    plate_id: 0,
    pattern: '',
    type: '',
    series_years: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPlateModal, setShowPlateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Fetch plates when component mounts
    if (plates.length === 0) {
      dispatch(fetchPlates());
    }
  }, [dispatch, plates.length]);

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
        pattern: formData.pattern.trim(),
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
                pattern: '',
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add New Pattern</Text>
      </View>

      <View style={styles.form}>
        {/* Plate Selection */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>License Plate *</Text>
          {platesLoading ? (
            <ActivityIndicator size="small" color="#007AFF" />
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

        {/* Number Pattern */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Number Pattern *</Text>
          <TextInput
            style={styles.input}
            value={formData.pattern}
            onChangeText={(text) => handleInputChange('pattern', text)}
            placeholder="e.g., ABC-1234, 123-4567"
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
            placeholder="e.g., Standard, Special, Custom"
            placeholderTextColor="#999"
          />
        </View>

        {/* Series Years */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Series Years</Text>
          <TextInput
            style={styles.input}
            value={formData.series_years}
            onChangeText={(text) => handleInputChange('series_years', text)}
            placeholder="e.g., 2020-2023, 1995-2000"
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
            <ActivityIndicator size="small" color="#fff" />
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  form: {
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 20,
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
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  searchContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  platesList: {
    flex: 1,
  },
  plateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
