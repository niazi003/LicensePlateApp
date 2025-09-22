import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import PlateNavigation from './PlateNavigation';
import SightingsNavigation from './SightingsNavigation';

export type RootTabParamList = {
    Plates: undefined;
    Actions: undefined;
    Sightings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const TabNavigation=()=>{
    return(
        <Tab.Navigator screenOptions={{headerShown: false}}>
            <Tab.Screen name="Plates" component={PlateNavigation}/>
            <Tab.Screen name="Sightings" component={SightingsNavigation}/>
        </Tab.Navigator>
    );
};

export default TabNavigation;
