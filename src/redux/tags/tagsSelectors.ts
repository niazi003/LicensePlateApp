import { RootState } from '../store';

export const selectAllTags = (state: RootState) => state.tags.allTags;
export const selectTagsLoading = (state: RootState) => state.tags.loading;
export const selectTagsError = (state: RootState) => state.tags.error;
export const selectTagsForPlate = (state: RootState, plateId: number) => state.tags.plateTags[plateId] || [];
