
import React, { useEffect } from "react";
import { exchangeCode } from "../api/Auth";

export const SpotifyCallback: React.FC = () => {
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    console.log("CODE",code)
    if (!code) return;
    exchangeCode(code).then((ok) => {
      window.location.href = ok ? "/player" : "/?error=auth_failed";
    });
  }, []);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0A0A0A",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <p style={{ color: "#2a2a2a", letterSpacing: "0.12em", fontSize: 11 }}>
        CONNECTING…
      </p>
    </div>
  );
};