import { Router } from "express";
import * as authController from "../controllers/authController";

const router = Router();

// Email
router.post("/register/verify", authController.verifyAndRegister);
router.get("/login", authController.loginEmail);
router.post("/register/send-code", authController.sendVerificationCode);

// Google
router.post("/login/google", authController.loginGoogle);

// Apple
router.post("/login/apple", authController.loginApple);

// Phone OTP
router.post("/otp/send", authController.sendOTPController);
router.post("/otp/verify", authController.verifyOTPController);

export default router;
