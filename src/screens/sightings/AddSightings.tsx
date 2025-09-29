import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { launchCamera, launchImageLibrary, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { Dropdown } from 'react-native-element-dropdown';
import * as db from '../../database/helpers';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../redux/store';
import { createSighting } from '../../redux/sightings/sightingsSlice';

type ParamList = { AddSighting: { plateId?: number } };

const AddSightings = () => {
  const route = useRoute<RouteProp<ParamList, 'AddSighting'>>();
  const navigation = useNavigation<any>();
  const prefillPlateId = route.params?.plateId;

  const dispatch = useDispatch<AppDispatch>();

  const [plateId, setPlateId] = useState<number | undefined>(prefillPlateId);
  const [allPlates, setAllPlates] = useState<db.Plate[]>([]);
  const [plateItems, setPlateItems] = useState<any[]>([]);
  const plate = useSelector((s: RootState) => (plateId ? s.plates.byId[plateId] : undefined));
  const [time, setTime] = useState<string>(new Date().toISOString());
  const [location, setLocation] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [trip, setTrip] = useState<string>('');
  const [allTrips, setAllTrips] = useState<string[]>([]);
  const [tripItems, setTripItems] = useState<any[]>([]);
  const [showAddTrip, setShowAddTrip] = useState<boolean>(false);
  const [newTripName, setNewTripName] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showImagePicker, setShowImagePicker] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      // Prefer TripName table; fallback to sightings-derived list
      const list = await db.getTripNames().catch(async () => await db.getAllTripNames());
      setAllTrips(list);
      const tripItemsWithAdd = [
        ...list.map(trip => ({ label: trip, value: trip })),
        { label: '+ Add New Trip', value: 'ADD_NEW' }
      ];
      setTripItems(tripItemsWithAdd);
    })();
  }, []);

  // Load all plates when no plateId is provided (coming from SightingsList)
  useEffect(() => {
    (async () => {
      if (!prefillPlateId) {
        try {
          const plates = await db.getAllPlates();
          setAllPlates(plates);
          setPlateItems(plates.map(plate => ({
            label: `${plate.name} (${plate.state}, ${plate.country})`,
            value: plate.plate_id,
            external_id: plate.external_id
          })));
        } catch (error) {
          console.error('Error loading plates:', error);
        }
      }
    })();
  }, [prefillPlateId]);



  const canSave = useMemo(() => {
    return !!plateId;
  }, [plateId]);

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
      quality: 1 as const,
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
      quality: 1 as const,
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

  const save = async () => {
    if (!canSave || saving) {
      if (!plateId) setErrorMsg('Please select a plate before saving.');
      return;
    }
    setErrorMsg('');
    setSaving(true);
    try {
      // 🔥 dispatch Redux thunk instead of calling DB directly
      await dispatch(
        createSighting({
          plate_id: plateId!,
          location,
          time,
          notes,
          image_uri: imageUri || undefined,
          trip: trip || null,
        })
      ).unwrap();

      navigation.goBack();
    } catch (e: any) {
      setErrorMsg(e?.message || 'Failed to add sighting.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add Sighting</Text>

      {/* Plate selection */}
      <Text style={styles.label}>Plate Selection</Text>
      {!prefillPlateId && (
        <Dropdown
          data={plateItems}
          value={plateId}
          onChange={(item) => setPlateId(item.value)}
          labelField="label"
          valueField="value"
          placeholder="Select a plate"
          search
          searchPlaceholder="Search plates..."
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
        />
      )}
      {prefillPlateId && plate && (
        <View style={styles.selectedPlate}>
          <Text style={styles.selectedPlateText}>
            {plate.name} ({plate.state}, {plate.country})
          </Text>
          <Text style={styles.selectedPlateId}>ID: {plate.external_id}</Text>
        </View>
      )}

      {/* Time & location */}
      <TextInput style={styles.input} placeholder="Time (ISO)" placeholderTextColor={"gray"} value={time} onChangeText={setTime} />
      <TextInput
        style={styles.input}
        placeholder="Location (city, state)"
        placeholderTextColor={"gray"}
        value={location}
        onChangeText={setLocation}
      />

      {/* Notes */}
      <TextInput
        style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
        multiline
        placeholder="Notes (required if no plate)"
        placeholderTextColor={"gray"}
        value={notes}
        onChangeText={setNotes}
      />

      {/* Image */}
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

      {/* Trip */}
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
              <Text style={styles.cancelButtonText}>Cancel</Text>
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
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {errorMsg ? <Text style={{ color: 'red', marginBottom: 8 }}>{errorMsg}</Text> : null}
      <TouchableOpacity
        style={[styles.button, { opacity: canSave && !saving ? 1 : 0.5 }]}
        disabled={!canSave || saving}
        onPress={save}
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Sighting</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  label: { fontSize: 16, fontWeight: '500', marginBottom: 8 },
  button: {
    backgroundColor: '#007bff',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 280,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  listItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  addBtn: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addBtnText: { color: '#007bff', fontWeight: '600' },
  selectedPlate: {
    backgroundColor: '#f0f8ff',
    borderWidth: 1,
    borderColor: '#007bff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  selectedPlateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  selectedPlateId: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  changePlateButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  changePlateText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchResults: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  searchResultId: {
    fontSize: 14,
    color: '#666',
  },
  noResultsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 12,
    fontStyle: 'italic',
  },
  dropdownButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  plateDropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 300,
  },
  plateDropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  plateDropdownName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  plateDropdownId: {
    fontSize: 14,
    color: '#666',
  },
  morePlatesText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 8,
    fontStyle: 'italic',
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
    paddingVertical: 8,
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
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
  },
  addButton: {
    flex: 1,
    backgroundColor: '#28a745',
  },
  cancelButtonText: {
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
    height: 300,
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
  modalCancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddSightings;
