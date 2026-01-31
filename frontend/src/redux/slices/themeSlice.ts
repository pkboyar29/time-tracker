import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getThemeFromLS } from '../../helpers/localstorageHelpers';

type ThemeType = 'dark' | 'light';

interface ThemeState {
  theme: ThemeType;
}

const initialState: ThemeState = {
  theme: getThemeFromLS() === 'dark' ? 'dark' : 'light',
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeType>) => {
      state.theme = action.payload;
    },
  },
});

export const { setTheme } = themeSlice.actions;
export default themeSlice.reducer;
