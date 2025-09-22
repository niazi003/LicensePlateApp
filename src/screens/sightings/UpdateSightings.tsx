import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import * as db from '../../database/helpers';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';

type ParamList = { UpdateSighting: { sightingId: number } };

const UpdateSightings = () => {
    const route = useRoute<RouteProp<ParamList,'UpdateSighting'>>();
    const navigation = useNavigation<any>();
    const { sightingId } = route.params;
    const [time, setTime] = useState('');
    const [location, setLocation] = useState('');
    const [notes, setNotes] = useState('');
    const [imageUri, setImageUri] = useState('');

    useEffect(() => {
        (async () => {
            const rows = await db.executeSql('SELECT * FROM Sighting WHERE sighting_id=?;', [sightingId]);
            if (rows.rows.length) {
                const s = rows.rows.item(0);
                setTime(s.time || '');
                setLocation(s.location || '');
                setNotes(s.notes || '');
                setImageUri(s.image_uri || '');
            }
        })();
    }, [sightingId]);

    const save = async () => {
        await db.updateSighting({ sighting_id: sightingId, plate_id: 0 as any, time, location, notes, image_uri: imageUri });
        navigation.goBack();
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Update Sighting</Text>
            <TextInput style={styles.input} placeholder="Time (ISO)" value={time} onChangeText={setTime} />
            <TextInput style={styles.input} placeholder="Location" value={location} onChangeText={setLocation} />
            <TextInput style={[styles.input, {height: 100, textAlignVertical: 'top'}]} multiline placeholder="Notes" value={notes} onChangeText={setNotes} />
            <TextInput style={styles.input} placeholder="Image URI" value={imageUri} onChangeText={setImageUri} />
            <TouchableOpacity style={styles.button} onPress={save}>
                <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', padding: 16 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
    button: { backgroundColor: '#28a745', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 12, marginBottom: 28 },
    buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
export default UpdateSightings;