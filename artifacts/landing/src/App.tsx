import { useEffect, useState, useRef, ReactNode } from "react";
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

import { 
  ShoppingCart, 
  Truck, 
  Banknote, 
  Smartphone, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  ShieldCheck,
  Download as DownloadIcon,
  Globe,
  Quote,
  MessageCircle,
  Mail,
  Phone
} from "lucide-react";

const APK_DOWNLOAD_URL = "https://github.com/matrixofficiel237-create/makit-plus/releases/download/latest/Makit-Plus.apk";
const API_STATS_BASE = typeof window !== "undefined"
  ? `${window.location.origin}/api`
  : "https://market-fresh-delivery--makit4079.replit.app/api";

function downloadApk() {
  window.open(APK_DOWNLOAD_URL, "_blank", "noopener");
}

function Reveal({ children, delay = 0, className = "" }: { children: ReactNode, delay?: number, className?: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(40px)",
        transition: `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`
      }}
    >
      {children}
    </div>
  );
}

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
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 lg:px-12 h-20 flex items-center justify-between ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
      <div className="flex items-center gap-3">
        <img src={logoImg} alt="Makit+" className="w-10 h-10 rounded-xl object-cover shadow-sm" />
        <span className={`text-2xl font-black tracking-tight ${scrolled ? 'text-gray-900' : 'text-white drop-shadow-md'}`}>Makit+</span>
      </div>
      <div className="flex items-center gap-6">
        <a href="#fonctionnement" className={`hidden md:block font-bold text-sm transition-colors ${scrolled ? 'text-gray-600 hover:text-primary' : 'text-white/90 hover:text-white drop-shadow-sm'}`}>
          Comment ça marche
        </a>
        <button onClick={() => navigate(user ? "/tableau-de-bord" : "/connexion")} className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg hover:scale-105 ${scrolled ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-white text-primary hover:bg-primary-lighter'}`}>
          {user ? "Mon espace" : "Se connecter"}
        </button>
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
      className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-full border-2 border-white/30 bg-white/10 text-white font-bold text-lg hover:bg-white/20 transition-all backdrop-blur-md shadow-xl group"
    >
      <Globe className="w-6 h-6 group-hover:rotate-12 transition-transform" />
      Commander en ligne
    </button>
  );
}

function VisitorCounter({ visitors }: { visitors: number | null }) {
  if (visitors === null) return null;
  return (
    <div className="mt-12 inline-flex items-center gap-3 bg-black/20 backdrop-blur-xl border border-white/10 rounded-full px-5 py-2.5 text-white/90 font-medium text-sm shadow-2xl">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#69F0AE] opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#69F0AE]"></span>
      </span>
      <span>
        {visitors.toLocaleString("fr-FR")} visiteur{visitors > 1 ? "s" : ""} sur ce site
      </span>
    </div>
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
    <section className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden px-6 pt-32 pb-20 hero-gradient">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-black/10 rounded-full blur-3xl pointer-events-none -translate-x-1/3 translate-y-1/3" />
      
      <div className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto w-full">
        <Reveal>
          <img src={logoImg} alt="Makit+ Logo" className="w-24 h-24 md:w-28 md:h-28 rounded-3xl shadow-2xl mb-8 object-cover border-4 border-white/20" />
        </Reveal>
        
        <Reveal delay={100} className="w-full">
          <h1 className="text-6xl md:text-8xl lg:text-[140px] font-black text-white tracking-tighter leading-[0.9] mb-8 drop-shadow-2xl">
            Makit<span className="text-primary-light">+</span>
          </h1>
        </Reveal>
        
        <Reveal delay={200}>
          <p className="text-xl md:text-3xl text-white font-semibold max-w-3xl mx-auto mb-10 leading-snug tracking-tight drop-shadow-md">
            Le marché qui vient directement chez vous.
          </p>
        </Reveal>

        <Reveal delay={300} className="w-full flex flex-col sm:flex-row items-center justify-center gap-4">
          <HeroOrderButton />
          <button onClick={downloadApk} className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-white text-primary-dark font-bold text-lg hover:scale-105 transition-transform shadow-2xl group">
            <Smartphone className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
            Télécharger l'App
          </button>
        </Reveal>
        
        <Reveal delay={400}>
          <VisitorCounter visitors={visitors} />
        </Reveal>
      </div>

      <div className="absolute bottom-10 left-0 right-0 hidden lg:flex justify-center gap-12 text-white/90 font-bold text-sm tracking-wide">
        <div className="flex items-center gap-2 drop-shadow-md"><ShoppingCart size={20} /> Courses en ligne</div>
        <div className="flex items-center gap-2 drop-shadow-md"><Truck size={20} /> Livraison rapide</div>
        <div className="flex items-center gap-2 drop-shadow-md"><Banknote size={20} /> Paiement à la livraison</div>
      </div>
    </section>
  );
}

