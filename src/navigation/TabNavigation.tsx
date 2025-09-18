import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import PlateNavigation from './PlateNavigation';
import PatternNavigation from './PatternNavigation';

export type RootTabParamList = {
    Plates: undefined;
    Patterns: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const TabNavigation=()=>{
    return(
        <Tab.Navigator screenOptions={{headerShown: false}}>
            <Tab.Screen name="Plates" component={PlateNavigation}/>
            <Tab.Screen name="Patterns" component={PatternNavigation}/>
        </Tab.Navigator>
    );
};

export default TabNavigation;