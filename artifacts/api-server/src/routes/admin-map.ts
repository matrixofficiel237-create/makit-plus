import { Router } from "express";
import { getAllUsers, getAllOrders } from "../store";
import { assignerZone, ZONES } from "../utils/zones";

const router = Router();

router.get("/admin/map", async (req, res) => {
  const [users, orders] = await Promise.all([getAllUsers(), getAllOrders()]);

  const activeStatuts = new Set(["en_attente", "achat_en_cours", "en_livraison"]);
  const activeOrders = orders.filter(o => activeStatuts.has(o.statut));

  const activeByUser: Record<string, typeof activeOrders> = {};
  for (const o of activeOrders) {
    if (!activeByUser[o.userId]) activeByUser[o.userId] = [];
    activeByUser[o.userId].push(o);
  }

  const clients = users
    .filter(u => u.role === "client" && u.latitude != null && u.longitude != null)
    .map(u => {
      const { motDePasse: _, ...safe } = u;
      const zone = assignerZone(u.latitude!, u.longitude!);
      return {
        ...safe,
        zone: zone.id,
        zoneName: zone.nom,
        zoneCouleur: zone.couleur,
        activeOrders: activeByUser[u.id] ?? [],
      };
    });

  const zoneStats = ZONES.map(z => ({
    ...z,
    clientCount: clients.filter(c => c.zone === z.id).length,
    activeOrderCount: clients.filter(c => c.zone === z.id)
      .reduce((s, c) => s + c.activeOrders.length, 0),
  }));

  res.json({ clients, zones: zoneStats });
});

export default router;
