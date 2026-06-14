import { useState } from "react";
import { useLocation } from "wouter";
import { login } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import logoImg from "../assets/logo.jpg";

const GREEN = "#4CAF50";
const GREEN_DARK = "#388E3C";

export default function Login() {
  const [, navigate] = useLocation();
  const { setUser } = useAuth();
  const [telephone, setTelephone] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(telephone, motDePasse);
      setUser(user);
      navigate("/tableau-de-bord");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${GREEN_DARK} 0%, ${GREEN} 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        background: "white", borderRadius: 24, padding: "40px 36px",
        width: "100%", maxWidth: 420,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src={logoImg} alt="Makit+" style={{ width: 64, height: 64, borderRadius: 16, objectFit: "cover", marginBottom: 12 }} />
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1a1a1a", marginBottom: 4 }}>Connexion</h1>
          <p style={{ fontSize: 14, color: "#888" }}>Accédez à votre espace Makit+</p>
        </div>

        {error && (
          <div style={{
            background: "#FFEBEE", border: "1px solid #FFCDD2",
            borderRadius: 12, padding: "12px 16px", marginBottom: 20,
            color: "#C62828", fontSize: 14,
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#444", marginBottom: 6, display: "block" }}>
              Numéro de téléphone
            </label>
            <input
              type="tel"
              value={telephone}
              onChange={e => setTelephone(e.target.value)}
              placeholder="Ex: 691234567"
              required
              style={{
                width: "100%", padding: "12px 16px", borderRadius: 12,
                border: "2px solid #eee", fontSize: 15, outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={e => (e.target.style.borderColor = GREEN)}
              onBlur={e => (e.target.style.borderColor = "#eee")}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#444", marginBottom: 6, display: "block" }}>
              Mot de passe
            </label>
            <input
              type="password"
              value={motDePasse}
              onChange={e => setMotDePasse(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: "100%", padding: "12px 16px", borderRadius: 12,
                border: "2px solid #eee", fontSize: 15, outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={e => (e.target.style.borderColor = GREEN)}
              onBlur={e => (e.target.style.borderColor = "#eee")}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "14px", borderRadius: 12,
              background: loading ? "#ccc" : GREEN,
              color: "white", fontWeight: 700, fontSize: 16,
              border: "none", cursor: loading ? "not-allowed" : "pointer",
              marginTop: 4,
            }}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "#888" }}>
          Pas encore de compte ?{" "}
          <button
            onClick={() => navigate("/inscription")}
            style={{ color: GREEN, fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontSize: 14 }}
          >
            S'inscrire
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 12 }}>
          <button
            onClick={() => navigate("/")}
            style={{ color: "#aaa", background: "none", border: "none", cursor: "pointer", fontSize: 13 }}
          >
            ← Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
}
