import { createSlice } from "@reduxjs/toolkit";

const Card = createSlice({
  name: "card",
  initialState: {
    categoryData: [],
    categorySelectedItem: [],
    itemData: [],
    itemSelectedItem: [],
    addonData: [],
    addonSelectedItem: null,


    //updated
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
    setAddonData: (state, action) => {
      state.addonData = action.payload;
    },
    setAddonSelectedItem: (state, action) => {
      state.addonSelectedItem = action.payload;
    },
    clearCategoryData: (state) => {
      state.categoryData = [];
      state.categorySelectedItem = [];
      state.itemData = [];
      state.itemSelectedItem = [];
      state.addonData = [];
      state.addonSelectedItem = null;
    },
  },
});

export const {
  setCategoryData,
  setCategorySelectedItem,
  setItemData,
  setItemSelectedItem,
  setAddonData,
  setAddonSelectedItem,
  clearCategoryData,
} = Card.actions;

export default Card.reducer;
