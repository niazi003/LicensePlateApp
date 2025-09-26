import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

export const selectAllPatterns = (state: RootState) => state.patterns.byId;
export const selectPatternIds = (state: RootState) => state.patterns.allIds;

export const selectAllPatternsArray = createSelector(
  [selectAllPatterns, selectPatternIds],
  (patternsById, patternIds) => patternIds.map(id => patternsById[id])
);

export const selectPatternById = createSelector(
  [selectAllPatterns, (_: RootState, patternId: number) => patternId],
  (patternsById, patternId) => patternsById[patternId]
);

export const selectPatternsByPlate = createSelector(
  [selectAllPatternsArray, (_: RootState, plateId: number) => plateId],
  (patterns, plateId) => patterns.filter(pattern => pattern.plate_id === plateId)
);