function PromoHero() {
  return (
    <section className="py-24 px-6 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        <Reveal className="w-full lg:w-1/2 relative">
          <div className="absolute inset-0 bg-primary/10 translate-x-4 translate-y-4 rounded-[2rem] -z-10"></div>
          <img src={promoDelivery} alt="Livraison Makit+" className="w-full aspect-square md:aspect-[4/3] object-cover rounded-[2rem] shadow-2xl" />
          <div className="absolute -bottom-8 -left-8 bg-white p-6 rounded-2xl shadow-xl max-w-[200px] hidden md:block border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary-lighter flex items-center justify-center text-primary">
                <CheckCircle2 size={24} />
              </div>
              <span className="font-bold text-gray-900 leading-tight">Qualité<br/>Garantie</span>
            </div>
            <p className="text-xs text-gray-500 font-medium">Sélectionnés avec soin le matin même.</p>
          </div>
        </Reveal>
        
        <div className="w-full lg:w-1/2 space-y-8">
          <Reveal delay={100}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary-lighter text-primary-dark font-bold text-xs uppercase tracking-widest mb-4">Service de livraison à domicile</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 leading-[1.1] tracking-tight mt-2">
              Vos courses livrées directement chez vous.
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-lg text-gray-600 leading-relaxed font-medium">
              Plus besoin de se déplacer au marché, d'affronter la foule ou les bouchons. Makit+ sélectionne pour vous les meilleurs produits frais et vous les apporte à votre porte.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <button onClick={downloadApk} className="flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-full font-bold text-lg hover:bg-gray-800 hover:-translate-y-1 transition-all shadow-xl">
              <DownloadIcon size={20} />
              Télécharger l'application
            </button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function PhotoGallery() {
  return (
    <section className="py-24 px-6 bg-primary-lighter/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Reveal>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary-dark font-bold text-xs uppercase tracking-widest mb-4">Notre Service</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">Proche, rapide et humain</h2>
            <p className="text-gray-600 text-lg mt-6 font-medium">Nous mettons un point d'honneur à vous offrir un service de qualité, avec des livreurs de confiance.</p>
          </Reveal>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <Reveal delay={100} className="group rounded-[2rem] overflow-hidden bg-white shadow-xl hover:shadow-2xl transition-all relative">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 pointer-events-none"></div>
            <img src={promoLivreur} className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-700" alt="Livreur" />
            <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
              <div className="flex items-center gap-4 text-white mb-4">
                <div className="p-3 bg-primary rounded-xl backdrop-blur-md"><Truck size={28} /></div>
                <h3 className="text-3xl font-black tracking-tight">Livraison Rapide</h3>
              </div>
              <p className="text-white/90 font-medium text-lg leading-snug">Nos livreurs connaissent Yaoundé comme leur poche pour vous garantir un délai optimal.</p>
            </div>
          </Reveal>
          
          <Reveal delay={200} className="group rounded-[2rem] overflow-hidden bg-white shadow-xl hover:shadow-2xl transition-all relative">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 pointer-events-none"></div>
            <img src={promoFamily} className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-700" alt="Famille" />
            <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
              <div className="flex items-center gap-4 text-white mb-4">
                <div className="p-3 bg-[#E65100] rounded-xl backdrop-blur-md"><MapPin size={28} /></div>
                <h3 className="text-3xl font-black tracking-tight">À votre porte</h3>
              </div>
              <p className="text-white/90 font-medium text-lg leading-snug">Profitez de vos proches pendant que nous nous chargeons de faire vos courses.</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { num: "01", icon: <ShoppingCart size={36}/>, title: "Créez votre liste", desc: "Parcourez notre catalogue complet et ajoutez vos articles au panier en un clic." },
    { num: "02", icon: <MapPin size={36}/>, title: "Indiquez l'adresse", desc: "Renseignez votre quartier à Yaoundé et choisissez votre mode de paiement (Cash ou Mobile Money)." },
    { num: "03", icon: <Truck size={36}/>, title: "On s'occupe du reste", desc: "Un livreur effectue les achats et vous livre chez vous dans les plus brefs délais." },
  ];

  return (
    <section id="fonctionnement" className="py-24 px-6 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <Reveal className="text-center max-w-2xl mx-auto mb-20">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary-lighter text-primary-dark font-bold text-xs uppercase tracking-widest mb-4">Processus</span>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">Comment ça marche ?</h2>
          <p className="text-gray-600 mt-6 text-lg font-medium">Trois étapes simples pour recevoir vos courses sans quitter votre domicile.</p>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-12 relative">
          <div className="hidden md:block absolute top-16 left-[15%] right-[15%] h-1 bg-gray-100 border-t-2 border-dashed border-gray-200 z-0"></div>
          
          {steps.map((step, i) => (
            <Reveal key={step.num} delay={i * 150} className="relative z-10 flex flex-col items-center text-center">
              <div className="w-28 h-28 rounded-[2rem] bg-primary-lighter flex items-center justify-center text-primary mb-8 shadow-[0_0_0_12px_rgba(255,255,255,1)] relative rotate-3 hover:rotate-0 transition-transform">
                <span className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-base shadow-lg">{step.num}</span>
                {step.icon}
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-4">{step.title}</h3>
              <p className="text-gray-600 leading-relaxed max-w-[280px] font-medium">{step.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: <ShoppingCart size={32} />, title: "Faites vos courses", color: "text-primary", bg: "bg-primary-lighter", border: "border-primary-light",
      items: ["Créez votre liste de courses en clics", "Ajoutez tous vos articles facilement", "Historique de vos commandes"]
    },
    {
      icon: <MapPin size={32} />, title: "Livraison chez vous", color: "text-[#E65100]", bg: "bg-[#FBE9E7]", border: "border-[#FFCCBC]",
      items: ["Indiquez votre adresse à Yaoundé", "Suivez votre commande en direct", "Recevez vos courses à la porte"]
    },
    {
      icon: <Banknote size={32} />, title: "Paiement simple", color: "text-[#1565C0]", bg: "bg-[#E3F2FD]", border: "border-[#BBDEFB]",
      items: ["Payez directement à la livraison", "Mobile Money accepté sans frais", "Service fiable et 100% sécurisé"]
    }
  ];

  return (
    <section className="py-32 px-6 bg-gray-50 border-y border-gray-100">
      <div className="max-w-7xl mx-auto">
        <Reveal className="mb-16 max-w-2xl">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white text-gray-900 font-bold text-xs uppercase tracking-widest mb-4 shadow-sm border border-gray-200">Fonctionnalités</span>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-[1.1]">Une app pensée<br/>pour vous simplifier la vie.</h2>
        </Reveal>

        <div className="grid lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 100} className={`bg-white rounded-[2rem] p-10 border ${f.border} shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2`}>
              <div className={`w-20 h-20 rounded-2xl ${f.bg} ${f.color} flex items-center justify-center mb-8`}>
                {f.icon}
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-6">{f.title}</h3>
              <ul className="space-y-4">
                {f.items.map(item => (
                  <li key={item} className="flex items-start gap-4">
                    <CheckCircle2 className={`w-6 h-6 shrink-0 ${f.color}`} />
                    <span className="text-gray-600 font-medium leading-tight">{item}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const items = [
    { icon: <Clock size={48} />, label: "Disponible 24h/7" },
    { icon: <Smartphone size={48} />, label: "Application Android" },
    { icon: <ShieldCheck size={48} />, label: "Paiement Sécurisé" },
    { icon: <MapPin size={48} />, label: "Livraison Yaoundé" },
  ];
  return (
    <section className="py-20 px-6 bg-primary-dark relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-2 md:grid-cols-4 gap-12">
        {items.map((s, i) => (
          <Reveal key={s.label} delay={i * 100} className="flex flex-col items-center text-center text-white">
            <div className="mb-6 opacity-90 p-4 bg-white/10 rounded-full backdrop-blur-sm">{s.icon}</div>
            <div className="font-bold text-xl tracking-tight">{s.label}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  const reviews = [
    {
      name: "Amina", location: "Yaoundé",
      text: "Je n'ai plus besoin de passer des heures au marché de Mokolo. Le livreur me ramène tout bien frais !",
      emoji: "🥬"
    },
    {
      name: "Cédric", location: "Yaoundé",
      text: "Un service vraiment fiable. Je commande mes légumes depuis le bureau, et quand j'arrive à la maison, tout est là.",
      emoji: "💼"
    },
    {
      name: "Chantal", location: "Yaoundé",
      text: "Les prix sont transparents et les livreurs sont toujours souriants. Bravo à l'équipe Makit+ !",
      emoji: "🌟"
    }
  ];

  return (
    <section className="py-32 px-6 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <Reveal className="text-center mb-20">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary-dark font-bold text-xs uppercase tracking-widest mb-4">Témoignages</span>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">Ce qu'ils pensent de nous</h2>
        </Reveal>
        
        <div className="grid md:grid-cols-3 gap-8">
          {reviews.map((r, i) => (
            <Reveal key={r.name} delay={i * 150} className="bg-gray-50 border border-gray-100 rounded-[2rem] p-10 relative hover:bg-white hover:shadow-xl transition-all">
              <Quote className="absolute top-8 right-8 text-primary/10 w-20 h-20" />
              <div className="text-5xl mb-8 relative z-10">{r.emoji}</div>
              <p className="text-gray-700 text-lg font-medium leading-relaxed mb-10 relative z-10">
                "{r.text}"
              </p>
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white font-black text-xl shadow-md">
                  {r.name.charAt(0)}
                </div>
                <div>
                  <div className="font-black text-gray-900 text-lg">{r.name}</div>
                  <div className="text-sm font-bold text-primary">{r.location}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Download() {
  return (
    <section id="telechargement" className="py-24 px-6 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto bg-primary-dark rounded-[3rem] p-10 md:p-20 relative shadow-[0_30px_60px_-15px_rgba(76,175,80,0.5)] flex flex-col md:flex-row items-center gap-16 overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-black/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="w-full md:w-1/2 relative z-10 text-white">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/20 text-white font-bold text-xs uppercase tracking-widest mb-6 backdrop-blur-md border border-white/10">Téléchargement Gratuit</span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.05] mb-6 tracking-tight">Emportez votre marché partout.</h2>
          <p className="text-white/80 text-lg mb-10 font-medium leading-relaxed">
            Application Android — Compatible avec tous les appareils Android 6.0 et plus. Gratuit, sans publicité, aucun abonnement requis.
          </p>
          <button onClick={downloadApk} className="flex items-center gap-4 px-8 py-5 bg-white text-primary-dark rounded-full font-black text-lg hover:scale-105 transition-transform shadow-2xl w-full sm:w-auto justify-center">
            <DownloadIcon size={24} />
            Télécharger l'APK
          </button>
          <div className="mt-8 flex flex-col gap-3 text-white/90 font-bold">
            <div className="flex items-center gap-3"><CheckCircle2 size={20} className="text-[#A5D6A7]"/> Paiement uniquement à la livraison</div>
            <div className="flex items-center gap-3"><CheckCircle2 size={20} className="text-[#A5D6A7]"/> Disponible sur tout Android</div>
          </div>
        </div>
        
        <div className="w-full md:w-1/2 relative z-10 flex justify-center mt-10 md:mt-0">
          <img src={appShowcase} alt="Application Makit+" className="w-[280px] md:w-[320px] drop-shadow-[0_30px_60px_rgba(0,0,0,0.6)] hover:-translate-y-4 transition-transform duration-700" />
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 pt-24 pb-12 px-6 text-white/70">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
        <div className="md:col-span-2">
          <div className="flex items-center gap-4 mb-6">
            <img src={logoImg} alt="Makit+" className="w-14 h-14 rounded-2xl object-cover" />
            <span className="text-4xl font-black text-white tracking-tight">Makit+</span>
          </div>
          <p className="text-white/60 text-lg max-w-sm mb-8 leading-relaxed font-medium">
            Le premier service de livraison de courses à domicile qui comprend vos besoins. De la fraîcheur directement chez vous, partout à Yaoundé.
          </p>
        </div>
        
        <div>
          <h4 className="text-white font-bold text-xl mb-8 tracking-tight">Liens Rapides</h4>
          <ul className="space-y-5 font-medium">
            <li><a href="#fonctionnement" className="hover:text-primary transition-colors flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary/50"></div> Comment ça marche</a></li>
            <li><a href="#" className="hover:text-primary transition-colors flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary/50"></div> Politique de confidentialité</a></li>
            <li><a href="#" className="hover:text-primary transition-colors flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary/50"></div> Conditions générales</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="text-white font-bold text-xl mb-8 tracking-tight">Contact</h4>
          <ul className="space-y-5 font-medium mb-10">
            <li className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-primary"><Phone size={18}/></div>
              <a href="tel:+237658237831" className="hover:text-primary transition-colors text-white/90">+237 658 237 831</a>
            </li>
            <li className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-primary"><MessageCircle size={18}/></div>
              <a href="https://wa.me/237658237831" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors text-white/90">WhatsApp : 658 237 831</a>
            </li>
            <li className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-primary"><Mail size={18}/></div>
              <a href="mailto:makit4079@gmail.com" className="hover:text-primary transition-colors text-white/90">makit4079@gmail.com</a>
            </li>
          </ul>

          <h4 className="text-white font-bold text-base mb-4 tracking-tight">Réseaux sociaux</h4>
          <div style={{ display: "flex", gap: 12 }}>
            {/* Facebook */}
            <a href="https://facebook.com/Makitplus" target="_blank" rel="noopener noreferrer" title="Facebook"
              style={{ width: 44, height: 44, borderRadius: "50%", background: "#1877F2", display: "flex", alignItems: "center", justifyContent: "center", transition: "opacity 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")} onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            {/* Instagram */}
            <a href="https://instagram.com/Makitplus" target="_blank" rel="noopener noreferrer" title="Instagram"
              style={{ width: 44, height: 44, borderRadius: "50%", background: "radial-gradient(circle at 30% 107%, #fdf497 0%, #fd5949 45%, #d6249f 60%, #285AEB 90%)", display: "flex", alignItems: "center", justifyContent: "center", transition: "opacity 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")} onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
            {/* TikTok */}
            <a href="https://tiktok.com/@Makitplus" target="_blank" rel="noopener noreferrer" title="TikTok"
              style={{ width: 44, height: 44, borderRadius: "50%", background: "#010101", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.15)", transition: "opacity 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")} onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.79 1.52V6.75a4.85 4.85 0 01-1.02-.06z"/></svg>
            </a>
            {/* WhatsApp */}
            <a href="https://wa.me/237658237831" target="_blank" rel="noopener noreferrer" title="WhatsApp"
              style={{ width: 44, height: 44, borderRadius: "50%", background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", transition: "opacity 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")} onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </a>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 text-center text-sm font-medium flex flex-col md:flex-row items-center justify-between gap-4">
        <div>© {new Date().getFullYear()} Makit+. Tous droits réservés.</div>
        <div className="flex items-center gap-2">Fait avec passion à Yaoundé. <span className="text-primary text-lg">🇨🇲</span></div>
      </div>
    </footer>
  );
}

function LandingPage() {
  return (
    <div className="selection:bg-primary selection:text-white">
      <Navbar />
      <Hero />
      <PromoHero />
      <PhotoGallery />
      <HowItWorks />
      <Features />
      <Stats />
      <Testimonials />
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
