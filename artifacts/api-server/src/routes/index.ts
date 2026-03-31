import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import ordersRouter from "./orders";
import usersRouter from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/orders", ordersRouter);
router.use("/users", usersRouter);

export default router;
