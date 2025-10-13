import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as db from '../../database/helpers';
import { Pattern } from '../../database/helpers';

export const fetchPatternsByPlate = createAsyncThunk('patterns/fetchByPlate', async (plate_id: number) => {
  return { plate_id, patterns: await db.getPatternsByPlate(plate_id) };
});

export const createPattern = createAsyncThunk('patterns/create', async (pattern: Pattern) => {
  return await db.addPattern(pattern);
});

export const updatePatternThunk = createAsyncThunk('patterns/update', async (pattern: Pattern) => {
  await db.updatePattern(pattern);
  return pattern;
});

export const deletePatternThunk = createAsyncThunk(
  'patterns/delete', 
  async (args: { pattern_id: number; plate_id: number }) => {
    await db.deletePattern(args.pattern_id);
    // Renumber remaining patterns for this plate
    await db.renumberPatternsForPlate(args.plate_id);
    return args;
  }
);

type PatternsState = {
  byId: Record<number, Pattern>;
  allIds: number[];
};

const initialState: PatternsState = {
  byId: {},
  allIds: [],
};

const patternsSlice = createSlice({
  name: 'patterns',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchPatternsByPlate.fulfilled, (state, action: PayloadAction<{ plate_id: number; patterns: Pattern[] }>) => {
        action.payload.patterns.forEach(p => {
          state.byId[p.pattern_id!] = p;
          if (!state.allIds.includes(p.pattern_id!)) state.allIds.push(p.pattern_id!);
        });
      })
      .addCase(createPattern.fulfilled, (state, action: PayloadAction<Pattern>) => {
        const p = action.payload;
        state.byId[p.pattern_id!] = p;
        state.allIds.push(p.pattern_id!);
      })
      .addCase(updatePatternThunk.fulfilled, (state, action: PayloadAction<Pattern>) => {
        state.byId[action.payload.pattern_id!] = action.payload;
      })
      .addCase(deletePatternThunk.fulfilled, (state, action: PayloadAction<{ pattern_id: number; plate_id: number }>) => {
        delete state.byId[action.payload.pattern_id];
        state.allIds = state.allIds.filter(id => id !== action.payload.pattern_id);
      });
  },
});

export default patternsSlice.reducer;
