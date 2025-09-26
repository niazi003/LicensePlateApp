import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../redux/store';
import { updateSightingThunk } from '../../redux/sightings/sightingsSlice';
import * as db from '../../database/helpers';

type RouteProp = {
  params: {
    sightingId: number;
  };
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
  const [imageUri, setImageUri] = useState('');
  const [trip, setTrip] = useState('');
  const [tripQuery, setTripQuery] = useState('');
  const [allTrips, setAllTrips] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Load trip names
  useEffect(() => {
    (async () => {
      try {
        const list = await db.getTripNames().catch(async () => await db.getAllTripNames());
        setAllTrips(list);
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
    }
  }, [sighting]);

  // Filter trips based on query
  const filteredTrips = useMemo(() => {
    if (!tripQuery.trim()) return allTrips;
    return allTrips.filter(t => 
      t.toLowerCase().includes(tripQuery.toLowerCase())
    );
  }, [allTrips, tripQuery]);

  const canSave = useMemo(() => {
    return !!sighting?.plate_id;
  }, [sighting?.plate_id]);

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
        <TextInput
          style={styles.input}
          placeholder="Search or enter trip name"
          placeholderTextColor="#999"
          value={tripQuery}
          onChangeText={setTripQuery}
        />
        {tripQuery && filteredTrips.length > 0 && (
          <View style={styles.tripList}>
            {filteredTrips.slice(0, 5).map((tripName, index) => (
              <TouchableOpacity
                key={index}
                style={styles.tripItem}
                onPress={() => {
                  setTrip(tripName);
                  setTripQuery(tripName);
                }}
              >
                <Text style={styles.tripText}>{tripName}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Image URI */}
      <View style={styles.section}>
        <Text style={styles.label}>Image URI</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter image URI"
          placeholderTextColor="#999"
          value={imageUri}
          onChangeText={setImageUri}
        />
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
          <Text style={styles.saveButtonText}>Update Sighting</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
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
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default UpdateSightings;
