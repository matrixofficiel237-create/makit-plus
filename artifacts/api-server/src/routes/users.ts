import { Router } from "express";
import { getAllUsers, findUserByPhone, findUserById, createUser, deleteUser, updateUser, savePushToken } from "../store";

const router = Router();

router.get("/", async (req, res) => {
  const { role } = req.query as { role?: string };
  const all = await getAllUsers();
  let filtered: typeof all;
  if (role) {
    filtered = all.filter((u) => u.role === role);
  } else {
    filtered = all.filter((u) => u.role !== "client" && u.role !== "admin");
  }
  res.json({ users: filtered.map(({ motDePasse: _, ...u }) => u) });
});

router.post("/", async (req, res) => {
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
  const existing = await findUserByPhone(telephone);
  if (existing) {
    res.status(409).json({ error: "Ce numéro est déjà utilisé" });
    return;
  }
  const newUser = await createUser({
    id: `${role}-${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
    nom, prenom, telephone, motDePasse,
    adresse: adresse || "Makit+ HQ",
    role,
  });
  const { motDePasse: _, ...safe } = newUser;
  res.status(201).json({ user: safe });
});

router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const user = await findUserById(id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const { nom, prenom, telephone, adresse } = req.body as {
    nom?: string; prenom?: string; telephone?: string; adresse?: string;
  };
  if (telephone && telephone !== user.telephone) {
    const existing = await findUserByPhone(telephone);
    if (existing) {
      res.status(409).json({ error: "Ce numéro est déjà utilisé" });
      return;
    }
  }
  const patch: any = {};
  if (nom !== undefined) patch.nom = nom;
  if (prenom !== undefined) patch.prenom = prenom;
  if (telephone !== undefined) patch.telephone = telephone;
  if (adresse !== undefined) patch.adresse = adresse;
  const updated = await updateUser(id, patch);
  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const { motDePasse: _, ...safe } = updated;
  res.json({ user: safe });
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const ok = await deleteUser(id);
  if (!ok) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ success: true });
});

router.post("/:id/push-token", async (req, res) => {
  const { id } = req.params;
  const { token } = req.body as { token: string };
  if (!token) {
    res.status(400).json({ error: "Token manquant" });
    return;
  }
  const ok = await savePushToken(id, token);
  if (!ok) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ success: true });
});

export default router;
