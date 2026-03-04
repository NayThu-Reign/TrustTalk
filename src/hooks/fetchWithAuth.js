export async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem("refresh_token");

  const headers = {
    ...(options.headers || {}),
    Authorization: token ? `Bearer ${token}` : "",
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    if (response.status === 401) {
      console.warn("Unauthorized. Redirecting to login page.");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("e2ee_keypair");
      
      // Redirect to login page
      window.location.hash = '#/login';
      return;
    }

    return response;
  } catch (err) {
    console.error("fetchWithAuth error:", err);
    throw err;
  }
}