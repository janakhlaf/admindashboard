const API_URL = "http://localhost:8000";

export const getUsers = async () => {
  const response = await fetch(`${API_URL}/users`);

  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }

  return response.json();
};