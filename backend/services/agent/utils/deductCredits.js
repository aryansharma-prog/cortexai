import axios from "axios";

export const deductCredits = async (userId, agent) => {
  if (!userId || userId === "anonymous" || userId.startsWith("test_")) {
    return null;
  }
  try {
    const { data } = await axios.post(`${process.env.AUTH_SERVICE}/deduct-credits`, { userId, agent });
    return data;
  } catch (error) {
    // Graceful handling without breaking the agent workflow
    return null;
  }
};