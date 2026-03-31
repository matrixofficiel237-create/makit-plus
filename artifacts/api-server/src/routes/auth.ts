import { Router } from "express";
import { findUserByPhone, createUser } from "../store";

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

export default router;
