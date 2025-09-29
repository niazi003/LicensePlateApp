import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
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
  const [pattern, setPattern] = useState('');
  const [type, setType] = useState('');
  const [seperator, setSeperator] = useState('');
  const [seriesYears, setSeriesYears] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Initialize form with pattern data
  useEffect(() => {
    if (patternData) {
      setPattern(patternData.pattern || '');
      setType(patternData.type || '');
      setSeperator(patternData.seperator || '');
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
          pattern,
          type,
          seperator,
          series_years: seriesYears,
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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Update Pattern</Text>

      {/* Pattern */}
      <Text style={styles.label}>Pattern</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter pattern"
        placeholderTextColor="#999"
        value={pattern}
        onChangeText={setPattern}
      />

      {/* Type */}
      <Text style={styles.label}>Type</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter type"
        placeholderTextColor="#999"
        value={type}
        onChangeText={setType}
      />

      {/* Separator */}
      <Text style={styles.label}>Separator</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter separator"
        placeholderTextColor="#999"
        value={seperator}
        onChangeText={setSeperator}
      />

      {/* Series Years */}
      <Text style={styles.label}>Series Years</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter series years"
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 16 },
  loading: { padding: 20, textAlign: 'center', fontSize: 16 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  errorContainer: { backgroundColor: '#f8d7da', padding: 12, borderRadius: 8, marginBottom: 16 },
  errorText: { color: '#721c24', textAlign: 'center' },
  saveButton: { backgroundColor: '#007bff', padding: 16, borderRadius: 8, alignItems: 'center' },
  disabledButton: { backgroundColor: '#6c757d' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default UpdatePattern;