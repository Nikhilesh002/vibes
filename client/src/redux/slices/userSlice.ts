import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface UserState {
  user: {
    username: string;
    email: string;
  } | null;
  error: string;
}

const initialState: UserState = {
  user: null,
  error: "",
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    login: (state, action: PayloadAction<UserState>) => {
      state.user = action.payload.user;
      state.error = action.payload.error;
    },
    logout: (state) => {
      state.user = null;
      state.error = "";
    },
  },
});

// Action creators are generated for each case reducer function
export const { login, logout } = userSlice.actions;

export default userSlice.reducer;
