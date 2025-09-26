import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Modal } from 'react-native';
import { useDispatch } from 'react-redux';
import { fetchPlates } from '../../redux/plates/platesSlice';
import { RootState, AppDispatch } from '../../redux/store';
import { useNavigation } from '@react-navigation/native';
import { PlateStackParamList } from '../../navigation/PlateNavigation';
import { StackNavigationProp } from '@react-navigation/stack';
import * as db from '../../database/helpers';

import ImportPlatesCSV from './ImportPlatesCSV';
import { Plate } from '../../database/helpers';

type NavProp = StackNavigationProp<PlateStackParamList, 'Home'>;

const HomePage = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigation = useNavigation<NavProp>();

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Plate[]>([]);
    const [searching, setSearching] = useState(false);
    const [actionsOpen, setActionsOpen] = useState(false);

    useEffect(() => {
        // keep store up to date for detail screens etc.
        dispatch(fetchPlates());
    }, [dispatch]);

    const onSearch = async (text: string) => {
        setQuery(text);
        if (!text.trim()) {
            setResults([]);
            return;
        }
        setSearching(true);
        try {
            const rows = await db.searchPlates(text);
            setResults(rows);
        } finally {
            setSearching(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Search Plates</Text>
            <TextInput
                style={styles.search}
                placeholder="Search by name, state, notes, or external ID"
                placeholderTextColor={"gray"}
                value={query}
                onChangeText={onSearch}
                autoCapitalize='none'
                autoCorrect={false}
                clearButtonMode='while-editing'
            />
            {searching && <Text>Searching...</Text>}
            <FlatList
                data={results}
                keyExtractor={item => item.plate_id!.toString()}
                ListEmptyComponent={query ? <Text>No results</Text> : <Text>Type to search</Text>}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.item}
                        onPress={() => navigation.navigate('PlateDetail', { plateId: item.plate_id! })}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {/* No image in schema anymore — placeholder block */}
                            <View style={[styles.thumb, { backgroundColor: '#eee' }]} />
                            <View style={{ marginLeft: 10, flex: 1 }}>
                                <Text style={{ fontWeight: '600' }}>{item.name || '(Unnamed)'}</Text>
                                <Text style={{ color: '#666' }}>
                                    {item.state}, {item.country}  ·  {item.external_id || '-'}
                                </Text>
                                {item.years_available ? (
                                    <Text style={{ color: '#999', fontSize: 12 }}>
                                        Years: {item.years_available}
                                    </Text>
                                ) : null}
                                {item.avail === false && (
                                    <Text style={{ color: 'red', fontSize: 12 }}>Not Available</Text>
                                )}
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
            />
            {/* Actions drawer accessible only from Plates home */}
            <TouchableOpacity style={styles.fab} onPress={() => setActionsOpen(true)}>
                <Text style={{ color: '#fff', fontSize: 22 }}>+</Text>
            </TouchableOpacity>
            <Modal visible={actionsOpen} transparent animationType="slide" onRequestClose={() => setActionsOpen(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.drawer}>
                        <Text style={styles.drawerTitle}>Quick Actions</Text>
                        <TouchableOpacity style={styles.drawerBtn} onPress={() => { setActionsOpen(false); navigation.navigate('AddPlate'); }}>
                            <Text style={styles.drawerText}>Add Plate</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.drawerBtn} onPress={() => { setActionsOpen(false); (navigation as any).navigate('AddSighting'); }}>
                            <Text style={styles.drawerText}>Add Sighting</Text>
                        </TouchableOpacity>
                        <View style={{ marginTop: 10 }}>
                            <ImportPlatesCSV />
                        </View>
                        <TouchableOpacity style={[styles.drawerBtn, { backgroundColor: '#6c757d' }]} onPress={() => setActionsOpen(false)}>
                            <Text style={styles.drawerText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};
export default HomePage;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 12
    },
    search: {
        borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
        padding: 12, marginBottom: 12, fontSize: 16,
    },
    item: {
        padding: 12,
        borderBottomWidth: 1,
        borderColor: '#ccc'
    },
    thumb: { width: 48, height: 32, borderRadius: 4 },
    fab: { position: 'absolute', right: 16, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#007bff', alignItems: 'center', justifyContent: 'center', elevation: 4 },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
    drawer: { backgroundColor: '#fff', padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
    drawerTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
    drawerBtn: { backgroundColor: '#007bff', padding: 12, borderRadius: 8, marginBottom: 10, alignItems: 'center' },
    drawerText: { color: '#fff', fontWeight: '600' },
});
