import { Router } from "express";
import { createWriteStream } from "fs";

const APK_URL = "https://github.com/matrixofficiel237-create/makit-plus/releases/download/latest/Makit-Plus.apk";

const router = Router();

router.get("/download-apk", async (req, res) => {
  try {
    const response = await fetch(APK_URL, {
      redirect: "follow",
      headers: { "User-Agent": "Makit-Plus-Server/1.0" },
    });

    if (!response.ok) {
      res.status(404).json({ error: "APK non disponible pour le moment" });
      return;
    }

    const contentLength = response.headers.get("content-length");
    res.setHeader("Content-Type", "application/vnd.android.package-archive");
    res.setHeader("Content-Disposition", "attachment; filename=Makit-Plus.apk");
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (contentLength) res.setHeader("Content-Length", contentLength);

    const reader = response.body!.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } catch (err) {
    console.error("[Download] Erreur :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
