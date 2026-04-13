import { createSlice } from "@reduxjs/toolkit";

const Card = createSlice({
  name: "card",
  initialState: {
    categoryData: [],
    categorySelectedItem: [],
    itemData: [],
    itemSelectedItem: [],
  },
  reducers: {
    setCategoryData: (state, action) => {
      state.categoryData = action.payload;
    },
    setCategorySelectedItem: (state, action) => {
      state.categorySelectedItem = action.payload;
    },
    setItemData: (state, action) => {
      state.itemData = action.payload;
    },
    setItemSelectedItem: (state, action) => {
      state.itemSelectedItem = action.payload;
    },
    clearCategoryData: (state) => {
      state.categoryData = [];
      state.categorySelectedItem = [];
      state.itemData = [];
      state.itemSelectedItem = [];
    },
  },
});

export const {
  setCategoryData,
  setCategorySelectedItem,
  setItemData,
  setItemSelectedItem,
  clearCategoryData,
} = Card.actions;

export default Card.reducer;
