const API_URL = "http://127.0.0.1:8000";

export const getAssets = async () => {
  const response = await fetch(`${API_URL}/assets`);

  if (!response.ok) {
    throw new Error("Failed to fetch assets");
  }

  return response.json();
};

export const approveAsset = async (assetId: number) => {
  const response = await fetch(
    `${API_URL}/assets/${assetId}/approve`,
    {
      method: "PATCH",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to approve asset");
  }

  return response.json();
};

export const rejectAsset = async (assetId: number) => {
  const response = await fetch(
    `${API_URL}/assets/${assetId}/reject`,
    {
      method: "PATCH",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to reject asset");
  }

  return response.json();
};

export const deleteAsset = async (assetId: number) => {
  const response = await fetch(
    `${API_URL}/assets/${assetId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete asset");
  }

  return response.json();
};

export const updateAsset = async (
  assetId: number,
  data: any
) => {
  const response = await fetch(
    `${API_URL}/assets/${assetId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update asset");
  }

  return response.json();
};