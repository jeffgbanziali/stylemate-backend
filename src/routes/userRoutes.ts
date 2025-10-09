import express from "express";
import { UserController } from "../controllers/userController";
import { authenticateJWT } from "../middleware/authMiddleware";

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateJWT);

// ==================== PROFIL ====================
/**
 * @route   GET /api/user/profile
 * @desc    Récupérer le profil de l'utilisateur connecté
 * @access  Private
 */
router.get("/profile-other/:id", UserController.getProfile);
router.get("/me",  UserController.getMyProfile);


/**
 * @route   PUT /api/user/profile
 * @desc    Mettre à jour les informations de base
 * @access  Private
 */
router.put("/profile", UserController.updateProfile);

/**
 * @route   GET /api/user/stats
 * @desc    Obtenir les statistiques de l'utilisateur
 * @access  Private
 */
router.get("/stats", UserController.getUserStats);

// ==================== PRÉFÉRENCES ====================
/**
 * @route   GET /api/user/preferences
 * @desc    Récupérer les préférences de l'utilisateur
 * @access  Private
 */
router.get("/preferences", UserController.getPreferences);

/**
 * @route   PUT /api/user/preferences
 * @desc    Mettre à jour toutes les préférences
 * @access  Private
 */
router.put("/preferences", UserController.updatePreferences);

/**
 * @route   POST /api/user/preferences/style
 * @desc    Ajouter un style aux préférences
 * @access  Private
 */
router.post("/preferences/style", UserController.addStylePreference);

/**
 * @route   DELETE /api/user/preferences/style/:style
 * @desc    Retirer un style des préférences
 * @access  Private
 */
router.delete("/preferences/style/:style", UserController.removeStylePreference);

/**
 * @route   POST /api/user/preferences/color
 * @desc    Ajouter une couleur aux préférences
 * @access  Private
 */
router.post("/preferences/color", UserController.addColorPreference);

/**
 * @route   DELETE /api/user/preferences/color/:color
 * @desc    Retirer une couleur des préférences
 * @access  Private
 */
router.delete("/preferences/color/:color", UserController.removeColorPreference);

// ==================== MESURES ====================
/**
 * @route   GET /api/user/measurements
 * @desc    Récupérer les mesures corporelles
 * @access  Private
 */
router.get("/measurements", UserController.getMeasurements);

/**
 * @route   PUT /api/user/measurements
 * @desc    Mettre à jour les mesures corporelles
 * @access  Private
 */
router.put("/measurements", UserController.updateMeasurements);

// ==================== SÉCURITÉ ====================
/**
 * @route   POST /api/user/change-password
 * @desc    Changer le mot de passe
 * @access  Private
 */
router.post("/change-password", UserController.changePassword);

/**
 * @route   DELETE /api/user/account
 * @desc    Supprimer le compte utilisateur
 * @access  Private
 */
router.delete("/account", UserController.deleteAccount);

export default router;