import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomePage from '../screens/plate/HomePage';
import AddPlate from '../screens/plate/AddPlate';
import PlateDetail from '../screens/plate/PlateDetail';
import UpdatePlate from '../screens/plate/UpdatePlate';
import SightingsNavigation from './SightingsNavigation';
import AddPattern from '../screens/pattern/AddPattern';
import PatternDetail from '../screens/pattern/PatternDetail';
import UpdatePattern from '../screens/pattern/UpdatePattern';
import AddSightings from '../screens/sightings/AddSightings';
import SightingDetail from '../screens/sightings/SightingsDetail';
import UpdateSightings from '../screens/sightings/UpdateSightings';

export type PlateStackParamList = {
    Home: undefined;
    AddPlate: undefined;
    PlateDetail: { plateId: number };
    UpdatePlate: { plateId: number };
    SightingsNav: { sightingsId: number, plateId: number };
    AddPattern: { plateId: number };
    PatternDetail: { patternId: number };
    UpdatePattern: { patternId: number };
    AddSighting: { plateId?: number };
    SightingDetail: { sightingId: number; plateId: number };
    UpdateSighting: { sightingId: number };
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
            {/* Pattern routes under Plate stack */}
            <Stack.Screen name="AddPattern" component={AddPattern} options={{ title: 'Add Pattern' }} />
            <Stack.Screen name="PatternDetail" component={PatternDetail} options={{ title: 'Pattern Details' }} />
            <Stack.Screen name="UpdatePattern" component={UpdatePattern} options={{ title: 'Update Pattern' }} />
            {/* Quick Add Sighting from Plate context */}
            <Stack.Screen name="AddSighting" component={AddSightings} options={{ title: 'Add Sighting' }} />
            {/* Sighting Detail from Plate context */}
            <Stack.Screen name="SightingDetail" component={SightingDetail} options={{ title: 'Sighting Details' }} />
            {/* Update Sighting from Plate context */}
            <Stack.Screen name="UpdateSighting" component={UpdateSightings} options={{ title: 'Update Sighting' }} />
        </Stack.Navigator>
    );
};
export default PlateNavigation;