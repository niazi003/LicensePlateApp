import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, Animated, ScrollView } from 'react-native';
import { useDispatch } from 'react-redux';
import { fetchPlates } from '../../redux/plates/platesSlice';
import { AppDispatch } from '../../redux/store';
import { useNavigation } from '@react-navigation/native';
import { PlateStackParamList } from '../../navigation/PlateNavigation';
import { StackNavigationProp } from '@react-navigation/stack';
import * as db from '../../database/helpers';
import ClearableTextInput from '../../components/ClearableTextInput';

import ImportPlatesCSV from './ImportPlatesCSV';
import { Plate, PlateFilters } from '../../database/helpers';

type NavProp = StackNavigationProp<PlateStackParamList, 'Home'>;

const COLOR_OPTIONS = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Dark Blue', 'Purple', 'Brown', 'White', 'Gray', 'Black'];
const FONT_OPTIONS = ['Serif', 'Sans-Serif', 'Script'];

const HomePage = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigation = useNavigation<NavProp>();

    const [filters, setFilters] = useState<PlateFilters>({
        name: '',
        state: '',
        country: '',
        external_id: '',
        years_available: '',
        available: 'all',
        base: 'all',
        embossed: 'all',
        county: 'all',
        tags: '',
        notes: '',
        text: '',
        colors: [],
        primary_background_color: '',
        pattern_font: '',
        state_font: '',
        pattern_color: '',
        state_color: '',
    });
    const [results, setResults] = useState<Plate[]>([]);
    const [searching, setSearching] = useState(false);
    const [actionsOpen, setActionsOpen] = useState(false);
    const [filtersCollapsed, setFiltersCollapsed] = useState(false);
    const [filtersHeight] = useState(new Animated.Value(1));
    const [filtersOpacity] = useState(new Animated.Value(1));
    const [hasActiveFilters, setHasActiveFilters] = useState(false);
    const [colorsModalOpen, setColorsModalOpen] = useState(false);
    const [backgroundColorModalOpen, setBackgroundColorModalOpen] = useState(false);
    const [patternFontModalOpen, setPatternFontModalOpen] = useState(false);
    const [stateFontModalOpen, setStateFontModalOpen] = useState(false);
    const [patternColorModalOpen, setPatternColorModalOpen] = useState(false);
    const [stateColorModalOpen, setStateColorModalOpen] = useState(false);

    useEffect(() => {
        // keep store up to date for detail screens etc.
        dispatch(fetchPlates());
    }, [dispatch]);

    // Check if any filters are active
    useEffect(() => {
        const active = 
            filters.name?.trim() ||
            filters.state?.trim() ||
            filters.country?.trim() ||
            filters.external_id?.trim() ||
            filters.years_available?.trim() ||
            filters.tags?.trim() ||
            filters.notes?.trim() ||
            filters.text?.trim() ||
            (filters.colors && filters.colors.length > 0) ||
            filters.primary_background_color?.trim() ||
            filters.pattern_font?.trim() ||
            filters.state_font?.trim() ||
            filters.pattern_color?.trim() ||
            filters.state_color?.trim() ||
            (filters.available !== 'all') ||
            (filters.base !== 'all') ||
            (filters.embossed !== 'all') ||
            (filters.county !== 'all');
        setHasActiveFilters(!!active);
    }, [filters]);


    // Debounced search to improve performance
    const debouncedSearch = useMemo(() => {
        let timeoutId: NodeJS.Timeout;
        return (searchFilters: PlateFilters) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                // Check if any filters are set
                const active = 
                    searchFilters.name?.trim() ||
                    searchFilters.state?.trim() ||
                    searchFilters.country?.trim() ||
                    searchFilters.external_id?.trim() ||
                    searchFilters.years_available?.trim() ||
                    searchFilters.tags?.trim() ||
                    searchFilters.notes?.trim() ||
                    searchFilters.text?.trim() ||
                    (searchFilters.colors && searchFilters.colors.length > 0) ||
                    searchFilters.primary_background_color?.trim() ||
                    searchFilters.pattern_font?.trim() ||
                    searchFilters.state_font?.trim() ||
                    searchFilters.pattern_color?.trim() ||
                    searchFilters.state_color?.trim() ||
                    (searchFilters.available !== 'all') ||
                    (searchFilters.base !== 'all') ||
                    (searchFilters.embossed !== 'all') ||
                    (searchFilters.county !== 'all');
                
                if (!active) {
                    setResults([]);
                    return;
                }
                
                setSearching(true);
                db.searchPlatesAdvanced(searchFilters)
                    .then((rows) => {
                        setResults(rows);
                    })
                    .finally(() => {
                        setSearching(false);
                    });
            }, 400); // 400ms delay
        };
    }, []);

    // Handle filter changes
    const handleFilterChange = (field: keyof PlateFilters, value: any) => {
        const newFilters = { ...filters, [field]: value };
        setFilters(newFilters);
        debouncedSearch(newFilters);
    };

    // Clear all filters
    const clearAllFilters = () => {
        const emptyFilters: PlateFilters = {
            name: '',
            state: '',
            country: '',
            external_id: '',
            years_available: '',
            available: 'all',
            base: 'all',
            embossed: 'all',
            county: 'all',
            tags: '',
            notes: '',
            text: '',
            colors: [],
            primary_background_color: '',
            pattern_font: '',
            state_font: '',
            pattern_color: '',
            state_color: '',
        };
        setFilters(emptyFilters);
        setResults([]);
    };

    // Toggle color selection
    const toggleColor = (color: string) => {
        const currentColors = filters.colors || [];
        const newColors = currentColors.includes(color)
            ? currentColors.filter(c => c !== color)
            : [...currentColors, color];
        handleFilterChange('colors', newColors);
    };

    // Toggle filters collapse
    const toggleFiltersCollapse = () => {
        const toHeight = filtersCollapsed ? 1 : 0;
        const toOpacity = filtersCollapsed ? 1 : 0;
        
        Animated.parallel([
            Animated.timing(filtersHeight, {
                toValue: toHeight,
                duration: 300,
                useNativeDriver: false,
            }),
            Animated.timing(filtersOpacity, {
                toValue: toOpacity,
                duration: 250,
                useNativeDriver: false,
            })
        ]).start();
        setFiltersCollapsed(!filtersCollapsed);
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.title}>Filter Plates</Text>
                <View style={styles.headerButtons}>
                    {hasActiveFilters && (
                        <TouchableOpacity 
                            style={styles.clearButton} 
                            onPress={clearAllFilters}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.clearButtonText}>Clear</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                        style={[styles.collapseButton, filtersCollapsed && styles.collapseButtonCollapsed]} 
                        onPress={toggleFiltersCollapse}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.collapseButtonIcon}>
                            {filtersCollapsed ? '🔍' : '🔽'}
                        </Text>
                        <Text style={styles.collapseButtonText}>
                            {filtersCollapsed ? 'Show' : 'Hide'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
            
            <Animated.View style={[
                styles.filtersContainer, 
                { 
                    height: filtersHeight.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 500],
                        extrapolate: 'clamp',
                    }),
                    opacity: filtersOpacity
                }
            ]}>
                <ScrollView 
                    style={styles.filtersScroll}
                    contentContainerStyle={styles.filtersScrollContent}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                    bounces={true}
                >
                    <View style={styles.filtersContent}>
                        {/* Primary Filters */}
                        <View style={styles.filterSection}>
                            <Text style={styles.sectionTitle}>Primary Filters</Text>
                            
                            <Text style={styles.filterLabel}>Name</Text>
                            <ClearableTextInput
                                style={styles.filterInput}
                                placeholder="Search by Plate Name"
                                placeholderTextColor="gray"
                                value={filters.name || ''}
                                onChangeText={(val) => handleFilterChange('name', val)}
                                autoCapitalize='none'
                                autoCorrect={false}
                            />

                            <View style={styles.filterRow}>
                                <View style={styles.filterHalf}>
                                    <Text style={styles.filterLabel}>State</Text>
                                    <ClearableTextInput
                                        style={styles.filterInput}
                                        placeholder="e.g., New York"
                                        placeholderTextColor="gray"
                                        value={filters.state || ''}
                                        onChangeText={(val) => handleFilterChange('state', val)}
                                        autoCapitalize='characters'
                                        autoCorrect={false}
                                    />
                                </View>
                                <View style={styles.filterHalf}>
                                    <Text style={styles.filterLabel}>Country</Text>
                                    <ClearableTextInput
                                        style={styles.filterInput}
                                        placeholder="e.g., US"
                                        placeholderTextColor="gray"
                                        value={filters.country || ''}
                                        onChangeText={(val) => handleFilterChange('country', val)}
                                        autoCapitalize='characters'
                                        autoCorrect={false}
                                    />
                                </View>
                            </View>

                            <Text style={styles.filterLabel}>External ID</Text>
                            <ClearableTextInput
                                style={styles.filterInput}
                                placeholder="Search by external ID"
                                placeholderTextColor="gray"
                                value={filters.external_id || ''}
                                onChangeText={(val) => handleFilterChange('external_id', val)}
                                autoCapitalize='none'
                                autoCorrect={false}
                            />

                            <Text style={styles.filterLabel}>Years Available</Text>
                            <ClearableTextInput
                                style={styles.filterInput}
                                placeholder="e.g., 2010-2020"
                                placeholderTextColor="gray"
                                value={filters.years_available || ''}
                                onChangeText={(val) => handleFilterChange('years_available', val)}
                                autoCapitalize='none'
                                autoCorrect={false}
                            />
                        </View>

                        {/* Status Filters */}
                        <View style={styles.filterSection}>
                            <Text style={styles.sectionTitle}>Status Filters</Text>
                            
                            <View style={styles.filterRow}>
                                <View style={styles.filterHalf}>
                                    <Text style={styles.filterLabel}>Available</Text>
                                    <View style={styles.segmentControl}>
                                        <TouchableOpacity
                                            style={[styles.segment, filters.available === 'all' && styles.segmentActive]}
                                            onPress={() => handleFilterChange('available', 'all')}
                                        >
                                            <Text style={[styles.segmentText, filters.available === 'all' && styles.segmentTextActive]}>All</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.segment, filters.available === true && styles.segmentActive]}
                                            onPress={() => handleFilterChange('available', true)}
                                        >
                                            <Text style={[styles.segmentText, filters.available === true && styles.segmentTextActive]}>Yes</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.segment, filters.available === false && styles.segmentActive]}
                                            onPress={() => handleFilterChange('available', false)}
                                        >
                                            <Text style={[styles.segmentText, filters.available === false && styles.segmentTextActive]}>No</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={styles.filterHalf}>
                                    <Text style={styles.filterLabel}>Base Plate</Text>
                                    <View style={styles.segmentControl}>
                                        <TouchableOpacity
                                            style={[styles.segment, filters.base === 'all' && styles.segmentActive]}
                                            onPress={() => handleFilterChange('base', 'all')}
                                        >
                                            <Text style={[styles.segmentText, filters.base === 'all' && styles.segmentTextActive]}>All</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.segment, filters.base === true && styles.segmentActive]}
                                            onPress={() => handleFilterChange('base', true)}
                                        >
                                            <Text style={[styles.segmentText, filters.base === true && styles.segmentTextActive]}>Yes</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.segment, filters.base === false && styles.segmentActive]}
                                            onPress={() => handleFilterChange('base', false)}
                                        >
                                            <Text style={[styles.segmentText, filters.base === false && styles.segmentTextActive]}>No</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.filterRow}>
                                <View style={styles.filterHalf}>
                                    <Text style={styles.filterLabel}>Embossed</Text>
                                    <View style={styles.segmentControl}>
                                        <TouchableOpacity
                                            style={[styles.segment, filters.embossed === 'all' && styles.segmentActive]}
                                            onPress={() => handleFilterChange('embossed', 'all')}
                                        >
                                            <Text style={[styles.segmentText, filters.embossed === 'all' && styles.segmentTextActive]}>All</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.segment, filters.embossed === true && styles.segmentActive]}
                                            onPress={() => handleFilterChange('embossed', true)}
                                        >
                                            <Text style={[styles.segmentText, filters.embossed === true && styles.segmentTextActive]}>Yes</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.segment, filters.embossed === false && styles.segmentActive]}
                                            onPress={() => handleFilterChange('embossed', false)}
                                        >
                                            <Text style={[styles.segmentText, filters.embossed === false && styles.segmentTextActive]}>No</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={styles.filterHalf}>
                                    <Text style={styles.filterLabel}>County Plate</Text>
                                    <View style={styles.segmentControl}>
                                        <TouchableOpacity
                                            style={[styles.segment, filters.county === 'all' && styles.segmentActive]}
                                            onPress={() => handleFilterChange('county', 'all')}
                                        >
                                            <Text style={[styles.segmentText, filters.county === 'all' && styles.segmentTextActive]}>All</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.segment, filters.county === true && styles.segmentActive]}
                                            onPress={() => handleFilterChange('county', true)}
                                        >
                                            <Text style={[styles.segmentText, filters.county === true && styles.segmentTextActive]}>Yes</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.segment, filters.county === false && styles.segmentActive]}
                                            onPress={() => handleFilterChange('county', false)}
                                        >
                                            <Text style={[styles.segmentText, filters.county === false && styles.segmentTextActive]}>No</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Design Filters */}
                        <View style={styles.filterSection}>
                            <Text style={styles.sectionTitle}>Design Filters</Text>
                            
                            <Text style={styles.filterLabel}>Background Color</Text>
                            <TouchableOpacity 
                                style={styles.colorPickerButton} 
                                onPress={() => setBackgroundColorModalOpen(true)}
                            >
                                <View style={styles.dropdownContent}>
                                    {filters.primary_background_color && (
                                        <View style={[styles.colorDotSmall, { backgroundColor: getColorHex(filters.primary_background_color) }]} />
                                    )}
                                    <Text style={[
                                        styles.colorPickerText,
                                        filters.primary_background_color && styles.colorPickerTextActive
                                    ]}>
                                        {filters.primary_background_color || 'Select Background Color'}
                                    </Text>
                                </View>
                                <Text style={styles.colorPickerArrow}>▼</Text>
                            </TouchableOpacity>

                            <Text style={styles.filterLabel}>All Colors (Multi-Select)</Text>
                            <TouchableOpacity 
                                style={styles.colorPickerButton} 
                                onPress={() => setColorsModalOpen(true)}
                            >
                                <Text style={[
                                    styles.colorPickerText,
                                    filters.colors && filters.colors.length > 0 && styles.colorPickerTextActive
                                ]}>
                                    {filters.colors && filters.colors.length > 0 
                                        ? filters.colors.join(', ') 
                                        : 'Select Colors'}
                                </Text>
                                <Text style={styles.colorPickerArrow}>▼</Text>
                            </TouchableOpacity>

                            <View style={styles.filterRow}>
                                <View style={styles.filterHalf}>
                                    <Text style={styles.filterLabel}>Number Font</Text>
                                    <TouchableOpacity 
                                        style={styles.colorPickerButton} 
                                        onPress={() => setPatternFontModalOpen(true)}
                                    >
                                        <Text style={[
                                            styles.colorPickerText,
                                            filters.pattern_font && styles.colorPickerTextActive
                                        ]}>
                                            {filters.pattern_font || 'Select Font'}
                                        </Text>
                                        <Text style={styles.colorPickerArrow}>▼</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.filterHalf}>
                                    <Text style={styles.filterLabel}>State Font</Text>
                                    <TouchableOpacity 
                                        style={styles.colorPickerButton} 
                                        onPress={() => setStateFontModalOpen(true)}
                                    >
                                        <Text style={[
                                            styles.colorPickerText,
                                            filters.state_font && styles.colorPickerTextActive
                                        ]}>
                                            {filters.state_font || 'Select Font'}
                                        </Text>
                                        <Text style={styles.colorPickerArrow}>▼</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.filterRow}>
                                <View style={styles.filterHalf}>
                                    <Text style={styles.filterLabel}>Number Color</Text>
                                    <TouchableOpacity 
                                        style={styles.colorPickerButton} 
                                        onPress={() => setPatternColorModalOpen(true)}
                                    >
                                        <View style={styles.dropdownContent}>
                                            {filters.pattern_color && (
                                                <View style={[styles.colorDotSmall, { backgroundColor: getColorHex(filters.pattern_color) }]} />
                                            )}
                                            <Text style={[
                                                styles.colorPickerText,
                                                filters.pattern_color && styles.colorPickerTextActive
                                            ]}>
                                                {filters.pattern_color || 'Select Color'}
                                            </Text>
                                        </View>
                                        <Text style={styles.colorPickerArrow}>▼</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.filterHalf}>
                                    <Text style={styles.filterLabel}>State Color</Text>
                                    <TouchableOpacity 
                                        style={styles.colorPickerButton} 
                                        onPress={() => setStateColorModalOpen(true)}
                                    >
                                        <View style={styles.dropdownContent}>
                                            {filters.state_color && (
                                                <View style={[styles.colorDotSmall, { backgroundColor: getColorHex(filters.state_color) }]} />
                                            )}
                                            <Text style={[
                                                styles.colorPickerText,
                                                filters.state_color && styles.colorPickerTextActive
                                            ]}>
                                                {filters.state_color || 'Select Color'}
                                            </Text>
                                        </View>
                                        <Text style={styles.colorPickerArrow}>▼</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* Additional Filters */}
                        <View style={styles.filterSection}>
                            <Text style={styles.sectionTitle}>Additional Filters</Text>
                            
                            <Text style={styles.filterLabel}>Tags</Text>
                            <ClearableTextInput
                                style={styles.filterInput}
                                placeholder="Search by tags"
                                placeholderTextColor="gray"
                                value={filters.tags || ''}
                                onChangeText={(val) => handleFilterChange('tags', val)}
                                autoCapitalize='none'
                                autoCorrect={false}
                            />

                            <Text style={styles.filterLabel}>Text on Plate</Text>
                            <ClearableTextInput
                                style={styles.filterInput}
                                placeholder="Search by text"
                                placeholderTextColor="gray"
                                value={filters.text || ''}
                                onChangeText={(val) => handleFilterChange('text', val)}
                                autoCapitalize='none'
                                autoCorrect={false}
                            />

                            <Text style={styles.filterLabel}>Notes</Text>
                            <ClearableTextInput
                                style={styles.filterInput}
                                placeholder="Search by notes"
                                placeholderTextColor="gray"
                                value={filters.notes || ''}
                                onChangeText={(val) => handleFilterChange('notes', val)}
                                autoCapitalize='none'
                                autoCorrect={false}
                            />
                        </View>

                        {searching && (
                            <View style={styles.searchingContainer}>
                                <Text style={styles.searchingText}>Searching...</Text>
                            </View>
                        )}
                        {!searching && hasActiveFilters && results.length > 0 && (
                            <Text style={styles.resultsCount}>
                                {results.length} plate{results.length !== 1 ? 's' : ''} found
                                {results.length === 200 && ' (showing first 200)'}
                            </Text>
                        )}
                    </View>
                </ScrollView>
            </Animated.View>
            <FlatList
                data={results}
                keyExtractor={item => item.plate_id!.toString()}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                updateCellsBatchingPeriod={50}
                initialNumToRender={20}
                windowSize={10}
                style={styles.list}
                contentContainerStyle={styles.listContainer}
                getItemLayout={(data, index) => ({
                    length: 60, // Approximate height of each item
                    offset: 60 * index,
                    index,
                })}
                ListEmptyComponent={
                    hasActiveFilters ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No plates found</Text>
                            <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
                        </View>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Filter license plates</Text>
                            <Text style={styles.emptySubtext}>Use the filters above to search</Text>
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

            {/* All Colors Picker Modal (Multi-Select) */}
            <Modal visible={colorsModalOpen} transparent animationType="slide" onRequestClose={() => setColorsModalOpen(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.colorModalContent}>
                        <Text style={styles.colorModalTitle}>Select Colors</Text>
                        <Text style={styles.colorModalSubtitle}>
                            {filters.colors && filters.colors.length > 0 
                                ? `${filters.colors.length} color${filters.colors.length !== 1 ? 's' : ''} selected`
                                : 'Select one or more colors'}
                        </Text>
                        <ScrollView style={styles.colorList} showsVerticalScrollIndicator={true}>
                            {COLOR_OPTIONS.map(color => (
                                <TouchableOpacity 
                                    key={color} 
                                    style={styles.colorItem} 
                                    onPress={() => toggleColor(color)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.colorItemContent}>
                                        <View style={[styles.colorDot, { backgroundColor: getColorHex(color) }]} />
                                        <Text style={styles.colorItemText}>{color}</Text>
                                    </View>
                                    {filters.colors && filters.colors.includes(color) && (
                                        <Text style={styles.colorCheckmark}>✓</Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <View style={styles.colorModalActions}>
                            <TouchableOpacity 
                                style={[styles.colorModalButton, styles.colorModalButtonSecondary]} 
                                onPress={() => handleFilterChange('colors', [])}
                            >
                                <Text style={styles.colorModalButtonTextSecondary}>Clear All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.colorModalButton, styles.colorModalButtonPrimary]} 
                                onPress={() => setColorsModalOpen(false)}
                            >
                                <Text style={styles.colorModalButtonText}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Background Color Modal (Single Select) */}
            <Modal visible={backgroundColorModalOpen} transparent animationType="slide" onRequestClose={() => setBackgroundColorModalOpen(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.colorModalContent}>
                        <Text style={styles.colorModalTitle}>Select Background Color</Text>
                        <ScrollView style={styles.colorList} showsVerticalScrollIndicator={true}>
                            {COLOR_OPTIONS.map(color => (
                                <TouchableOpacity 
                                    key={color} 
                                    style={styles.colorItem} 
                                    onPress={() => { handleFilterChange('primary_background_color', color); setBackgroundColorModalOpen(false); }}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.colorItemContent}>
                                        <View style={[styles.colorDot, { backgroundColor: getColorHex(color) }]} />
                                        <Text style={styles.colorItemText}>{color}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <View style={styles.colorModalActions}>
                            <TouchableOpacity 
                                style={[styles.colorModalButton, styles.colorModalButtonSecondary]} 
                                onPress={() => { handleFilterChange('primary_background_color', ''); setBackgroundColorModalOpen(false); }}
                            >
                                <Text style={styles.colorModalButtonTextSecondary}>Clear</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.colorModalButton, styles.colorModalButtonPrimary]} 
                                onPress={() => setBackgroundColorModalOpen(false)}
                            >
                                <Text style={styles.colorModalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Number Font Modal */}
            <Modal visible={patternFontModalOpen} transparent animationType="slide" onRequestClose={() => setPatternFontModalOpen(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.smallModalContent}>
                        <Text style={styles.colorModalTitle}>Select Number Font</Text>
                        <View style={styles.optionsList}>
                            {FONT_OPTIONS.map(font => (
                                <TouchableOpacity 
                                    key={font} 
                                    style={styles.optionItem} 
                                    onPress={() => { handleFilterChange('pattern_font', font); setPatternFontModalOpen(false); }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.optionItemText}>{font}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={styles.colorModalActions}>
                            <TouchableOpacity 
                                style={[styles.colorModalButton, styles.colorModalButtonSecondary]} 
                                onPress={() => { handleFilterChange('pattern_font', ''); setPatternFontModalOpen(false); }}
                            >
                                <Text style={styles.colorModalButtonTextSecondary}>Clear</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.colorModalButton, styles.colorModalButtonPrimary]} 
                                onPress={() => setPatternFontModalOpen(false)}
                            >
                                <Text style={styles.colorModalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* State Font Modal */}
            <Modal visible={stateFontModalOpen} transparent animationType="slide" onRequestClose={() => setStateFontModalOpen(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.smallModalContent}>
                        <Text style={styles.colorModalTitle}>Select State Font</Text>
                        <View style={styles.optionsList}>
                            {FONT_OPTIONS.map(font => (
                                <TouchableOpacity 
                                    key={font} 
                                    style={styles.optionItem} 
                                    onPress={() => { handleFilterChange('state_font', font); setStateFontModalOpen(false); }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.optionItemText}>{font}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={styles.colorModalActions}>
                            <TouchableOpacity 
                                style={[styles.colorModalButton, styles.colorModalButtonSecondary]} 
                                onPress={() => { handleFilterChange('state_font', ''); setStateFontModalOpen(false); }}
                            >
                                <Text style={styles.colorModalButtonTextSecondary}>Clear</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.colorModalButton, styles.colorModalButtonPrimary]} 
                                onPress={() => setStateFontModalOpen(false)}
                            >
                                <Text style={styles.colorModalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Number Color Modal */}
            <Modal visible={patternColorModalOpen} transparent animationType="slide" onRequestClose={() => setPatternColorModalOpen(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.colorModalContent}>
                        <Text style={styles.colorModalTitle}>Select Number Color</Text>
                        <ScrollView style={styles.colorList} showsVerticalScrollIndicator={true}>
                            {COLOR_OPTIONS.map(color => (
                                <TouchableOpacity 
                                    key={color} 
                                    style={styles.colorItem} 
                                    onPress={() => { handleFilterChange('pattern_color', color); setPatternColorModalOpen(false); }}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.colorItemContent}>
                                        <View style={[styles.colorDot, { backgroundColor: getColorHex(color) }]} />
                                        <Text style={styles.colorItemText}>{color}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <View style={styles.colorModalActions}>
                            <TouchableOpacity 
                                style={[styles.colorModalButton, styles.colorModalButtonSecondary]} 
                                onPress={() => { handleFilterChange('pattern_color', ''); setPatternColorModalOpen(false); }}
                            >
                                <Text style={styles.colorModalButtonTextSecondary}>Clear</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.colorModalButton, styles.colorModalButtonPrimary]} 
                                onPress={() => setPatternColorModalOpen(false)}
                            >
                                <Text style={styles.colorModalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* State Color Modal */}
            <Modal visible={stateColorModalOpen} transparent animationType="slide" onRequestClose={() => setStateColorModalOpen(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.colorModalContent}>
                        <Text style={styles.colorModalTitle}>Select State Color</Text>
                        <ScrollView style={styles.colorList} showsVerticalScrollIndicator={true}>
                            {COLOR_OPTIONS.map(color => (
                                <TouchableOpacity 
                                    key={color} 
                                    style={styles.colorItem} 
                                    onPress={() => { handleFilterChange('state_color', color); setStateColorModalOpen(false); }}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.colorItemContent}>
                                        <View style={[styles.colorDot, { backgroundColor: getColorHex(color) }]} />
                                        <Text style={styles.colorItemText}>{color}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <View style={styles.colorModalActions}>
                            <TouchableOpacity 
                                style={[styles.colorModalButton, styles.colorModalButtonSecondary]} 
                                onPress={() => { handleFilterChange('state_color', ''); setStateColorModalOpen(false); }}
                            >
                                <Text style={styles.colorModalButtonTextSecondary}>Clear</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.colorModalButton, styles.colorModalButtonPrimary]} 
                                onPress={() => setStateColorModalOpen(false)}
                            >
                                <Text style={styles.colorModalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

// Helper function to get color hex values for visual display
const getColorHex = (colorName: string): string => {
    const colorMap: { [key: string]: string } = {
        'Red': '#FF3B30',
        'Orange': '#FF9500',
        'Yellow': '#FFCC00',
        'Green': '#34C759',
        'Blue': '#007AFF',
        'Dark Blue': '#003f87',
        'Purple': '#AF52DE',
        'Brown': '#A2845E',
        'White': '#FFFFFF',
        'Gray': '#8E8E93',
        'Black': '#000000',
    };
    return colorMap[colorName] || '#999999';
};
export default HomePage;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5'
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    headerButtons: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    clearButton: {
        backgroundColor: '#dc3545',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        shadowColor: '#dc3545',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    clearButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
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
        minWidth: 90,
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
        marginBottom: 16,
        overflow: 'hidden',
        backgroundColor: '#fff',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    filtersScroll: {
        flex: 1,
    },
    filtersScrollContent: {
        flexGrow: 1,
        paddingBottom: 16,
    },
    filtersContent: {
        padding: 16,
    },
    filterSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#007bff',
        marginBottom: 12,
        borderBottomWidth: 2,
        borderBottomColor: '#007bff',
        paddingBottom: 6,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
        marginBottom: 6,
        marginTop: 8,
    },
    filterInput: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        backgroundColor: '#fafafa',
        marginBottom: 4,
    },
    filterRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 4,
    },
    filterHalf: {
        flex: 1,
    },
    segmentControl: {
        flexDirection: 'row',
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        marginBottom: 4,
    },
    segment: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: '#fafafa',
        alignItems: 'center',
        justifyContent: 'center',
        borderRightWidth: 1,
        borderRightColor: '#e0e0e0',
    },
    segmentActive: {
        backgroundColor: '#007bff',
    },
    segmentText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
    },
    segmentTextActive: {
        color: '#fff',
    },
    colorPickerButton: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#fafafa',
        marginBottom: 4,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    colorPickerText: {
        fontSize: 15,
        color: '#999',
        flex: 1,
    },
    colorPickerTextActive: {
        color: '#333',
        fontWeight: '500',
    },
    colorPickerArrow: {
        fontSize: 12,
        color: '#999',
        marginLeft: 8,
    },
    dropdownContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    colorDotSmall: {
        width: 16,
        height: 16,
        borderRadius: 8,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    colorModalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        maxHeight: '70%',
        width: '100%',
    },
    colorModalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#333',
        marginBottom: 6,
    },
    colorModalSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    colorList: {
        maxHeight: 320,
        marginBottom: 16,
    },
    colorItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fff',
    },
    colorItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    colorDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    colorItemText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    colorCheckmark: {
        fontSize: 20,
        color: '#007bff',
        fontWeight: '700',
    },
    colorModalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    colorModalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    colorModalButtonPrimary: {
        backgroundColor: '#007bff',
    },
    colorModalButtonSecondary: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#007bff',
    },
    colorModalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    colorModalButtonTextSecondary: {
        color: '#007bff',
        fontSize: 16,
        fontWeight: '700',
    },
    smallModalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        width: '100%',
    },
    optionsList: {
        marginVertical: 12,
    },
    optionItem: {
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fff',
    },
    optionItemText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    list: {
        flex: 1,
    },
    listContainer: {
        flexGrow: 1,
        paddingBottom: 80, // Space for FAB
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

