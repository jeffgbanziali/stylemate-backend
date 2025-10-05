import { Router } from "express";
import * as authController from "../controllers/authController";

const router = Router();

// Email
router.post("/register", authController.registerEmail);
router.post("/login", authController.loginEmail);

// Google
router.post("/login/google", authController.loginGoogle);

// Apple
router.post("/login/apple", authController.loginApple);

// Phone OTP
router.post("/otp/send", authController.sendOTPController);
router.post("/otp/verify", authController.verifyOTPController);

export default router;
