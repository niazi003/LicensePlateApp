import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../redux/store';
import { createPlate } from '../../redux/plates/platesSlice';
import { useNavigation } from '@react-navigation/native';

const AddPlate = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();

  // Form state
  const [externalId, setExternalId] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [country, setCountry] = useState('');
  const [name, setName] = useState('');
  const [yearsAvailable, setYearsAvailable] = useState('');
  const [available, setAvailable] = useState(false);
  const [base, setBase] = useState(false);
  const [primaryBackgroundColors, setPrimaryBackgroundColors] = useState('');
  const [allColors, setAllColors] = useState('');
  const [backgroundDesc, setBackgroundDesc] = useState('');
  const [textField, setTextField] = useState('');
  const [featuresTags, setFeaturesTags] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState('');

  const handleSave = async () => {
    if (!name) {
      Alert.alert('Validation', 'Plate name is required');
      return;
    }
    try {
      await dispatch(
        createPlate({
          external_id: externalId,
          state: stateVal,
          country,
          name,
          years_available: yearsAvailable,
          available,
          base,
          primary_background_colors: primaryBackgroundColors,
          all_colors: allColors,
          background_desc: backgroundDesc,
          text_field: textField,
          features_tags: featuresTags,
          description,
          notes,
          images,
        }),
      ).unwrap();
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add plate');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add New Plate</Text>

      {/* Inputs */}
      <TextInput style={styles.input} placeholder="External ID" value={externalId} onChangeText={setExternalId} />
      <TextInput style={styles.input} placeholder="State" value={stateVal} onChangeText={setStateVal} />
      <TextInput style={styles.input} placeholder="Country" value={country} onChangeText={setCountry} />
      <TextInput style={styles.input} placeholder="Name *" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Years Available" value={yearsAvailable} onChangeText={setYearsAvailable} />
      <TextInput style={styles.input} placeholder="Primary Background Colors" value={primaryBackgroundColors} onChangeText={setPrimaryBackgroundColors} />
      <TextInput style={styles.input} placeholder="All Colors" value={allColors} onChangeText={setAllColors} />
      <TextInput style={styles.input} placeholder="Background Description" value={backgroundDesc} onChangeText={setBackgroundDesc} />
      <TextInput style={styles.input} placeholder="Text Field" value={textField} onChangeText={setTextField} />
      <TextInput style={styles.input} placeholder="Features Tags" value={featuresTags} onChangeText={setFeaturesTags} />
      <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} />
      <TextInput style={styles.input} placeholder="Notes" value={notes} onChangeText={setNotes} />
      <TextInput style={styles.input} placeholder="Images (URIs, comma separated)" value={images} onChangeText={setImages} />

      {/* Save */}
      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save Plate</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default AddPlate;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    padding: 12, marginBottom: 12, fontSize: 16,
  },
  button: { backgroundColor: '#007bff', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
