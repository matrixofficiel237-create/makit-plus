import { Router, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import fs from "fs";
import { execFile } from "child_process";
import { promisify } from "util";
// @ts-ignore — ffmpeg-static has no bundled types
import ffmpegPath from "ffmpeg-static";
import { openai } from "@workspace/integrations-openai-ai-server";

const execFileAsync = promisify(execFile);
const FFMPEG = (ffmpegPath as string) ?? "ffmpeg";
import { verifyAiToken } from "../lib/aiToken";
import { findUserById } from "../store";
import { getRecentOrdersByUser } from "../store";

const router = Router();

// ---------------------------------------------------------------------------
// Makit+ AI assistant — free-form catalog-less system prompt
// ---------------------------------------------------------------------------
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
- Pour une recette, utilise les ingrédients précis de la base de connaissance ci-dessous.
- Si la demande est vague ("légumes"), propose une sélection variée et utile.
- Sois inclusif et bienveillant — certains utilisateurs sont en situation de handicap.
- Ne renvoie JAMAIS autre chose que le JSON demandé.

---
BASE DE CONNAISSANCE — PLATS TRADITIONNELS CAMEROUNAIS (ingrédients exacts) :

## Plats à base de feuilles vertes

**Ndolè** : Feuilles de ndolè fraîches (ou congelées) blanchies et lavées, arachides fraîches écorchées et ébouillantées, viande de bœuf / poisson fumé / crevettes fraîches, oignons + ail + gingembre écrasés, huile raffinée.

**Eru** : Feuilles d'eru (okazi) séchées ou fraîches finement coupées, feuilles de Water leaf (épinards sauvages), peau de bœuf cuite (kanda) / tripes / viande de bœuf, poissons fumés + écrevisses séchées moulues, huile de palme rouge + piment jaune.

**Okok** : Feuilles d'okok découpées finement, pâte d'arachides grillées, jus de noix de palme fraîches (sauce graine), sucre (optionnel), sel ou cube d'assaisonnement.

**Kwem** : Feuilles de manioc fraîches pilées, jus de noix de palme fraîches épais, sel (variante moderne), crevettes ou poisson fumé (optionnel).

**Sanga** : Feuilles de zo'o (brèdes) ou jeunes feuilles de courge, grains de maïs frais doux, jus de noix de palme fraîches.

## Mets en papillote

**Koki** : Haricots cornille blancs, huile de palme rouge liquide tiède, piment piquant, feuilles de bananier.

**Nkouo Ngond (pistache)** : Graines de courge moulues, viande de bœuf hachée / poisson fumé, œufs, oignons + sel, feuilles de bananier.

**Mintoumba** : Tubercules de manioc fermentés, huile de palme rouge, piment + sel, feuilles de bananier.

**Kouakoukou** : Tubercules de macabo blanc râpés, huile raffinée, sel, feuilles de bananier (servi avec sauce arachides ou gombo).

## Purées, pilés et sauces rituelles

**Achu (Taro sauce jaune)** : Tubercules de taro (macabo rouge) bouillis et pilés, huile de palme rouge, calcaire (kanwa), épices Achu (pebe, liman, lélé…), viande de bœuf + kanda + tripes.

**Nkui** : Écorce de plante Nkui, mélange d'épices bamiléké (ngansang, pebe, hiomi, chili…), sel + cube (servi avec couscous de maïs).

**Kondrè** : Bananes plantains vertes épluchées, viande de chèvre / porc / bœuf, tomates + oignons + ail + gingembre, épices (djansan, pebe, poivre de Penja), huile de palme rouge.

**Ekwang** : Macabo blanc râpé, jeunes feuilles de macabo tendres, huile de palme rouge en grande quantité, écrevisses séchées moulues + poisson fumé, piment jaune + ail + oignons.

## Sauces sombres, ragoûts et grillades

**Mbongo Tchobi** : Graines de mbongo torréfiées et moulues (noires), morceaux de poisson (capitaine / mâchoiron) ou viande, tomates + oignons + ail + gingembre, huile raffinée, djansan (optionnel).

**Poulet DG** : Poulet entier découpé, bananes plantains mûres frites, carottes + poivrons (vert/rouge/jaune) + haricots verts, tomates + oignons + poireaux + ail + gingembre + céleri, huile raffinée.

**Poisson braisé** : Poissons entiers (maquereau / bar / sole / carpe), djansan + pebe + poivre de Penja, ail + gingembre + oignons + piment fort, huile raffinée.

**Soya** : Faux-filet de bœuf ou viande de mouton en lamelles, poudre de Kankan (cacahuètes torréfiées moulues + piment + sel + épices), huile raffinée.

**Corn Tchap** : Grains de maïs sec trempés et bouillis, haricots rouges ou noirs bouillis, huile de palme rouge, oignons + piment + viande de bœuf (optionnel).
---`;

// ---------------------------------------------------------------------------
// Transcription helpers
// ---------------------------------------------------------------------------
const ALLOWED_AUDIO_MIMES = new Set([
  "audio/m4a",
  "audio/mp4",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/x-m4a",
]);

const upload = multer({
  dest: "/tmp/audio-uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 1,
  },
  fileFilter(_req, file, cb) {
    if (ALLOWED_AUDIO_MIMES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Type de fichier non autorisé: ${file.mimetype}`));
    }
  },
});

