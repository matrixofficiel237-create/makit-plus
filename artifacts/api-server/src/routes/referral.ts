import { Router } from "express";
import {
  findUserById, findUserByPromoCode, generatePromoCode, setPromoCode,
  addPointsToUser, createReferralEvent, getReferralHistory, getAllReferrals,
  getAllUsers, useReward
} from "../store";

const router = Router();

// GET /api/referral/admin/all – stats admin (DOIT être avant /:userId)
router.get("/admin/all", async (_req, res) => {
  const [allUsers, allReferrals] = await Promise.all([getAllUsers(), getAllReferrals()]);
  const clients = allUsers.filter(u => u.role === "client");
  const usersWithPromo = clients.filter(u => u.promoCode);
  const totalPoints = clients.reduce((s, u) => s + u.points, 0);
  const totalRewardsUsed = clients.reduce((s, u) => s + u.rewardsUsed, 0);
  const topReferrers = clients
    .filter(u => u.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 10)
    .map(u => ({
      id: u.id,
      nom: u.nom,
      prenom: u.prenom,
      promoCode: u.promoCode,
      points: u.points,
      rewardsUsed: u.rewardsUsed,
      availableRewards: Math.max(0, Math.floor(u.points / 10) - u.rewardsUsed),
    }));
  res.json({
    totalReferrals: allReferrals.length,
    totalPoints,
    totalRewardsUsed,
    usersWithPromo: usersWithPromo.length,
    topReferrers,
    recentReferrals: allReferrals.slice(0, 20),
  });
});

// GET /api/referral/:userId – infos parrainage du compte
router.get("/:userId", async (req, res) => {
  const user = await findUserById(req.params.userId);
  if (!user) { res.status(404).json({ error: "Utilisateur introuvable" }); return; }
  const history = await getReferralHistory(user.id);
  const availableRewards = Math.floor(user.points / 10) - user.rewardsUsed;
  res.json({
    promoCode: user.promoCode ?? null,
    points: user.points,
    rewardsUsed: user.rewardsUsed,
    availableRewards: Math.max(0, availableRewards),
    history,
  });
});

// POST /api/referral/:userId/generate – générer un code pour un utilisateur existant
router.post("/:userId/generate", async (req, res) => {
  const user = await findUserById(req.params.userId);
  if (!user) { res.status(404).json({ error: "Utilisateur introuvable" }); return; }
  if (user.promoCode) { res.json({ promoCode: user.promoCode }); return; }

  let code = generatePromoCode(user.prenom);
  let attempt = 0;
  while (attempt < 10) {
    const existing = await findUserByPromoCode(code);
    if (!existing) break;
    code = generatePromoCode(user.prenom);
    attempt++;
  }
  const updated = await setPromoCode(user.id, code);
  res.json({ promoCode: updated?.promoCode ?? code });
});

// POST /api/referral/:userId/use-reward – utiliser une récompense
router.post("/:userId/use-reward", async (req, res) => {
  const result = await useReward(req.params.userId);
  if (!result.ok) {
    res.status(400).json({ error: "Aucune récompense disponible" });
    return;
  }
  res.json({ ok: true, availableRewards: result.availableRewards });
});

export default router;
