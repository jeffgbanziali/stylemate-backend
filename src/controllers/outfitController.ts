import { Request, Response } from "express";
import { generateAIOutfit } from "../services/aiService";

/**
 * Contrôleur d'appel au service IA
 * - Gère les erreurs explicites (connexion, format de réponse, statut HTTP)
 * - Journalise chaque étape pour faciliter le debug Docker
 */
export const getRecommendedOutfits = async (req: Request, res: Response) => {
  console.log("🛰️ [BACKEND] Requête reçue sur /api/outfits/recommend");
  console.log("🧾 Corps de la requête :", JSON.stringify(req.body, null, 2));

  try {
    const context = req.body;

    if (!context || Object.keys(context).length === 0) {
      console.warn("⚠️ [BACKEND] Contexte vide ou invalide reçu du client");
      return res.status(400).json({ message: "Contexte vide — impossible de générer un outfit" });
    }

    console.log("📤 [BACKEND] Envoi du contexte à l’IA :", context);

    const aiResponse = await generateAIOutfit(context);

    console.log("📥 [BACKEND] Réponse brute reçue depuis le service IA :", aiResponse);

    // ✅ Vérifie que la réponse IA est correcte
    if (!aiResponse) {
      console.error("⚠️ [BACKEND] Le service IA a renvoyé une réponse vide !");
      return res.status(502).json({ message: "Aucune réponse du service IA" });
    }

    // ✅ Vérifie le format attendu
    if (typeof aiResponse !== "object") {
      console.error("⚠️ [BACKEND] Réponse IA non valide :", aiResponse);
      return res.status(502).json({ message: "Format de réponse IA invalide" });
    }

    // ✅ Vérifie le statut et la donnée principale
    if (aiResponse.status === "success" && aiResponse.outfits) {
      console.log("✅ [BACKEND] Outfits générés avec succès :", aiResponse.outfits.length);
      return res.status(200).json({
        status: "success",
        outfits: aiResponse.outfits,
        source: "ai",
      });
    }

    // ⚠️ Cas : IA a répondu mais avec un message d’erreur ou format incomplet
    console.warn("⚠️ [BACKEND] Réponse IA en erreur :", aiResponse.message || "Erreur inconnue");
    return res.status(502).json({
      status: "error",
      message: aiResponse.message || "Erreur dans la génération IA",
      details: aiResponse,
    });

  } catch (err: any) {
    console.error("💥 [BACKEND] Exception non gérée :", err);

    // 🔍 Diagnostic réseau précis
    if (err.code === "ECONNREFUSED") {
      console.error("🚫 Impossible de contacter le service IA — probablement injoignable sur le réseau Docker.");
      console.error("💡 Vérifie : le conteneur 'ai' tourne bien, et AI_SERVICE_URL = http://ai:8001");
    } else if (err.code === "ETIMEDOUT") {
      console.error("⏰ Timeout — le service IA a mis trop de temps à répondre.");
    }

    res.status(500).json({
      status: "error",
      message: "Erreur interne du serveur lors de la communication avec l’IA.",
      error: err.message,
      code: err.code || "UNKNOWN_ERROR",
    });
  }
};
