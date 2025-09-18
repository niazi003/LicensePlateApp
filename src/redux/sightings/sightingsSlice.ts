import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as db from '../../database/helpers';
import { Sighting } from '../../database/helpers';

export const fetchSightingsByPlate = createAsyncThunk('sightings/fetchByPlate', async (plate_id: number) => {
  return { plate_id, sightings: await db.getSightingsByPlate(plate_id) };
});

export const createSighting = createAsyncThunk('sightings/create', async (sighting: Sighting) => {
  return await db.addSighting(sighting);
});

export const updateSightingThunk = createAsyncThunk('sightings/update', async (sighting: Sighting) => {
  await db.updateSighting(sighting);
  return sighting;
});

export const deleteSightingThunk = createAsyncThunk('sightings/delete', async (sighting_id: number) => {
  await db.deleteSighting(sighting_id);
  return sighting_id;
});

type SightingsState = {
  byId: Record<number, Sighting>;
  allIds: number[];
};

const initialState: SightingsState = {
  byId: {},
  allIds: [],
};

const sightingsSlice = createSlice({
  name: 'sightings',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchSightingsByPlate.fulfilled, (state, action: PayloadAction<{ plate_id: number; sightings: Sighting[] }>) => {
        action.payload.sightings.forEach(s => {
          state.byId[s.sighting_id!] = s;
          if (!state.allIds.includes(s.sighting_id!)) state.allIds.push(s.sighting_id!);
        });
      })
      .addCase(createSighting.fulfilled, (state, action: PayloadAction<Sighting>) => {
        const s = action.payload;
        state.byId[s.sighting_id!] = s;
        state.allIds.push(s.sighting_id!);
      })
      .addCase(updateSightingThunk.fulfilled, (state, action: PayloadAction<Sighting>) => {
        state.byId[action.payload.sighting_id!] = action.payload;
      })
      .addCase(deleteSightingThunk.fulfilled, (state, action: PayloadAction<number>) => {
        delete state.byId[action.payload];
        state.allIds = state.allIds.filter(id => id !== action.payload);
      });
  },
});

export default sightingsSlice.reducer;