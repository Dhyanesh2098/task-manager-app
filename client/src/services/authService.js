import axios from "axios";

const API_URL = "https://task-manager-backend-0e4l.onrender.com/api/auth";

// Register User
export const registerUser = async (userData) => {
  const response = await axios.post(
    `${API_URL}/register`,
    userData
  );

  return response.data;
};

// Login User
export const loginUser = async (userData) => {
  const response = await axios.post(
    `${API_URL}/login`,
    userData
  );

  return response.data;
};