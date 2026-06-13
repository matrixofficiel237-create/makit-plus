import { useState, useEffect, lazy, Suspense } from "react";
import { useLocation } from "wouter";
import { getOrders, type Order } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import logoImg from "../assets/logo.jpg";

const AdminMapView = lazy(() => import("../components/AdminMapView"));

const GREEN = "#4CAF50";
const GREEN_DARK = "#388E3C";
const GREEN_LIGHT = "#E8F5E9";

const STATUT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  en_attente: { label: "En attente", color: "#E65100", bg: "#FBE9E7" },
  confirme: { label: "Confirmé", color: "#1565C0", bg: "#E3F2FD" },
  en_cours: { label: "En cours", color: "#6A1B9A", bg: "#F3E5F5" },
  livre: { label: "Livré ✓", color: "#2E7D32", bg: "#E8F5E9" },
  annule: { label: "Annulé", color: "#B71C1C", bg: "#FFEBEE" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"commandes" | "carte">("commandes");

  const isAdmin = user?.role === "admin" || user?.role === "sous_admin";

  useEffect(() => {
    if (!user) { navigate("/connexion"); return; }
    getOrders(user.id).then(o => { setOrders(o); setLoading(false); }).catch(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <nav style={{
        background: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        padding: "0 24px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={logoImg} alt="Makit+" style={{ width: 36, height: 36, borderRadius: 9, objectFit: "cover" }} />
          <span style={{ fontWeight: 800, fontSize: 18, color: "#1a1a1a" }}>Makit+</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 14, color: "#555" }}>
            {user.prenom} {user.nom}
          </span>
          <button
            onClick={handleLogout}
            style={{
              padding: "8px 16px", borderRadius: 10,
              background: "#f5f5f5", color: "#555",
              fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer",
            }}
          >
            Déconnexion
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 16px" }}>
        <div style={{
          background: `linear-gradient(135deg, ${GREEN_DARK}, ${GREEN})`,
          borderRadius: 20, padding: "28px 32px", marginBottom: 28, color: "white",
        }}>
          <p style={{ fontSize: 14, opacity: 0.85, marginBottom: 4 }}>Bonjour 👋</p>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{user.prenom} {user.nom}</h1>
          <p style={{ fontSize: 13, opacity: 0.8 }}>📍 {user.adresse}</p>
          {isAdmin && (
            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.9 }}>
              🛡️ {user.role === "admin" ? "Administrateur" : "Sous-administrateur"}
            </div>
          )}
        </div>

        {/* Admin tabs */}
        {isAdmin && (
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {([
              { key: "commandes", label: "📋 Commandes" },
              { key: "carte", label: "🗺️ Carte des clients" },
            ] as { key: "commandes" | "carte"; label: string }[]).map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  padding: "10px 20px", borderRadius: 12,
                  border: `2px solid ${activeTab === t.key ? GREEN : "#ddd"}`,
                  background: activeTab === t.key ? GREEN : "white",
                  color: activeTab === t.key ? "white" : "#555",
                  fontWeight: 700, fontSize: 14, cursor: "pointer",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Map tab (admin only) */}
        {isAdmin && activeTab === "carte" && (
          <Suspense fallback={<div style={{ textAlign: "center", padding: 40, color: "#888" }}>Chargement de la carte…</div>}>
            <AdminMapView />
          </Suspense>
        )}

        {/* Orders tab */}
        {(!isAdmin || activeTab === "commandes") && (
          <>
            <button
              onClick={() => navigate("/nouvelle-commande")}
              style={{
                width: "100%", padding: "18px", borderRadius: 16,
                background: GREEN, color: "white",
                fontWeight: 800, fontSize: 17, border: "none", cursor: "pointer",
                boxShadow: `0 4px 20px ${GREEN}55`,
                marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              }}
            >
              <span style={{ fontSize: 22 }}>🛒</span>
              Passer une commande
            </button>

            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", marginBottom: 16 }}>
              {isAdmin ? "Toutes les commandes" : "Mes commandes"} {orders.length > 0 && <span style={{ color: "#888", fontWeight: 400, fontSize: 14 }}>({orders.length})</span>}
            </h2>

            {loading ? (
              <div style={{ textAlign: "center", padding: 40, color: "#888" }}>Chargement...</div>
            ) : orders.length === 0 ? (
              <div style={{
                background: "white", borderRadius: 20, padding: 40,
                textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
                <p style={{ color: "#888", fontSize: 15 }}>Vous n'avez pas encore de commandes.</p>
                <p style={{ color: "#bbb", fontSize: 13, marginTop: 8 }}>Cliquez sur "Passer une commande" pour commencer !</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[...orders].reverse().map(order => {
                  const statut = STATUT_LABELS[order.statut] || STATUT_LABELS.en_attente;
                  const isOpen = expanded === order.id;
                  return (
                    <div key={order.id} style={{
                      background: "white", borderRadius: 16,
                      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                      overflow: "hidden",
                    }}>
                      <button
                        onClick={() => setExpanded(isOpen ? null : order.id)}
                        style={{
                          width: "100%", padding: "16px 20px",
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          background: "none", border: "none", cursor: "pointer", textAlign: "left",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                            <span style={{
                              padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                              color: statut.color, background: statut.bg,
                            }}>{statut.label}</span>
                            <span style={{ fontSize: 13, color: "#999" }}>{formatDate(order.date)}</span>
                          </div>
                          <p style={{ fontSize: 14, color: "#333", fontWeight: 600 }}>
                            {order.items.length} article{order.items.length > 1 ? "s" : ""} · {order.totalFinal.toLocaleString()} FCFA
                          </p>
                        </div>
                        <span style={{ color: "#bbb", fontSize: 20, lineHeight: 1 }}>{isOpen ? "▲" : "▼"}</span>
                      </button>

                      {isOpen && (
                        <div style={{ padding: "0 20px 20px", borderTop: "1px solid #f0f0f0" }}>
                          <div style={{ marginTop: 16, marginBottom: 12 }}>
                            {order.items.map(item => (
                              <div key={item.id} style={{
                                display: "flex", justifyContent: "space-between",
                                padding: "6px 0", borderBottom: "1px solid #fafafa", fontSize: 14,
                              }}>
                                <span style={{ color: "#444" }}>{item.nom} × {item.quantite}</span>
                                <span style={{ color: GREEN_DARK, fontWeight: 600 }}>{(item.prix * item.quantite).toLocaleString()} FCFA</span>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "#666" }}>
                            <span>📍 {order.adresse.quartier} — {order.adresse.details || ""}</span>
                            <span>💳 {order.paiement === "livraison" ? "Paiement à la livraison" : order.paiement === "orange_money" ? "Orange Money" : "Mobile Money"}</span>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>
                              <span>Total</span>
                              <span style={{ color: GREEN_DARK }}>{order.totalFinal.toLocaleString()} FCFA</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
