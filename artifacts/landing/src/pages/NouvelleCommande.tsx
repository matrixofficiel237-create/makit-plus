import { useState } from "react";
import { useLocation } from "wouter";
import { createOrder, type OrderItem, API_BASE } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const GREEN = "#4CAF50";
const GREEN_DARK = "#388E3C";
const GREEN_LIGHT = "#E8F5E9";

function calculerFraisLivraison(totalProduits: number): number {
  if (totalProduits <= 0) return 0;
  if (totalProduits <= 10000) return 750;
  if (totalProduits <= 20000) return 1000;
  if (totalProduits <= 30000) return 1500;
  if (totalProduits <= 50000) return 2000;
  return 3000;
}

function calculerFraisLivraisonSpecial(totalProduits: number): number {
  if (totalProduits <= 0) return 0;
  if (totalProduits <= 10000) return 1500;
  if (totalProduits <= 20000) return 2000;
  if (totalProduits <= 30000) return 2500;
  if (totalProduits <= 50000) return 3000;
  return 4000;
}

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function NouvelleCommande() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [items, setItems] = useState<OrderItem[]>([{ id: generateId(), nom: "", prix: 0, quantite: 1 }]);
  const [quartier, setQuartier] = useState("");
  const [details, setDetails] = useState("");
  const [nomDestinataire, setNomDestinataire] = useState(user ? `${user.prenom} ${user.nom}` : "");
  const [telephone, setTelephone] = useState(user?.telephone || "");
  const [paiement, setPaiement] = useState<"livraison" | "orange_money" | "momo">("livraison");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingMobile, setLoadingMobile] = useState<"orange_money" | "momo" | null>(null);

  if (!user) { navigate("/connexion"); return null; }

  function addItem() {
    setItems(prev => [...prev, { id: generateId(), nom: "", prix: 0, quantite: 1 }]);
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function updateItem(id: string, key: keyof OrderItem, value: string | number) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [key]: value } : i));
  }

  const totalProduits = items.reduce((sum, i) => sum + i.prix * i.quantite, 0);
  const fraisLivraison = user?.prixSpecial
    ? calculerFraisLivraisonSpecial(totalProduits)
    : calculerFraisLivraison(totalProduits);
  const totalFinal = totalProduits + fraisLivraison;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const validItems = items.filter(i => i.nom.trim() && i.prix > 0 && i.quantite > 0);
    if (validItems.length === 0) { setError("Ajoutez au moins un article valide."); return; }
    if (!quartier.trim()) { setError("Indiquez votre quartier de livraison."); return; }
    setLoading(true);
    try {
      await createOrder({
        userId: user!.id,
        items: validItems,
        adresse: { nom: nomDestinataire, telephone, quartier, details },
        paiement,
        totalProduits,
        fraisLivraison,
        totalFinal,
      });
      navigate("/tableau-de-bord");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la commande");
    } finally {
      setLoading(false);
    }
  }

  async function handleMobileMoneyPay(type: "orange_money" | "momo") {
    setError("");
    const validItems = items.filter(i => i.nom.trim() && i.prix > 0 && i.quantite > 0);
    if (validItems.length === 0) { setError("Ajoutez au moins un article valide."); return; }
    if (!quartier.trim()) { setError("Indiquez votre quartier de livraison."); return; }
    if (!telephone.trim()) { setError("Indiquez votre numéro de téléphone pour le paiement."); return; }

    setLoadingMobile(type);
    try {
      // Créer la commande
      const result = await createOrder({
        userId: user!.id,
        items: validItems,
        adresse: { nom: nomDestinataire, telephone, quartier, details },
        paiement: type,
        totalProduits,
        fraisLivraison,
        totalFinal,
      });

      // Lancer le paiement KPay (push USSD direct sur le téléphone)
      const kpayMethod = type === "momo" ? "momo" : "orange";
      const label = type === "momo" ? "MTN MoMo" : "Orange Money";
      try {
        const kpayRes = await fetch(`${API_BASE}/payments/initiate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            telephone,
            amount: totalFinal,
            method: kpayMethod,
            orderId: (result as any)?.order?.id ?? "",
            userName: nomDestinataire,
          }),
        });
        const kpayData = await kpayRes.json();
        if (kpayData.success) {
          setError(`✅ Demande ${label} envoyée ! Une notification a été envoyée sur le ${telephone}. Confirmez avec votre PIN pour finaliser. Réf : ${kpayData.reference}`);
        } else {
          setError(`Paiement : ${kpayData.error ?? "Erreur, réessayez."}`);
        }
      } catch {
        setError("Service de paiement momentanément indisponible. Votre commande est bien enregistrée.");
      }

      navigate("/tableau-de-bord");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la commande");
    } finally {
      setLoadingMobile(null);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "11px 14px", borderRadius: 10,
    border: "2px solid #eee", fontSize: 14, outline: "none",
    boxSizing: "border-box", transition: "border-color 0.2s",
  };

  const sectionTitle = (t: string) => (
    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", marginBottom: 14, marginTop: 4 }}>{t}</h3>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <nav style={{
        background: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        padding: "0 20px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <button
          onClick={() => navigate("/tableau-de-bord")}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#333", display: "flex", alignItems: "center", gap: 6 }}
        >
          ← <span style={{ fontSize: 15, fontWeight: 600 }}>Ma commande</span>
        </button>
      </nav>

      <form onSubmit={handleSubmit} style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px" }}>
        {error && (
          <div style={{
            background: "#FFEBEE", border: "1px solid #FFCDD2",
            borderRadius: 12, padding: "12px 16px", marginBottom: 16,
            color: "#C62828", fontSize: 14,
          }}>{error}</div>
        )}

        <div style={{ background: "white", borderRadius: 16, padding: "20px", marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          {sectionTitle("🛒 Articles à acheter")}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((item, idx) => (
              <div key={item.id} style={{
                background: GREEN_LIGHT, borderRadius: 12, padding: "14px",
                display: "flex", flexDirection: "column", gap: 8,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: GREEN_DARK }}>Article {idx + 1}</span>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(item.id)}
                      style={{ background: "none", border: "none", color: "#e53935", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
                  )}
                </div>
                <input
                  placeholder="Nom de l'article (ex: Tomates, Riz 5kg…)"
                  value={item.nom}
                  onChange={e => updateItem(item.id, "nom", e.target.value)}
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = GREEN)}
                  onBlur={e => (e.target.style.borderColor = "#eee")}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>Prix estimé (FCFA)</label>
                    <input
                      type="number" min="0"
                      placeholder="0"
                      value={item.prix || ""}
                      onChange={e => updateItem(item.id, "prix", Number(e.target.value))}
                      style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = GREEN)}
                      onBlur={e => (e.target.style.borderColor = "#eee")}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>Quantité</label>
                    <input
                      type="number" min="1"
                      value={item.quantite}
                      onChange={e => updateItem(item.id, "quantite", Number(e.target.value))}
                      style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = GREEN)}
                      onBlur={e => (e.target.style.borderColor = "#eee")}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button" onClick={addItem}
            style={{
              marginTop: 12, width: "100%", padding: "10px",
              borderRadius: 10, border: `2px dashed ${GREEN}`,
              background: "none", color: GREEN, fontWeight: 700,
              fontSize: 14, cursor: "pointer",
            }}
          >
            + Ajouter un article
          </button>
        </div>

        <div style={{ background: "white", borderRadius: 16, padding: "20px", marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          {sectionTitle("📍 Adresse de livraison")}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>Nom du destinataire</label>
              <input value={nomDestinataire} onChange={e => setNomDestinataire(e.target.value)}
                placeholder="Votre nom complet" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = GREEN)} onBlur={e => (e.target.style.borderColor = "#eee")} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>Téléphone</label>
              <input type="tel" value={telephone} onChange={e => setTelephone(e.target.value)}
                placeholder="Ex: 691234567" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = GREEN)} onBlur={e => (e.target.style.borderColor = "#eee")} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>Quartier *</label>
              <input value={quartier} onChange={e => setQuartier(e.target.value)}
                placeholder="Ex: Bastos, Melen, Nlongkak…" required style={inputStyle}
                onFocus={e => (e.target.style.borderColor = GREEN)} onBlur={e => (e.target.style.borderColor = "#eee")} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>Détails (optionnel)</label>
              <input value={details} onChange={e => setDetails(e.target.value)}
                placeholder="Ex: Rue des Fleurs, face à l'église…" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = GREEN)} onBlur={e => (e.target.style.borderColor = "#eee")} />
            </div>
          </div>
        </div>

        <div style={{ background: "white", borderRadius: 16, padding: "20px", marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          {sectionTitle("💳 Mode de paiement")}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

            {/* Paiement à la livraison – sélection classique */}
            <button
              type="button"
              onClick={() => setPaiement("livraison")}
              style={{
                padding: "14px 16px", borderRadius: 12, textAlign: "left",
                border: `2px solid ${paiement === "livraison" ? GREEN : "#eee"}`,
                background: paiement === "livraison" ? GREEN_LIGHT : "white",
                cursor: "pointer",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 14, color: paiement === "livraison" ? GREEN_DARK : "#333" }}>💵 Paiement à la livraison</div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>Payez en cash à la réception</div>
            </button>

            {/* Séparateur */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0" }}>
              <div style={{ flex: 1, height: 1, background: "#eee" }} />
              <span style={{ fontSize: 11, color: "#aaa", fontWeight: 700, letterSpacing: "0.5px" }}>OU PAYER MAINTENANT</span>
              <div style={{ flex: 1, height: 1, background: "#eee" }} />
            </div>

            {/* Orange Money – bouton d'action direct */}
            <button
              type="button"
              onClick={() => handleMobileMoneyPay("orange_money")}
              disabled={loadingMobile !== null}
              style={{
                padding: "14px 16px", borderRadius: 12, textAlign: "left",
                border: "2px solid #FF6D00",
                background: "#FFF8F0",
                cursor: loadingMobile !== null ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 12,
                opacity: loadingMobile !== null ? 0.7 : 1,
              }}
            >
              <span style={{ fontSize: 24 }}>🟠</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#E65100" }}>
                  {loadingMobile === "orange_money" ? "En cours..." : "Payer avec Orange Money"}
                </div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>Ouvre le composeur + confirme la commande</div>
              </div>
              <span style={{ fontSize: 18, color: "#FF6D00" }}>📞</span>
            </button>

            {/* MTN MoMo – bouton d'action direct */}
            <button
              type="button"
              onClick={() => handleMobileMoneyPay("momo")}
              disabled={loadingMobile !== null}
              style={{
                padding: "14px 16px", borderRadius: 12, textAlign: "left",
                border: "2px solid #FFC107",
                background: "#FFFDF0",
                cursor: loadingMobile !== null ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 12,
                opacity: loadingMobile !== null ? 0.7 : 1,
              }}
            >
              <span style={{ fontSize: 24 }}>📱</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#F57F17" }}>
                  {loadingMobile === "momo" ? "En cours..." : "Payer avec MTN Mobile Money"}
                </div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>Ouvre le composeur + confirme la commande</div>
              </div>
              <span style={{ fontSize: 18, color: "#FFC107" }}>📞</span>
            </button>
          </div>
        </div>

        <div style={{ background: "white", borderRadius: 16, padding: "20px", marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          {sectionTitle("🧾 Récapitulatif")}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#555" }}>
              <span>Articles</span>
              <span>{totalProduits.toLocaleString()} FCFA</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#555" }}>
              <span>Frais de livraison</span>
              <span>{fraisLivraison.toLocaleString()} FCFA</span>
            </div>
            <div style={{
              display: "flex", justifyContent: "space-between",
              fontWeight: 800, fontSize: 16, color: "#1a1a1a",
              borderTop: "2px solid #f0f0f0", paddingTop: 10, marginTop: 4,
            }}>
              <span>Total</span>
              <span style={{ color: GREEN_DARK }}>{totalFinal.toLocaleString()} FCFA</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%", padding: "18px", borderRadius: 16,
            background: loading ? "#ccc" : GREEN,
            color: "white", fontWeight: 800, fontSize: 17,
            border: "none", cursor: loading ? "not-allowed" : "pointer",
            boxShadow: loading ? "none" : `0 4px 20px ${GREEN}55`,
          }}
        >
          {loading ? "Envoi en cours..." : "✅ Confirmer la commande"}
        </button>
      </form>
    </div>
  );
}