// ---------------------------------------------------------------------------
// Verify server-issued HMAC token (issued at login/register via aiToken lib)
// ---------------------------------------------------------------------------
function requireAiToken(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers["authorization"];
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  const userId = req.headers["x-user-id"] as string | undefined;

  if (!token || !userId) {
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(401).json({ error: "Authentification requise." });
    return;
  }

  if (!verifyAiToken(userId, token)) {
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(401).json({ error: "Token invalide." });
    return;
  }

  next();
}

// ---------------------------------------------------------------------------
// In-memory rate limiter — max 10 transcription requests per TCP IP per minute.
// Uses req.socket.remoteAddress only (never X-Forwarded-For).
// ---------------------------------------------------------------------------
const transcribeRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const TRANSCRIBE_MAX_PER_MINUTE = 10;

function transcribeRateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = req.socket.remoteAddress ?? "unknown";
  const now = Date.now();
  const bucket = transcribeRateLimitMap.get(ip);
  if (!bucket || now >= bucket.resetAt) {
    transcribeRateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return next();
  }
  bucket.count += 1;
  if (bucket.count > TRANSCRIBE_MAX_PER_MINUTE) {
    res.status(429).json({ error: "Trop de requêtes. Réessaie dans une minute." });
    return;
  }
  next();
}

// ---------------------------------------------------------------------------
// POST /api/ai/assistant
// ---------------------------------------------------------------------------
router.post("/ai/assistant", async (req, res) => {
  const { message } = req.body as { message?: string };

  if (!message || typeof message !== "string" || !message.trim()) {
    res.status(400).json({ error: "Le champ 'message' est requis." });
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.6-luna",
      max_completion_tokens: 1024,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: message.trim() },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    console.log("[AI raw]", raw.substring(0, 300));

    let parsed: { response?: string; items?: { nom: string; prix: number; emoji: string }[] };

    try {
      // Try direct parse first
      parsed = JSON.parse(raw);
    } catch {
      // Extract JSON block if wrapped in markdown code fences
      const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/) ?? raw.match(/(\{[\s\S]*\})/);
      if (match) {
        try {
          parsed = JSON.parse(match[1]);
        } catch {
          parsed = { response: "Je n'ai pas compris. Reformule ta demande.", items: [] };
        }
      } else {
        parsed = { response: "Je n'ai pas compris. Reformule ta demande.", items: [] };
      }
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

// ---------------------------------------------------------------------------
// POST /api/ai/transcribe
// ---------------------------------------------------------------------------
router.post(
  "/ai/transcribe",
  upload.single("audio"),
  requireAiToken,
  transcribeRateLimit,
  async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "Fichier audio manquant." });
      return;
    }

    const filePath = req.file.path;
    const wavPath  = filePath + ".wav";

    try {
      // Convert whatever format React Native sends (m4a/aac) → WAV PCM 16-bit
      await execFileAsync(FFMPEG, [
        "-y", "-i", filePath,
        "-ar", "16000",   // 16 kHz — optimal for speech recognition
        "-ac", "1",       // mono
        "-c:a", "pcm_s16le",
        wavPath,
      ]);

      const transcription = await openai.audio.transcriptions.create({
        model: "gpt-4o-mini-transcribe",
        file: fs.createReadStream(wavPath) as unknown as File,
        language: "fr",
        response_format: "json",
      });

      res.json({ text: transcription.text });
    } catch (err) {
      console.error("[AI transcribe] erreur:", err);
      res.status(500).json({ error: "La transcription a échoué. Réessaie." });
    } finally {
      fs.unlink(filePath, () => {});
      fs.unlink(wavPath,  () => {});
    }
  }
);

export default router;
