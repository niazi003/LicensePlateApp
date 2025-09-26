import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../redux/store';
import { deleteSightingThunk } from '../../redux/sightings/sightingsSlice';

type RouteProp = {
  params: {
    sightingId: number;
    plateId: number;
  };
};

const SightingsDetail = () => {
  const route = useRoute<RouteProp>();
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { sightingId, plateId } = route.params;

  // Get data from Redux state
  const sighting = useSelector((state: RootState) => state.sightings.byId[sightingId]);
  const plate = useSelector((state: RootState) => state.plates.byId[plateId]);

  const handleEdit = () => {
    navigation.navigate('UpdateSighting', { sightingId });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Sighting',
      'Are you sure you want to delete this sighting? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteSightingThunk(sightingId)).unwrap();
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete sighting');
            }
          },
        },
      ]
    );
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
      <Text style={styles.title}>Sighting Details</Text>

      {/* Plate Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Plate Information</Text>
        <Text style={styles.detail}>
          <Text style={styles.label}>Name:</Text> {plate?.name || 'Unknown'}
        </Text>
        <Text style={styles.detail}>
          <Text style={styles.label}>State:</Text> {plate?.state || 'Unknown'}
        </Text>
        <Text style={styles.detail}>
          <Text style={styles.label}>Country:</Text> {plate?.country || 'Unknown'}
        </Text>
        <Text style={styles.detail}>
          <Text style={styles.label}>External ID:</Text> {plate?.external_id || 'Unknown'}
        </Text>
      </View>

      {/* Sighting Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sighting Information</Text>
        <Text style={styles.detail}>
          <Text style={styles.label}>Location:</Text> {sighting.location || 'Not specified'}
        </Text>
        <Text style={styles.detail}>
          <Text style={styles.label}>Time:</Text> {sighting.time || 'Not specified'}
        </Text>
        <Text style={styles.detail}>
          <Text style={styles.label}>Trip:</Text> {sighting.trip || 'Not specified'}
        </Text>
        {sighting.image_uri && (
          <Text style={styles.detail}>
            <Text style={styles.label}>Image:</Text> {sighting.image_uri}
          </Text>
        )}
        {sighting.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.label}>Notes:</Text>
            <Text style={styles.notesText}>{sighting.notes}</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
          <Text style={styles.buttonText}>Edit Sighting</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.buttonText}>Delete Sighting</Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  detail: {
    fontSize: 16,
    marginBottom: 8,
    color: '#666',
  },
  label: {
    fontWeight: '600',
    color: '#333',
  },
  notesContainer: {
    marginTop: 8,
  },
  notesText: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 40,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SightingsDetail;