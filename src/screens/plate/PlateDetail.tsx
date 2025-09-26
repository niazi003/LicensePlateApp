import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ScrollView,
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
  const [showDelete, setShowDelete] = useState(false);

  const plate = useSelector((state: RootState) => state.plates.byId[plateId]);
  const patterns = useSelector((state: RootState) =>
    state.patterns.allIds.map(id => state.patterns.byId[id]).filter(p => p.plate_id === plateId),
  );
  const sightings = useSelector((state: RootState) =>
    state.sightings.allIds.map(id => state.sightings.byId[id]).filter(s => s.plate_id === plateId),
  );

  // Debug logging
  console.log('PlateDetail: plateId:', plateId);
  console.log('PlateDetail: plate from Redux:', plate);
  console.log('PlateDetail: plate external_id:', plate?.external_id);

  useEffect(() => {
    dispatch(fetchPatternsByPlate(plateId));
    dispatch(fetchSightingsByPlate(plateId));
  }, [dispatch, plateId]);

  if (!plate) return <Text style={styles.loading}>Loading...</Text>;

  const handleDelete = async () => {
    const sightingsCount = sightings.length;
    Alert.alert(
      'Delete Plate',
      `This will permanently delete the plate and ${sightingsCount} linked sighting${sightingsCount === 1 ? '' : 's'}. This cannot be undone.`,
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
      </View>

      {/* Details */}
      <View style={styles.card}>
        <Text style={styles.section}>Details</Text>
        <Text style={styles.detail}>
          Years:
          <Text style={styles.bold}> {plate.years_available || '-'}</Text>
        </Text>
        <Text style={styles.detail}>
          Available:
          <Text style={styles.bold}> {plate.avail ? 'Yes' : 'No'}</Text>
        </Text>
        <Text style={styles.detail}>
          Base:
          <Text style={styles.bold}> {plate.base ? 'Yes' : 'No'}</Text>
        </Text>
        <Text style={styles.detail}>
          Embossed:
          <Text style={styles.bold}> {plate.embossed ? 'Yes' : 'No'} </Text>
        </Text>
        <Text style={styles.detail}>
          County-specific:
          <Text style={styles.bold}> {plate.county ? 'Yes' : 'No'} </Text>
        </Text>
        <Text style={styles.detail}>
          URL Flag:
          <Text style={styles.bold}> {plate.url ? 'Yes' : 'No'}</Text>
        </Text>

        <Text style={styles.detail}>
          Primary Colors:
          <Text style={styles.bold}> {plate.primary_background_colors || '-'} </Text>
        </Text>
        <Text style={styles.detail}>
          All Colors:
          <Text style={styles.bold}> {plate.all_colors || '-'}</Text>
        </Text>
        <Text style={styles.detail}>
          Background:
          <Text style={styles.bold}> {plate.background_desc || '-'}</Text>
        </Text>

        <Text style={styles.detail}>
          Plate Text:
          <Text style={styles.bold}> {plate.text || '-'} </Text>
        </Text>
        <Text style={styles.detail}>
          Number Font:
          <Text style={styles.bold}> {plate.num_font || '-'} </Text>
        </Text>
        <Text style={styles.detail}>
          Number Color:
          <Text style={styles.bold}> {plate.num_color || '-'} </Text>
        </Text>
        <Text style={styles.detail}>
          State Font:
          <Text style={styles.bold}> {plate.state_font || '-'}</Text>
        </Text>
        <Text style={styles.detail}>
          State Color:
          <Text style={styles.bold}>{plate.state_color || '-'} </Text>
        </Text>
        <Text style={styles.detail}>
          State Location:
          <Text style={styles.bold}> {plate.state_location || '-'}</Text>
        </Text>

        <Text style={styles.detail}>
          Tags:
          <Text style={styles.bold}> {plate.features_tags || '-'}</Text>
        </Text>
        <Text style={styles.detail}>
          Description:
          <Text style={styles.bold}> {plate.description || '-'}</Text>
        </Text>
        <Text style={styles.detail}>
          Notes:
          <Text style={styles.bold}> {plate.notes || '-'}</Text>
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, styles.primary]}
          onPress={() => navigation.navigate('UpdatePlate', { plateId })}
        >
          <Text style={styles.buttonText}>Update</Text>
        </TouchableOpacity>
        {!showDelete ? (
          <TouchableOpacity style={[styles.button, { borderWidth: 1, borderColor: '#dc3545' }]} onPress={() => setShowDelete(true)}>
            <Text style={[styles.buttonText, { color: '#dc3545' }]}>Reveal Delete</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.button, styles.danger]} onPress={handleDelete}>
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        )}
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
              onPress={() => (navigation as any).navigate('PatternDetail', { patternId: item.pattern_id! })}
            >
              <Text style={styles.itemTitle}>{item.pattern}</Text>
              <Text style={styles.itemSub}>{item.type || '-'}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No patterns yet</Text>}
        />
        <TouchableOpacity
          style={[styles.button, styles.success]}
          onPress={() => (navigation as any).navigate('AddPattern', { plateId })}
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
              onPress={() => (navigation as any).navigate('SightingDetail', { sightingId: item.sighting_id! })}
            >
              <Text style={styles.itemTitle}>{item.location || 'Unknown location'}</Text>
              <Text style={styles.itemSub}>{item.time || '-'}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No sightings yet</Text>}
        />
        <TouchableOpacity
          style={[styles.button, styles.success]}
          onPress={() => (navigation as any).navigate('AddSighting', { plateId })}
        >
          <Text style={styles.buttonText}>Add Sighting</Text>
        </TouchableOpacity>
      </View>

      {/* Footer External ID */}
      <View style={[styles.card, { marginBottom: 24 }]}>
        <Text style={styles.section}>Identifiers</Text>
        <Text style={[styles.detail, { fontWeight: '600' }]}>External ID: {plate.external_id || '-'}</Text>
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

  card: { backgroundColor: '#fff', padding: 16, margin: 10, borderRadius: 10, elevation: 2 },
  section: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  detail: { fontSize: 14, marginBottom: 6, color: '#333' },
  bold: { fontWeight: 'bold' },

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
