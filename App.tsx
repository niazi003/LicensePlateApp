import React, { useEffect } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { store, AppDispatch } from './src/redux/store';
import { initDB } from './src/database/db';
import { fetchPlates } from './src/redux/plates/platesSlice';
import TabNavigation from './src/navigation/TabNavigation';

const AppLoader = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const start = async () => {
      await initDB();
      dispatch(fetchPlates());
    };
    start();
  }, [dispatch]);
  return <TabNavigation />;
};

export default function App() {
  return (
    <Provider store={store} >
      <AppLoader />
    </Provider>
  )
}