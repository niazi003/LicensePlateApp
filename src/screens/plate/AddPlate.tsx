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
  const [embossed, setEmbossed] = useState(false);
  const [primaryBackgroundColors, setPrimaryBackgroundColors] = useState('');
  const [allColors, setAllColors] = useState('');
  const [backgroundDesc, setBackgroundDesc] = useState('');
  const [numFont, setNumFont] = useState('');
  const [numColor, setNumColor] = useState('');
  const [stateFont, setStateFont] = useState('');
  const [stateColor, setStateColor] = useState('');
  const [stateLocation, setStateLocation] = useState<'Top' | 'Bottom' | ''>('');
  const [featuresTags, setFeaturesTags] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [text, setText] = useState('');
  const [county, setCounty] = useState(false);
  const [url, setUrl] = useState(false);

  // UI state
  const [colorsOpen, setColorsOpen] = useState(false);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [showNotes, setShowNotes] = useState(false);
  const [showBackground, setShowBackground] = useState(false);
  const [numFontDropdownOpen, setNumFontDropdownOpen] = useState(false);
  const [stateFontDropdownOpen, setStateFontDropdownOpen] = useState(false);
  const [stateLocationDropdownOpen, setStateLocationDropdownOpen] = useState(false);
  const [numColorDropdownOpen, setNumColorDropdownOpen] = useState(false);
  const [stateColorDropdownOpen, setStateColorDropdownOpen] = useState(false);
  const [primaryBackgroundColorDropdownOpen, setPrimaryBackgroundColorDropdownOpen] = useState(false);

  const COLOR_OPTIONS = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Dark Blue', 'Purple', 'Brown', 'White', 'Gray', 'Black'];
  const FONT_OPTIONS = ['Serif', 'Sans-Serif', 'Script'];
  const STATE_LOCATION_OPTIONS = ['Top', 'Bottom'];

  const toggleColor = (c: string) => {
    setSelectedColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const composeFeaturesTags = (): string => {
    const metas = [
      stateLocation ? `state_location=${stateLocation}` : null,
    ].filter(Boolean) as string[];
    const baseTags = featuresTags?.trim() ? [featuresTags.trim()] : [];
    return [...metas, ...baseTags].join(';');
  };

  const handleSave = async () => {
    if (!name) {
      Alert.alert('Validation', 'Plate name is required');
      return;
    }
    try {
      console.log('AddPlate: Dispatching createPlate action...');
      const result = await dispatch(
        createPlate({
          state: stateVal,
          country,
          name,
          years_available: yearsAvailable,
          available,
          base,
          embossed,
          pattern_font: numFont,
          pattern_color: numColor,
          state_font: stateFont,
          state_color: stateColor,
          state_location: stateLocation,
          primary_background_colors: primaryBackgroundColors,
          all_colors: selectedColors.length ? selectedColors.join(',') : allColors,
          background_description: backgroundDesc,
          text,
          tags: composeFeaturesTags(),
          additional_description: description,
          notes,
          county,
          url,
        }),
      ).unwrap();
      console.log('AddPlate: createPlate result:', result);
      navigation.goBack();
    } catch (err: any) {
      console.error('AddPlate: createPlate error:', err);
      Alert.alert('Error', err.message || 'Failed to add plate');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add New Plate</Text>

      {/* Inputs */}
      <TextInput style={styles.input} placeholder="State" placeholderTextColor={"gray"} value={stateVal} onChangeText={setStateVal} />
      <TextInput style={styles.input} placeholder="Country" placeholderTextColor={"gray"} value={country} onChangeText={setCountry} />
      <TextInput style={styles.input} placeholder="Name *" placeholderTextColor={"gray"} value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Years Available" placeholderTextColor={"gray"} value={yearsAvailable} onChangeText={setYearsAvailable} />

      {/* Booleans as switches */}
      <View style={styles.rowBetween}>
        <Text style={styles.label}>Available</Text>
        <Switch value={available} onValueChange={setAvailable} />
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.label}>Base</Text>
        <Switch value={base} onValueChange={setBase} />
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.label}>Embossed</Text>
        <Switch value={embossed} onValueChange={setEmbossed} />
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.label}>County-specific</Text>
        <Switch value={county} onValueChange={setCounty} />
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.label}>URL Flag</Text>
        <Switch value={url} onValueChange={setUrl} />
      </View>

      <TouchableOpacity style={styles.select} onPress={() => setPrimaryBackgroundColorDropdownOpen(true)}>
        <Text style={styles.selectText}>{primaryBackgroundColors || 'Select Primary Background Color'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.select} onPress={() => setColorsOpen(true)}>
        <Text style={styles.selectText}>{selectedColors.length ? selectedColors.join(', ') : (allColors || 'Select Colors (multi)')}</Text>
      </TouchableOpacity>

      {/* Fonts */}
      <TouchableOpacity style={styles.select} onPress={() => setNumFontDropdownOpen(true)}>
        <Text style={styles.selectText}>{numFont || 'Select Number Font'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.select} onPress={() => setStateFontDropdownOpen(true)}>
        <Text style={styles.selectText}>{stateFont || 'Select State Font'}</Text>
      </TouchableOpacity>
      
      {/* Colors */}
      <TouchableOpacity style={styles.select} onPress={() => setNumColorDropdownOpen(true)}>
        <Text style={styles.selectText}>{numColor || 'Select Number Color'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.select} onPress={() => setStateColorDropdownOpen(true)}>
        <Text style={styles.selectText}>{stateColor || 'Select State Color'}</Text>
      </TouchableOpacity>

      {/* State location dropdown */}
      <TouchableOpacity style={styles.select} onPress={() => setStateLocationDropdownOpen(true)}>
        <Text style={styles.selectText}>{stateLocation || 'Select State Location'}</Text>
      </TouchableOpacity>

      {/* Expandable sections */}
      <TouchableOpacity style={styles.expandHeader} onPress={() => setShowBackground(s => !s)}>
        <Text style={styles.sectionTitle}>Background {showBackground ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {showBackground && (
        <TextInput 
          style={[styles.input, {height: 150, textAlignVertical: 'top'}]} 
          multiline 
          placeholder="Background Description" 
          placeholderTextColor={"gray"} 
          value={backgroundDesc} 
          onChangeText={setBackgroundDesc}
          numberOfLines={6}
        />
      )}

      <TextInput style={styles.input} placeholder="Plate Text" placeholderTextColor={"gray"} value={text} onChangeText={setText} />
      <TextInput style={styles.input} placeholder="Features Tags (additional)" placeholderTextColor={"gray"} value={featuresTags} onChangeText={setFeaturesTags} />
      <TextInput style={styles.input} placeholder="Description" placeholderTextColor={"gray"} value={description} onChangeText={setDescription} />

      <TouchableOpacity style={styles.expandHeader} onPress={() => setShowNotes(s => !s)}>
        <Text style={styles.sectionTitle}>Notes {showNotes ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {showNotes && (
        <TextInput 
          style={[styles.input, {height: 150, textAlignVertical: 'top'}]} 
          multiline 
          placeholder="Notes" 
          placeholderTextColor={"gray"} 
          value={notes} 
          onChangeText={setNotes}
          numberOfLines={6}
        />
      )}

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

      {/* Number Font modal */}
      <Modal visible={numFontDropdownOpen} transparent animationType="slide" onRequestClose={() => setNumFontDropdownOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Select Number Font</Text>
            <ScrollView style={{maxHeight: 200}}>
              {FONT_OPTIONS.map(font => (
                <TouchableOpacity key={font} style={styles.colorItem} onPress={() => { setNumFont(font); setNumFontDropdownOpen(false); }}>
                  <Text style={{flex:1}}>{font}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.button, {marginTop: 10}]} onPress={() => setNumFontDropdownOpen(false)}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* State Font modal */}
      <Modal visible={stateFontDropdownOpen} transparent animationType="slide" onRequestClose={() => setStateFontDropdownOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Select State Font</Text>
            <ScrollView style={{maxHeight: 200}}>
              {FONT_OPTIONS.map(font => (
                <TouchableOpacity key={font} style={styles.colorItem} onPress={() => { setStateFont(font); setStateFontDropdownOpen(false); }}>
                  <Text style={{flex:1}}>{font}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.button, {marginTop: 10}]} onPress={() => setStateFontDropdownOpen(false)}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* State Location modal */}
      <Modal visible={stateLocationDropdownOpen} transparent animationType="slide" onRequestClose={() => setStateLocationDropdownOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Select State Location</Text>
            <ScrollView style={{maxHeight: 200}}>
              {STATE_LOCATION_OPTIONS.map(location => (
                <TouchableOpacity key={location} style={styles.colorItem} onPress={() => { setStateLocation(location as any); setStateLocationDropdownOpen(false); }}>
                  <Text style={{flex:1}}>{location}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.button, {marginTop: 10}]} onPress={() => setStateLocationDropdownOpen(false)}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Number Color modal */}
      <Modal visible={numColorDropdownOpen} transparent animationType="slide" onRequestClose={() => setNumColorDropdownOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Select Number Color</Text>
            <ScrollView style={{maxHeight: 200}}>
              {COLOR_OPTIONS.map(color => (
                <TouchableOpacity key={color} style={styles.colorItem} onPress={() => { setNumColor(color); setNumColorDropdownOpen(false); }}>
                  <Text style={{flex:1}}>{color}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.button, {marginTop: 10}]} onPress={() => setNumColorDropdownOpen(false)}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* State Color modal */}
      <Modal visible={stateColorDropdownOpen} transparent animationType="slide" onRequestClose={() => setStateColorDropdownOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Select State Color</Text>
            <ScrollView style={{maxHeight: 200}}>
              {COLOR_OPTIONS.map(color => (
                <TouchableOpacity key={color} style={styles.colorItem} onPress={() => { setStateColor(color); setStateColorDropdownOpen(false); }}>
                  <Text style={{flex:1}}>{color}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.button, {marginTop: 10}]} onPress={() => setStateColorDropdownOpen(false)}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Primary Background Color modal */}
      <Modal visible={primaryBackgroundColorDropdownOpen} transparent animationType="slide" onRequestClose={() => setPrimaryBackgroundColorDropdownOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Select Primary Background Color</Text>
            <ScrollView style={{maxHeight: 200}}>
              {COLOR_OPTIONS.map(color => (
                <TouchableOpacity key={color} style={styles.colorItem} onPress={() => { setPrimaryBackgroundColors(color); setPrimaryBackgroundColorDropdownOpen(false); }}>
                  <Text style={{flex:1}}>{color}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.button, {marginTop: 10}]} onPress={() => setPrimaryBackgroundColorDropdownOpen(false)}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
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
