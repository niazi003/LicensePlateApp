// src/screens/plate/ImportPlatesCSV.tsx
import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { pick, types, keepLocalCopy } from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import Papa from 'papaparse';
import db from '../../database/db';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../redux/store';
import { fetchPlates } from '../../redux/plates/platesSlice';

const normalizeRow = (rawRow: any) => {
  const lower: any = {};
  Object.keys(rawRow || {}).forEach(k => {
    lower[k.toLowerCase().trim()] = rawRow[k];
  });

  return {
    external_id: (lower['external_id'] || '').toString().trim(),
    state: (lower['state'] || '').toString().trim(),
    country: (lower['country'] || '').toString().trim(),
    name: (lower['name'] || '').toString().trim(),
    years_available: (lower['years_available'] || '').toString().trim(),
    available: lower['available']?.toString().trim() === '1' ? 1 : 0,
    base: lower['base']?.toString().trim() === '1' ? 1 : 0,
    primary_background_colors: (lower['primary_background_colors'] || '').toString().trim(),
    all_colors: (lower['all_colors'] || '').toString().trim(),
    background_desc: (lower['background_desc'] || '').toString().trim(),
    text_field: (lower['text_field'] || '').toString().trim(),
    features_tags: (lower['features_tags'] || '').toString().trim(),
    description: (lower['description'] || '').toString().trim(),
    notes: (lower['notes'] || '').toString().trim(),
    images: (lower['images'] || '').toString().trim(),
  };
};

export default function ImportPlatesCSV() {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  const handlePick = async () => {
    try {
      setLoading(true);

      const picked = await pick({
        type: [types.plainText, types.csv, types.allFiles],
        allowMultiSelection: false,
        mode: 'import',
        allowVirtualFiles: true,
      });

      const file = Array.isArray(picked) ? picked[0] : picked;
      if (!file?.uri) throw new Error('No file selected');

      const copyResult = await keepLocalCopy({
        destination: 'cachesDirectory',
        files: [{ uri: file.uri, fileName: file.name || 'plates.csv' }],
      });
      const localUri = copyResult[0]?.localUri;
      if (!localUri) throw new Error('Local URI not available');

      const path = localUri.startsWith('file://') ? localUri.replace('file://', '') : localUri;
      const content = await RNFS.readFile(path, 'utf8');

      const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
      if (parsed.errors.length) console.warn('CSV parse warnings:', parsed.errors.slice(0, 5));

      const rows = (parsed.data || []).map(normalizeRow).filter(r => r.name);
      if (rows.length === 0) {
        Alert.alert('Import', 'No valid rows found (check headers).');
        return;
      }

      let inserted = 0;
      let skipped = 0;

      for (const row of rows) {
        await new Promise<void>(async (resolve, reject) => {
          const database = await db;
          database.transaction(
            tx => {
              tx.executeSql(
                `INSERT OR IGNORE INTO LicensePlate (
                  external_id, state, country, name, years_available, available, base,
                  primary_background_colors, all_colors, background_desc, text_field,
                  features_tags, description, notes, images
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);`,
                [
                  row.external_id, row.state, row.country, row.name, row.years_available,
                  row.available, row.base, row.primary_background_colors,
                  row.all_colors, row.background_desc, row.text_field, row.features_tags,
                  row.description, row.notes, row.images,
                ],
                (t, res) => {
                  if (res.rowsAffected === 1) inserted++;
                  else skipped++;
                  resolve();
                },
                (t, err) => {
                  console.warn('Insert error for row', row, err);
                  skipped++;
                  resolve();
                  return false;
                }
              );
            },
            err => reject(err),
          );
        });
      }

      await dispatch(fetchPlates());

      Alert.alert(
        'Import finished',
        `Imported: ${inserted}\nSkipped (duplicates/invalid): ${skipped}`,
      );
    } catch (err: any) {
      console.error('Import Error', err);
      if (err?.code === 'OPERATION_CANCELED') return;
      Alert.alert('Error', err.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePick} disabled={loading} style={styles.button}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Import Plates CSV</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 12, width: '100%', alignItems: 'center' },
  button: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    width: '70%',
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});
