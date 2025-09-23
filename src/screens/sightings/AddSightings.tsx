import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
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

  const [plateQuery, setPlateQuery] = useState('');
  const [plateId, setPlateId] = useState<number | undefined>(prefillPlateId);
  const [patterns, setPatterns] = useState<any[]>([]);
  const plate = useSelector((s: RootState) => (plateId ? s.plates.byId[plateId] : undefined));

  const [patternChoice, setPatternChoice] = useState<string>('');
  const [time, setTime] = useState<string>(new Date().toISOString());
  const [location, setLocation] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [images, setImages] = useState<string>('');
  const [trip, setTrip] = useState<string>('');
  const [tripQuery, setTripQuery] = useState<string>('');
  const [allTrips, setAllTrips] = useState<string[]>([]);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    (async () => {
      // Prefer TripName table; fallback to sightings-derived list
      const list = await db.getTripNames().catch(async () => await db.getAllTripNames());
      setAllTrips(list);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!plateId) return;
      const pats = await db.getPatternsByPlate(plateId);
      setPatterns(pats);
    })();
  }, [plateId]);

  const canSave = useMemo(() => {
    return !!plateId;
  }, [plateId]);

  const save = async () => {
    if (!canSave || saving) {
      if (!plateId) setErrorMsg('Please select a plate before saving.');
      return;
    }
    setErrorMsg('');
    setSaving(true);
    try {
      const img = images.split(',').map(s => s.trim()).filter(Boolean);

      // 🔥 dispatch Redux thunk instead of calling DB directly
      await dispatch(
        createSighting({
          plate_id: plateId!,
          location,
          time,
          notes,
          image_uri: img[0] || undefined,
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

      {/* Plate selection/search */}
      {plateId ? (
        <Text style={styles.label}>
          Plate: {plate?.name} ({plate?.state})
        </Text>
      ) : (
        <TextInput
          style={styles.input}
          placeholder="Search Plate (name/state)"
          value={plateQuery}
          onChangeText={setPlateQuery}
        />
      )}

      {/* Patterns */}
      <Text style={styles.label}>Pattern</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        {patterns.map(p => (
          <TouchableOpacity
            key={p.pattern_id}
            style={[styles.pill, patternChoice === p.num_pattern && styles.pillActive]}
            onPress={() => setPatternChoice(p.num_pattern)}
          >
            <Text
              style={[styles.pillText, patternChoice === p.num_pattern && styles.pillTextActive]}
            >
              {p.num_pattern}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.pill, patternChoice === 'Personalized' && styles.pillActive]}
          onPress={() => setPatternChoice('Personalized')}
        >
          <Text
            style={[styles.pillText, patternChoice === 'Personalized' && styles.pillTextActive]}
          >
            Personalized
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Time & location */}
      <TextInput style={styles.input} placeholder="Time (ISO)" value={time} onChangeText={setTime} />
      <TextInput
        style={styles.input}
        placeholder="Location (city, state)"
        value={location}
        onChangeText={setLocation}
      />

      {/* Notes */}
      <TextInput
        style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
        multiline
        placeholder="Notes (required if no plate)"
        value={notes}
        onChangeText={setNotes}
      />

      {/* Images */}
      <TextInput
        style={styles.input}
        placeholder="Images (URIs, comma separated)"
        value={images}
        onChangeText={setImages}
      />

      {/* Trip */}
      <Text style={styles.label}>Trip</Text>
      <TextInput
        style={styles.input}
        placeholder="Search or type trip"
        value={tripQuery}
        onChangeText={setTripQuery}
      />
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
        {allTrips.filter(t => !tripQuery || t.toLowerCase().includes(tripQuery.toLowerCase()))
          .length === 0 && (
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
    marginBottom: 28,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 16,
    marginRight: 6,
  },
  pillActive: { backgroundColor: '#007bff', borderColor: '#007bff' },
  pillText: { color: '#333' },
  pillTextActive: { color: '#fff' },
  listItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  listItemText: { fontSize: 16, color: '#333' },
  addBtn: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addBtnText: { color: '#007bff', fontWeight: '600' },
});

export default AddSightings;
