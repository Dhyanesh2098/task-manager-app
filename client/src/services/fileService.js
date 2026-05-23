import axios from "axios";

const API_URL = "https://task-manager-backend-0e4l.onrender.com/api/upload";

export const uploadFile = async (file) => {
  const user = JSON.parse(localStorage.getItem("user"));

  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post(API_URL, formData, {
    headers: {
      Authorization: `Bearer ${user.token}`,
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};