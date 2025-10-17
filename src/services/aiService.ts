import dotenv from 'dotenv';
dotenv.config();


import axios, { AxiosError } from "axios";

/**
 * Service d'appel à l'IA pour générer une recommandation d'outfit.
 * Fournit des logs détaillés pour tout type d'erreur réseau ou applicative.
 */

const AI_BASE_URL = process.env.AI_SERVICE_URL || "http://ai:8001";

export async function generateAIOutfit(context: any) {
  console.log("📡 [AI SERVICE] Tentative de communication avec :", `${AI_BASE_URL}/generate-outfit`);
  console.log("📦 [AI SERVICE] Données envoyées :", JSON.stringify(context, null, 2));

  try {
    const response = await axios.post(`${AI_BASE_URL}/generate-outfit`, context, {
      timeout: 15000, // 15s max avant erreur
      headers: { "Content-Type": "application/json" },
    });

    console.log("✅ [AI SERVICE] Réponse brute IA :", response.data);
    return response.data;

  } catch (err: any) {
    const error = err as AxiosError;
    console.error("❌ [AI SERVICE] Erreur lors de la requête :", error.message);

    // 1️⃣ Cas d’erreur réseau (pas de réponse du tout)
    if (error.code === "ECONNREFUSED") {
      console.error("🚫 [AI SERVICE] Connexion refusée — le conteneur IA est peut-être injoignable.");
      console.error("💡 Vérifie que le service `ai` tourne bien et que `AI_SERVICE_URL` est correct :", AI_BASE_URL);
    }
    else if (error.code === "ETIMEDOUT") {
      console.error("⏰ [AI SERVICE] Timeout — le service IA a mis trop de temps à répondre.");
    }
    else if (error.code === "ENOTFOUND") {
      console.error("🔎 [AI SERVICE] Service IA introuvable — nom d’hôte incorrect :", AI_BASE_URL);
    }

    // 2️⃣ Cas d’erreur HTTP (réponse reçue mais avec erreur)
    if (error.response) {
      console.error("⚠️ [AI SERVICE] Réponse HTTP en erreur :");
      console.error("   → Statut :", error.response.status);
      console.error("   → Message :", error.response.statusText);
      console.error("   → Données :", JSON.stringify(error.response.data, null, 2));
      console.error("   → En-têtes :", JSON.stringify(error.response.headers, null, 2));
    }

    // 3️⃣ Cas d’erreur sans réponse (pas de connexion, blocage, etc.)
    else if (error.request) {
      console.error("📭 [AI SERVICE] Aucune réponse reçue. Détails de la requête :");
      console.error(error.request);
    }

    // 4️⃣ Cas d’erreur interne inattendue
    else {
      console.error("💥 [AI SERVICE] Erreur interne inattendue :", error);
    }

    throw new Error(`[AI SERVICE] Échec de la communication avec le service IA : ${error.message}`);
  }
}
