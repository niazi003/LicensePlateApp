import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  TextInputProps,
} from 'react-native';

interface ClearableTextInputProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  showClearButton?: boolean;
  clearButtonStyle?: any;
  clearButtonTextStyle?: any;
}

const ClearableTextInput: React.FC<ClearableTextInputProps> = ({
  value,
  onChangeText,
  showClearButton = true,
  clearButtonStyle,
  clearButtonTextStyle,
  style,
  ...props
}) => {
  const handleClear = () => {
    onChangeText('');
  };

  const shouldShowClear = showClearButton && value && value.length > 0;

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, style]}
        value={value}
        onChangeText={onChangeText}
        {...props}
      />
      {shouldShowClear && (
        <TouchableOpacity
          style={[styles.clearButton, clearButtonStyle]}
          onPress={handleClear}
          activeOpacity={0.7}
        >
          <Text style={[styles.clearButtonText, clearButtonTextStyle]}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  input: {
    // Default input styles will be overridden by passed style prop
  },
  clearButton: {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: [{ translateY: -10 }],
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default ClearableTextInput;
