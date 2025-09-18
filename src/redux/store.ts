import { configureStore } from '@reduxjs/toolkit';
import platesReducer from './plates/platesSlice';
import patternsReducer from './patterns/patternsSlice';
import sightingsReducer from './sightings/sightingsSlice';

export const store = configureStore({
    reducer:{
        plates: platesReducer,
        patterns: patternsReducer,
        sightings: sightingsReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;