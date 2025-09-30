import axios from "axios";


export const ScoreApi = async ({ name, score }) => {
  try {
    const response = await axios.post(
      "/api/score",
      {
        name: name.trim(), 
        score: score,
      },
    );

    console.log("Score submitted successfully:", response.data);
    return response.data;

  } catch (error) {
    console.error("Error submitting score:", error);
    return null;
  }
};

export const addUser = async (name) => {
  try {
    const response = await axios.post(
      "/api/addPlayer",
      {
        name: name.trim(), 
      },
    );

    console.log("User added successfully:", response.data);
    return response.data;

  } catch (error) {
    console.error("Error adding user:", error);
    return null;
  }
}

