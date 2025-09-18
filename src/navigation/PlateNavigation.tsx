import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomePage from '../screens/plate/HomePage';
import AddPlate from '../screens/plate/AddPlate';
import PlateDetail from '../screens/plate/PlateDetail';
import UpdatePlate from '../screens/plate/UpdatePlate';
import SightingsNavigation from './SightingsNavigation';

export type PlateStackParamList = {
    Home: undefined;
    AddPlate: undefined;
    PlateDetail: { plateId: number };
    UpdatePlate: { plateId: number };
    SightingsNav: { sightingsId: number, plateId: number };
};

const Stack = createStackNavigator<PlateStackParamList>();

const PlateNavigation = () => {
    return (
        <Stack.Navigator initialRouteName='Home'>
            <Stack.Screen name="Home" component={HomePage} options={{ title: 'Plates' }} />
            <Stack.Screen name="AddPlate" component={AddPlate} options={{ title: 'Add Plate' }} />
            <Stack.Screen name="PlateDetail" component={PlateDetail} options={{ title: 'Plate Details' }} />
            <Stack.Screen name="UpdatePlate" component={UpdatePlate} options={{ title: 'Update Plate' }} />
            {/*Nest Sightings Screen*/}
            <Stack.Screen 
                name="SightingsNav"
                component={SightingsNavigation}
                options={{headerShown: false}}
            />
        </Stack.Navigator>
    );
};
export default PlateNavigation;