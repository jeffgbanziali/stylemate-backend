import { Router } from "express";
import { WardrobeController } from "../controllers/WardrobeController";
import { authenticateJWT } from "../middleware/authMiddleware";

const router = Router();

/**
 *  ROUTES DU DRESSING (Wardrobe)
 * Toutes les routes sont protégées par le middleware d’authentification JWT.
 */

// 🔹 Récupérer tous les vêtements du dressing
router.get("/", authenticateJWT, WardrobeController.getAll);

// 🔹 Récupérer un vêtement précis par ID
router.get("/:id", authenticateJWT, WardrobeController.getById);

// 🔹 Ajouter un nouveau vêtement
router.post("/", authenticateJWT, WardrobeController.add);

// 🔹 Mettre à jour un vêtement
router.put("/:id", authenticateJWT, WardrobeController.update);

// 🔹 Supprimer un vêtement
router.delete("/:id", authenticateJWT, WardrobeController.remove);

// 🔹 Filtrer le dressing (par catégorie, couleur, style, etc.)
router.get("/filter/items", authenticateJWT, WardrobeController.filter);

export default router;
