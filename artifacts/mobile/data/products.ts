import { Product } from "@/context/CartContext";

export const CATEGORIES = [
  { id: "legumes", nom: "Légumes", emoji: "🥬" },
  { id: "tomates", nom: "Tomates", emoji: "🍅" },
  { id: "plantain", nom: "Plantain", emoji: "🍌" },
  { id: "poisson", nom: "Poisson", emoji: "🐟" },
  { id: "viande", nom: "Viande", emoji: "🥩" },
  { id: "epices", nom: "Épices", emoji: "🧅" },
];

export const PRODUCTS: Product[] = [
  // Légumes
  { id: "1", nom: "Gombo", categorie: "legumes", prix: 500, emoji: "🥬" },
  { id: "2", nom: "Aubergine", categorie: "legumes", prix: 600, emoji: "🍆" },
  { id: "3", nom: "Courgette", categorie: "legumes", prix: 400, emoji: "🥒" },
  { id: "4", nom: "Haricots verts", categorie: "legumes", prix: 450, emoji: "🫘" },
  { id: "5", nom: "Chou", categorie: "legumes", prix: 350, emoji: "🥬" },
  { id: "6", nom: "Épinards", categorie: "legumes", prix: 300, emoji: "🥬" },

  // Tomates
  { id: "7", nom: "Tomates fraîches", categorie: "tomates", prix: 500, emoji: "🍅" },
  { id: "8", nom: "Tomates cerises", categorie: "tomates", prix: 700, emoji: "🍅" },
  { id: "9", nom: "Pâte de tomate", categorie: "tomates", prix: 300, emoji: "🍅" },

  // Plantain
  { id: "10", nom: "Plantain mûr", categorie: "plantain", prix: 600, emoji: "🍌" },
  { id: "11", nom: "Plantain vert", categorie: "plantain", prix: 500, emoji: "🍌" },
  { id: "12", nom: "Régime de plantain", categorie: "plantain", prix: 2000, emoji: "🍌" },

  // Poisson
  { id: "13", nom: "Poisson frais", categorie: "poisson", prix: 2500, emoji: "🐟" },
  { id: "14", nom: "Poisson fumé", categorie: "poisson", prix: 1500, emoji: "🐟" },
  { id: "15", nom: "Crevettes", categorie: "poisson", prix: 3000, emoji: "🦐" },
  { id: "16", nom: "Sardines", categorie: "poisson", prix: 1000, emoji: "🐟" },

  // Viande
  { id: "17", nom: "Poulet entier", categorie: "viande", prix: 5000, emoji: "🍗" },
  { id: "18", nom: "Bœuf haché", categorie: "viande", prix: 3500, emoji: "🥩" },
  { id: "19", nom: "Porc", categorie: "viande", prix: 4000, emoji: "🥩" },
  { id: "20", nom: "Mouton", categorie: "viande", prix: 4500, emoji: "🥩" },

  // Épices
  { id: "21", nom: "Oignon", categorie: "epices", prix: 300, emoji: "🧅" },
  { id: "22", nom: "Ail", categorie: "epices", prix: 250, emoji: "🧄" },
  { id: "23", nom: "Piment", categorie: "epices", prix: 200, emoji: "🌶️" },
  { id: "24", nom: "Gingembre", categorie: "epices", prix: 300, emoji: "🫚" },
  { id: "25", nom: "Poivre", categorie: "epices", prix: 350, emoji: "🧂" },
  { id: "26", nom: "Cube Maggi", categorie: "epices", prix: 150, emoji: "🧂" },
];
