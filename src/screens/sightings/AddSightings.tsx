import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Switch } from 'react-native';
import * as db from '../../database/helpers';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';

type ParamList = { AddSighting: { plateId?: number } };

const AddSightings = () => {
    const route = useRoute<RouteProp<ParamList, 'AddSighting'>>();
    const navigation = useNavigation<any>();
    const prefillPlateId = route.params?.plateId;

    const [plateQuery, setPlateQuery] = useState('');
    const [plateId, setPlateId] = useState<number | undefined>(prefillPlateId);
    const [patterns, setPatterns] = useState<any[]>([]);
    const plate = useSelector((s: RootState) => plateId ? s.plates.byId[plateId] : undefined);

    const [patternChoice, setPatternChoice] = useState<string>('');
    const [time, setTime] = useState<string>(new Date().toISOString());
    const [location, setLocation] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [images, setImages] = useState<string>('');
    const [tripId, setTripId] = useState<number | undefined>(undefined);
    const [useCurrentTrip, setUseCurrentTrip] = useState<boolean>(true);
    const [trips, setTrips] = useState<db.Trip[]>([]);

    useEffect(() => {
        (async () => {
            const ts = await db.getAllTrips();
            setTrips(ts);
            if (useCurrentTrip && ts.length) setTripId(ts[0].id);
        })();
    }, [useCurrentTrip]);

    useEffect(() => {
        (async () => {
            if (!plateId) return;
            const pats = await db.getPatternsByPlate(plateId);
            setPatterns(pats);
        })();
    }, [plateId]);

    const canSave = useMemo(() => {
        if (!plateId && !notes.trim()) return false;
        return true;
    }, [plateId, notes]);

    const save = async () => {
        if (!canSave) return;
        const img = images.split(',').map(s => s.trim()).filter(Boolean);
        await db.addSighting({
            plate_id: plateId!,
            location,
            time,
            notes,
            image_uri: img[0] || undefined,
            trip_id: tripId ?? null,
        });
        navigation.goBack();
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Add Sighting</Text>

            {/* Plate selection/search */}
            {plateId ? (
                <Text style={styles.label}>Plate: {plate?.name} ({plate?.state})</Text>
            ) : (
                <TextInput style={styles.input} placeholder="Search Plate (name/state)" value={plateQuery} onChangeText={setPlateQuery} />
            )}

            {/* Patterns dropdown */}
            <Text style={styles.label}>Pattern</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:12}}>
                {patterns.map(p => (
                    <TouchableOpacity key={p.pattern_id} style={[styles.pill, patternChoice===p.num_pattern && styles.pillActive]} onPress={() => setPatternChoice(p.num_pattern)}>
                        <Text style={[styles.pillText, patternChoice===p.num_pattern && styles.pillTextActive]}>{p.num_pattern}</Text>
                    </TouchableOpacity>
                ))}
                <TouchableOpacity style={[styles.pill, patternChoice==='Personalized' && styles.pillActive]} onPress={() => setPatternChoice('Personalized')}>
                    <Text style={[styles.pillText, patternChoice==='Personalized' && styles.pillTextActive]}>Personalized</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Time & location */}
            <TextInput style={styles.input} placeholder="Time (ISO)" value={time} onChangeText={setTime} />
            <TextInput style={styles.input} placeholder="Location (city, state)" value={location} onChangeText={setLocation} />

            {/* Notes */}
            <TextInput style={[styles.input, {height: 100, textAlignVertical: 'top'}]} multiline placeholder="Notes (required if no plate)" value={notes} onChangeText={setNotes} />

            {/* Images */}
            <TextInput style={styles.input} placeholder="Images (URIs, comma separated)" value={images} onChangeText={setImages} />

            {/* Trips */}
            <View style={styles.rowBetween}>
                <Text style={styles.label}>Use current trip</Text>
                <Switch value={useCurrentTrip} onValueChange={setUseCurrentTrip} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:12}}>
                {trips.map(t => (
                    <TouchableOpacity key={t.id} style={[styles.pill, tripId===t.id && styles.pillActive]} onPress={() => setTripId(t.id!)}>
                        <Text style={[styles.pillText, tripId===t.id && styles.pillTextActive]}>{t.name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <TouchableOpacity style={[styles.button, {opacity: canSave?1:0.5}]} disabled={!canSave} onPress={save}>
                <Text style={styles.buttonText}>Save Sighting</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', padding: 16 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
    label: { fontSize: 16, fontWeight: '500', marginBottom: 8 },
    button: { backgroundColor: '#007bff', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 12, marginBottom: 28 },
    buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
    rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    pill: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#ccc', borderRadius: 16, marginRight: 6 },
    pillActive: { backgroundColor: '#007bff', borderColor: '#007bff' },
    pillText: { color: '#333' },
    pillTextActive: { color: '#fff' },
});
export default AddSightings;