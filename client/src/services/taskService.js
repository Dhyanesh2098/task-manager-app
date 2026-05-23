import axios from "axios";

const API_URL = "http://localhost:5000/api/tasks";

const getToken = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  return user?.token;
};

const config = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});

export const getTasks = async () => {
  const response = await axios.get(API_URL, config());
  return response.data;
};

export const createTask = async (taskData) => {
  const response = await axios.post(API_URL, taskData, config());
  return response.data;
};

export const updateTask = async (id, taskData) => {
  const response = await axios.put(`${API_URL}/${id}`, taskData, config());
  return response.data;
};

export const deleteTask = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, config());
  return response.data;
};