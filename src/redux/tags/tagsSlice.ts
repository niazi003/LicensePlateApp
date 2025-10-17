import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as db from '../../database/helpers';

//---------------------- Thunks ----------------------

export const fetchTags = createAsyncThunk('tags/fetchAll', async () => {
    return await db.getTagNames();
});

export const addTag = createAsyncThunk('tags/add', async (tagName: string) => {
    try {
        await db.addTagName(tagName);
        return tagName;
    } catch (error) {
        console.error('Redux addTag error:', error);
        throw error;
    }
});

export const getTagsForPlate = createAsyncThunk('tags/getForPlate', async (plateId: number) => {
    try {
        return await db.getTagsForPlate(plateId);
    } catch (error) {
        console.error('Redux getTagsForPlate error:', error);
        throw error;
    }
});

export const setTagsForPlate = createAsyncThunk('tags/setForPlate', async ({ plateId, tags }: { plateId: number; tags: string[] }) => {
    try {
        await db.setTagsForPlate(plateId, tags);
        return { plateId, tags };
    } catch (error) {
        console.error('Redux setTagsForPlate error:', error);
        throw error;
    }
});

//---------------------- State ----------------------

type TagState = {
    status?: string;
    allTags: string[];
    plateTags: Record<number, string[]>; // plateId -> tags array
    loading: boolean;
    error: string | null;
};

const initialState: TagState = {
    allTags: [],
    plateTags: {},
    loading: false,
    error: null,
    status: undefined,
};

//---------------------- Slice ----------------------

const tagsSlice = createSlice({
    name: 'tags',
    initialState,
    reducers: {
        clearPlateTags: (state, action: PayloadAction<number>) => {
            delete state.plateTags[action.payload];
        },
        clearAllPlateTags: (state) => {
            state.plateTags = {};
        },
    },
    extraReducers: builder => {
        builder
            // Fetch all tags
            .addCase(fetchTags.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTags.fulfilled, (state, action: PayloadAction<string[]>) => {
                state.loading = false;
                state.allTags = action.payload;
            })
            .addCase(fetchTags.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || null;
            })
            // Add tag
            .addCase(addTag.fulfilled, (state, action: PayloadAction<string>) => {
                if (!state.allTags.includes(action.payload)) {
                    state.allTags.push(action.payload);
                    state.allTags.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
                }
            })
            // Get tags for plate
            .addCase(getTagsForPlate.fulfilled, (state, action: PayloadAction<string[]>) => {
                // This will be handled by the component that calls it
            })
            // Set tags for plate
            .addCase(setTagsForPlate.fulfilled, (state, action: PayloadAction<{ plateId: number; tags: string[] }>) => {
                const { plateId, tags } = action.payload;
                state.plateTags[plateId] = tags;
            });
    },
});

export const { clearPlateTags, clearAllPlateTags } = tagsSlice.actions;
export default tagsSlice.reducer;
