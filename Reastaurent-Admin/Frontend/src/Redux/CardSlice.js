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
    customerData: [],
    customerSelectedItem: null,
    orderData: [],
    orderSelectedItem: null,
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
    setCustomerData: (state, action) => {
      state.customerData = action.payload;
    },
    setCustomerSelectedItem: (state, action) => {
      state.customerSelectedItem = action.payload;
    },
    setOrderData: (state, action) => {
      state.orderData = action.payload;
    },
    setOrderSelectedItem: (state, action) => {
      state.orderSelectedItem = action.payload;
    },
    clearCategoryData: (state) => {
      state.categoryData = [];
      state.categorySelectedItem = [];
      state.itemData = [];
      state.itemSelectedItem = [];
      state.addonData = [];
      state.addonSelectedItem = null;
      state.customerData = [];
      state.customerSelectedItem = null;
      state.orderData = [];
      state.orderSelectedItem = null;
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
  setCustomerData,
  setCustomerSelectedItem,
  setOrderData,
  setOrderSelectedItem,
  clearCategoryData,
} = Card.actions;

export default Card.reducer;
