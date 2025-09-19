import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPlates } from '../../redux/plates/platesSlice';
import { RootState, AppDispatch } from '../../redux/store';
import { useNavigation } from '@react-navigation/native';
import { PlateStackParamList } from '../../navigation/PlateNavigation';
import { StackNavigationProp } from '@react-navigation/stack';

import ImportPlatesCSV from './ImportPlatesCSV';

type NavProp = StackNavigationProp<PlateStackParamList, 'Home'>;

const HomePage = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigation = useNavigation<NavProp>();

    const plates = useSelector((state: RootState) =>
        state.plates.allIds.map(id => state.plates.byId[id]),
    );
    const status = useSelector((state: RootState) => state.plates.status);

    useEffect(() => {
        dispatch(fetchPlates());
    }, [dispatch]);


    return (
        <View style={styles.container}>
            <Text style={styles.title}>Plates</Text>
            {status === 'loading' && <Text>Loading...</Text>}
            <FlatList
                data={plates}
                keyExtractor={item => item.plate_id!.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.item}
                        onPress={() => navigation.navigate('PlateDetail', { plateId: item.plate_id! })}
                    >
                        <Text>{item.state} - {item.name}</Text>
                    </TouchableOpacity>
                )}
            />
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AddPlate')}
            >
                <Text style={styles.addText}>+ Add Plate</Text>
            </TouchableOpacity>

            {/* Bulk Import */}
            <ImportPlatesCSV />
        </View>
    );
}
export default HomePage;

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        padding: 16 
    },
    title: { 
        fontSize: 22, 
        fontWeight: 'bold', 
        marginBottom: 12 
    },
    item: { 
        padding: 12, 
        borderBottomWidth: 1, 
        borderColor: '#ccc' 
    },
    addButton: { 
        marginTop: 16, 
        padding: 12, 
        backgroundColor: '#007bff', 
        borderRadius: 8 
    },
    addText: { 
        color: '#fff', 
        textAlign: 'center', 
        fontWeight: 'bold' 
    },
});