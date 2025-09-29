import React, { useEffect, useState, useMemo } from 'react';
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
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<Plate[]>([]);
    const [searching, setSearching] = useState(false);
    const [actionsOpen, setActionsOpen] = useState(false);

    useEffect(() => {
        // keep store up to date for detail screens etc.
        dispatch(fetchPlates());
    }, [dispatch]);

    const onSearch = async (text: string) => {
        if (!text.trim()) {
            setResults([]);
            return;
        }
        setSearching(true);
        try {
            const rows = await db.searchPlates(text);
            // Limit results to prevent UI overload
            setResults(rows.slice(0, 100));
        } finally {
            setSearching(false);
        }
    };

    // Debounced search to improve performance
    const debouncedSearch = useMemo(() => {
        let timeoutId: NodeJS.Timeout;
        return (text: string) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setSearchQuery(text);
                onSearch(text);
            }, 300); // 300ms delay
        };
    }, []);

    // Handle immediate text input changes
    const handleTextChange = (text: string) => {
        setQuery(text);
        debouncedSearch(text);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Search Plates</Text>
            <TextInput
                style={styles.search}
                placeholder="Search by name, state, notes, or external ID"
                placeholderTextColor={"gray"}
                value={query}
                onChangeText={handleTextChange}
                autoCapitalize='none'
                autoCorrect={false}
                clearButtonMode='while-editing'
            />
            {searching && (
                <View style={styles.searchingContainer}>
                    <Text style={styles.searchingText}>Searching...</Text>
                </View>
            )}
            {!searching && searchQuery && results.length > 0 && (
                <Text style={styles.resultsCount}>
                    {results.length} plate{results.length !== 1 ? 's' : ''} found
                    {results.length === 100 && ' (showing first 100)'}
                </Text>
            )}
            <FlatList
                data={results}
                keyExtractor={item => item.plate_id!.toString()}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                updateCellsBatchingPeriod={50}
                initialNumToRender={20}
                windowSize={10}
                getItemLayout={(data, index) => ({
                    length: 60, // Approximate height of each item
                    offset: 60 * index,
                    index,
                })}
                ListEmptyComponent={
                    searchQuery ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No plates found</Text>
                            <Text style={styles.emptySubtext}>Try a different search term</Text>
                        </View>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Search for license plates</Text>
                            <Text style={styles.emptySubtext}>Enter a name, state, or external ID</Text>
                        </View>
                    )
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.plateItem}
                        onPress={() => navigation.navigate('PlateDetail', { plateId: item.plate_id! })}
                    >
                        <View style={styles.plateContent}>
                            <View style={styles.plateMainInfo}>
                                <Text style={styles.plateName} numberOfLines={1}>
                                    {item.name || '(Unnamed)'}
                                </Text>
                                <Text style={styles.plateLocation} numberOfLines={1}>
                                    {item.state}, {item.country}
                                </Text>
                            </View>
                            <View style={styles.plateMeta}>
                                <Text style={styles.plateId} numberOfLines={1}>
                                    {item.external_id || 'No ID'}
                                </Text>
                                <View style={[
                                    styles.availabilityDot,
                                    { backgroundColor: item.available === false ? '#FF3B30' : '#34C759' }
                                ]} />
                            </View>
                        </View>
                        {item.years_available && (
                            <Text style={styles.yearsText} numberOfLines={1}>
                                {item.years_available}
                            </Text>
                        )}
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
        padding: 16,
        backgroundColor: '#f5f5f5'
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333'
    },
    search: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        fontSize: 16,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    searchingContainer: {
        backgroundColor: '#e3f2fd',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        alignItems: 'center',
    },
    searchingText: {
        fontSize: 14,
        color: '#1976d2',
        fontWeight: '600',
    },
    resultsCount: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
    plateItem: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    plateContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    plateMainInfo: {
        flex: 1,
        marginRight: 12,
    },
    plateName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    plateLocation: {
        fontSize: 14,
        color: '#666',
    },
    plateMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    plateId: {
        fontSize: 12,
        color: '#007AFF',
        fontWeight: '500',
        maxWidth: 100,
    },
    availabilityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    yearsText: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
        fontStyle: 'italic',
    },
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#007bff',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'flex-end'
    },
    drawer: {
        backgroundColor: '#fff',
        padding: 16,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16
    },
    drawerTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12
    },
    drawerBtn: {
        backgroundColor: '#007bff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
        alignItems: 'center'
    },
    drawerText: {
        color: '#fff',
        fontWeight: '600'
    },
});

