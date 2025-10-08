import User, { IUser } from "../models/userModel";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";
import { getRedis } from "../config/redis";

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";



// ---------------------- JWT ----------------------
const generateToken = (user: IUser) => {
  return jwt.sign(
    { id: user._id, email: user.email, provider: user.provider },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// ---------------------- EMAIL ----------------------
export const registerEmail = async (email: string, password: string, username?: string, dateOfBirth?: string) => {
  const existing = await User.findOne({ email });
  if (existing) throw new Error("Email déjà utilisé");

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({
    email,
    password: hashedPassword,
    username,
    dateOfBirth,
    provider: "email"
  });

  await user.save();
  return generateToken(user);
};

export const loginEmail = async (email: string, password: string) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Utilisateur non trouvé");

  if (!user.password) throw new Error("Mot de passe non défini pour ce compte");

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error("Mot de passe incorrect");

  return generateToken(user);
};

// ---------------------- GOOGLE ----------------------
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const loginGoogle = async (idToken: string) => {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.email) throw new Error("Google login failed");

  let user = await User.findOne({ email: payload.email });
  if (!user) {
    user = new User({
      email: payload.email,
      username: payload.name,
      provider: "google",
      providerId: payload.sub
    });
    await user.save();
  }

  return generateToken(user);
};

// ---------------------- APPLE ----------------------
export const loginApple = async (identityToken: string) => {
  // Vérification simplifiée : en prod, utiliser Apple Sign In lib officielle
  const response = await axios.post("https://appleid.apple.com/auth/token", {
    id_token: identityToken,
    client_id: process.env.APPLE_CLIENT_ID,
    client_secret: process.env.APPLE_CLIENT_SECRET,
    grant_type: "authorization_code"
  });

  const payload = response.data.id_token; 
  const email = payload?.email;
  const sub = payload?.sub;

  if (!email) throw new Error("Apple login failed");

  let user = await User.findOne({ email });
  if (!user) {
    user = new User({
      email,
      username: payload?.username || "Apple User",
      provider: "apple",
      providerId: sub
    });
    await user.save();
  }

  return generateToken(user);
};

// ---------------------- PHONE OTP ----------------------
export const sendOTP = async (phone: string) => {
  const redisClient = getRedis(); 
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await redisClient.set(`otp:${phone}`, otp, { EX: 300 });
  console.log(`OTP pour ${phone}: ${otp}`);
  return otp;
};

export const verifyOTP = async (phone: string, otp: string) => {
  const redisClient = getRedis(); 
  const savedOTP = await redisClient.get(`otp:${phone}`);
  if (savedOTP !== otp) throw new Error("OTP invalide");

  let user = await User.findOne({ phone });
  if (!user) {
    user = new User({ phone, provider: "phone" });
    await user.save();
  }

  return generateToken(user);
};