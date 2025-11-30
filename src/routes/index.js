import { Router } from "express";

import authRouter from "./authRouter.js";
import profileRouter from "./profile.routes.js";
import studentRoutes from "./student.routes.js";
import tutorRoutes from "./tutor.routes.js";
import emailConfigRouter from "./emailConfig.routes.js";
import matchingRouter from "./matching.routes.js";
import notificationRouter from "./notification.routes.js"; 




const Root = Router();

Root.use("/auth", authRouter);
Root.use("/api", profileRouter);
Root.use("/api", studentRoutes);
Root.use("/api", tutorRoutes);
Root.use("/api/email-config", emailConfigRouter);

Root.use("/api/matching", matchingRouter);
Root.use("/api/notifications", notificationRouter); 

export default Root;
