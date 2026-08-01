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
          <ul className="space-y-5 font-medium">
            <li className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-primary"><Phone size={18}/></div> <a href="tel:+237658237831" className="hover:text-primary transition-colors text-white/90">+237 658 237 831</a></li>
            <li className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-primary"><MessageCircle size={18}/></div> <a href="https://wa.me/237658237831" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors text-white/90">WhatsApp : 658 237 831</a></li>
            <li className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-primary"><Mail size={18}/></div> <a href="mailto:makit4079@gmail.com" className="hover:text-primary transition-colors text-white/90">makit4079@gmail.com</a></li>
            <li className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></div> <a href="https://facebook.com/Makitplus" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors text-white/90">Facebook : Makit+</a></li>
            <li className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></div> <a href="https://instagram.com/Makitplus" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors text-white/90">Instagram : Makit+</a></li>
            <li className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg></div> <a href="https://tiktok.com/@Makitplus" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors text-white/90">TikTok : Makit+</a></li>
          </ul>
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
