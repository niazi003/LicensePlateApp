import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

export const selectAllPlates = (state: RootState) => state.plates.byId;
export const selectPlateIds = (state: RootState) => state.plates.allIds;
export const selectPlatesLoading = (state: RootState) => state.plates.loading;
export const selectPlatesError = (state: RootState) => state.plates.error;

export const selectAllPlatesArray = createSelector(
  [selectAllPlates, selectPlateIds],
  (platesById, plateIds) => plateIds.map(id => platesById[id])
);

export const selectPlateById = createSelector(
  [selectAllPlates, (_: RootState, plateId: number) => plateId],
  (platesById, plateId) => platesById[plateId]
);

export const selectPlatesByState = createSelector(
  [selectAllPlatesArray, (_: RootState, state: string) => state],
  (plates, state) => plates.filter(plate => plate.state === state)
);
