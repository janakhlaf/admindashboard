const API_URL = "http://127.0.0.1:8000";

export const getUsers = async () => {
  const response = await fetch(`${API_URL}/users`);

  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }

  return response.json();
};