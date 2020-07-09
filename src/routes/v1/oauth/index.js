import callback from "./callback";
import redirect from "./redirect";
import start from "./start";
import express from "express";

// Create router for oauth.
const router = new express.Router();

// Set up nested routes.
router.use("/callback", callback);
router.use("/redirect", redirect);
router.use("/start", start);

export default router;
