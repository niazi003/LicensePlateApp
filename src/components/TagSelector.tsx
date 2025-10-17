import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { fetchTags, addTag } from '../redux/tags/tagsSlice';

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  style?: any;
  allowAddNew?: boolean; // Whether to show "Add New Tag" option
}

const TagSelector: React.FC<TagSelectorProps> = ({
  selectedTags,
  onTagsChange,
  placeholder = 'Select Tags',
  style,
  allowAddNew = true, // Default to true for backward compatibility
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const allTags = useSelector((state: RootState) => state.tags.allTags);
  const tagsLoading = useSelector((state: RootState) => state.tags.loading);

  const [modalVisible, setModalVisible] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [showAddTag, setShowAddTag] = useState(false);

  // Load tags when component mounts
  useEffect(() => {
    if (allTags.length === 0 && !tagsLoading) {
      dispatch(fetchTags());
    }
  }, [dispatch, allTags.length, tagsLoading]);

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleAddNewTag = async () => {
    const trimmed = newTagName.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Tag name cannot be empty');
      return;
    }

    if (allTags.includes(trimmed)) {
      Alert.alert('Error', 'Tag already exists');
      return;
    }

    try {
      await dispatch(addTag(trimmed)).unwrap();
      onTagsChange([...selectedTags, trimmed]);
      setNewTagName('');
      setShowAddTag(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to add tag');
    }
  };

  const handleClearAll = () => {
    onTagsChange([]);
  };

  const displayText = selectedTags.length > 0 
    ? `${selectedTags.length} tag${selectedTags.length !== 1 ? 's' : ''} selected`
    : placeholder;

  return (
    <>
      <TouchableOpacity style={[styles.select, style]} onPress={() => setModalVisible(true)}>
        <Text style={styles.selectText}>{displayText}</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Select Tags</Text>
            <Text style={styles.modalSubtitle}>
              {selectedTags.length > 0
                ? `${selectedTags.length} tag${selectedTags.length !== 1 ? 's' : ''} selected`
                : 'Select one or more tags'}
            </Text>

            {/* Add new tag section - only show if allowAddNew is true */}
            {allowAddNew && showAddTag && (
              <View style={styles.addTagContainer}>
                <Text style={styles.fieldLabel}>Add New Tag</Text>
                <TextInput
                  style={styles.input}
                  value={newTagName}
                  onChangeText={setNewTagName}
                  placeholder="Enter tag name"
                  autoFocus
                />
                <View style={styles.addTagButtons}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => {
                      setShowAddTag(false);
                      setNewTagName('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.addButton]}
                    onPress={handleAddNewTag}
                    disabled={!newTagName.trim()}
                  >
                    <Text style={styles.buttonText}>Add Tag</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <ScrollView style={{ maxHeight: 300 }}>
              {/* Add new tag option - only show if allowAddNew is true */}
              {allowAddNew && (
                <TouchableOpacity 
                  style={styles.tagItem} 
                  onPress={() => setShowAddTag(true)}
                >
                  <Text style={styles.addTagText}>+ Add New Tag</Text>
                </TouchableOpacity>
              )}

              {/* Existing tags */}
              {allTags.map(tag => (
                <TouchableOpacity 
                  key={tag} 
                  style={styles.tagItem} 
                  onPress={() => handleTagToggle(tag)}
                >
                  <Text style={styles.tagText}>{tag}</Text>
                  <Text style={styles.tagCheckmark}>
                    {selectedTags.includes(tag) ? '✓' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.clearButton]} 
                onPress={handleClearAll}
              >
                <Text style={styles.buttonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.doneButton]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  select: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  selectText: {
    color: '#333',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    maxHeight: '80%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tagText: {
    flex: 1,
    fontSize: 16,
  },
  addTagText: {
    flex: 1,
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
  },
  tagCheckmark: {
    fontSize: 20,
    color: '#007bff',
    fontWeight: '700',
  },
  addTagContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  addTagButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 16,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  clearButton: {
    backgroundColor: '#6c757d',
  },
  doneButton: {
    backgroundColor: '#007bff',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#28a745',
    marginLeft: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default TagSelector;
