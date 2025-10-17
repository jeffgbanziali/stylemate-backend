import express from "express";
import { getRecommendedOutfits } from "../controllers/outfitController";

const router = express.Router();
router.post("/recommend", getRecommendedOutfits);
export default router;
