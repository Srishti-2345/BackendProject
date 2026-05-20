import { useEffect, useRef } from "react";

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

const loadGoogleScript = () =>
  new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve(window.google);
      return;
    }

    const existingScript = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.google), { once: true });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = reject;
    document.head.appendChild(script);
  });

const GoogleAuthButton = ({ onCredential, onError, text = "continue_with", width = 320 }) => {
  const buttonRef = useRef(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    let cancelled = false;

    if (!clientId || !buttonRef.current) {
      return undefined;
    }

    loadGoogleScript()
      .then((google) => {
        if (cancelled || !google?.accounts?.id || !buttonRef.current) {
          return;
        }

        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) {
              onCredential(response.credential);
              return;
            }

            onError?.(new Error("Google did not return a credential"));
          },
        });

        buttonRef.current.innerHTML = "";
        google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          shape: "pill",
          width,
          text,
        });
      })
      .catch((error) => {
        if (!cancelled) {
          onError?.(error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, onCredential, onError, text, width]);

  if (!clientId) {
    return null;
  }

  return <div className="google-auth-button" ref={buttonRef} />;
};

export default GoogleAuthButton;
