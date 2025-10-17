import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import PlateNavigation from './PlateNavigation';
import SightingsNavigation from './SightingsNavigation';
import { Image, StyleSheet } from 'react-native';


export type RootTabParamList = {
    Plates: undefined;
    Actions: undefined;
    Sightings: undefined;
};


const Tab = createBottomTabNavigator<RootTabParamList>();

const PlateIcon = ({size, focused, color: _color}: {size: number, focused: boolean, color: string}) => (
    <Image style={[
        { width: size, height: size },
        focused ? styles.icon : styles.iconInactive
    ]}
    source={require('../icons/home.png')}
    />
);

const SightingIcon = ({size, focused, color: _color}: {size: number, focused: boolean, color: string}) => (
    <Image style={[
        { width: size, height: size },
        focused ? styles.icon : styles.iconInactive
    ]}
    source={require('../icons/sighting.png')}
    />
);

const TabNavigation=()=>{
    return(
        // <Tab.Navigator screenOptions={{headerShown: false, tabBarIconStyle: { display: "none" }, tabBarLabelStyle: { marginTop: 12 },}}>
        <Tab.Navigator screenOptions={{headerShown: false}}>
            <Tab.Screen name="Plates" component={PlateNavigation} options={{
                title: 'Plates',
                tabBarIcon: PlateIcon,
            }}/>
            <Tab.Screen name="Sightings" component={SightingsNavigation} options={{
                title: 'Sightings',
                tabBarIcon: SightingIcon,
            }}/>
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    icon: {
        tintColor: '#007afd',
    },
    iconInactive: {
        tintColor: 'gray',
    },
});

export default TabNavigation;
