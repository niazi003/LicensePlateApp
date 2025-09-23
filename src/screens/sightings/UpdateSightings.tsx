import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../redux/store';
import { updateSightingThunk } from '../../redux/sightings/sightingsSlice';
import * as db from '../../database/helpers';

type ParamList = { UpdateSighting: { sightingId: number } };

const UpdateSightings = () => {
  const route = useRoute<RouteProp<ParamList, 'UpdateSighting'>>();
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { sightingId } = route.params;

  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [tripQuery, setTripQuery] = useState('');
  const [trip, setTrip] = useState('');
  const [allTrips, setAllTrips] = useState<string[]>([]);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    (async () => {
      const rows = await db.executeSql('SELECT * FROM Sighting WHERE sighting_id=?;', [sightingId]);
      if (rows.rows.length) {
        const s = rows.rows.item(0);
        setTime(s.time || '');
        setLocation(s.location || '');
        setNotes(s.notes || '');
        setImageUri(s.image_uri || '');
        setTrip(s.trip || '');
        setTripQuery(s.trip || '');
      }
      const names = await db.getTripNames().catch(async () => await db.getAllTripNames());
      setAllTrips(names);
    })();
  }, [sightingId]);

  const save = async () => {
    if (saving) return;
    setErrorMsg('');
    setSaving(true);
    try {
      await dispatch(
        updateSightingThunk({
          sighting_id: sightingId,
          plate_id: 0 as any, // 👈 keep your DB happy; plate_id is not being changed here
          time,
          location,
          notes,
          image_uri: imageUri,
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

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Update Sighting</Text>
      <TextInput style={styles.input} placeholder="Time (ISO)" value={time} onChangeText={setTime} />
      <TextInput style={styles.input} placeholder="Location" value={location} onChangeText={setLocation} />
      <TextInput
        style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
        multiline
        placeholder="Notes"
        value={notes}
        onChangeText={setNotes}
      />
      <TextInput style={styles.input} placeholder="Image URI" value={imageUri} onChangeText={setImageUri} />
      <Text style={styles.label}>Trip</Text>
      <TextInput style={styles.input} placeholder="Search or type trip" value={tripQuery} onChangeText={setTripQuery} />
      <ScrollView style={{ maxHeight: 160, marginBottom: 8 }}>
        {allTrips
          .filter(t => !tripQuery || t.toLowerCase().includes(tripQuery.toLowerCase()))
          .map(t => (
            <TouchableOpacity
              key={t}
              style={styles.listItem}
              onPress={() => {
                setTrip(t);
                setTripQuery(t);
              }}
            >
              <Text style={styles.listItemText}>{t}</Text>
            </TouchableOpacity>
          ))}
        {allTrips.filter(t => !tripQuery || t.toLowerCase().includes(tripQuery.toLowerCase())).length === 0 && (
          <View style={{ paddingVertical: 8 }}>
            <Text style={{ color: '#777', marginBottom: 8 }}>No trips found</Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={async () => {
                const name = tripQuery.trim();
                if (!name) return;
                try {
                  await db.addTripName(name);
                } catch {}
                if (!allTrips.includes(name)) setAllTrips([name, ...allTrips]);
                setTrip(name);
                setTripQuery(name);
              }}
            >
              <Text style={styles.addBtnText}>Add trip "{tripQuery.trim()}"</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      {errorMsg ? <Text style={{ color: 'red', marginBottom: 8 }}>{errorMsg}</Text> : null}
      <TouchableOpacity
        style={[styles.button, { opacity: saving ? 0.5 : 1 }]}
        disabled={saving}
        onPress={save}
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  label: { fontSize: 16, fontWeight: '500', marginBottom: 8 },
  button: { backgroundColor: '#28a745', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 12, marginBottom: 28 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  listItem: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  listItemText: { fontSize: 16, color: '#333' },
  addBtn: { backgroundColor: '#f0f0f0', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center' },
  addBtnText: { color: '#007bff', fontWeight: '600' },
});
export default UpdateSightings;
