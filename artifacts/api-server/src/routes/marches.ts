import { Router } from "express";
import { getAllMarches, createMarche, deleteMarche } from "../store";

const router = Router();

router.get("/marches", async (req, res) => {
  const marches = await getAllMarches();
  res.json({ marches });
});

router.post("/marches", async (req, res) => {
  const { nom, latitude, longitude, createdBy } = req.body;
  if (!nom || latitude == null || longitude == null) {
    res.status(400).json({ error: "nom, latitude et longitude sont requis" });
    return;
  }
  const marche = await createMarche({ nom, latitude, longitude, createdBy });
  res.status(201).json({ marche });
});

router.delete("/marches/:id", async (req, res) => {
  await deleteMarche(req.params.id);
  res.json({ success: true });
});

export default router;
