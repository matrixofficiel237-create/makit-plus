import { Router } from "express";

const ASSET_API_URL = "https://api.github.com/repos/matrixofficiel237-create/makit-plus/releases/assets";
const GH_TOKEN = process.env.GH_PAT || "";

const router = Router();

router.get("/download-apk", async (req, res) => {
  try {
    // Récupère la liste des assets de la release latest
    const releaseRes = await fetch(
      "https://api.github.com/repos/matrixofficiel237-create/makit-plus/releases/latest",
      {
        headers: {
          "Authorization": `Bearer ${GH_TOKEN}`,
          "Accept": "application/vnd.github+json",
          "User-Agent": "Makit-Plus-Server/1.0",
        },
      }
    );

    if (!releaseRes.ok) {
      res.status(404).json({ error: "Release non disponible" });
      return;
    }

    const release = await releaseRes.json() as { assets: { id: number; name: string }[] };
    const apkAsset = release.assets.find((a: any) => a.name.endsWith(".apk"));

    if (!apkAsset) {
      res.status(404).json({ error: "APK non trouvé dans la release" });
      return;
    }

    // Télécharge l'asset via l'API GitHub (fonctionne même pour les dépôts privés)
    const dlRes = await fetch(
      `https://api.github.com/repos/matrixofficiel237-create/makit-plus/releases/assets/${apkAsset.id}`,
      {
        headers: {
          "Authorization": `Bearer ${GH_TOKEN}`,
          "Accept": "application/octet-stream",
          "User-Agent": "Makit-Plus-Server/1.0",
        },
        redirect: "follow",
      }
    );

    if (!dlRes.ok) {
      res.status(502).json({ error: "Erreur lors du téléchargement de l'APK" });
      return;
    }

    const contentLength = dlRes.headers.get("content-length");
    res.setHeader("Content-Type", "application/vnd.android.package-archive");
    res.setHeader("Content-Disposition", `attachment; filename="${apkAsset.name}"`);
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (contentLength) res.setHeader("Content-Length", contentLength);

    const reader = dlRes.body!.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } catch (err) {
    console.error("[Download] Erreur proxy APK :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
