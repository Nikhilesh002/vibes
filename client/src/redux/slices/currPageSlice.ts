import { createSlice } from "@reduxjs/toolkit";

export interface ICurrPageState {
  pageNo: number;
}

const initialState: ICurrPageState = {
  pageNo: 1,
};

export const currPageSlice = createSlice({
  name: "currPage",
  initialState,
  reducers: {
    nextPage: (state) => {
      state.pageNo += 1;
    },
    prevPage: (state) => {
      state.pageNo -= 1;
    },
    makeZero: (state) => {
      state.pageNo = 1;
    },
  },
});

// Action creators are generated for each case reducer function
export const { nextPage, prevPage } = currPageSlice.actions;

export default currPageSlice.reducer;
