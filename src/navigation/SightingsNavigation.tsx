import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SightingDetail from '../screens/sightings/SightingsDetail';
import UpdateSighting from '../screens/sightings/UpdateSightings';

export type SightingsStackParamList = {
  SightingDetail: { sightingId: number; plateId: number };
  UpdateSighting: { sightingId: number };
};

const Stack = createStackNavigator<SightingsStackParamList>();

const SightingsNavigation = () => {
  return (
    <Stack.Navigator initialRouteName="SightingDetail">
      <Stack.Screen
        name="SightingDetail"
        component={SightingDetail}
        options={{ title: 'Sighting Details' }}
      />
      <Stack.Screen
        name="UpdateSighting"
        component={UpdateSighting}
        options={{ title: 'Update Sighting' }}
      />
    </Stack.Navigator>
  );
};
export default SightingsNavigation;