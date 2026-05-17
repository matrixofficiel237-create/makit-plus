import { Router } from "express";

const APK_URL = "https://github.com/matrixofficiel237-create/makit-plus/releases/latest/download/Makit-Plus.apk";

// Incrémentez APP_VERSION à chaque nouvelle release APK publiée sur GitHub
const APP_VERSION = process.env.APP_VERSION || "1.0.0";

const router = Router();

router.get("/download-apk", (req, res) => {
  res.redirect(302, APK_URL);
});

router.get("/version", (req, res) => {
  res.json({
    version: APP_VERSION,
    apkUrl: APK_URL,
    releaseNotes: process.env.RELEASE_NOTES || "Nouvelle version disponible avec des améliorations et corrections.",
  });
});

export default router;
