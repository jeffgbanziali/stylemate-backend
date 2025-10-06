import { Request, Response } from "express";
import * as authService from "../services/authService";

export const registerEmail = async (req: Request, res: Response) => {
  try {
    const { email, password, username } = req.body;
    const token = await authService.registerEmail(email, password, username);
    res.json({ token });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const loginEmail = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const token = await authService.loginEmail(email, password);
    res.json({ token });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const loginGoogle = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;
    const token = await authService.loginGoogle(idToken);
    res.json({ token });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};


// Apple OAuth
export const loginApple = async (req: Request, res: Response) => {
  try {
    const { identityToken } = req.body;
    const token = await authService.loginApple(identityToken);
    res.json({ token });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// Phone OTP
export const sendOTPController = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    const otp = await authService.sendOTP(phone);
    res.json({ message: "OTP envoyé (console pour test)", otp });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const verifyOTPController = async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;
    const token = await authService.verifyOTP(phone, otp);
    res.json({ token });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};


// TODO: Apple OAuth + Phone OTP endpoints
