import { useEffect, useState } from "react";
import { Router, Switch, Route, useLocation } from "wouter";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NouvelleCommande from "./pages/NouvelleCommande";
import { useAuth } from "./context/AuthContext";
import logoImg from "./assets/logo.jpg";
import promoDelivery from "./assets/promo-delivery.png";
import appShowcase from "./assets/app-showcase.png";
import promoLivreur from "./assets/promo-livreur.png";
import promoFamily from "./assets/promo-family.png";

const APK_DOWNLOAD_URL = "https://github.com/matrixofficiel237-create/makit-plus/releases/download/latest/Makit-Plus.apk";
const API_STATS_BASE = typeof window !== "undefined"
  ? `${window.location.origin}/api`
  : "https://market-fresh-delivery--makit4079.replit.app/api";

function downloadApk() {
  window.open(APK_DOWNLOAD_URL, "_blank", "noopener");
}

const GREEN = "#4CAF50";
const GREEN_DARK = "#388E3C";
const GREEN_LIGHT = "#E8F5E9";
const GREEN_MID = "#A5D6A7";

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? "rgba(255,255,255,0.97)" : "transparent",
      boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.08)" : "none",
      transition: "all 0.3s ease",
      padding: "0 24px",
      height: 64,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <img src={logoImg} alt="Makit+" style={{ width: 38, height: 38, borderRadius: 10, objectFit: "cover" }} />
        <span style={{ fontSize: 20, fontWeight: 700, color: scrolled ? "#1a1a1a" : "white" }}>Makit+</span>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <a href="#fonctionnement" style={{
          padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 500,
          color: scrolled ? "#555" : "rgba(255,255,255,0.85)",
          textDecoration: "none", transition: "color 0.2s",
        }}>Comment ça marche</a>
        {user ? (
          <button onClick={() => navigate("/tableau-de-bord")} style={{
            padding: "8px 18px", borderRadius: 10,
            background: scrolled ? GREEN : "white",
            color: scrolled ? "white" : GREEN,
            fontSize: 14, fontWeight: 700,
            border: "none", cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}>Mon espace</button>
        ) : (
          <button onClick={() => navigate("/connexion")} style={{
            padding: "8px 18px", borderRadius: 10,
            background: scrolled ? GREEN : "white",
            color: scrolled ? "white" : GREEN,
            fontSize: 14, fontWeight: 700,
            border: "none", cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            transition: "all 0.2s",
          }}>Se connecter</button>
        )}
      </div>
    </nav>
  );
}

function HeroOrderButton() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  return (
    <button
      onClick={() => navigate(user ? "/tableau-de-bord" : "/connexion")}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "14px 24px", borderRadius: 14,
        border: "2px solid rgba(255,255,255,0.6)",
        background: "rgba(255,255,255,0.12)",
        color: "white", fontWeight: 700, fontSize: 16, cursor: "pointer",
        backdropFilter: "blur(4px)",
      }}
    >
      <span style={{ fontSize: 20 }}>🌐</span>
      Commander en ligne
    </button>
  );
}

