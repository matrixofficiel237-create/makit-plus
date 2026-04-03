import { useState } from "react";
import { useLocation } from "wouter";
import { register } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import logoImg from "../assets/logo.jpg";

const GREEN = "#4CAF50";
const GREEN_DARK = "#388E3C";

export default function Register() {
  const [, navigate] = useLocation();
  const { setUser } = useAuth();
  const [form, setForm] = useState({ nom: "", prenom: "", telephone: "", adresse: "", motDePasse: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await register(form);
      setUser(user);
      navigate("/tableau-de-bord");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur d'inscription");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 16px", borderRadius: 12,
    border: "2px solid #eee", fontSize: 15, outline: "none",
    boxSizing: "border-box", transition: "border-color 0.2s",
  };

  const fields: { key: keyof typeof form; label: string; placeholder: string; type?: string }[] = [
    { key: "nom", label: "Nom", placeholder: "Ex: Dupont" },
    { key: "prenom", label: "Prénom", placeholder: "Ex: Jean" },
    { key: "telephone", label: "Numéro de téléphone", placeholder: "Ex: 691234567", type: "tel" },
    { key: "adresse", label: "Adresse / Quartier", placeholder: "Ex: Bastos, Rue des Manguiers" },
    { key: "motDePasse", label: "Mot de passe", placeholder: "••••••••", type: "password" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${GREEN_DARK} 0%, ${GREEN} 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        background: "white", borderRadius: 24, padding: "40px 36px",
        width: "100%", maxWidth: 440,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src={logoImg} alt="Makit+" style={{ width: 64, height: 64, borderRadius: 16, objectFit: "cover", marginBottom: 12 }} />
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1a1a1a", marginBottom: 4 }}>Créer un compte</h1>
          <p style={{ fontSize: 14, color: "#888" }}>Rejoignez Makit+ et commandez dès maintenant</p>
        </div>

        {error && (
          <div style={{
            background: "#FFEBEE", border: "1px solid #FFCDD2",
            borderRadius: 12, padding: "12px 16px", marginBottom: 20,
            color: "#C62828", fontSize: 14,
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {fields.map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#444", marginBottom: 6, display: "block" }}>
                {f.label}
              </label>
              <input
                type={f.type || "text"}
                value={form[f.key]}
                onChange={handleChange(f.key)}
                placeholder={f.placeholder}
                required
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = GREEN)}
                onBlur={e => (e.target.style.borderColor = "#eee")}
              />
            </div>
          ))}

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
            {loading ? "Inscription..." : "Créer mon compte"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "#888" }}>
          Déjà un compte ?{" "}
          <button
            onClick={() => navigate("/connexion")}
            style={{ color: GREEN, fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontSize: 14 }}
          >
            Se connecter
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
