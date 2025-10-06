import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Animated,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  getSightingsPaged,
  countSightings,
  SightingsFilter,
  SightingListItem,
} from '../../database/helpers';

const PAGE_SIZE = 20;

const SightingsList = () => {
  const navigation = useNavigation<any>();

  // Filters
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  // Paging
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<SightingListItem[]>([]);

  // Collapsible filters
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [filtersHeight] = useState(new Animated.Value(1));
  const [filtersOpacity] = useState(new Animated.Value(1));

  const filterMemo = useMemo(() => {
    let dateFrom = null;
    let dateTo = null;
    
    // Handle month and year filtering
    if (monthFilter.trim() && yearFilter.trim()) {
      // Both month and year specified
      const month = monthFilter.trim();
      const year = yearFilter.trim();
      dateFrom = `${year}-${month.padStart(2, '0')}-01`;
      const nextMonth = parseInt(month, 10) === 12 ? 1 : parseInt(month, 10) + 1;
      const nextYear = parseInt(month, 10) === 12 ? parseInt(year, 10) + 1 : parseInt(year, 10);
      dateTo = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
    } else if (yearFilter.trim()) {
      // Only year specified
      const year = yearFilter.trim();
      dateFrom = `${year}-01-01`;
      dateTo = `${parseInt(year, 10) + 1}-01-01`;
    } else if (monthFilter.trim()) {
      // Only month specified (current year)
      const month = monthFilter.trim();
      const currentYear = new Date().getFullYear();
      dateFrom = `${currentYear}-${month.padStart(2, '0')}-01`;
      const nextMonth = parseInt(month, 10) === 12 ? 1 : parseInt(month, 10) + 1;
      const nextYear = parseInt(month, 10) === 12 ? currentYear + 1 : currentYear;
      dateTo = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
    }
    
    return {
      dateFrom,
      dateTo,
      state: stateFilter.trim() || null,
      country: countryFilter.trim() || null,
      location: locationFilter.trim() || null,
    };
  }, [monthFilter, yearFilter, stateFilter, countryFilter, locationFilter]);

  const load = useCallback(
    async (nextPage: number, replace: boolean) => {
      setLoading(true);
      try {
        const totalCount = await countSightings(filterMemo);
        setTotal(totalCount);
        const filter: SightingsFilter = {
          ...filterMemo,
          limit: PAGE_SIZE,
          offset: nextPage * PAGE_SIZE,
        } as any;
        const rows = await getSightingsPaged(filter);
        setItems(prev => (replace ? rows : [...prev, ...rows]));
      } finally {
        setLoading(false);
      }
    },
    [filterMemo],
  );

  // initial load
  useEffect(() => {
    load(0, true);
  }, [load]);

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
      }),
    ]).start();
    setFiltersCollapsed(!filtersCollapsed);
  };


  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Sightings</Text>
        <TouchableOpacity
          style={[
            styles.collapseButton,
            filtersCollapsed && styles.collapseButtonCollapsed,
          ]}
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
      <Animated.View
        style={[
          styles.filtersContainer,
          {
            height: filtersHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 360],
              extrapolate: 'clamp',
            }),
            opacity: filtersOpacity,
          },
        ]}
      >
        <View style={styles.dateRow}>
          <TextInput
            style={[styles.input, styles.dateInput]}
            placeholder="Month (1-12)"
            placeholderTextColor={'gray'}
            value={monthFilter}
            onChangeText={setMonthFilter}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, styles.dateInput]}
            placeholder="Year (e.g., 2024)"
            placeholderTextColor={'gray'}
            value={yearFilter}
            onChangeText={setYearFilter}
            keyboardType="numeric"
          />
        </View>
        <TextInput
          style={styles.input}
          placeholder="Location (City, State, Country)"
          placeholderTextColor={'gray'}
          value={locationFilter}
          onChangeText={setLocationFilter}
        />
        <TextInput
          style={styles.input}
          placeholder="Plate State"
          placeholderTextColor={'gray'}
          value={stateFilter}
          onChangeText={setStateFilter}
        />
        <TextInput
          style={styles.input}
          placeholder="Plate Country"
          placeholderTextColor={'gray'}
          value={countryFilter}
          onChangeText={setCountryFilter}
        />
        <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
          <Text style={styles.applyText}>Apply</Text>
        </TouchableOpacity>
      </Animated.View>

      <FlatList
        data={items}
        keyExtractor={item => item.sighting_id!.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() =>
              navigation.navigate('SightingDetail', {
                sightingId: item.sighting_id,
                plateId: item.plate_id,
              })
            }
          >
            <View style={styles.itemContent}>
              {/* Small image on the left */}
              <View style={styles.imageContainer}>
                {item.image_uri ? (
                  <Image
                    source={{ uri: item.image_uri }}
                    style={styles.sightingImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Text style={styles.placeholderText}>📷</Text>
                  </View>
                )}
              </View>
              
              {/* Content on the right */}
              <View style={styles.itemTextContainer}>
                <Text style={styles.locationText}>
                  {item.location || 'Unknown location'}
                </Text>
                <Text style={styles.timeText}>
                  {item.time || 'No time specified'}
                </Text>
                <Text style={styles.plateText}>
                  {item.plate_name || 'Unknown plate'} · {item.plate_state}, {item.plate_country}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          loading ? <ActivityIndicator style={styles.loadingIndicator} /> : null
        }
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>
              No sightings
            </Text>
          ) : null
        }
      />

      {/* Optional explicit pagination controls */}
      <View style={styles.paginationBar}>
        <Text style={styles.pageInfo}>Total Sightings: {total}</Text>
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
  dateRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  dateInput: {
    flex: 1,
    marginBottom: 0,
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
  item: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    width: 60,
    height: 60,
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  sightingImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
    color: '#999',
  },
  itemTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  plateText: {
    fontSize: 12,
    color: '#888',
  },
  paginationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  pageBtn: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  pageText: { color: '#fff', fontWeight: '600' },
  pageInfo: { fontSize: 12, color: '#333' },
  loadingIndicator: { marginVertical: 16 },
  emptyText: { textAlign: 'center', marginTop: 24 },
});
