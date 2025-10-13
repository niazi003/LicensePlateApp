import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../redux/store';
import { deletePatternThunk, fetchPatternsByPlate } from '../../redux/patterns/patternsSlice';

type RouteProp = {
  params: {
    patternId: number;
  };
};

const PatternDetail = () => {
  const route = useRoute<RouteProp>();
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { patternId } = route.params;

  // Get pattern from Redux state
  const pattern = useSelector((state: RootState) => state.patterns.byId[patternId]);
  const plate = useSelector((state: RootState) => 
    pattern?.plate_id ? state.plates.byId[pattern.plate_id] : undefined
  );

  const handleDelete = async () => {
    if (!pattern || !pattern.plate_id) return;

    Alert.alert(
      'Delete Pattern',
      'Are you sure you want to delete this pattern? All patterns will be automatically renumbered.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(
                deletePatternThunk({ 
                  pattern_id: patternId, 
                  plate_id: pattern.plate_id 
                })
              ).unwrap();
              
              // Refresh patterns for this plate to show updated serial_ids
              await dispatch(fetchPatternsByPlate(pattern.plate_id)).unwrap();
              
              Alert.alert('Success', 'Pattern deleted and remaining patterns renumbered.');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete pattern');
            }
          },
        },
      ]
    );
  };

  if (!pattern) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading pattern...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.headerCard}>
        <Text style={styles.title}>{pattern.pattern}</Text>
        <Text style={styles.subTitle}>
          {plate ? `${plate.name} (${plate.state}, ${plate.country})` : 'Unknown Plate'}
        </Text>
      </View>

      {/* Pattern Details */}
      <View style={styles.card}>
        <Text style={styles.section}>Pattern Information</Text>
        <Text style={styles.detail}>
          Pattern:
          <Text style={styles.bold}> {pattern.pattern}</Text>
        </Text>
        <Text style={styles.detail}>
          Type:
          <Text style={styles.bold}> {pattern.type || '-'}</Text>
        </Text>
        <Text style={styles.detail}>
          Separator:
          <Text style={styles.bold}>
            {' '}
            {pattern.separator !== undefined && pattern.separator !== null 
              ? (pattern.separator === '' ? '(none)' : pattern.separator)
              : '-'}
          </Text>
        </Text>
        <Text style={styles.detail}>
          Series Years:
          <Text style={styles.bold}> {pattern.series_years || '-'}</Text>
        </Text>
        <Text style={styles.detail}>
          Serial ID:
          <Text style={styles.bold}> {pattern.serial_id || '-'}</Text>
        </Text>
        <Text style={styles.detail}>
          Unique ID:
          <Text style={styles.bold}> {pattern.unique_id || '-'}</Text>
        </Text>
        <Text style={styles.detail}>
          External ID:
          <Text style={styles.bold}> {pattern.external_id || '-'}</Text>
        </Text>
      </View>

      {/* Plate Information */}
      {plate && (
        <View style={styles.card}>
          <Text style={styles.section}>Associated Plate</Text>
          <Text style={styles.detail}>
            Name:
            <Text style={styles.bold}> {plate.name || '-'}</Text>
          </Text>
          <Text style={styles.detail}>
            Location:
            <Text style={styles.bold}> {plate.state}, {plate.country}</Text>
          </Text>
          <Text style={styles.detail}>
            Years Available:
            <Text style={styles.bold}> {plate.years_available || '-'}</Text>
          </Text>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, styles.primary]}
          onPress={() => navigation.navigate('UpdatePattern', { patternId })}
        >
          <Text style={styles.buttonText}>Update</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.danger]}
          onPress={handleDelete}
        >
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.controlsBottom}>
        <TouchableOpacity
          style={[styles.button, styles.secondary]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.buttonText, styles.secondaryText]}>Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loading: {
    padding: 20,
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
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
  section: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  detail: {
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
    lineHeight: 20,
  },
  bold: {
    fontWeight: '600',
    color: '#000',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 10,
    marginBottom: 10,
    marginTop: 10,
  },
  controlsBottom: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 10,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
    elevation: 2,
  },
  primary: {
    backgroundColor: '#007bff',
  },
  danger: {
    backgroundColor: '#dc3545',
  },
  secondary: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryText: {
    color: '#fff',
  },
});

export default PatternDetail;