import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SightingDetail from '../screens/sightings/SightingsDetail';
import AddSightings from '../screens/sightings/AddSightings';
import SightingsList from '../screens/sightings/SightingsList';
import UpdateSightings from '../screens/sightings/UpdateSightings';

export type SightingsStackParamList = {
  SightingsList: undefined;
  SightingDetail: { sightingId: number; plateId: number };
  UpdateSighting: { sightingId: number };
  AddSighting: { plateId?: number };
};

const Stack = createStackNavigator<SightingsStackParamList>();

const SightingsNavigation = () => {
  return (
    <Stack.Navigator initialRouteName="SightingsList">
      <Stack.Screen
        name="SightingsList"
        component={SightingsList}
        options={{ title: 'Sightings' }}
      />
      <Stack.Screen
        name="SightingDetail"
        component={SightingDetail}
        options={{ title: 'Sighting Details' }}
      />
      <Stack.Screen
        name="AddSighting"
        component={AddSightings}
        options={{ title: 'Add Sighting' }}
      />
      <Stack.Screen
        name="UpdateSighting"
        component={UpdateSightings}
        options={{ title: 'Update Sighting' }}
      />
    </Stack.Navigator>
  );
};
export default SightingsNavigation;