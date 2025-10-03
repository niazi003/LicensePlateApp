import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getSightingsPaged, countSightings, SightingsFilter, SightingListItem } from '../../database/helpers';

const PAGE_SIZE = 20;

const SightingsList = () => {
    const navigation = useNavigation<any>();

    // Filters
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [stateFilter, setStateFilter] = useState('');
    const [countryFilter, setCountryFilter] = useState('');

    // Paging
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<SightingListItem[]>([]);
    
    // Collapsible filters
    const [filtersCollapsed, setFiltersCollapsed] = useState(false);
    const [filtersHeight] = useState(new Animated.Value(1));
    const [filtersOpacity] = useState(new Animated.Value(1));

    const filterMemo = useMemo(() => ({
        dateFrom: dateFrom.trim() || null,
        dateTo: dateTo.trim() || null,
        state: stateFilter.trim() || null,
        country: countryFilter.trim() || null,
    }), [dateFrom, dateTo, stateFilter, countryFilter]);

    const load = useCallback(async (nextPage: number, replace: boolean) => {
        setLoading(true);
        try {
            const totalCount = await countSightings(filterMemo);
            setTotal(totalCount);
            const filter: SightingsFilter = { ...filterMemo, limit: PAGE_SIZE, offset: nextPage * PAGE_SIZE } as any;
            const rows = await getSightingsPaged(filter);
            setItems(prev => replace ? rows : [...prev, ...rows]);
            setPage(nextPage);
        } finally {
            setLoading(false);
        }
    }, [filterMemo]);

    // initial load
    useEffect(() => {
        load(0, true);
    }, []);

    // apply filters
    const applyFilters = () => {
        load(0, true);
    };

    // Toggle filters collapse
    const toggleFiltersCollapse = () => {
        const toHeight = filtersCollapsed ? 1 : 0;
        const toOpacity = filtersCollapsed ? 1 : 0;
        
        Animated.parallel([
            Animated.timing(filtersHeight, {
                toValue: toHeight,
                duration: 250,
                useNativeDriver: false,
            }),
            Animated.timing(filtersOpacity, {
                toValue: toOpacity,
                duration: 200,
                useNativeDriver: false,
            })
        ]).start();
        setFiltersCollapsed(!filtersCollapsed);
    };

    const canLoadMore = items.length < total;

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.title}>Sightings</Text>
                <TouchableOpacity 
                    style={[styles.collapseButton, filtersCollapsed && styles.collapseButtonCollapsed]} 
                    onPress={toggleFiltersCollapse}
                    activeOpacity={0.7}
                >
                    <Text style={styles.collapseButtonIcon}>
                        {filtersCollapsed ? '🔍' : '🔽'}
                    </Text>
                    <Text style={styles.collapseButtonText}>
                        {filtersCollapsed ? 'Show Filters' : 'Hide Filters'}
                    </Text>
                </TouchableOpacity>
            </View>
            
            {/* Collapsible Filters */}
            <Animated.View style={[
                styles.filtersContainer, 
                { 
                    height: filtersHeight.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 310],
                        extrapolate: 'clamp',
                    }),
                    opacity: filtersOpacity
                }
            ]}>
                <TextInput style={styles.input} placeholder="From (ISO)" placeholderTextColor={"gray"} value={dateFrom} onChangeText={setDateFrom} />
                <TextInput style={styles.input} placeholder="To (ISO)" placeholderTextColor={"gray"} value={dateTo} onChangeText={setDateTo} />
                <TextInput style={styles.input} placeholder="State" placeholderTextColor={"gray"} value={stateFilter} onChangeText={setStateFilter} />
                <TextInput style={styles.input} placeholder="Country" placeholderTextColor={"gray"} value={countryFilter} onChangeText={setCountryFilter} />
                <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
                    <Text style={styles.applyText}>Apply</Text>
                </TouchableOpacity>
            </Animated.View>

            <FlatList
                data={items}
                keyExtractor={(item) => item.sighting_id!.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('SightingDetail', { sightingId: item.sighting_id, plateId: item.plate_id })}>
                        <Text style={styles.itemTitle}>{item.plate_name || 'Unknown plate'} · {item.location || 'Unknown location'}</Text>
                        <Text style={styles.itemSub}>{item.time} · {item.plate_state}, {item.plate_country}</Text>
                    </TouchableOpacity>
                )}
                ListFooterComponent={loading ? <ActivityIndicator style={{ marginVertical: 16 }} /> : null}
                onEndReachedThreshold={0.5}
                onEndReached={() => {
                    if (!loading && canLoadMore) load(page + 1, false);
                }}
                ListEmptyComponent={!loading ? <Text style={{ textAlign: 'center', marginTop: 24 }}>No sightings</Text> : null}
            />

            {/* Optional explicit pagination controls */}
            <View style={styles.paginationBar}>
                <TouchableOpacity
                    style={[styles.pageBtn, { opacity: page > 0 ? 1 : 0.5 }]}
                    disabled={page === 0 || loading}
                    onPress={() => load(page - 1, true)}
                >
                    <Text style={styles.pageText}>Prev</Text>
                </TouchableOpacity>
                <Text style={styles.pageInfo}>Page {page + 1} · {items.length}/{total}</Text>
                <TouchableOpacity
                    style={[styles.pageBtn, { opacity: canLoadMore ? 1 : 0.5 }]}
                    disabled={!canLoadMore || loading}
                    onPress={() => load(page + 1, true)}
                >
                    <Text style={styles.pageText}>Next</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default SightingsList;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', padding: 12 },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: { 
        fontSize: 22, 
        fontWeight: 'bold',
        flex: 1,
    },
    collapseButton: {
        backgroundColor: '#007bff',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#007bff',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
        minWidth: 120,
    },
    collapseButtonCollapsed: {
        backgroundColor: '#6c757d',
        shadowColor: '#6c757d',
    },
    collapseButtonIcon: {
        fontSize: 16,
        marginRight: 6,
    },
    collapseButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    filtersContainer: { 
        marginBottom: 12,
        overflow: 'hidden',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    input: { 
        borderWidth: 1, 
        borderColor: '#e0e0e0', 
        borderRadius: 8, 
        padding: 12, 
        marginBottom: 12, 
        fontSize: 16,
        backgroundColor: '#fafafa',
    },
    applyBtn: { 
        backgroundColor: '#007bff', 
        padding: 12, 
        borderRadius: 8, 
        alignItems: 'center', 
        marginBottom: 0,
        shadowColor: '#007bff',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    applyText: { color: '#fff', fontWeight: '600' },
    item: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
    itemTitle: { fontSize: 16, fontWeight: '600' },
    itemSub: { fontSize: 12, color: '#666' },
    paginationBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
    pageBtn: { backgroundColor: '#6c757d', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
    pageText: { color: '#fff', fontWeight: '600' },
    pageInfo: { fontSize: 12, color: '#333' },
});
