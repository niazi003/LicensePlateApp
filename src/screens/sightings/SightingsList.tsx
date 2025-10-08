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
import ClearableTextInput from '../../components/ClearableTextInput';
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

  // 🔹 Filters
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  // 🔹 Paging & Data
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<SightingListItem[]>([]);

  // 🔹 Collapsible filters
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [filtersHeight] = useState(new Animated.Value(1));
  const [filtersOpacity] = useState(new Animated.Value(1));

  // 🔹 Prepare filters (memoized)
  const filters = useMemo(() => {
    const f: SightingsFilter = {
      month: monthFilter.trim(),
      year: yearFilter.trim(),
      state: stateFilter.trim(),
      country: countryFilter.trim(),
      location: locationFilter.trim(),
    };
    return f;
  }, [monthFilter, yearFilter, stateFilter, countryFilter, locationFilter]);

  // 🔹 Load and apply filters
  const load = useCallback(
    async (nextPage: number, replace: boolean, appliedFilters?: SightingsFilter) => {
      setLoading(true);
      try {
        const usedFilters = appliedFilters || filters; // fallback to current filters
        const totalCount = await countSightings(usedFilters);
        const allRows = await getSightingsPaged({
          filters: usedFilters,
          limit: PAGE_SIZE,
          offset: nextPage * PAGE_SIZE,
        });

        setTotal(totalCount);
        setItems(replace ? allRows : [...items, ...allRows]);
      } catch (error) {
        console.error('Error loading sightings:', error);
      } finally {
        setLoading(false);
      }
    },
    [items], // depends only on items for pagination merging
  );

  // 🔹 Initial load (only once)
  useEffect(() => {
    load(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🔹 Apply filters manually
  const applyFilters = () => {
    load(0, true, filters);
  };

  // 🔹 Toggle filters collapse
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

  // 🔹 Render
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Sightings</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.applyBtn, loading && { opacity: 0.6 }]}
            onPress={!loading ? () => load(0, true, filters) : undefined}
            disabled={loading}
          >
            <Text style={styles.applyText}>{loading ? 'Loading...' : '🔄 Refresh'}</Text>
          </TouchableOpacity>

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
      </View>

      {/* 🔹 Collapsible Filters */}
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
        <ClearableTextInput
          style={styles.input}
          placeholder="Location (City, State, Country)"
          placeholderTextColor={'gray'}
          value={locationFilter}
          onChangeText={setLocationFilter}
        />
        <ClearableTextInput
          style={styles.input}
          placeholder="Plate State"
          placeholderTextColor={'gray'}
          value={stateFilter}
          onChangeText={setStateFilter}
        />
        <ClearableTextInput
          style={styles.input}
          placeholder="Plate Country"
          placeholderTextColor={'gray'}
          value={countryFilter}
          onChangeText={setCountryFilter}
        />
        <TouchableOpacity
          style={[styles.applyBtn, loading && { opacity: 0.6 }]}
          onPress={!loading ? applyFilters : undefined}
          disabled={loading}
        >
          <Text style={styles.applyText}>{loading ? 'Loading...' : 'Apply'}</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* 🔹 Sightings List */}
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
              <View style={styles.itemTextContainer}>
                <Text style={styles.locationText}>
                  {item.location || 'Unknown location'}
                </Text>
                <Text style={styles.timeText}>
                  {item.time || 'No time specified'}
                </Text>
                <Text style={styles.plateText}>
                  {item.plate_name || 'Unknown plate'} · {item.plate_state},{' '}
                  {item.plate_country}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          loading ? <ActivityIndicator style={styles.loadingIndicator} /> : null
        }
        ListEmptyComponent={
          !loading ? <Text style={styles.emptyText}>No sightings</Text> : null
        }
      />

      {/* 🔹 Footer */}
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#28a745',
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
  pageInfo: { fontSize: 12, color: '#333' },
  loadingIndicator: { marginVertical: 16 },
  emptyText: { textAlign: 'center', marginTop: 24 },
});
