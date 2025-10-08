import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Sighting,
  getSightingById,
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
import { updatePlateThunk, deletePlateThunk } from '../plates/platesSlice';

// --- Thunks ---
export const fetchSightingById = createAsyncThunk(
  'sightings/fetchById',
  async (sighting_id: number) => {
    const sighting = await getSightingById(sighting_id);
    if (!sighting) {
      throw new Error('Sighting not found');
    }
    return sighting;
  }
);

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
  async (params: { filters?: SightingsFilter; limit: number; offset: number; replace: boolean }) => {
    const total = await countSightings(params.filters);
    const rows = await getSightingsPaged({ filters: params.filters, limit: params.limit, offset: params.offset });
    return { rows, total, replace: params.replace };
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
      .addCase(fetchSightingById.fulfilled, (state, action: PayloadAction<Sighting>) => {
        const sighting = action.payload;
        state.byId[sighting.sighting_id!] = sighting;
        if (!state.allIds.includes(sighting.sighting_id!)) {
          state.allIds.push(sighting.sighting_id!);
        }
      })
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
      })
      // Listen for plate updates to refresh sightings list
      .addCase(updatePlateThunk.fulfilled, (state, action) => {
        const updatedPlate = action.payload;
        // Update sightings list items that reference this plate
        state.list = state.list.map(item => {
          if (item.plate_id === updatedPlate.plate_id) {
            return {
              ...item,
              plate_name: updatedPlate.name,
              plate_state: updatedPlate.state,
              plate_country: updatedPlate.country,
            };
          }
          return item;
        });
        
        // Update individual sightings that reference this plate
        Object.keys(state.byId).forEach(sightingId => {
          const sighting = state.byId[parseInt(sightingId)];
          if (sighting.plate_id === updatedPlate.plate_id) {
            // Update the sighting with new plate information
            state.byId[parseInt(sightingId)] = {
              ...sighting,
              // Note: We don't store plate details in sighting objects,
              // but this ensures the sighting is marked as updated
            };
          }
        });
      })
      // Listen for plate deletions to remove affected sightings
      .addCase(deletePlateThunk.fulfilled, (state, action) => {
        const deletedPlateId = action.payload;
        const affectedSightings = state.list.filter(item => item.plate_id === deletedPlateId);
        
        // Remove sightings that reference the deleted plate from list
        state.list = state.list.filter(item => item.plate_id !== deletedPlateId);
        
        // Remove sightings from byId state
        affectedSightings.forEach(sighting => {
          if (sighting.sighting_id) {
            delete state.byId[sighting.sighting_id];
            state.allIds = state.allIds.filter(id => id !== sighting.sighting_id);
          }
        });
        
        // Update total count
        state.total = Math.max(0, state.total - affectedSightings.length);
      });
  },
});

export default sightingsSlice.reducer;
