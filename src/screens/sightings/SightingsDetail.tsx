import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../redux/store';
import { deleteSightingThunk, fetchSightingById } from '../../redux/sightings/sightingsSlice';

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

  // Fetch sighting data if not in store
  useEffect(() => {
    if (!sighting) {
      dispatch(fetchSightingById(sightingId));
    }
  }, [sighting, sightingId, dispatch]);

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

      {/* Image Section - Prioritized */}
      {sighting.image_uri && (
        <View style={styles.imageSection}>
          <Image
            source={{ uri: sighting.image_uri }}
            style={styles.sightingImage}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Main Info Card */}
      <View style={styles.mainInfoCard}>
        <View style={styles.infoHeader}>
          <View style={styles.infoIcon}>
            <Text style={styles.infoIconText}>📍</Text>
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.locationTitle}>{sighting.location || 'Unknown location'}</Text>
            <Text style={styles.timeText}>{sighting.time || 'No time specified'}</Text>
          </View>
        </View>
        
        <View style={styles.plateInfo}>
          <View style={styles.plateIcon}>
            <Text style={styles.plateIconText}>🏷️</Text>
          </View>
          <View style={styles.plateContent}>
            <Text style={styles.plateName}>{plate?.name || 'Unknown plate'}</Text>
            <Text style={styles.plateDetails}>{plate?.state}, {plate?.country}</Text>
          </View>
        </View>
      </View>

      {/* Additional Details */}
      <View style={styles.detailsSection}>
        <Text style={styles.detailsTitle}>Additional Details</Text>
        
        {sighting.trip && (
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>🗺️</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Trip</Text>
              <Text style={styles.detailValue}>{sighting.trip}</Text>
            </View>
          </View>
        )}
        
        {plate?.external_id && (
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>🆔</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>External ID</Text>
              <Text style={styles.detailValue}>{plate.external_id}</Text>
            </View>
          </View>
        )}
        
        {sighting.notes && (
          <View style={styles.notesSection}>
            <View style={styles.notesHeader}>
              <Text style={styles.notesIcon}>📝</Text>
              <Text style={styles.notesTitle}>Notes</Text>
            </View>
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
    paddingTop: 32,
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
  imageSection: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  sightingImage: {
    width: '100%',
    height: 220,
  },
  mainInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoIconText: {
    fontSize: 20,
  },
  infoContent: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  plateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plateIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3e5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  plateIconText: {
    fontSize: 20,
  },
  plateContent: {
    flex: 1,
  },
  plateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  plateDetails: {
    fontSize: 14,
    color: '#666',
  },
  detailsSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  detailIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  notesSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notesIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  notesText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 40,
    gap: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default SightingsDetail;