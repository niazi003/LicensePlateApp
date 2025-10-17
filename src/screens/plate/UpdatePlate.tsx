import React, { useState, useEffect, useMemo } from 'react';
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
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { updatePlateThunk } from '../../redux/plates/platesSlice';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { PlateStackParamList } from '../../navigation/PlateNavigation';
import { StackNavigationProp } from '@react-navigation/stack';
import { getCountiesForState, addCounty, getTagsForPlate, setTagsForPlate } from '../../database/helpers';
import TagSelector from '../../components/TagSelector';
import { launchCamera, launchImageLibrary, ImagePickerResponse, MediaType } from 'react-native-image-picker';

type UpdateRoute = RouteProp<PlateStackParamList, 'UpdatePlate'>;
type NavProp = StackNavigationProp<PlateStackParamList, 'UpdatePlate'>;

interface Props {
  route: UpdateRoute;
}

const UpdatePlate = ({ route }: Props) => {
  const { plateId } = route.params;
  const navigation = useNavigation<NavProp>();
  const dispatch = useDispatch<AppDispatch>();

  const plate = useSelector((state: RootState) => state.plates.byId[plateId]);

  // external_id is auto-generated and should not be editable
  const [stateVal, setStateVal] = useState('');
  const [country, setCountry] = useState('');
  const [name, setName] = useState('');
  const [yearsAvailable, setYearsAvailable] = useState('');
  const [available, setAvailable] = useState(false);
  const [base, setBase] = useState(false);
  const [embossed, setEmbossed] = useState(false);
  const [primaryBackgroundColors, setPrimaryBackgroundColors] = useState<string[]>([]);
  const [allColors, setAllColors] = useState('');
  const [backgroundDesc, setBackgroundDesc] = useState('');
  const [numFont, setNumFont] = useState('');
  const [numColors, setNumColors] = useState<string[]>([]);
  const [stateFont, setStateFont] = useState('');
  const [stateColors, setStateColors] = useState<string[]>([]);
  const [stateLocation, setStateLocation] = useState<'Top' | 'Bottom' | ''>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [text, setText] = useState('');
  const [county, setCounty] = useState(false);
  const [countyName, setCountyName] = useState('');
  const [url, setUrl] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

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
  const [countyDropdownOpen, setCountyDropdownOpen] = useState(false);
  const [showAddCounty, setShowAddCounty] = useState(false);
  const [newCountyName, setNewCountyName] = useState('');
  const [availableCounties, setAvailableCounties] = useState<string[]>([]);
  const [showImagePicker, setShowImagePicker] = useState(false);

  const COLOR_OPTIONS = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Dark Blue', 'Purple', 'Brown', 'White', 'Gray', 'Black'];
  const FONT_OPTIONS = ['Serif', 'Sans-Serif', 'Script'];
  const STATE_LOCATION_OPTIONS = ['Top', 'Bottom'];

  const toggleColor = (c: string) =>
    setSelectedColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const togglePrimaryBackgroundColor = (c: string) => {
    setPrimaryBackgroundColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const toggleNumColor = (c: string) => {
    setNumColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const toggleStateColor = (c: string) => {
    setStateColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const composeFeaturesTags = (): string => {
    const metas = [stateLocation ? `state_location=${stateLocation}` : null].filter(Boolean) as string[];
    return [...metas, ...selectedTags].join(';');
  };

  // Load counties when state changes
  useEffect(() => {
    const loadCounties = async () => {
      if (stateVal) {
        try {
          const counties = await getCountiesForState(stateVal);
          setAvailableCounties(counties);
        } catch (error) {
          console.error('Error loading counties:', error);
          setAvailableCounties([]);
        }
      } else {
        setAvailableCounties([]);
      }
    };
    loadCounties();
  }, [stateVal]);

  // County dropdown data
  const countyOptions = useMemo(() => {
    return [
      ...availableCounties.map(county => ({ label: county, value: county })),
      { label: '+ Add New County', value: 'ADD_NEW' }
    ];
  }, [availableCounties]);

  const handleAddCounty = async () => {
    if (!newCountyName.trim() || !stateVal) return;
    
    try {
      // Add county to database
      await addCounty(stateVal, newCountyName.trim());
      
      // Update local state
      setAvailableCounties(prev => [...prev, newCountyName.trim()]);
      setCountyName(newCountyName.trim());
      setShowAddCounty(false);
      setNewCountyName('');
    } catch (error) {
      console.error('Error adding county:', error);
      Alert.alert('Error', 'Failed to add county');
    }
  };

  const handleImagePicker = () => {
    setShowImagePicker(true);
  };

  const handleCameraCapture = () => {
    setShowImagePicker(false);
    const options = {
      mediaType: 'photo' as MediaType,
      quality: 1 as const,
      includeBase64: false,
    };
    
    launchCamera(options, (response: ImagePickerResponse) => {
      if (response.assets && response.assets[0]) {
        setImageUri(response.assets[0].uri || null);
      }
    });
  };

  const handleGallerySelect = () => {
    setShowImagePicker(false);
    const options = {
      mediaType: 'photo' as MediaType,
      quality: 1 as const,
      includeBase64: false,
    };
    
    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.assets && response.assets[0]) {
        setImageUri(response.assets[0].uri || null);
      }
    });
  };

  const removeImage = () => {
    setImageUri(null);
  };

  useEffect(() => {
    if (plate) {
      setStateVal(plate.state || '');
      setCountry(plate.country || '');
      setName(plate.name || '');
      setYearsAvailable(plate.years_available || '');
      setAvailable(!!plate.available);
      setBase(!!plate.base);
      setEmbossed(!!plate.embossed);
      // Initialize color arrays from comma-separated strings
      setPrimaryBackgroundColors(plate.primary_background_colors ? plate.primary_background_colors.split(',').map(s => s.trim()).filter(Boolean) : []);
      setAllColors(plate.all_colors || '');
      setBackgroundDesc(plate.background_description || '');
      setNumFont(plate.pattern_font || '');
      setNumColors(plate.pattern_color ? plate.pattern_color.split(',').map(s => s.trim()).filter(Boolean) : []);
      setStateFont(plate.state_font || '');
      setStateColors(plate.state_color ? plate.state_color.split(',').map(s => s.trim()).filter(Boolean) : []);
      setStateLocation((plate.state_location as any) || '');
      setDescription(plate.additional_description || '');
      setNotes(plate.notes || '');
      setText(plate.text || '');
      setCounty(!!plate.county);
      setCountyName(plate.county_name || '');
      setUrl(!!plate.url);
      setImageUri(plate.image_uri || null);

      if (plate.all_colors) {
        setSelectedColors(plate.all_colors.split(',').map(s => s.trim()).filter(Boolean));
      }
    }
  }, [plate]);

  // Load tags for the plate
  useEffect(() => {
    const loadTags = async () => {
      if (plateId) {
        try {
          const tags = await getTagsForPlate(plateId);
          setSelectedTags(tags);
        } catch (error) {
          console.error('Error loading tags:', error);
        }
      }
    };
    loadTags();
  }, [plateId]);

  const handleUpdate = async () => {
    try {
      // Update the plate first
      await dispatch(
        updatePlateThunk({
          plate_id: plateId,
          state: stateVal,
          country,
          name,
          years_available: yearsAvailable,
          available,
          base,
          embossed,
          pattern_font: numFont,
          pattern_color: numColors.join(','),
          state_font: stateFont,
          state_color: stateColors.join(','),
          state_location: stateLocation,
          primary_background_colors: primaryBackgroundColors.join(','),
          all_colors: selectedColors.length ? selectedColors.join(',') : allColors,
          background_description: backgroundDesc,
          text,
          tags: composeFeaturesTags(),
          additional_description: description,
          notes,
          county,
          county_name: countyName,
          url,
          image_uri: imageUri || undefined,
        }),
      ).unwrap();

      // Update tags separately
      await setTagsForPlate(plateId, selectedTags);
      
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update plate');
    }
  };

  if (!plate) return <Text>Loading...</Text>;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView 
        style={styles.container}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Text style={styles.title}>Update Plate</Text>

      <Text style={styles.fieldLabel}>State</Text>
      <TextInput style={styles.input} value={stateVal} onChangeText={setStateVal} />
      <Text style={styles.fieldLabel}>Country</Text>
      <TextInput style={styles.input} value={country} onChangeText={setCountry} />
      <Text style={styles.fieldLabel}>Home</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />
      <Text style={styles.fieldLabel}>Years</Text>
      <TextInput style={styles.input} value={yearsAvailable} onChangeText={setYearsAvailable} />

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
        <Text style={styles.label}>Has County</Text>
        <Switch value={county} onValueChange={setCounty} />
      </View>
      
      {/* County dropdown - only show if county is true and state is entered */}
      {county && stateVal && (
        <>
          <Text style={styles.fieldLabel}>County</Text>
          <TouchableOpacity style={styles.select} onPress={() => setCountyDropdownOpen(true)}>
            <Text style={styles.selectText}>{countyName || 'Select County'}</Text>
          </TouchableOpacity>
          
          {/* Add County Input */}
          {showAddCounty && (
            <View style={styles.addCountyContainer}>
              <Text style={styles.fieldLabel}>Add New County</Text>
              <TextInput
                style={styles.input}
                value={newCountyName}
                onChangeText={setNewCountyName}
                placeholder="Enter county name"
                autoFocus
              />
              <View style={styles.addCountyButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setShowAddCounty(false);
                    setNewCountyName('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.addButton]}
                  onPress={handleAddCounty}
                  disabled={!newCountyName.trim()}
                >
                  <Text style={styles.buttonText}>Add County</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}
      
      <View style={styles.rowBetween}>
        <Text style={styles.label}>Has URL</Text>
        <Switch value={url} onValueChange={setUrl} />
      </View>

      <Text style={styles.fieldLabel}>Primary Background Colors (Multi-Select)</Text>
      <TouchableOpacity style={styles.select} onPress={() => setPrimaryBackgroundColorDropdownOpen(true)}>
        <Text style={styles.selectText}>{primaryBackgroundColors.length > 0 ? primaryBackgroundColors.join(', ') : 'Select Primary Background Colors'}</Text>
      </TouchableOpacity>
      <Text style={styles.fieldLabel}>All Colors</Text>
      <TouchableOpacity style={styles.select} onPress={() => setColorsOpen(true)}>
        <Text style={styles.selectText}>{selectedColors.length ? selectedColors.join(', ') : (allColors || 'Select Colors (multi)')}</Text>
      </TouchableOpacity>

      <Text style={styles.fieldLabel}>Pattern Font</Text>
      <TouchableOpacity style={styles.select} onPress={() => setNumFontDropdownOpen(true)}>
        <Text style={styles.selectText}>{numFont || 'Select Pattern Font'}</Text>
      </TouchableOpacity>
      <Text style={styles.fieldLabel}>Pattern Colors (Multi-Select)</Text>
      <TouchableOpacity style={styles.select} onPress={() => setNumColorDropdownOpen(true)}>
        <Text style={styles.selectText}>{numColors.length > 0 ? numColors.join(', ') : 'Select Pattern Colors'}</Text>
      </TouchableOpacity>

      <Text style={styles.fieldLabel}>State Font</Text>
      <TouchableOpacity style={styles.select} onPress={() => setStateFontDropdownOpen(true)}>
        <Text style={styles.selectText}>{stateFont || 'Select State Font'}</Text>
      </TouchableOpacity>
      <Text style={styles.fieldLabel}>State Colors (Multi-Select)</Text>
      <TouchableOpacity style={styles.select} onPress={() => setStateColorDropdownOpen(true)}>
        <Text style={styles.selectText}>{stateColors.length > 0 ? stateColors.join(', ') : 'Select State Colors'}</Text>
      </TouchableOpacity>
      <Text style={styles.fieldLabel}>State Location</Text>
      <TouchableOpacity style={styles.select} onPress={() => setStateLocationDropdownOpen(true)}>
        <Text style={styles.selectText}>{stateLocation || 'Select State Location'}</Text>
      </TouchableOpacity>

      <Text style={styles.fieldLabel}>Background</Text>
      <TextInput
        style={[styles.input, {height: 150, textAlignVertical: 'top'}]}
        multiline
        value={backgroundDesc}
        onChangeText={setBackgroundDesc}
        numberOfLines={6}
      />

      <Text style={styles.fieldLabel}>Plate Text</Text>
      <TextInput style={styles.input} value={text} onChangeText={setText} />
      <Text style={styles.fieldLabel}>Tags</Text>
      <TagSelector
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
        placeholder="Select Tags"
      />
      <Text style={styles.fieldLabel}>Additional Description</Text>
      <TextInput style={styles.input} value={description} onChangeText={setDescription} />

      <Text style={styles.fieldLabel}>Notes</Text>
      <TextInput
        style={[styles.input, {height: 150, textAlignVertical: 'top'}]}
        multiline
        value={notes}
        onChangeText={setNotes}
        numberOfLines={6}
      />

      {/* Image */}
      <Text style={styles.fieldLabel}>Plate Image</Text>
      {imageUri ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
            <Text style={styles.removeImageText}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.imagePickerButton} onPress={handleImagePicker}>
          <Text style={styles.imagePickerText}>📷 Add Plate Image</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.button} onPress={handleUpdate}>
        <Text style={styles.buttonText}>Update Plate</Text>
      </TouchableOpacity>

      <Modal visible={colorsOpen} transparent animationType="slide" onRequestClose={() => setColorsOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Select All Colors</Text>
            <Text style={styles.modalSubtitle}>
              {selectedColors.length > 0
                ? `${selectedColors.length} color${selectedColors.length !== 1 ? 's' : ''} selected`
                : 'Select one or more colors'}
            </Text>
            <ScrollView style={{maxHeight: 240}}>
              {COLOR_OPTIONS.map(c => (
                <TouchableOpacity key={c} style={styles.colorItem} onPress={() => toggleColor(c)}>
                  <View style={styles.colorItemContent}>
                    <View style={[styles.colorDot, { backgroundColor: getColorHex(c) }]} />
                    <Text style={{flex:1}}>{c}</Text>
                  </View>
                  <Text style={styles.colorCheckmark}>{selectedColors.includes(c) ? '✓' : ''}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={{flexDirection:'row', marginTop: 10}}>
              <TouchableOpacity style={[styles.button, {flex:1, backgroundColor:'#6c757d'}]} onPress={() => { setSelectedColors([]); }}>
                <Text style={styles.buttonText}>Clear All</Text>
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
            <Text style={styles.title}>Select Number Colors</Text>
            <Text style={styles.modalSubtitle}>
              {numColors.length > 0
                ? `${numColors.length} color${numColors.length !== 1 ? 's' : ''} selected`
                : 'Select one or more number colors'}
            </Text>
            <ScrollView style={{maxHeight: 240}}>
              {COLOR_OPTIONS.map(color => (
                <TouchableOpacity key={color} style={styles.colorItem} onPress={() => toggleNumColor(color)}>
                  <View style={styles.colorItemContent}>
                    <View style={[styles.colorDot, { backgroundColor: getColorHex(color) }]} />
                    <Text style={{flex:1}}>{color}</Text>
                  </View>
                  <Text style={styles.colorCheckmark}>{numColors.includes(color) ? '✓' : ''}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={{flexDirection:'row', marginTop: 10}}>
              <TouchableOpacity style={[styles.button, {flex:1, backgroundColor:'#6c757d'}]} onPress={() => { setNumColors([]); }}>
                <Text style={styles.buttonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, {flex:1}]} onPress={() => setNumColorDropdownOpen(false)}>
                <Text style={styles.buttonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* State Color modal */}
      <Modal visible={stateColorDropdownOpen} transparent animationType="slide" onRequestClose={() => setStateColorDropdownOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Select State Colors</Text>
            <Text style={styles.modalSubtitle}>
              {stateColors.length > 0
                ? `${stateColors.length} color${stateColors.length !== 1 ? 's' : ''} selected`
                : 'Select one or more state colors'}
            </Text>
            <ScrollView style={{maxHeight: 240}}>
              {COLOR_OPTIONS.map(color => (
                <TouchableOpacity key={color} style={styles.colorItem} onPress={() => toggleStateColor(color)}>
                  <View style={styles.colorItemContent}>
                    <View style={[styles.colorDot, { backgroundColor: getColorHex(color) }]} />
                    <Text style={{flex:1}}>{color}</Text>
                  </View>
                  <Text style={styles.colorCheckmark}>{stateColors.includes(color) ? '✓' : ''}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={{flexDirection:'row', marginTop: 10}}>
              <TouchableOpacity style={[styles.button, {flex:1, backgroundColor:'#6c757d'}]} onPress={() => { setStateColors([]); }}>
                <Text style={styles.buttonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, {flex:1}]} onPress={() => setStateColorDropdownOpen(false)}>
                <Text style={styles.buttonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Primary Background Color modal */}
      <Modal visible={primaryBackgroundColorDropdownOpen} transparent animationType="slide" onRequestClose={() => setPrimaryBackgroundColorDropdownOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Select Primary Background Colors</Text>
            <Text style={styles.modalSubtitle}>
              {primaryBackgroundColors.length > 0
                ? `${primaryBackgroundColors.length} color${primaryBackgroundColors.length !== 1 ? 's' : ''} selected`
                : 'Select one or more background colors'}
            </Text>
            <ScrollView style={{maxHeight: 240}}>
              {COLOR_OPTIONS.map(color => (
                <TouchableOpacity key={color} style={styles.colorItem} onPress={() => togglePrimaryBackgroundColor(color)}>
                  <View style={styles.colorItemContent}>
                    <View style={[styles.colorDot, { backgroundColor: getColorHex(color) }]} />
                    <Text style={{flex:1}}>{color}</Text>
                  </View>
                  <Text style={styles.colorCheckmark}>{primaryBackgroundColors.includes(color) ? '✓' : ''}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={{flexDirection:'row', marginTop: 10}}>
              <TouchableOpacity style={[styles.button, {flex:1, backgroundColor:'#6c757d'}]} onPress={() => { setPrimaryBackgroundColors([]); }}>
                <Text style={styles.buttonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, {flex:1}]} onPress={() => setPrimaryBackgroundColorDropdownOpen(false)}>
                <Text style={styles.buttonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* County modal */}
      <Modal visible={countyDropdownOpen} transparent animationType="slide" onRequestClose={() => setCountyDropdownOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Select County</Text>
            <Text style={styles.modalSubtitle}>
              {stateVal ? `Counties in ${stateVal}` : 'Please enter a state first'}
            </Text>
            <ScrollView style={{maxHeight: 300}}>
              {countyOptions.map(county => (
                <TouchableOpacity 
                  key={county.value} 
                  style={styles.colorItem} 
                  onPress={() => {
                    if (county.value === 'ADD_NEW') {
                      setShowAddCounty(true);
                      setCountyDropdownOpen(false);
                    } else {
                      setCountyName(county.value);
                      setCountyDropdownOpen(false);
                    }
                  }}
                >
                  <Text style={[
                    {flex: 1},
                    county.value === 'ADD_NEW' && styles.addCountyText
                  ]}>
                    {county.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.button, {marginTop: 10}]} onPress={() => setCountyDropdownOpen(false)}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Image Picker Modal */}
      <Modal
        visible={showImagePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImagePicker(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Select Image Source</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={handleCameraCapture}>
                <Text style={styles.modalButtonIcon}>📷</Text>
                <Text style={styles.modalButtonText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={handleGallerySelect}>
                <Text style={styles.modalButtonIcon}>🖼️</Text>
                <Text style={styles.modalButtonText}>Gallery</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowImagePicker(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
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

export default UpdatePlate;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16, paddingTop: 32 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    padding: 12, marginBottom: 12, fontSize: 16,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  label: { fontSize: 16, fontWeight: '500' },
  fieldLabel: { fontSize: 16, fontWeight: '500', marginBottom: 6, color: '#333' },
  select: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  selectText: { color: '#333' },
  pillGroup: { flexDirection: 'row' },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#ccc', borderRadius: 16, marginLeft: 6 },
  pillActive: { backgroundColor: '#28a745', borderColor: '#28a745' },
  pillText: { color: '#333' },
  pillTextActive: { color: '#fff' },
  expandHeader: { paddingVertical: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  button: { backgroundColor: '#28a745', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 20, marginBottom: 28 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', padding: 16 },
  modalContent: { backgroundColor: '#fff', borderRadius: 10, padding: 16 },
  modalSubtitle: { fontSize: 14, color: '#666', marginBottom: 16 },
  colorItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  colorItemContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  colorDot: { width: 24, height: 24, borderRadius: 12, marginRight: 12, borderWidth: 1, borderColor: '#ddd' },
  colorCheckmark: { fontSize: 20, color: '#007bff', fontWeight: '700' },
  addCountyText: {
    color: '#007bff',
    fontWeight: '600',
  },
  addCountyContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  addCountyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    flex: 1,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#28a745',
    flex: 1,
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imagePickerButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  imagePickerText: {
    color: '#333',
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  modalButton: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    minWidth: 100,
  },
  modalButtonIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modalCancelButton: {
    backgroundColor: '#6c757d',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
