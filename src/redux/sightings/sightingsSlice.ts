import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Sighting,
  getSightingsByPlate,
  addSighting,
  updateSighting,
  deleteSighting,
  getSightingsPaged,
  countSightings,
  SightingsFilter,
  SightingListItem,
} from '../../database/helpers';
import { reverseGeocode, GeocodingResult } from '../../services/geocodingService';

// --- Thunks ---
export const fetchSightingsByPlate = createAsyncThunk(
  'sightings/fetchByPlate',
  async (plate_id: number) => {
    return { plate_id, sightings: await getSightingsByPlate(plate_id) };
  }
);

export const reverseGeocodeLocation = createAsyncThunk(
  'sightings/reverseGeocode',
  async (coordinates: { latitude: number; longitude: number }) => {
    return await reverseGeocode(coordinates.latitude, coordinates.longitude);
  }
);

export const createSighting = createAsyncThunk(
  'sightings/create',
  async (sighting: Sighting) => {
    let sightingWithGeocoding = { ...sighting };
    
    // If we have coordinates but no geocoding data, perform reverse geocoding
    if (sighting.latitude && sighting.longitude && (!sighting.city || !sighting.state || !sighting.country)) {
      try {
        const geocodingResult = await reverseGeocode(sighting.latitude, sighting.longitude);
        sightingWithGeocoding = {
          ...sighting,
          city: geocodingResult.city,
          state: geocodingResult.state,
          country: geocodingResult.country,
          full_address: geocodingResult.fullAddress,
        };
      } catch (error) {
        console.warn('Reverse geocoding failed:', error);
        // Continue with original sighting data if geocoding fails
      }
    }
    
    return await addSighting(sightingWithGeocoding); // should return inserted row with sighting_id
  }
);

export const updateSightingThunk = createAsyncThunk(
  'sightings/update',
  async (sighting: Sighting) => {
    await updateSighting(sighting);
    return sighting;
  }
);

export const deleteSightingThunk = createAsyncThunk(
  'sightings/delete',
  async (sighting_id: number) => {
    await deleteSighting(sighting_id);
    return sighting_id;
  }
);

export const fetchSightingsPaged = createAsyncThunk(
  'sightings/fetchPaged',
  async (filter: SightingsFilter & { replace: boolean }) => {
    const total = await countSightings(filter);
    const rows = await getSightingsPaged(filter);
    return { rows, total, replace: filter.replace };
  }
);

// --- State ---
type SightingsState = {
  byId: Record<number, Sighting>;
  allIds: number[];
  list: SightingListItem[];
  total: number;
  loading: boolean;
};

const initialState: SightingsState = {
  byId: {},
  allIds: [],
  list: [],
  total: 0,
  loading: false,
};

// --- Slice ---
const sightingsSlice = createSlice({
  name: 'sightings',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchSightingsByPlate.fulfilled, (state, action: PayloadAction<{ plate_id: number; sightings: Sighting[] }>) => {
        action.payload.sightings.forEach(s => {
          state.byId[s.sighting_id!] = s;
          if (!state.allIds.includes(s.sighting_id!)) {
            state.allIds.push(s.sighting_id!);
          }
        });
      })
      .addCase(createSighting.fulfilled, (state, action: PayloadAction<Sighting>) => {
        const s = action.payload;
        state.byId[s.sighting_id!] = s;
        if (!state.allIds.includes(s.sighting_id!)) {
          state.allIds.push(s.sighting_id!);
        }
        state.list = [s, ...state.list]; // prepend to list view
        state.total += 1;
      })
      .addCase(updateSightingThunk.fulfilled, (state, action: PayloadAction<Sighting>) => {
        const s = action.payload;
        state.byId[s.sighting_id!] = s;
        state.list = state.list.map(item => (item.sighting_id === s.sighting_id ? { ...item, ...s } : item));
      })
      .addCase(deleteSightingThunk.fulfilled, (state, action: PayloadAction<number>) => {
        delete state.byId[action.payload];
        state.allIds = state.allIds.filter(id => id !== action.payload);
        state.list = state.list.filter(item => item.sighting_id !== action.payload);
        state.total = Math.max(0, state.total - 1);
      })
      .addCase(fetchSightingsPaged.pending, state => {
        state.loading = true;
      })
      .addCase(fetchSightingsPaged.fulfilled, (state, action) => {
        const { rows, total, replace } = action.payload;
        state.total = total;
        state.loading = false;
        state.list = replace ? rows : [...state.list, ...rows];
        rows.forEach(s => {
          state.byId[s.sighting_id!] = s as Sighting;
          if (!state.allIds.includes(s.sighting_id!)) {
            state.allIds.push(s.sighting_id!);
          }
        });
      })
      .addCase(fetchSightingsPaged.rejected, state => {
        state.loading = false;
      });
  },
});

export default sightingsSlice.reducer;
