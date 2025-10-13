import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../redux/store';
import { updatePatternThunk } from '../../redux/patterns/patternsSlice';

type RouteProp = {
  params: {
    patternId: number;
  };
};

const UpdatePattern = () => {
  const route = useRoute<RouteProp>();
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { patternId } = route.params;

  // Get pattern from Redux state
  const patternData = useSelector((state: RootState) => state.patterns.byId[patternId]);

  // Form state
  const [externalId, setExternalId] = useState('');
  const [serialId, setSerialId] = useState('');
  const [uniqueId, setUniqueId] = useState('');
  const [pattern, setPattern] = useState('');
  const [separator, setSeparator] = useState('');
  const [type, setType] = useState('');
  const [seriesYears, setSeriesYears] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Initialize form with pattern data
  useEffect(() => {
    if (patternData) {
      setExternalId(patternData.external_id || '');
      setSerialId(patternData.serial_id || '');
      setUniqueId(patternData.unique_id || '');
      setPattern(patternData.pattern || '');
      setSeparator(patternData.separator || '');
      setType(patternData.type || '');
      setSeriesYears(patternData.series_years || '');
    }
  }, [patternData]);

  const handleUpdate = async () => {
    if (!patternData) {
      setErrorMsg('Pattern data is not available.');
      return;
    }

    setErrorMsg('');
    setSaving(true);

    try {
      await dispatch(
        updatePatternThunk({
          pattern_id: patternId,
          plate_id: patternData.plate_id,
          external_id: externalId || undefined,
          serial_id: serialId || undefined,
          unique_id: uniqueId || undefined,
          pattern,
          separator: separator || undefined,
          type: type || undefined,
          series_years: seriesYears || undefined,
        })
      ).unwrap();

      navigation.goBack();
    } catch (e: any) {
      setErrorMsg(e?.message || 'Failed to update pattern.');
    } finally {
      setSaving(false);
    }
  };

  if (!patternData) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading pattern...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerCard}>
        <Text style={styles.title}>Update Pattern</Text>
        {patternData && (
          <Text style={styles.subTitle}>
            Pattern: {patternData.pattern}
          </Text>
        )}
      </View>

      <View style={styles.card}>

      {/* External ID */}
      <Text style={styles.label}>External ID</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., US-California-1"
        placeholderTextColor="#999"
        value={externalId}
        onChangeText={setExternalId}
      />

      {/* Serial ID */}
      <Text style={styles.label}>Serial ID</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 1, 2, 3"
        placeholderTextColor="#999"
        value={serialId}
        onChangeText={setSerialId}
      />

      {/* Unique ID */}
      <Text style={styles.label}>Unique ID</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., US-California-1-1"
        placeholderTextColor="#999"
        value={uniqueId}
        onChangeText={setUniqueId}
      />

      {/* Pattern */}
      <Text style={styles.label}>Pattern *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., #aaa###, ######a#"
        placeholderTextColor="#999"
        value={pattern}
        onChangeText={setPattern}
      />

      {/* Separator */}
      <Text style={styles.label}>Separator</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., -, (space), or leave empty"
        placeholderTextColor="#999"
        value={separator}
        onChangeText={setSeparator}
      />

      {/* Type */}
      <Text style={styles.label}>Type</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., Passenger, Truck, Trailer"
        placeholderTextColor="#999"
        value={type}
        onChangeText={setType}
      />

      {/* Series Years */}
      <Text style={styles.label}>Years</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 2011-present, 1998-2000"
        placeholderTextColor="#999"
        value={seriesYears}
        onChangeText={setSeriesYears}
      />

        {/* Error message */}
        {errorMsg ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={handleUpdate}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Updating...' : 'Update Pattern'}
          </Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  loading: {
    padding: 20,
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
  headerCard: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 10,
    borderRadius: 10,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subTitle: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 10,
    borderRadius: 10,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#333',
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  errorText: {
    color: '#721c24',
    textAlign: 'center',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#6c757d',
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default UpdatePattern;