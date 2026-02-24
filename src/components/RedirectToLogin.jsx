import { useEffect } from "react";

const RedirectToLogin = () => {
  useEffect(() => {
    const redirectUri = encodeURIComponent(window.location.href); // Current page
    window.location.href = `https://sso.trustlinkmm.com/loginForm?redirect_uri=${redirectUri}`;
  }, []);

  return null; // Nothing to render
};

export default RedirectToLogin;
