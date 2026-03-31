import { Router } from "express";
import { findUserByPhone, findUserById, createUser, updateUser } from "../store";

const router = Router();

router.post("/login", (req, res) => {
  const { telephone, motDePasse } = req.body as { telephone: string; motDePasse: string };
  if (!telephone || !motDePasse) {
    res.status(400).json({ error: "telephone and motDePasse required" });
    return;
  }
  const user = findUserByPhone(telephone);
  if (!user || user.motDePasse !== motDePasse) {
    res.status(401).json({ error: "Numéro ou mot de passe incorrect" });
    return;
  }
  const { motDePasse: _, ...safe } = user;
  res.json({ user: safe });
});

router.post("/register", (req, res) => {
  const { nom, prenom, telephone, adresse, motDePasse } = req.body as {
    nom: string; prenom: string; telephone: string; adresse: string; motDePasse: string;
  };
  if (!nom || !prenom || !telephone || !motDePasse) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const existing = findUserByPhone(telephone);
  if (existing) {
    res.status(409).json({ error: "Ce numéro est déjà utilisé" });
    return;
  }
  const newUser = createUser({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    nom, prenom, telephone,
    adresse: adresse || "",
    motDePasse,
    role: "client",
  });
  const { motDePasse: _, ...safe } = newUser;
  res.status(201).json({ user: safe });
});

// Reset password: verify phone exists, then update password
router.post("/reset-password", (req, res) => {
  const { telephone, newPassword } = req.body as { telephone: string; newPassword: string };
  if (!telephone || !newPassword) {
    res.status(400).json({ error: "telephone and newPassword required" });
    return;
  }
  if (newPassword.length < 4) {
    res.status(400).json({ error: "Le mot de passe doit contenir au moins 4 caractères" });
    return;
  }
  const user = findUserByPhone(telephone);
  if (!user) {
    res.status(404).json({ error: "Aucun compte associé à ce numéro" });
    return;
  }
  updateUser(user.id, { motDePasse: newPassword });
  res.json({ success: true });
});

// Update own credentials (phone/password), requires current password verification
router.patch("/update-credentials", (req, res) => {
  const { userId, currentPassword, newTelephone, newPassword } = req.body as {
    userId: string; currentPassword: string; newTelephone?: string; newPassword?: string;
  };
  if (!userId || !currentPassword) {
    res.status(400).json({ error: "userId and currentPassword required" });
    return;
  }
  const user = findUserById(userId);
  if (!user) {
    res.status(404).json({ error: "Utilisateur introuvable" });
    return;
  }
  if (user.motDePasse !== currentPassword) {
    res.status(401).json({ error: "Mot de passe actuel incorrect" });
    return;
  }
  if (newTelephone && newTelephone !== user.telephone) {
    const existing = findUserByPhone(newTelephone);
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
  const updated = updateUser(userId, patch);
  if (!updated) {
    res.status(404).json({ error: "Utilisateur introuvable" });
    return;
  }
  const { motDePasse: _, ...safe } = updated;
  res.json({ user: safe });
});

export default router;
