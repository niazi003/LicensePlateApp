import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { launchCamera, launchImageLibrary, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { Dropdown } from 'react-native-element-dropdown';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../redux/store';
import { updateSightingThunk, reverseGeocodeLocation } from '../../redux/sightings/sightingsSlice';
import * as db from '../../database/helpers';

type RouteProp = {
  params: {
    sightingId: number;
  };
  key: string;
  name: string;
};

const UpdateSightings = () => {
  const route = useRoute<RouteProp>();
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { sightingId } = route.params;

  // Get sighting from Redux state
  const sighting = useSelector((state: RootState) => state.sightings.byId[sightingId]);
  const plate = useSelector((state: RootState) => 
    sighting?.plate_id ? state.plates.byId[sighting.plate_id] : undefined
  );

  // Form state
  const [location, setLocation] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUri, setImageUri] = useState<string | null>('');
  const [trip, setTrip] = useState('');
  const [allTrips, setAllTrips] = useState<string[]>([]);
  const [tripItems, setTripItems] = useState<any[]>([]);
  const [showAddTrip, setShowAddTrip] = useState<boolean>(false);
  const [newTripName, setNewTripName] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showImagePicker, setShowImagePicker] = useState<boolean>(false);
  
  // Geocoding state
  const [latitude, setLatitude] = useState<number | null>(sighting?.latitude || null);
  const [longitude, setLongitude] = useState<number | null>(sighting?.longitude || null);
  const [city, setCity] = useState<string>(sighting?.city || '');
  const [state, setState] = useState<string>(sighting?.state || '');
  const [country, setCountry] = useState<string>(sighting?.country || '');
  const [fullAddress, setFullAddress] = useState<string>(sighting?.full_address || '');
  const [geocodingInProgress, setGeocodingInProgress] = useState<boolean>(false);
  const [geocodingError, setGeocodingError] = useState<string>('');

  // Load trip names
  useEffect(() => {
    (async () => {
      try {
        const list = await db.getTripNames().catch(async () => await db.getAllTripNames());
        setAllTrips(list);
        const tripItemsWithAdd = [
          ...list.map(trip => ({ label: trip, value: trip })),
          { label: '+ Add New Trip', value: 'ADD_NEW' }
        ];
        setTripItems(tripItemsWithAdd);
      } catch (error) {
        console.error('Error loading trip names:', error);
      }
    })();
  }, []);

  // Initialize form with sighting data
  useEffect(() => {
    if (sighting) {
      setLocation(sighting.location || '');
      setTime(sighting.time || '');
      setNotes(sighting.notes || '');
      setImageUri(sighting.image_uri || '');
      setTrip(sighting.trip || '');
      setLatitude(sighting.latitude || null);
      setLongitude(sighting.longitude || null);
      setCity(sighting.city || '');
      setState(sighting.state || '');
      setCountry(sighting.country || '');
      setFullAddress(sighting.full_address || '');
    }
  }, [sighting]);


  const canSave = useMemo(() => {
    return !!sighting?.plate_id;
  }, [sighting?.plate_id]);

  const performReverseGeocoding = useCallback(async () => {
    if (!latitude || !longitude) {
      setGeocodingError('No GPS coordinates available for geocoding');
      return;
    }

    console.log('Starting reverse geocoding with coordinates:', { latitude, longitude });
    setGeocodingInProgress(true);
    setGeocodingError('');

    try {
      const result = await dispatch(reverseGeocodeLocation({ latitude, longitude })).unwrap();
      console.log('Reverse geocoding result:', result);
      
      setCity(result.city || '');
      setState(result.state || '');
      setCountry(result.country || '');
      setFullAddress(result.fullAddress || '');
      
      // Also update the location field with a formatted string
      const locationString = `${result.city}, ${result.state}, ${result.country}`;
      console.log('Setting location string:', locationString);
      setLocation(locationString);
      
    } catch (error: any) {
      console.error('Reverse geocoding failed:', error);
      
      // Check if it's a network error
      if (error.message?.includes('NETWORK_ERROR')) {
        Alert.alert(
          'No Internet Connection',
          'Unable to get address from GPS coordinates. Please check your internet connection and try again.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Try Again', onPress: () => performReverseGeocoding() }
          ]
        );
        setGeocodingError('');
      } else {
        setGeocodingError(error.message || 'Failed to get address from coordinates');
      }
    } finally {
      setGeocodingInProgress(false);
    }
  }, [latitude, longitude, dispatch]);


  const handleAddTrip = async () => {
    if (!newTripName.trim()) return;
    
    try {
      // Add the new trip to the database
      await db.addTripName(newTripName.trim());
      
      // Update local state
      const updatedTrips = [...allTrips, newTripName.trim()];
      setAllTrips(updatedTrips);
      const tripItemsWithAdd = [
        ...updatedTrips.map(trip => ({ label: trip, value: trip })),
        { label: '+ Add New Trip', value: 'ADD_NEW' }
      ];
      setTripItems(tripItemsWithAdd);
      
      // Set the new trip as selected
      setTrip(newTripName.trim());
      
      // Reset add trip state
      setShowAddTrip(false);
      setNewTripName('');
    } catch (error) {
      console.error('Error adding trip:', error);
      setErrorMsg('Failed to add new trip');
    }
  };

  const handleImagePicker = () => {
    setShowImagePicker(true);
  };

  const handleCameraCapture = () => {
    setShowImagePicker(false);
    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.8 as const,
      includeBase64: false,
    };
    
    launchCamera(options, (response: ImagePickerResponse) => {
      if (response.assets && response.assets[0]) {
        setImageUri(response.assets[0].uri || null);
      }
    });
  };

  const handleGallerySelect = () => {
    setShowImagePicker(false);
    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.8 as const,
      includeBase64: false,
    };
    
    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.assets && response.assets[0]) {
        setImageUri(response.assets[0].uri || null);
      }
    });
  };

  const removeImage = () => {
    setImageUri(null);
  };

  const handleUpdate = async () => {
    if (!canSave || saving) {
      if (!sighting?.plate_id) {
        setErrorMsg('Sighting data is not available.');
      }
      return;
    }

    setErrorMsg('');
    setSaving(true);

    try {
      await dispatch(
        updateSightingThunk({
          sighting_id: sightingId,
          plate_id: sighting.plate_id,
          location,
          time,
          notes,
          image_uri: imageUri || undefined,
          trip: trip || null,
          latitude: latitude,
          longitude: longitude,
          city: city || null,
          state: state || null,
          country: country || null,
          full_address: fullAddress || null,
        })
      ).unwrap();

      navigation.goBack();
    } catch (e: any) {
      setErrorMsg(e?.message || 'Failed to update sighting.');
    } finally {
      setSaving(false);
    }
  };

  if (!sighting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading sighting...</Text>
      </View>
    );
  }

  return (
    <>
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Update Sighting</Text>

      {/* Plate information (read-only) */}
      <View style={styles.section}>
        <Text style={styles.label}>Plate</Text>
        <Text style={styles.plateInfo}>
          {plate?.name} ({plate?.state}, {plate?.country})
        </Text>
      </View>

      {/* Location */}
      <View style={styles.section}>
        <Text style={styles.label}>Location *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter location"
          placeholderTextColor="#999"
          value={location}
          onChangeText={setLocation}
        />
        
        {/* GPS Coordinates Display */}
        {(latitude && longitude) && (
          <View style={styles.gpsInfo}>
            <Text style={styles.gpsInfoText}>
              📍 GPS: {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </Text>
          </View>
        )}
        
        {/* Reverse Geocoding Button */}
        <TouchableOpacity
          style={[styles.geocodingButton, geocodingInProgress && styles.geocodingButtonDisabled]}
          onPress={performReverseGeocoding}
          disabled={geocodingInProgress}
        >
          {geocodingInProgress ? (
            <>
              <ActivityIndicator size="small" color="#fff" style={styles.geocodingLoading} />
              <Text style={styles.geocodingButtonText}>Getting Address...</Text>
            </>
          ) : (
            <Text style={styles.geocodingButtonText}>📍 Get Address from GPS</Text>
          )}
        </TouchableOpacity>
        
        {/* Geocoding Results */}
        {(city || state || country || fullAddress) && (
          <View style={styles.geocodingResults}>
            <Text style={styles.geocodingResultsTitle}>📍 Address Details:</Text>
            {city && <Text style={styles.geocodingResultText}>City: {city}</Text>}
            {state && <Text style={styles.geocodingResultText}>State: {state}</Text>}
            {country && <Text style={styles.geocodingResultText}>Country: {country}</Text>}
            {fullAddress && <Text style={styles.geocodingFullAddress}>Full Address: {fullAddress}</Text>}
          </View>
        )}
        
        {/* Geocoding Error */}
        {geocodingError && (
          <View style={styles.geocodingError}>
            <Text style={styles.geocodingErrorText}>❌ {geocodingError}</Text>
          </View>
        )}
      </View>

      {/* Time */}
      <View style={styles.section}>
        <Text style={styles.label}>Time</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD HH:MM"
          placeholderTextColor="#999"
          value={time}
          onChangeText={setTime}
        />
      </View>

      {/* Trip */}
      <View style={styles.section}>
        <Text style={styles.label}>Trip</Text>
        <Dropdown
          data={tripItems}
          value={trip}
          onChange={(item) => {
            if (item.value === 'ADD_NEW') {
              setShowAddTrip(true);
            } else {
              setTrip(item.value);
            }
          }}
          labelField="label"
          valueField="value"
          placeholder="Select a trip"
          search
          searchPlaceholder="Search trips..."
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          inputSearchStyle={styles.inputSearchStyle}
          iconStyle={styles.iconStyle}
          containerStyle={styles.dropdownContainer}
          itemContainerStyle={styles.listItemContainer}
          itemTextStyle={styles.listItemText}
          renderRightIcon={() => (
            <Text style={styles.dropdownIcon}>▼</Text>
          )}
          renderItem={(item) => (
            <View style={styles.listItemContainer}>
              <Text style={[
                styles.listItemText,
                item.value === 'ADD_NEW' && styles.addTripText
              ]}>
                {item.label}
              </Text>
            </View>
          )}
        />
        
        {/* Add Trip Input */}
        {showAddTrip && (
          <View style={styles.addTripContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter new trip name"
              placeholderTextColor="gray"
              value={newTripName}
              onChangeText={setNewTripName}
              autoFocus
            />
            <View style={styles.addTripButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setShowAddTrip(false);
                  setNewTripName('');
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.addButton]}
                onPress={handleAddTrip}
                disabled={!newTripName.trim()}
              >
                <Text style={styles.buttonText}>Add Trip</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Image */}
      <View style={styles.section}>
        <Text style={styles.label}>Image</Text>
        {imageUri ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
              <Text style={styles.removeImageText}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.imagePickerButton} onPress={handleImagePicker}>
            <Text style={styles.imagePickerText}>📷 Add Image</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Enter notes"
          placeholderTextColor="#999"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Image Picker Modal */}
      <Modal
        visible={showImagePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImagePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Image Source</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={handleCameraCapture}>
                <Text style={styles.modalButtonIcon}>📷</Text>
                <Text style={styles.modalButtonText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={handleGallerySelect}>
                <Text style={styles.modalButtonIcon}>🖼️</Text>
                <Text style={styles.modalButtonText}>Gallery</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowImagePicker(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Error message */}
      {errorMsg ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

      {/* Save button */}
      <TouchableOpacity
        style={[styles.saveButton, (!canSave || saving) && styles.disabledButton]}
        onPress={handleUpdate}
        disabled={!canSave || saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Update Sighting</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  plateInfo: {
    fontSize: 16,
    color: '#666',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  tripList: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 150,
  },
  tripItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tripText: {
    fontSize: 16,
    color: '#333',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#f44336',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#f44336',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 50,
  },
  placeholderStyle: {
    fontSize: 16,
    color: '#999',
  },
  selectedTextStyle: {
    fontSize: 16,
    color: '#333',
  },
  inputSearchStyle: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    height: 50,
    marginHorizontal: 8,
    marginVertical: 8,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#666',
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  listItemContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listItemText: {
    fontSize: 16,
    color: '#333',
  },
  addTripText: {
    color: '#007bff',
    fontWeight: '600',
  },
  addTripContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  addTripButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  addButton: {
    backgroundColor: '#28a745',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imagePickerButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  imagePickerText: {
    fontSize: 16,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  modalButton: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    minWidth: 80,
  },
  modalButtonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  modalCancelButton: {
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  gpsInfo: {
    backgroundColor: '#e8f4fd',
    borderWidth: 1,
    borderColor: '#bee5eb',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  gpsInfoText: {
    fontSize: 12,
    color: '#0c5460',
    textAlign: 'center',
  },
  geocodingButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  geocodingButtonDisabled: {
    backgroundColor: '#6c757d',
    opacity: 0.7,
  },
  geocodingButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  geocodingLoading: {
    marginRight: 8,
  },
  geocodingResults: {
    backgroundColor: '#e8f5e8',
    borderWidth: 1,
    borderColor: '#28a745',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  geocodingResultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#155724',
    marginBottom: 8,
  },
  geocodingResultText: {
    fontSize: 14,
    color: '#155724',
    marginBottom: 4,
  },
  geocodingFullAddress: {
    fontSize: 13,
    color: '#155724',
    fontStyle: 'italic',
    marginTop: 4,
  },
  geocodingError: {
    backgroundColor: '#f8d7da',
    borderWidth: 1,
    borderColor: '#dc3545',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  geocodingErrorText: {
    fontSize: 14,
    color: '#721c24',
    fontWeight: '500',
  },
});

export default UpdateSightings;
