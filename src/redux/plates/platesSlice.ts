import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as db from '../../database/helpers';
import { Plate } from '../../database/helpers';

export const fetchPlates = createAsyncThunk('plates/fetchAll', async () => {
    return await db.getAllPlates();
});

export const createPlate = createAsyncThunk('plates/create', async (plate: Plate) => {
    return await db.addPlate(plate);
});

export const updatePlateThunk = createAsyncThunk('plates/update', async (plate: Plate) => {
    await db.updatePlate(plate);
    return plate;
});

export const deletePlateThunk = createAsyncThunk('plates/delete', async (plate_id: number) => {
    await db.deletePlate(plate_id);
    return plate_id;
});

type PlateState = {
    byId: Record<number, Plate>;
    allIds: number[];
    loading: boolean;
    error: string | null;
};

const initialState: PlateState = {
    byId: {},
    allIds: [],
    loading: false,
    error: null,
};

const platesSlice = createSlice({
    name: 'plates',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchPlates.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPlates.fulfilled, (state, action: PayloadAction<Plate[]>) => {
                state.loading = false;
                state.allIds = action.payload.map(p => p.plate_id!);
                state.byId = {};
                action.payload.forEach(p => {
                    state.byId[p.plate_id!] = p;
                });
            })
            .addCase(fetchPlates.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || null;
            })
            .addCase(createPlate.fulfilled, (state, action: PayloadAction<Plate>) => {
                const plate = action.payload;
                state.byId[plate.plate_id!] = plate;
                state.allIds.push(plate.plate_id!);
            })
            .addCase(updatePlateThunk.fulfilled, (state, action: PayloadAction<Plate>) => {
                const plate = action.payload;
                state.byId[plate.plate_id!] = plate;
            })
            .addCase(deletePlateThunk.fulfilled, (state, action: PayloadAction<number>) => {
                const id = action.payload;
                delete state.byId[id];
                state.allIds = state.allIds.filter(pid => pid !== id);
            });
    },
});
export default platesSlice.reducer;