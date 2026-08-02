import { Router } from "express";
import { findUserByPhone, findUserById, createUser, updateUser, generatePromoCode, findUserByPromoCode, setPromoCode, addPointsToUser, createReferralEvent, hasPrixSpecial } from "../store";
import { signAiToken } from "../lib/aiToken";

const router = Router();

router.post("/login", async (req, res) => {
  const { telephone, motDePasse } = req.body as { telephone: string; motDePasse: string };
  if (!telephone || !motDePasse) {
    res.status(400).json({ error: "telephone and motDePasse required" });
    return;
  }
  const user = await findUserByPhone(telephone);
  if (!user || user.motDePasse !== motDePasse) {
    res.status(401).json({ error: "Numéro ou mot de passe incorrect" });
    return;
  }
  const { motDePasse: _, ...safe } = user;
  const prixSpecial = await hasPrixSpecial(user);
  res.json({ user: { ...safe, prixSpecial }, aiToken: signAiToken(user.id) });
});

router.post("/register", async (req, res) => {
  const { nom, prenom, telephone, adresse, motDePasse, codeParrain, latitude, longitude } = req.body as {
    nom: string; prenom: string; telephone: string; adresse: string; motDePasse: string;
    codeParrain?: string; latitude?: number; longitude?: number;
  };
  if (!nom || !prenom || !telephone || !motDePasse) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const existing = await findUserByPhone(telephone);
  if (existing) {
    res.status(409).json({ error: "Ce numéro est déjà utilisé" });
    return;
  }

  // Valider le code parrain (s'il est fourni)
  let referrer = codeParrain ? await findUserByPromoCode(codeParrain.trim()) : undefined;

  // Générer un code promo unique pour le nouvel utilisateur
  let promoCode = generatePromoCode(prenom);
  let attempt = 0;
  while (attempt < 10) {
    const taken = await findUserByPromoCode(promoCode);
    if (!taken) break;
    promoCode = generatePromoCode(prenom);
    attempt++;
  }

  const newUser = await createUser({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    nom, prenom, telephone,
    adresse: adresse || "",
    motDePasse,
    role: "client",
    promoCode,
    referredBy: referrer?.promoCode ?? null,
    latitude: latitude ?? null,
    longitude: longitude ?? null,
  });

  // Créditer le parrain si le code était valide
  if (referrer) {
    await addPointsToUser(referrer.id, 1);
    await createReferralEvent({
      id: `ref-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      referrerId: referrer.id,
      referredUserId: newUser.id,
      referredUserName: `${prenom} ${nom}`,
    });
  }

  const { motDePasse: _, ...safe } = newUser;
  const prixSpecial = await hasPrixSpecial(newUser);
  res.status(201).json({ user: { ...safe, prixSpecial }, aiToken: signAiToken(newUser.id), referrerFound: !!referrer });
});

router.get("/me/:id", async (req, res) => {
  const user = await findUserById(req.params.id);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  const { motDePasse: _, ...safe } = user;
  const prixSpecial = await hasPrixSpecial(user);
  // Always return a fresh aiToken so users who logged in before the
  // voice feature was deployed receive one automatically on next app load.
  res.json({ user: { ...safe, prixSpecial }, aiToken: signAiToken(user.id) });
});

/**
 * POST /auth/ai-token/refresh
 *
 * Requires a currently-valid AI bearer token to mint a fresh one.
 * Only someone who already holds a valid credential can extend it,
 * so this route does not widen the attack surface beyond the existing
 * token bearer.
 *
 * Body: { userId: string }
 * Header: Authorization: Bearer <current-valid-token>
 */
router.post("/ai-token/refresh", async (req, res) => {
  const auth = req.headers["authorization"];
  const currentToken = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  const { userId } = req.body as { userId?: string };

  if (!currentToken || !userId) {
    res.status(401).json({ error: "Authentification requise." });
    return;
  }

  // Verify the caller holds a currently valid token for this userId
  const { verifyAiToken } = await import("../lib/aiToken");
  if (!verifyAiToken(userId, currentToken)) {
    res.status(401).json({ error: "Token invalide ou expiré." });
    return;
  }

  const user = await findUserById(userId);
  if (!user) {
    res.status(404).json({ error: "Utilisateur introuvable." });
    return;
  }

  res.json({ aiToken: signAiToken(user.id) });
});

router.post("/reset-password", async (req, res) => {
  const { telephone, newPassword } = req.body as { telephone: string; newPassword: string };
  if (!telephone || !newPassword) {
    res.status(400).json({ error: "telephone and newPassword required" });
    return;
  }
  if (newPassword.length < 4) {
    res.status(400).json({ error: "Le mot de passe doit contenir au moins 4 caractères" });
    return;
  }
  const user = await findUserByPhone(telephone);
  if (!user) {
    res.status(404).json({ error: "Aucun compte associé à ce numéro" });
    return;
  }
  await updateUser(user.id, { motDePasse: newPassword });
  res.json({ success: true });
});

router.patch("/update-credentials", async (req, res) => {
  const { userId, currentPassword, newTelephone, newPassword } = req.body as {
    userId: string; currentPassword: string; newTelephone?: string; newPassword?: string;
  };
  if (!userId || !currentPassword) {
    res.status(400).json({ error: "userId and currentPassword required" });
    return;
  }
  const user = await findUserById(userId);
  if (!user) {
    res.status(404).json({ error: "Utilisateur introuvable" });
    return;
  }
  if (user.motDePasse !== currentPassword) {
    res.status(401).json({ error: "Mot de passe actuel incorrect" });
    return;
  }
  if (newTelephone && newTelephone !== user.telephone) {
    const existing = await findUserByPhone(newTelephone);
    if (existing) {
      res.status(409).json({ error: "Ce numéro est déjà utilisé par un autre compte" });
      return;
    }
  }
  const patch: any = {};
  if (newTelephone) patch.telephone = newTelephone;
  if (newPassword) {
    if (newPassword.length < 4) {
      res.status(400).json({ error: "Le nouveau mot de passe doit contenir au moins 4 caractères" });
      return;
    }
    patch.motDePasse = newPassword;
  }
  const updated = await updateUser(userId, patch);
  if (!updated) {
    res.status(404).json({ error: "Utilisateur introuvable" });
    return;
  }
  const { motDePasse: _, ...safe } = updated;
  res.json({ user: safe });
});

export default router;
