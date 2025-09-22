import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  Modal,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../redux/store';
import { createPlate } from '../../redux/plates/platesSlice';
import { useNavigation } from '@react-navigation/native';

const AddPlate = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();

  // Form state
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

  // Task 4 UI additions
  const [font, setFont] = useState<'Serif' | 'Sans-Serif' | 'Script' | ''>('');
  const [stateLocation, setStateLocation] = useState<'Top' | 'Bottom' | ''>('');
  const [colorsOpen, setColorsOpen] = useState(false);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [showNotes, setShowNotes] = useState(false);
  const [showBackground, setShowBackground] = useState(false);

  const COLOR_OPTIONS = ['Red','Blue','Green','Yellow','Black','White','Orange','Purple','Gray','Brown'];

  const toggleColor = (c: string) => {
    setSelectedColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const composeFeaturesTags = (): string => {
    const metas = [
      font ? `font=${font}` : null,
      stateLocation ? `state_location=${stateLocation}` : null,
    ].filter(Boolean) as string[];
    const baseTags = featuresTags?.trim() ? [featuresTags.trim()] : [];
    return [...metas, ...baseTags].join(';');
  };

  const imagesArray = (images || '').split(',').map(s => s.trim()).filter(Boolean);
  const [newImageUri, setNewImageUri] = useState('');
  const addImageUri = () => {
    const uri = newImageUri.trim();
    if (!uri) return;
    const next = [...imagesArray, uri].join(',');
    setImages(next);
    setNewImageUri('');
  };
  const removeImageAt = (idx: number) => {
    const next = imagesArray.filter((_, i) => i !== idx).join(',');
    setImages(next);
  };

  const handleSave = async () => {
    if (!name) {
      Alert.alert('Validation', 'Plate name is required');
      return;
    }
    try {
      await dispatch(
        createPlate({
          state: stateVal,
          country,
          name,
          years_available: yearsAvailable,
          available,
          base,
          primary_background_colors: primaryBackgroundColors,
          all_colors: selectedColors.length ? selectedColors.join(',') : allColors,
          background_desc: backgroundDesc,
          text_field: textField,
          features_tags: composeFeaturesTags(),
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
      <TextInput style={styles.input} placeholder="State" value={stateVal} onChangeText={setStateVal} />
      <TextInput style={styles.input} placeholder="Country" value={country} onChangeText={setCountry} />
      <TextInput style={styles.input} placeholder="Name *" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Years Available" value={yearsAvailable} onChangeText={setYearsAvailable} />

      {/* Booleans as switches */}
      <View style={styles.rowBetween}>
        <Text style={styles.label}>Available</Text>
        <Switch value={available} onValueChange={setAvailable} />
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.label}>Base</Text>
        <Switch value={base} onValueChange={setBase} />
      </View>

      <TextInput style={styles.input} placeholder="Primary Background Colors" value={primaryBackgroundColors} onChangeText={setPrimaryBackgroundColors} />
      <TouchableOpacity style={styles.select} onPress={() => setColorsOpen(true)}>
        <Text style={styles.selectText}>{selectedColors.length ? selectedColors.join(', ') : (allColors || 'Select Colors (multi)')}</Text>
      </TouchableOpacity>

      {/* Font pills */}
      <View style={styles.rowBetween}>
        <Text style={styles.label}>Font</Text>
        <View style={styles.pillGroup}>
          {['Serif','Sans-Serif','Script'].map(f => (
            <TouchableOpacity key={f} style={[styles.pill, (font===f) && styles.pillActive]} onPress={() => setFont(f as any)}>
              <Text style={[styles.pillText, (font===f) && styles.pillTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* State location pills */}
      <View style={styles.rowBetween}>
        <Text style={styles.label}>State Location</Text>
        <View style={styles.pillGroup}>
          {['Top','Bottom'].map(sl => (
            <TouchableOpacity key={sl} style={[styles.pill, (stateLocation===sl) && styles.pillActive]} onPress={() => setStateLocation(sl as any)}>
              <Text style={[styles.pillText, (stateLocation===sl) && styles.pillTextActive]}>{sl}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Expandable sections */}
      <TouchableOpacity style={styles.expandHeader} onPress={() => setShowBackground(s => !s)}>
        <Text style={styles.sectionTitle}>Background {showBackground ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {showBackground && (
        <TextInput style={[styles.input, {height: 100, textAlignVertical: 'top'}]} multiline placeholder="Background Description" value={backgroundDesc} onChangeText={setBackgroundDesc} />
      )}

      <TextInput style={styles.input} placeholder="Text Field" value={textField} onChangeText={setTextField} />
      <TextInput style={styles.input} placeholder="Features Tags (additional)" value={featuresTags} onChangeText={setFeaturesTags} />
      <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} />

      <TouchableOpacity style={styles.expandHeader} onPress={() => setShowNotes(s => !s)}>
        <Text style={styles.sectionTitle}>Notes {showNotes ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {showNotes && (
        <TextInput style={[styles.input, {height: 100, textAlignVertical: 'top'}]} multiline placeholder="Notes" value={notes} onChangeText={setNotes} />
      )}

      {/* Images management */}
      <Text style={styles.label}>Images</Text>
      {imagesArray.map((uri, idx) => (
        <View key={`${uri}-${idx}`} style={styles.rowBetween}>
          <Text numberOfLines={1} style={{flex: 1, marginRight: 8}}>{uri}</Text>
          <TouchableOpacity onPress={() => removeImageAt(idx)}>
            <Text style={{color: '#dc3545'}}>Remove</Text>
          </TouchableOpacity>
        </View>
      ))}
      <View style={{flexDirection:'row', alignItems:'center'}}>
        <TextInput style={[styles.input, {flex:1, marginBottom:0}]}
          placeholder="New Image URI" value={newImageUri} onChangeText={setNewImageUri} />
        <TouchableOpacity style={[styles.button, {marginLeft: 8, paddingHorizontal: 12}]} onPress={addImageUri}>
          <Text style={styles.buttonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Save */}
      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save Plate</Text>
      </TouchableOpacity>
      {/* Colors modal */}
      <Modal visible={colorsOpen} transparent animationType="slide" onRequestClose={() => setColorsOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Select Colors</Text>
            <ScrollView style={{maxHeight: 240}}>
              {COLOR_OPTIONS.map(c => (
                <TouchableOpacity key={c} style={styles.colorItem} onPress={() => toggleColor(c)}>
                  <Text style={{flex:1}}>{c}</Text>
                  <Text>{selectedColors.includes(c) ? '✓' : ''}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={{flexDirection:'row', marginTop: 10}}>
              <TouchableOpacity style={[styles.button, {flex:1, backgroundColor:'#6c757d'}]} onPress={() => { setSelectedColors([]); }}>
                <Text style={styles.buttonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, {flex:1}]} onPress={() => setColorsOpen(false)}>
                <Text style={styles.buttonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  label: { fontSize: 16, fontWeight: '500' },
  select: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  selectText: { color: '#333' },
  pillGroup: { flexDirection: 'row' },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#ccc', borderRadius: 16, marginLeft: 6 },
  pillActive: { backgroundColor: '#007bff', borderColor: '#007bff' },
  pillText: { color: '#333' },
  pillTextActive: { color: '#fff' },
  expandHeader: { paddingVertical: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  button: { backgroundColor: '#007bff', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 20, marginBottom: 28 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', padding: 16 },
  modalContent: { backgroundColor: '#fff', borderRadius: 10, padding: 16 },
  colorItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
});
