import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface WindowState {
  isSidebarOpen: boolean;
}

const initialState: WindowState = {
  isSidebarOpen: typeof window !== 'undefined' ? window.innerWidth > 768 : true,
};

const windowSlice = createSlice({
  name: 'window',
  initialState,
  reducers: {
    setIsSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.isSidebarOpen = action.payload;
    },
  },
});

export const { setIsSidebarOpen } = windowSlice.actions;
export default windowSlice.reducer;
