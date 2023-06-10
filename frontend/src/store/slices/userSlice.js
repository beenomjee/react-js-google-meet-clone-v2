import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";

// signin user
const signInUser = createAsyncThunk(
  "user/signin",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        import.meta.env.VITE_BACKEND_URL + "/api/v1/auth/signin",
        data
      );
      return response.data;
    } catch (err) {
      if (err.response.data?.message) toast.error(err.response.data.message);
      else toast.error(err.message);
      return rejectWithValue(err.message);
    }
  }
);

// signup user
const signUpUser = createAsyncThunk(
  "user/signup",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        import.meta.env.VITE_BACKEND_URL + "/api/v1/auth/signup",
        data
      );
      return response.data;
    } catch (err) {
      if (err.response?.status === 413) toast.error("Image Size is too large!");
      else if (err.response.data?.message)
        toast.error(err.response.data.message);
      else toast.error(err.message);
      return rejectWithValue(err.message);
    }
  }
);

// initial value
const initialState = {
  name: "",
  email: "",
  file: "",
  token: "",
  isLoading: false,
};

// slice
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    logout: () => {
      return initialState;
    },
    setUser: (state, action) => {
      return {
        ...state,
        ...action.payload,
      };
    },
  },

  extraReducers: (builder) => {
    // signin
    builder.addCase(signInUser.fulfilled, (state, action) => {
      const user = action.payload;
      state = {
        ...state,
        name: user.fName + " " + user.lName,
        email: user.email,
        file: user.file,
        token: user.token,
        isLoading: false,
      };

      return state;
    });
    builder.addCase(signInUser.pending, (state) => {
      state = {
        ...state,
        isLoading: true,
      };

      return state;
    });
    builder.addCase(signInUser.rejected, (state) => {
      state = {
        ...state,
        isLoading: false,
      };
      return state;
    });

    // signup
    builder.addCase(signUpUser.fulfilled, (state, action) => {
      const user = action.payload;
      state = {
        ...state,
        name: user.fName + " " + user.lName,
        email: user.email,
        file: user.file,
        token: user.token,
        isLoading: false,
      };

      return state;
    });
    builder.addCase(signUpUser.pending, (state) => {
      state = {
        ...state,
        isLoading: true,
      };

      return state;
    });
    builder.addCase(signUpUser.rejected, (state) => {
      state = {
        ...state,
        isLoading: false,
      };
      return state;
    });
  },
});

export const { logout, setUser } = userSlice.actions;
export { signInUser, signUpUser };
export default userSlice.reducer;