function Hero() {
  const [visitors, setVisitors] = useState<number | null>(null);

  useEffect(() => {
    fetch(API_STATS_BASE + "/stats/visit", { method: "POST" })
      .then((r) => r.json())
      .then((d) => setVisitors(d.visitors))
      .catch(() => {});
  }, []);

  return (
    <section style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${GREEN_DARK} 0%, ${GREEN} 60%, #81C784 100%)`,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      textAlign: "center", padding: "80px 24px 60px",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: -100, right: -100,
        width: 400, height: 400, borderRadius: "50%",
        background: "rgba(255,255,255,0.05)",
      }} />
      <div style={{
        position: "absolute", bottom: -80, left: -80,
        width: 300, height: 300, borderRadius: "50%",
        background: "rgba(255,255,255,0.05)",
      }} />

      <img src={logoImg} alt="Makit+" style={{
        width: 110, height: 110, borderRadius: 28,
        objectFit: "cover",
        marginBottom: 24, boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
      }} />

      <h1 style={{
        fontSize: "clamp(40px, 7vw, 72px)", fontWeight: 900,
        color: "white", marginBottom: 16, letterSpacing: -2,
        lineHeight: 1.1,
      }}>Makit+</h1>

      <p style={{
        fontSize: "clamp(18px, 2.5vw, 24px)", color: "rgba(255,255,255,0.9)",
        maxWidth: 560, marginBottom: 8, fontWeight: 500,
      }}>
        Vos courses livrées à domicile
      </p>
      <p style={{
        fontSize: 16, color: "rgba(255,255,255,0.75)",
        maxWidth: 480, marginBottom: 40,
      }}>
        Créez votre liste de courses, passez commande et recevez vos achats directement chez vous.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <button onClick={downloadApk} style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "14px 28px", borderRadius: 14,
          background: "white", color: GREEN,
          fontWeight: 800, fontSize: 16, border: "none", cursor: "pointer",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          transition: "transform 0.2s",
        }}>
          <span style={{ fontSize: 22 }}>📱</span>
          Télécharger l'APK Android
        </button>
        <HeroOrderButton />
      </div>

      <div style={{
        display: "flex", gap: 32, marginTop: 60,
        color: "rgba(255,255,255,0.85)", flexWrap: "wrap", justifyContent: "center",
      }}>
        {[
          { icon: "🛒", label: "Courses en ligne" },
          { icon: "🚚", label: "Livraison rapide" },
          { icon: "💵", label: "Paiement à la livraison" },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15 }}>
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span style={{ fontWeight: 500 }}>{item.label}</span>
          </div>
        ))}
      </div>

      {visitors !== null && (
        <div style={{
          marginTop: 32,
          display: "inline-flex", alignItems: "center", gap: 10,
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.25)",
          borderRadius: 40,
          padding: "10px 22px",
          color: "white",
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: 0.2,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "#69F0AE",
            boxShadow: "0 0 6px #69F0AE",
            display: "inline-block",
          }} />
          <span>
            {visitors.toLocaleString("fr-FR")} visiteur{visitors > 1 ? "s" : ""} sur ce site
          </span>
        </div>
      )}
    </section>
  );
}

