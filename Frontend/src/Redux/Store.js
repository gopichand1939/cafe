import { configureStore } from "@reduxjs/toolkit";
import Card from "./CardSlice";

const Store = configureStore({
  reducer: {
    card: Card,
  },
});

export default Store;
