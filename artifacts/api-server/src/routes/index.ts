import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import ordersRouter from "./orders";
import usersRouter from "./users";
import downloadRouter from "./download";
import statsRouter from "./stats";
import referralRouter from "./referral";
import paymentsRouter from "./payments";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/orders", ordersRouter);
router.use("/users", usersRouter);
router.use(downloadRouter);
router.use("/stats", statsRouter);
router.use("/referral", referralRouter);
router.use("/payments", paymentsRouter);

export default router;
