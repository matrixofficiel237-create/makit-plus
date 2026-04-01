import { useEffect, useState } from "react";

const APK_LINK = "https://github.com/matrixofficiel237-create/makit-plus/releases/latest/download/Makit-Plus.apk";

const GREEN = "#4CAF50";
const GREEN_DARK = "#388E3C";
const GREEN_LIGHT = "#E8F5E9";
const GREEN_MID = "#A5D6A7";

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
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
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: GREEN, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, fontWeight: 800, color: "white", letterSpacing: -1,
        }}>M+</div>
        <span style={{ fontSize: 20, fontWeight: 700, color: scrolled ? "#1a1a1a" : "white" }}>Makit+</span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <a href="#fonctionnement" style={{
          padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 500,
          color: scrolled ? "#555" : "rgba(255,255,255,0.85)",
          textDecoration: "none", transition: "color 0.2s",
        }}>Comment ça marche</a>
        <a href={APK_LINK} target="_blank" rel="noreferrer" style={{
          padding: "8px 18px", borderRadius: 10,
          background: scrolled ? GREEN : "white",
          color: scrolled ? "white" : GREEN,
          fontSize: 14, fontWeight: 700,
          textDecoration: "none",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          transition: "all 0.2s",
        }}>Télécharger l'APK</a>
      </div>
    </nav>
  );
}

function Hero() {
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

      <div style={{
        width: 90, height: 90, borderRadius: 24,
        background: "white", display: "flex",
        alignItems: "center", justifyContent: "center",
        fontSize: 42, fontWeight: 900, color: GREEN,
        marginBottom: 24, boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        letterSpacing: -2,
      }}>M+</div>

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
        Créez votre liste de courses, passez commande et recevez vos achats directement chez vous à Yaoundé.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <a href={APK_LINK} target="_blank" rel="noreferrer" style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "14px 28px", borderRadius: 14,
          background: "white", color: GREEN,
          fontWeight: 800, fontSize: 16, textDecoration: "none",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          transition: "transform 0.2s",
        }}>
          <span style={{ fontSize: 22 }}>📱</span>
          Télécharger l'APK Android
        </a>
        <a href="#fonctionnement" style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "14px 24px", borderRadius: 14,
          border: "2px solid rgba(255,255,255,0.5)",
          color: "white", fontWeight: 600, fontSize: 16, textDecoration: "none",
        }}>
          En savoir plus ↓
        </a>
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
      items: ["Payez directement à la livraison", "Aucune avance requise", "Service fiable et sécurisé", "Disponible dans toute la ville de Yaoundé"],
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
    <section id="telechargement" style={{ padding: "80px 24px", background: "#fafafa" }}>
      <div style={{
        maxWidth: 640, margin: "0 auto", textAlign: "center",
        background: "white", borderRadius: 28,
        padding: "56px 40px",
        boxShadow: "0 4px 40px rgba(0,0,0,0.08)",
        border: "1px solid #f0f0f0",
      }}>
        <div style={{ fontSize: 60, marginBottom: 20 }}>📱</div>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: "#1a1a1a", marginBottom: 12, letterSpacing: -1 }}>
          Téléchargez Makit+
        </h2>
        <p style={{ fontSize: 15, color: "#666", marginBottom: 8 }}>
          Application Android — Compatible avec tous les appareils Android 6.0 et plus
        </p>
        <p style={{ fontSize: 13, color: "#999", marginBottom: 32 }}>
          Gratuit · Sans publicité · Aucun abonnement requis
        </p>

        <a href={APK_LINK} target="_blank" rel="noreferrer" style={{
          display: "inline-flex", alignItems: "center", gap: 12,
          padding: "16px 36px", borderRadius: 16,
          background: GREEN, color: "white",
          fontWeight: 800, fontSize: 17, textDecoration: "none",
          boxShadow: `0 6px 24px ${GREEN}55`,
          transition: "transform 0.2s",
        }}>
          <span style={{ fontSize: 24 }}>⬇️</span>
          Télécharger l'APK Android
        </a>

        <p style={{ fontSize: 12, color: "#aaa", marginTop: 20 }}>
          Le téléchargement démarrera automatiquement · Android 6.0 et supérieur
        </p>

        <div style={{
          display: "flex", gap: 20, marginTop: 32, justifyContent: "center",
          flexWrap: "wrap",
        }}>
          {["✅ Gratuit", "✅ Sans inscription préalable", "✅ Paiement à la livraison"].map(tag => (
            <span key={tag} style={{ fontSize: 13, color: GREEN_DARK, fontWeight: 600 }}>{tag}</span>
          ))}
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
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: GREEN, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 900, color: "white",
          }}>M+</div>
          <span style={{ fontSize: 18, fontWeight: 700, color: "white" }}>Makit+</span>
        </div>
        <p style={{ fontSize: 14, marginBottom: 8 }}>
          Service de livraison de courses à domicile — Yaoundé, Cameroun
        </p>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
          © {new Date().getFullYear()} Makit+. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <div>
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <Stats />
      <Download />
      <Footer />
    </div>
  );
}
