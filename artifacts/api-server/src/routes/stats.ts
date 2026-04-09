import { Router } from "express";
import { incrementVisitors, getVisitors } from "../store";

const router = Router();

router.post("/visit", async (req, res) => {
  const count = await incrementVisitors();
  res.json({ visitors: count });
});

router.get("/visitors", async (req, res) => {
  const count = await getVisitors();
  res.json({ visitors: count });
});

export default router;