function PromoHero() {
  return (
    <section style={{ padding: "0", background: "#fff", overflow: "hidden" }}>
      <div style={{ position: "relative", width: "100%", maxHeight: 480 }}>
        <img
          src={promoDelivery}
          alt="Livraison Makit+"
          style={{ width: "100%", height: 480, objectFit: "cover", display: "block" }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to right, rgba(56,142,60,0.7) 0%, rgba(0,0,0,0.1) 100%)",
          display: "flex", alignItems: "center", padding: "0 48px",
        }}>
          <div style={{ color: "white", maxWidth: 500 }}>
            <p style={{
              fontSize: 13, fontWeight: 700, letterSpacing: 2,
              color: "#A5D6A7", marginBottom: 12, textTransform: "uppercase",
            }}>Service de livraison à domicile</p>
            <h2 style={{
              fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900,
              lineHeight: 1.15, marginBottom: 20, letterSpacing: -1,
            }}>
              Vos courses livrées<br />directement chez vous
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.85)", marginBottom: 28, lineHeight: 1.7 }}>
              Plus besoin de se déplacer au marché. Commandez depuis votre téléphone et recevez vos achats à domicile.
            </p>
            <button onClick={downloadApk} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "13px 24px", borderRadius: 12,
              background: GREEN, color: "white",
              fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer",
              boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
            }}>
              ⬇️ Télécharger l'app
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function PhotoGallery() {
  return (
    <section style={{ padding: "72px 24px", background: "#fafafa" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <span style={{
            display: "inline-block", padding: "6px 16px", borderRadius: 20,
            background: GREEN_LIGHT, color: GREEN_DARK,
            fontSize: 13, fontWeight: 700, marginBottom: 12, letterSpacing: 1,
          }}>NOTRE SERVICE</span>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, color: "#1a1a1a", letterSpacing: -1 }}>
            Rapide, fiable, proche de vous
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
            <img src={promoLivreur} alt="Livreur Makit+" style={{ width: "100%", height: 280, objectFit: "cover", display: "block" }} />
            <div style={{ background: "white", padding: "20px 24px" }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1a1a1a", marginBottom: 6 }}>🚚 Livraison rapide</h3>
              <p style={{ fontSize: 14, color: "#666", lineHeight: 1.6 }}>Nos livreurs expérimentés récupèrent et livrent vos articles rapidement partout dans la ville.</p>
            </div>
          </div>

          <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
            <img src={promoFamily} alt="Famille Makit+" style={{ width: "100%", height: 280, objectFit: "cover", display: "block" }} />
            <div style={{ background: "white", padding: "20px 24px" }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1a1a1a", marginBottom: 6 }}>🏠 À votre porte</h3>
              <p style={{ fontSize: 14, color: "#666", lineHeight: 1.6 }}>Recevez vos produits frais directement chez vous, sans vous déplacer.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { num: "1", icon: "📝", title: "Créez votre liste", desc: "Parcourez le catalogue et ajoutez vos articles au panier directement depuis votre téléphone." },
    { num: "2", icon: "📍", title: "Indiquez votre adresse", desc: "Précisez votre quartier et rue de livraison. Choisissez paiement à la livraison ou Mobile Money." },
    { num: "3", icon: "🚀", title: "Commande passée !", desc: "Un livreur prend en charge votre commande, effectue les achats et vous livre directement à domicile." },
  ];

  return (
    <section id="fonctionnement" style={{ padding: "80px 24px", background: "#fafafa" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <span style={{
            display: "inline-block", padding: "6px 16px", borderRadius: 20,
            background: GREEN_LIGHT, color: GREEN_DARK,
            fontSize: 13, fontWeight: 700, marginBottom: 12, letterSpacing: 1,
          }}>COMMENT ÇA MARCHE</span>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "#1a1a1a", letterSpacing: -1 }}>
            Simple, rapide, fiable
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
          {steps.map((step) => (
            <div key={step.num} style={{
              background: "white", borderRadius: 20, padding: "32px 28px",
              boxShadow: "0 2px 20px rgba(0,0,0,0.06)",
              border: "1px solid #f0f0f0",
              position: "relative",
            }}>
              <div style={{
                position: "absolute", top: 24, right: 24,
                width: 32, height: 32, borderRadius: "50%",
                background: GREEN_LIGHT, color: GREEN_DARK,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: 14,
              }}>{step.num}</div>
              <div style={{ fontSize: 40, marginBottom: 16 }}>{step.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", marginBottom: 10 }}>{step.title}</h3>
              <p style={{ fontSize: 14, color: "#666", lineHeight: 1.7 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: "🛒",
      title: "Faites vos courses",
      color: GREEN,
      bg: GREEN_LIGHT,
      items: ["Créez votre liste de courses en quelques clics", "Ajoutez tous vos articles au panier facilement", "Modifiez votre commande avant validation", "Consultez l'historique de vos commandes"],
    },
    {
      icon: "📍",
      title: "Livraison chez vous",
      color: "#E65100",
      bg: "#FBE9E7",
      items: ["Indiquez votre adresse de livraison", "Choisissez votre heure de livraison préférée", "Suivez le statut de votre commande en temps réel", "Recevez vos courses à votre porte"],
    },
    {
      icon: "💳",
      title: "Paiement simple",
      color: "#1565C0",
      bg: "#E3F2FD",
      items: ["Payez directement à la livraison", "Aucune avance requise", "Service fiable et sécurisé", "Disponible partout dans la ville"],
    },
  ];

  return (
    <section style={{ padding: "80px 24px", background: "white" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <span style={{
            display: "inline-block", padding: "6px 16px", borderRadius: 20,
            background: GREEN_LIGHT, color: GREEN_DARK,
            fontSize: 13, fontWeight: 700, marginBottom: 12, letterSpacing: 1,
          }}>FONCTIONNALITÉS</span>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "#1a1a1a", letterSpacing: -1 }}>
            Une app pour tout le monde
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {features.map((f) => (
            <div key={f.title} style={{
              borderRadius: 20, padding: "32px 28px",
              border: `2px solid ${f.bg}`,
              background: "white",
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: f.bg, display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: 28, marginBottom: 20,
              }}>{f.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", marginBottom: 16 }}>{f.title}</h3>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                {f.items.map((item) => (
                  <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "#555" }}>
                    <span style={{ color: f.color, fontWeight: 700, marginTop: 1, flexShrink: 0 }}>✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const items = [
    { icon: "⏰", label: "Disponible 24h/7" },
    { icon: "📱", label: "Application Android" },
    { icon: "🔒", label: "Paiement à la livraison" },
    { icon: "🏠", label: "Livraison à domicile" },
  ];
  return (
    <section style={{
      padding: "56px 24px",
      background: `linear-gradient(135deg, ${GREEN_DARK}, ${GREEN})`,
    }}>
      <div style={{
        maxWidth: 860, margin: "0 auto",
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 24,
      }}>
        {items.map((s) => (
          <div key={s.label} style={{ textAlign: "center", color: "white" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Download() {
  return (
    <section id="telechargement" style={{ padding: "80px 24px", background: "white" }}>
      <div style={{
        maxWidth: 1000, margin: "0 auto",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48,
        alignItems: "center",
      }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <img
            src={appShowcase}
            alt="Application Makit+"
            style={{ width: "100%", maxWidth: 320, borderRadius: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}
          />
        </div>

        <div>
          <span style={{
            display: "inline-block", padding: "6px 16px", borderRadius: 20,
            background: GREEN_LIGHT, color: GREEN_DARK,
            fontSize: 13, fontWeight: 700, marginBottom: 16, letterSpacing: 1,
          }}>TÉLÉCHARGEMENT GRATUIT</span>

          <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "#1a1a1a", marginBottom: 16, letterSpacing: -1 }}>
            Téléchargez<br />Makit+ maintenant
          </h2>
          <p style={{ fontSize: 15, color: "#666", marginBottom: 8, lineHeight: 1.7 }}>
            Application Android — Compatible avec tous les appareils Android 6.0 et plus.
          </p>
          <p style={{ fontSize: 14, color: "#999", marginBottom: 28 }}>
            Gratuit · Sans publicité · Aucun abonnement requis
          </p>

          <button onClick={downloadApk} style={{
            display: "inline-flex", alignItems: "center", gap: 12,
            padding: "16px 32px", borderRadius: 16,
            background: GREEN, color: "white",
            fontWeight: 800, fontSize: 17, border: "none", cursor: "pointer",
            boxShadow: `0 6px 24px ${GREEN}55`,
            marginBottom: 16,
          }}>
            <span style={{ fontSize: 22 }}>⬇️</span>
            Télécharger l'APK Android
          </button>

          <p style={{ fontSize: 12, color: "#aaa", marginBottom: 24 }}>
            Le téléchargement démarrera automatiquement · Android 6.0+
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {["✅ Gratuit et sans frais cachés", "✅ Paiement uniquement à la livraison", "✅ Disponible sur tout Android"].map(tag => (
              <span key={tag} style={{ fontSize: 14, color: GREEN_DARK, fontWeight: 600 }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{
      background: "#1a1a1a", color: "rgba(255,255,255,0.6)",
      padding: "40px 24px", textAlign: "center",
    }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16 }}>
          <img src={logoImg} alt="Makit+" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />
          <span style={{ fontSize: 18, fontWeight: 700, color: "white" }}>Makit+</span>
        </div>
        <p style={{ fontSize: 14, marginBottom: 8 }}>
          Service de livraison de courses à domicile
        </p>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
          © {new Date().getFullYear()} Makit+. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}

function LandingPage() {
  return (
    <div>
      <Navbar />
      <Hero />
      <PromoHero />
      <PhotoGallery />
      <HowItWorks />
      <Features />
      <Stats />
      <Download />
      <Footer />
    </div>
  );
}

export default function App() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return (
    <Router base={base}>
      <Switch>
        <Route path="/connexion" component={Login} />
        <Route path="/inscription" component={Register} />
        <Route path="/tableau-de-bord" component={Dashboard} />
        <Route path="/nouvelle-commande" component={NouvelleCommande} />
        <Route component={LandingPage} />
      </Switch>
    </Router>
  );
}
