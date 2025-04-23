import apiClient from "./apiClient";

const databaseReset = async () => {
    const response = await apiClient.post(
      `/demo/database_reset`,
    );
    return response.data;
  };

  export default {
    databaseReset
  }