import { Request, Response } from "express";
import User, { IUser } from "../models/userModel";
import bcrypt from "bcrypt";

interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    phone?: string;
    provider: string;
  };
}

export class UserController {
  /**
   * Récupérer le profil de l'utilisateur connecté
   * GET /api/user/profile
   */
  static async getProfile(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Non authentifié",
        });
      }

      const user = await User.findById(userId).select("-password");
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      return res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération du profil",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  /**
   * Mettre à jour les informations de base
   * PUT /api/user/profile
   */
  static async updateProfile(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { username, dateOfBirth, phone } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Non authentifié",
        });
      }

      // Vérifier si le téléphone est déjà utilisé par un autre utilisateur
      if (phone) {
        const existingUser = await User.findOne({ 
          phone, 
          _id: { $ne: userId } 
        });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: "Ce numéro de téléphone est déjà utilisé",
          });
        }
      }

      const updateData: Partial<IUser> = {};
      if (username) updateData.username = username;
      if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
      if (phone) updateData.phone = phone;

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select("-password");

      return res.json({
        success: true,
        message: "Profil mis à jour avec succès",
        data: updatedUser,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la mise à jour du profil",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  /**
   * Récupérer les préférences de l'utilisateur
   * GET /api/user/preferences
   */
  static async getPreferences(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Non authentifié",
        });
      }

      const user = await User.findById(userId).select("preferences");
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      return res.json({
        success: true,
        data: user.preferences,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des préférences",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  /**
   * Mettre à jour toutes les préférences
   * PUT /api/user/preferences
   */
  static async updatePreferences(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { style, color } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Non authentifié",
        });
      }

      const updateData: any = {};
      if (style && Array.isArray(style)) {
        updateData["preferences.style"] = style;
      }
      if (color && Array.isArray(color)) {
        updateData["preferences.color"] = color;
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select("preferences");

      return res.json({
        success: true,
        message: "Préférences mises à jour avec succès",
        data: updatedUser?.preferences,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la mise à jour des préférences",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  /**
   * Ajouter un style aux préférences
   * POST /api/user/preferences/style
   */
  static async addStylePreference(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { style } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Non authentifié",
        });
      }

      if (!style || typeof style !== "string") {
        return res.status(400).json({
          success: false,
          message: "Le style est requis et doit être une chaîne de caractères",
        });
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $addToSet: { "preferences.style": style } },
        { new: true }
      ).select("preferences");

      return res.json({
        success: true,
        message: "Style ajouté avec succès",
        data: updatedUser?.preferences,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors de l'ajout du style",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  /**
   * Retirer un style des préférences
   * DELETE /api/user/preferences/style/:style
   */
  static async removeStylePreference(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { style } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Non authentifié",
        });
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $pull: { "preferences.style": style } },
        { new: true }
      ).select("preferences");

      return res.json({
        success: true,
        message: "Style retiré avec succès",
        data: updatedUser?.preferences,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors du retrait du style",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  /**
   * Ajouter une couleur aux préférences
   * POST /api/user/preferences/color
   */
  static async addColorPreference(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { color } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Non authentifié",
        });
      }

      if (!color || typeof color !== "string") {
        return res.status(400).json({
          success: false,
          message: "La couleur est requise et doit être une chaîne de caractères",
        });
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $addToSet: { "preferences.color": color } },
        { new: true }
      ).select("preferences");

      return res.json({
        success: true,
        message: "Couleur ajoutée avec succès",
        data: updatedUser?.preferences,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors de l'ajout de la couleur",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  /**
   * Retirer une couleur des préférences
   * DELETE /api/user/preferences/color/:color
   */
  static async removeColorPreference(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { color } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Non authentifié",
        });
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $pull: { "preferences.color": color } },
        { new: true }
      ).select("preferences");

      return res.json({
        success: true,
        message: "Couleur retirée avec succès",
        data: updatedUser?.preferences,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors du retrait de la couleur",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  /**
   * Récupérer les mesures de l'utilisateur
   * GET /api/user/measurements
   */
  static async getMeasurements(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Non authentifié",
        });
      }

      const user = await User.findById(userId).select("measurements");
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      return res.json({
        success: true,
        data: user.measurements || {},
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des mesures",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  /**
   * Mettre à jour les mesures corporelles
   * PUT /api/user/measurements
   */
  static async updateMeasurements(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { height, weight, chest, waist, hips } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Non authentifié",
        });
      }

      const measurements: Partial<IUser["measurements"]> = {};
      if (height !== undefined && typeof height === "number") measurements.height = height;
      if (weight !== undefined && typeof weight === "number") measurements.weight = weight;
      if (chest !== undefined && typeof chest === "number") measurements.chest = chest;
      if (waist !== undefined && typeof waist === "number") measurements.waist = waist;
      if (hips !== undefined && typeof hips === "number") measurements.hips = hips;

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: { measurements } },
        { new: true, runValidators: true }
      ).select("measurements");

      return res.json({
        success: true,
        message: "Mesures mises à jour avec succès",
        data: updatedUser?.measurements,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la mise à jour des mesures",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  /**
   * Changer le mot de passe
   * POST /api/user/change-password
   */
  static async changePassword(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { currentPassword, newPassword } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Non authentifié",
        });
      }

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Mot de passe actuel et nouveau mot de passe requis",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Le nouveau mot de passe doit contenir au moins 6 caractères",
        });
      }

      const user = await User.findById(userId);
      if (!user || !user.password) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé ou pas de mot de passe défini",
        });
      }

      // Vérifier l'ancien mot de passe
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Mot de passe actuel incorrect",
        });
      }

      // Hasher le nouveau mot de passe
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();

      return res.json({
        success: true,
        message: "Mot de passe modifié avec succès",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors du changement de mot de passe",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  /**
   * Supprimer le compte utilisateur
   * DELETE /api/user/account
   */
  static async deleteAccount(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { password } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Non authentifié",
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      // Vérifier le mot de passe si l'utilisateur en a un
      if (user.password && password) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(401).json({
            success: false,
            message: "Mot de passe incorrect",
          });
        }
      }

      await User.findByIdAndDelete(userId);

      return res.json({
        success: true,
        message: "Compte supprimé avec succès",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la suppression du compte",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  /**
   * Obtenir les statistiques de l'utilisateur
   * GET /api/user/stats
   */
  static async getUserStats(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Non authentifié",
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      const stats = {
        accountAge: Math.floor(
          (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        ),
        preferencesCount: {
          styles: user.preferences.style.length,
          colors: user.preferences.color.length,
        },
        profileCompletion: UserController.calculateProfileCompletion(user),
        provider: user.provider,
      };

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des statistiques",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  /**
   * Calculer le pourcentage de complétion du profil
   */
  private static calculateProfileCompletion(user: IUser): number {
    let completed = 0;
    const total = 8;

    if (user.email || user.phone) completed++;
    if (user.username) completed++;
    if (user.dateOfBirth) completed++;
    if (user.preferences.style.length > 0) completed++;
    if (user.preferences.color.length > 0) completed++;
    if (user.measurements?.height) completed++;
    if (user.measurements?.weight) completed++;
    if (user.measurements?.chest || user.measurements?.waist || user.measurements?.hips) completed++;

    return Math.round((completed / total) * 100);
  }
}