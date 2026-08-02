import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

const SYSTEM_PROMPT = `Tu es l'assistant IA de Makit+, une application de livraison de produits du marché au Cameroun (Douala, Yaoundé).

Makit+ ne possède pas de catalogue fixe. Les utilisateurs composent librement leur liste de courses.
Ton rôle est d'aider l'utilisateur à préparer sa liste en comprenant ce qu'il veut cuisiner ou acheter, puis en lui proposant les articles nécessaires avec des prix réalistes en FCFA (marché camerounais 2025).

Quand l'utilisateur décrit sa demande (recette, repas, besoin du quotidien), tu dois :
1. Répondre chaleureusement et brièvement (1-2 phrases).
2. Lister les articles nécessaires avec un prix unitaire réaliste en FCFA.
3. Retourner UNIQUEMENT un objet JSON valide au format :
{
  "response": "ton message bref",
  "items": [
    { "nom": "Tomates fraîches", "prix": 500, "emoji": "🍅" },
    { "nom": "Oignon", "prix": 300, "emoji": "🧅" }
  ]
}

Règles :
- Les prix sont en FCFA, basés sur les prix réels des marchés camerounais.
- Utilise des emojis pertinents pour chaque article.
- Pour une recette, propose tous les ingrédients de base nécessaires.
- Si la demande est vague ("légumes"), propose une sélection variée et utile.
- Sois inclusif et bienveillant — certains utilisateurs sont en situation de handicap.
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
    let parsed: { response?: string; items?: { nom: string; prix: number; emoji: string }[] };

    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { response: "Je n'ai pas compris. Reformule ta demande.", items: [] };
    }

    res.json({
      response: parsed.response ?? "Voici ce que je te suggère.",
      items: (parsed.items ?? []).filter(
        (i) => typeof i.nom === "string" && typeof i.prix === "number" && i.prix > 0
      ),
    });
  } catch (err) {
    console.error("[AI assistant] erreur:", err);
    res.status(500).json({ error: "Erreur de l'assistant IA. Réessaie dans un instant." });
  }
});

export default router;
