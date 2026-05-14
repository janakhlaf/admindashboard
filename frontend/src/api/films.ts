const API_URL = "http://127.0.0.1:8000";

export const getFilms = async () => {
  const response = await fetch(`${API_URL}/films`);

  if (!response.ok) {
    throw new Error("Failed to fetch films");
  }

  return response.json();
};

export const approveFilm = async (filmId: number) => {
  const response = await fetch(
    `${API_URL}/films/${filmId}/approve`,
    {
      method: "PATCH",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to approve film");
  }

  return response.json();
};

export const rejectFilm = async (filmId: number) => {
  const response = await fetch(
    `${API_URL}/films/${filmId}/reject`,
    {
      method: "PATCH",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to reject film");
  }

  return response.json();
};

export const deleteFilm = async (filmId: number) => {
  const response = await fetch(
    `${API_URL}/films/${filmId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete film");
  }

  return response.json();
};

export const updateFilm = async (
  filmId: number,
  data: any
) => {
  const response = await fetch(
    `${API_URL}/films/${filmId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update film");
  }

  return response.json();
};