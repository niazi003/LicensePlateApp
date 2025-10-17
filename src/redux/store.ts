import { configureStore } from '@reduxjs/toolkit';
import platesReducer from './plates/platesSlice';
import patternsReducer from './patterns/patternsSlice';
import sightingsReducer from './sightings/sightingsSlice';
import tagsReducer from './tags/tagsSlice';

export const store = configureStore({
    reducer:{
        plates: platesReducer,
        patterns: patternsReducer,
        sightings: sightingsReducer,
        tags: tagsReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;