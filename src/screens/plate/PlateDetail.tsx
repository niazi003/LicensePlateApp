import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../redux/store';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { PlateStackParamList } from '../../navigation/PlateNavigation';
import { StackNavigationProp } from '@react-navigation/stack';
import { deletePlateThunk } from '../../redux/plates/platesSlice';
import { fetchPatternsByPlate } from '../../redux/patterns/patternsSlice';
import { fetchSightingsByPlate } from '../../redux/sightings/sightingsSlice';

type DetailRoute = RouteProp<PlateStackParamList, 'PlateDetail'>;
type NavProp = StackNavigationProp<PlateStackParamList, 'PlateDetail'>;

interface Props {
  route: DetailRoute;
}

const PlateDetail = ({ route }: Props) => {
  const { plateId } = route.params;
  const navigation = useNavigation<NavProp>();
  const dispatch = useDispatch<AppDispatch>();

  const plate = useSelector((state: RootState) => state.plates.byId[plateId]);
  const patterns = useSelector((state: RootState) =>
    state.patterns.allIds.map(id => state.patterns.byId[id]).filter(p => p.plate_id === plateId),
  );
  const sightings = useSelector((state: RootState) =>
    state.sightings.allIds.map(id => state.sightings.byId[id]).filter(s => s.plate_id === plateId),
  );

  useEffect(() => {
    dispatch(fetchPatternsByPlate(plateId));
    dispatch(fetchSightingsByPlate(plateId));
  }, [dispatch, plateId]);

  if (!plate) return <Text style={styles.loading}>Loading...</Text>;

  const handleDelete = async () => {
    Alert.alert(
      'Delete Plate',
      'Are you sure you want to delete this plate and all its patterns & sightings?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deletePlateThunk(plateId)).unwrap();
              navigation.goBack();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete plate');
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.headerCard}>
        <Text style={styles.title}>{plate.name || 'Unnamed Plate'}</Text>
        <Text style={styles.subTitle}>{plate.state}, {plate.country}</Text>
        {plate.images ? (
          <Image source={{ uri: plate.images }} style={styles.image} resizeMode="contain" />
        ) : null}
      </View>

      {/* Details */}
      <View style={styles.card}>
        <Text style={styles.section}>Details</Text>
        <Text style={styles.detail}>External ID: {plate.external_id || '-'}</Text>
        <Text style={styles.detail}>Years: {plate.years_available || '-'}</Text>
        <Text style={styles.detail}>Available: {plate.available ? 'Yes' : 'No'}</Text>
        <Text style={styles.detail}>Base: {plate.base ? 'Yes' : 'No'}</Text>
        <Text style={styles.detail}>Primary Colors: {plate.primary_background_colors || '-'}</Text>
        <Text style={styles.detail}>All Colors: {plate.all_colors || '-'}</Text>
        <Text style={styles.detail}>Background: {plate.background_desc || '-'}</Text>
        <Text style={styles.detail}>Text Field: {plate.text_field || '-'}</Text>
        <Text style={styles.detail}>Tags: {plate.features_tags || '-'}</Text>
        <Text style={styles.detail}>Description: {plate.description || '-'}</Text>
        <Text style={styles.detail}>Notes: {plate.notes || '-'}</Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, styles.primary]}
          onPress={() => navigation.navigate('UpdatePlate', { plateId })}
        >
          <Text style={styles.buttonText}>Update</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.danger]} onPress={handleDelete}>
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Patterns */}
      <View style={styles.card}>
        <Text style={styles.section}>Patterns</Text>
        <FlatList
          data={patterns}
          keyExtractor={item => item.pattern_id!.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => navigation.navigate('PatternDetail', { patternId: item.pattern_id! })}
            >
              <Text style={styles.itemTitle}>{item.num_pattern}</Text>
              <Text style={styles.itemSub}>{item.type || '-'}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No patterns yet</Text>}
        />
        <TouchableOpacity
          style={[styles.button, styles.success]}
          onPress={() => navigation.navigate('AddPattern', { plateId })}
        >
          <Text style={styles.buttonText}>Add Pattern</Text>
        </TouchableOpacity>
      </View>

      {/* Sightings */}
      <View style={styles.card}>
        <Text style={styles.section}>Sightings</Text>
        <FlatList
          data={sightings}
          keyExtractor={item => item.sighting_id!.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => navigation.navigate('SightingDetail', { sightingId: item.sighting_id! })}
            >
              <Text style={styles.itemTitle}>{item.location || 'Unknown location'}</Text>
              <Text style={styles.itemSub}>{item.time || '-'}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No sightings yet</Text>}
        />
        <TouchableOpacity
          style={[styles.button, styles.success]}
          onPress={() => navigation.navigate('AddSighting', { plateId })}
        >
          <Text style={styles.buttonText}>Add Sighting</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default PlateDetail;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  loading: { padding: 20, textAlign: 'center' },

  headerCard: { backgroundColor: '#fff', padding: 16, margin: 10, borderRadius: 10, elevation: 2 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  subTitle: { fontSize: 16, color: '#666' },
  image: { marginTop: 10, width: '100%', height: 200, borderRadius: 8 },

  card: { backgroundColor: '#fff', padding: 16, margin: 10, borderRadius: 10, elevation: 2 },
  section: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  detail: { fontSize: 14, marginBottom: 6, color: '#333' },

  controls: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 10, marginBottom: 20 },
  button: { flex: 1, padding: 12, borderRadius: 8, marginHorizontal: 5, alignItems: 'center' },
  primary: { backgroundColor: '#007bff' },
  danger: { backgroundColor: '#dc3545' },
  success: { backgroundColor: '#28a745', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: '600' },

  item: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemTitle: { fontSize: 16, fontWeight: '500' },
  itemSub: { fontSize: 12, color: '#666' },

  empty: { textAlign: 'center', padding: 10, color: '#666' },
});
