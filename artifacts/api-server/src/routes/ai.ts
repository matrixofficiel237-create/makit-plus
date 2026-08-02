import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

// Catalogue complet des produits disponibles
const PRODUCTS = [
  { id: "1",  nom: "Gombo",            categorie: "legumes",  prix: 500,  emoji: "🥬" },
  { id: "2",  nom: "Aubergine",        categorie: "legumes",  prix: 600,  emoji: "🍆" },
  { id: "3",  nom: "Courgette",        categorie: "legumes",  prix: 400,  emoji: "🥒" },
  { id: "4",  nom: "Haricots verts",   categorie: "legumes",  prix: 450,  emoji: "🫘" },
  { id: "5",  nom: "Chou",             categorie: "legumes",  prix: 350,  emoji: "🥬" },
  { id: "6",  nom: "Épinards",         categorie: "legumes",  prix: 300,  emoji: "🥬" },
  { id: "7",  nom: "Tomates fraîches", categorie: "tomates",  prix: 500,  emoji: "🍅" },
  { id: "8",  nom: "Tomates cerises",  categorie: "tomates",  prix: 700,  emoji: "🍅" },
  { id: "9",  nom: "Pâte de tomate",   categorie: "tomates",  prix: 300,  emoji: "🍅" },
  { id: "10", nom: "Plantain mûr",     categorie: "plantain", prix: 600,  emoji: "🍌" },
  { id: "11", nom: "Plantain vert",    categorie: "plantain", prix: 500,  emoji: "🍌" },
  { id: "12", nom: "Régime de plantain", categorie: "plantain", prix: 2000, emoji: "🍌" },
  { id: "13", nom: "Poisson frais",    categorie: "poisson",  prix: 2500, emoji: "🐟" },
  { id: "14", nom: "Poisson fumé",     categorie: "poisson",  prix: 1500, emoji: "🐟" },
  { id: "15", nom: "Crevettes",        categorie: "poisson",  prix: 3000, emoji: "🦐" },
  { id: "16", nom: "Sardines",         categorie: "poisson",  prix: 1000, emoji: "🐟" },
  { id: "17", nom: "Poulet entier",    categorie: "viande",   prix: 5000, emoji: "🍗" },
  { id: "18", nom: "Bœuf haché",       categorie: "viande",   prix: 3500, emoji: "🥩" },
  { id: "19", nom: "Porc",             categorie: "viande",   prix: 4000, emoji: "🥩" },
  { id: "20", nom: "Mouton",           categorie: "viande",   prix: 4500, emoji: "🥩" },
  { id: "21", nom: "Oignon",           categorie: "epices",   prix: 300,  emoji: "🧅" },
  { id: "22", nom: "Ail",              categorie: "epices",   prix: 250,  emoji: "🧄" },
  { id: "23", nom: "Piment",           categorie: "epices",   prix: 200,  emoji: "🌶️" },
  { id: "24", nom: "Gingembre",        categorie: "epices",   prix: 300,  emoji: "🫚" },
  { id: "25", nom: "Poivre",           categorie: "epices",   prix: 350,  emoji: "🧂" },
  { id: "26", nom: "Cube Maggi",       categorie: "epices",   prix: 150,  emoji: "🧂" },
];

const SYSTEM_PROMPT = `Tu es l'assistant IA de Makit+, une application de livraison de produits du marché au Cameroun.
Tu aides les personnes, notamment celles en situation de handicap, à créer facilement leur liste de courses.

Voici le catalogue disponible (JSON) :
${JSON.stringify(PRODUCTS)}

Quand l'utilisateur décrit ce qu'il veut (en français, fongbé, langue locale ou peu importe), tu dois :
1. Répondre chaleureusement et simplement (2-3 phrases max).
2. Identifier les produits correspondants dans le catalogue.
3. Retourner UNIQUEMENT un objet JSON valide au format :
{
  "response": "ton message d'accueil bref",
  "productIds": ["1", "7", "21"]
}

Règles importantes :
- Si une recette est mentionnée (ex: sauce tomate, ndolé, eru), propose tous les ingrédients nécessaires.
- Si l'utilisateur dit "légumes", propose une sélection variée de légumes.
- Prix en FCFA. Sois inclusif et bienveillant.
- Ne renvoie JAMAIS autre chose que le JSON demandé.`;

// POST /api/ai/assistant
router.post("/ai/assistant", async (req, res) => {
  const { message } = req.body as { message?: string };

  if (!message || typeof message !== "string" || !message.trim()) {
    res.status(400).json({ error: "Le champ 'message' est requis." });
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.6-luna",
      max_completion_tokens: 512,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: message.trim() },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let parsed: { response?: string; productIds?: string[] };

    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { response: "Je n'ai pas compris. Reformule ta demande.", productIds: [] };
    }

    const suggestedIds = (parsed.productIds ?? []).filter((id) =>
      PRODUCTS.some((p) => p.id === id)
    );
    const products = PRODUCTS.filter((p) => suggestedIds.includes(p.id));

    res.json({
      response: parsed.response ?? "Voici ce que j'ai trouvé pour toi.",
      products,
    });
  } catch (err) {
    console.error("[AI assistant] erreur:", err);
    res.status(500).json({ error: "Erreur de l'assistant IA. Réessaie dans un instant." });
  }
});

export default router;
