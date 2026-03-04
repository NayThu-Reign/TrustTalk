import { createContext, useContext, useReducer, useEffect, useRef } from "react";
import sodium from "libsodium-wrappers-sumo";
import { restoreFromKeybackupFile } from "../utils/restoreKeybackup";
import { createKeyBackupFile } from "../utils/createKeybackupFile";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const api = import.meta.env.VITE_API_URL;

/* ---------- INITIAL STATE ---------- */

const initialAuthState = {
  authUser: null,
  accessToken: localStorage.getItem("token"),
  loading: true,
  error: null,
  keyPair: null,
  keysReady: false,
  isTabActive: true,
};

/* ---------- REDUCER ---------- */

function authReducer(state, action) {
  switch (action.type) {
    case "AUTH_START":
      return { ...state, loading: true, error: null };

    case "AUTH_SUCCESS":
      console.log("AUTH_SUCCESS payload:", action.payload);
      return {
        ...state,
        authUser: action.payload.user,
        accessToken: action.payload.token,
        loading: false,
        error: null,
      };

    case "AUTH_FAILURE":
      return { ...state, loading: false, error: action.payload };

    case "LOGOUT":
      return { ...initialAuthState, loading: false };

    case "KEYS_READY":
      return { ...state, keyPair: action.payload, keysReady: true };

    case "TAB_ACTIVE":
      return { ...state, isTabActive: action.payload };

    case "UPDATE_AUTH_USER":
      return {
        ...state,
        authUser: {
          ...state.authUser,
          ...action.payload,
        },
      };

    default:
      return state;
  }
}

/* ---------- PROVIDER ---------- */

export default function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);
  const isTabActiveRef = useRef(state.isTabActive);

  /* ---------- TAB VISIBILITY ---------- */

  useEffect(() => {
    const update = (v) => {
      dispatch({ type: "TAB_ACTIVE", payload: v });
      isTabActiveRef.current = v;
    };

    const onVisibility = () => update(!document.hidden);
    const onFocus = () => update(true);
    const onBlur = () => update(false);

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  /* ---------- LOGIN FUNCTION ---------- */

  const login = async (credentials) => {
    dispatch({ type: "AUTH_START" });

    try {
      // Step 1: Login to get access token
      const res = await fetch(`https://sso.trustlinkmm.com/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Login failed");
      }

      const { access_token, refresh_token } = await res.json();

      // consol.log('')

      // Step 2: Fetch user details with the token
      const userRes = await fetch(`${api}/api/users/get-detail`, {
        method: "GET",
        headers: { 
          "Authorization": `Bearer ${access_token}`
        },
        credentials: "include",
      });

      const data = await userRes.json();
      
      if (data.status !== 1) {
        throw new Error("Invalid user");
      }

      // Step 3: Store token and user data
      localStorage.setItem("token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      console.log("Logged in user:", data.user, access_token);
      dispatch({
        type: "AUTH_SUCCESS",
        payload: { user: data.user, token: access_token },
      });

      return { success: true };
    } catch (e) {
      dispatch({ type: "AUTH_FAILURE", payload: e.message });
      return { success: false, error: e.message };
    }
  };

  /* ---------- KEY MANAGEMENT ---------- */

  const initKeys = async () => {
    await sodium.ready;

    const stored = localStorage.getItem("e2ee_keypair");
    if (stored) {
      dispatch({ type: "KEYS_READY", payload: JSON.parse(stored) });
      return;
    }

    const res = await fetch(`${api}/api/backup/restore`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: state.authUser.user_code }),
    });

    if (res.ok) {
      const blob = await res.blob();
      const restored = await restoreFromKeybackupFile(blob, state.authUser.email);
      localStorage.setItem("e2ee_keypair", JSON.stringify(restored));
      dispatch({ type: "KEYS_READY", payload: restored });
      return;
    }

    const kp = sodium.crypto_box_keypair();
    const localKey = {
      publicKeyBase64: sodium.to_base64(kp.publicKey),
      secretKeyBase64: sodium.to_base64(kp.privateKey),
    };

    localStorage.setItem("e2ee_keypair", JSON.stringify(localKey));
    dispatch({ type: "KEYS_READY", payload: localKey });

    const backup = await createKeyBackupFile(localKey, state.authUser.email);
    const form = new FormData();
    form.append("file", backup);
    form.append("userId", state.authUser.user_code);

    await fetch(`${api}/api/backup`, { method: "POST", body: form });
  };

  /* ---------- BOOTSTRAP ---------- */

  useEffect(() => {
    const checkExistingAuth = async () => {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");

      if (token && userStr) {
        const user = JSON.parse(userStr);
        console.log("Restoring session for user:", user);
        dispatch({
          type: "AUTH_SUCCESS",
          payload: { user, token },
        });
        return;
      } else {
        dispatch({ type: "AUTH_FAILURE", payload: null });
      }

    
        
    };

    checkExistingAuth();
  }, []);

  useEffect(() => {
    if (state.authUser && !state.keysReady && !state.loading) {
      initKeys();
    }
  }, [state.authUser, state.loading]);

  /* ---------- LOGOUT ---------- */

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("e2ee_keypair");
    localStorage.removeItem("refresh_token");
    dispatch({ type: "LOGOUT" });
  };

  /* ---------- UPDATE USER ---------- */

  const updateAuthenticatedUser = (updates) => {
    const updatedUser = { ...state.authUser, ...updates };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    dispatch({
      type: "UPDATE_AUTH_USER",
      payload: updates,
    });
  };

  /* ---------- DERIVED FLAGS ---------- */

  const isAuthReady =
    !!state.authUser && !!state.accessToken && state.keysReady && !state.loading;
    

  return (
    <AuthContext.Provider
      value={{
        ...state,
        isAuthReady,
        login,
        logout,
        updateAuthenticatedUser,
        isTabActiveRef,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}