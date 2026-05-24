import axios from "axios";

const API_URL = "http://localhost:5000/api/activities/";

const getActivities = async () => {
  const user = JSON.parse(localStorage.getItem("user"));

  const config = {
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
  };

  const response = await axios.get(API_URL, config);

  return response.data;
};

export default getActivities;