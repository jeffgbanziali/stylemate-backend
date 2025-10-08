import { Request, Response } from "express";
import * as authService from "../services/authService";
import { sendVerificationEmail } from "../services/mailVerificationService";
import Verification from "../models/Verification";

export const sendVerificationCode = async (req: Request, res: Response) => {
  try {
    const { email, password, username, dateOfBirth } = req.body;

    if (!email || !password || !username || !dateOfBirth) {
      return res.status(400).json({ error: "Tous les champs sont requis." });
    }

    // Génère un code à 6 chiffres
    const verificationCode = Math.floor(100000 + Math.random() * 900000);

    // Supprime toute vérification précédente
    await Verification.deleteOne({ email });

    // Enregistre temporairement les infos
    await Verification.create({
      email,
      username,
      password,
      dateOfBirth,
      verificationCode,
    });

    // Envoi du mail
    await sendVerificationEmail(email, verificationCode);

    res.status(200).json({
      message: "Code de vérification envoyé à ton email.",
      email,
    });
  } catch (err: any) {
    console.error("Erreur sendVerificationCode:", err);
    res.status(400).json({ error: err.message });
  }
};

export const verifyAndRegister = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    const verification = await Verification.findOne({ email });

    if (!verification) {
      return res.status(400).json({ error: "Aucune demande de vérification trouvée." });
    }

    if (String(verification.verificationCode) !== String(code)) {
      console.log("log", verification);
      console.log("log code", code);
      return res.status(400).json({ error: "Code de vérification invalide." });
    }

    if (!verification.password || !verification.username) {
      return res.status(400).json({ error: "Informations de vérification manquantes." });
    }

    const token = await authService.registerEmail(
      verification.email,
      verification.password,
      verification.username,
      verification.dateOfBirth
    );

    await verification.deleteOne();

    res.status(201).json({ message: "Compte créé avec succès", token });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};



/*export const registerEmail = async (req: Request, res: Response) => {
  try {
    const { email, password, username } = req.body;

     const verificationCode = Math.floor(100000 + Math.random() * 900000);

    sendVerificationEmail(username, verificationCode)
    
    const token = await authService.registerEmail(email, password, username);
    res.json({ token });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};*/

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
