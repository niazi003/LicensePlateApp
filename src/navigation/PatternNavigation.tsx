import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import PatternList from '../screens/pattern/PatternList';
import AddPattern from '../screens/pattern/AddPattern';
import PatternDetail from '../screens/pattern/PatternDetail';
import UpdatePattern from '../screens/pattern/UpdatePattern';

export type PatternStackParamList = {
  PatternList: undefined;
  AddPattern: undefined;
  PatternDetail: { patternId: number };
  UpdatePattern: { patternId: number };
};

const Stack = createStackNavigator<PatternStackParamList>();

const PatternNavigation = () => {
  return (
    <Stack.Navigator initialRouteName="PatternList">
      <Stack.Screen name="PatternList" component={PatternList} options={{ title: 'Patterns' }} />
      <Stack.Screen name="AddPattern" component={AddPattern} options={{ title: 'Add Pattern' }} />
      <Stack.Screen name="PatternDetail" component={PatternDetail} options={{ title: 'Pattern Details' }} />
      <Stack.Screen name="UpdatePattern" component={UpdatePattern} options={{ title: 'Update Pattern' }} />
    </Stack.Navigator>
  );
};

export default PatternNavigation;