// src/components/Login.jsx
import { useState } from "react";
import "./Login.css";
import authStore from "../store/authStore";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login, loading, error } = authStore();
  const [form, setForm]     = useState({ username: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [localErr, setLocalErr] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalErr("");

    // Validation locale avant d'appeler l'API
    if (!form.username.trim() || !form.password) {
      setLocalErr("Veuillez remplir tous les champs.");
      return;
    }
    if (form.username.trim().length < 3) {
      setLocalErr("Nom d'utilisateur trop court.");
      return;
    }

    await login(form.username.trim(), form.password);
    if (!authStore.getState().error) navigate("/dashboard");
  };

  const displayError = localErr || error;

  return (
    <div className="login-page">
      <div className={`login-card ${displayError ? "login-shake" : ""}`}>
        <div className="login-top">
          <div className="login-ball">
            <img src="/photos/balon.ico" alt="BissauJogo" />
          </div>
          <h2 className="login-title">Bissau<em>Jogo</em></h2>
          <p className="login-sub">Espace administrateur</p>
        </div>

        <form className="login-body" onSubmit={handleSubmit} noValidate>
          {displayError && (
            <div className="login-error" role="alert">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2"/>
                <line x1="8" y1="5" x2="8" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                <circle cx="8" cy="11.5" r=".8" fill="currentColor"/>
              </svg>
              {displayError}
            </div>
          )}

          <div className="login-field">
            <label htmlFor="username">Nom d'utilisateur</label>
            <input
              id="username"
              type="text"
              placeholder="admin"
              autoComplete="username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && document.getElementById("password").focus()}
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Mot de passe</label>
            <div className="pwd-wrap">
              <input
                id="password"
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                className="pwd-eye"
                onClick={() => setShowPwd(!showPwd)}
                aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {/* SVG à la place de l'emoji */}
                {showPwd
                  ? <EyeClosedIcon />
                  : <EyeOpenIcon />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <div className="login-footer">
          <p>Accès réservé aux superusers uniquement</p>
        </div>
      </div>
    </div>
  );
}

function EyeOpenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  );
}

function EyeClosedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 2l12 12M6.5 6.7A2 2 0 0010 10m-6.5-.5C2.5 8.5 1 8 1 8s2.5-5 7-5c1 0 2 .2 2.8.5M13.5 10C14.5 8.8 15 8 15 8s-2.5-5-7-5"
        stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}