import { Router } from "express";

const APK_URL = "https://github.com/matrixofficiel237-create/makit-plus/releases/latest/download/Makit-Plus.apk";

const router = Router();

router.get("/download-apk", (req, res) => {
  res.redirect(302, APK_URL);
});

export default router;
