import { Router } from "express";
import { getAllUsers, findUserByPhone, createUser, deleteUser } from "../store";

const router = Router();

router.get("/", (req, res) => {
  const { role } = req.query as { role?: string };
  const all = getAllUsers();
  const filtered = role ? all.filter((u) => u.role === role) : all.filter((u) => u.role !== "client" && u.role !== "admin");
  res.json({ users: filtered.map(({ motDePasse: _, ...u }) => u) });
});

router.post("/", (req, res) => {
  const { nom, prenom, telephone, motDePasse, role, adresse } = req.body as {
    nom: string; prenom: string; telephone: string; motDePasse: string;
    role: "livreur" | "sous_admin"; adresse?: string;
  };
  if (!nom || !prenom || !telephone || !motDePasse || !role) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  if (!["livreur", "sous_admin"].includes(role)) {
    res.status(400).json({ error: "Invalid role" });
    return;
  }
  const existing = findUserByPhone(telephone);
  if (existing) {
    res.status(409).json({ error: "Ce numéro est déjà utilisé" });
    return;
  }
  const newUser = createUser({
    id: `${role}-${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
    nom, prenom, telephone, motDePasse,
    adresse: adresse || "Makit+ HQ",
    role,
  });
  const { motDePasse: _, ...safe } = newUser;
  res.status(201).json({ user: safe });
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const ok = deleteUser(id);
  if (!ok) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ success: true });
});

export default router;
