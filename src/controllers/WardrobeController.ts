import { Request, Response } from "express";
import * as wardrobeService from "../services/wardrobeService";
import { AuthRequest } from "../middleware/authMiddleware";

export class WardrobeController {
  static async getAll(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const items = await wardrobeService.getAllItems(userId!);
      return res.json({ success: true, data: items });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération du dressing",
      });
    }
  }

  static async add(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const item = await wardrobeService.addItem(userId!, req.body);
      return res.status(201).json({
        success: true,
        message: "Vêtement ajouté avec succès",
        data: item,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Erreur lors de l’ajout du vêtement",
      });
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const updated = await wardrobeService.updateItem(userId!, id, req.body);

      if (!updated)
        return res.status(404).json({ success: false, message: "Vêtement non trouvé" });

      return res.json({ success: true, data: updated });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Erreur lors de la mise à jour du vêtement",
      });
    }
  }

  static async remove(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const deleted = await wardrobeService.deleteItem(userId!, id);

      if (!deleted)
        return res.status(404).json({ success: false, message: "Vêtement non trouvé" });

      return res.json({ success: true, message: "Vêtement supprimé avec succès" });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la suppression du vêtement",
      });
    }
  }

  static async getById(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const item = await wardrobeService.getItemById(userId!, id);

      if (!item)
        return res.status(404).json({ success: false, message: "Vêtement introuvable" });

      return res.json({ success: true, data: item });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération du vêtement",
      });
    }
  }

   static async filter(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const userId = req.user?.id;
    const { category, color, style, season, material, occasion } = req.query;

    const items = await wardrobeService.filterItems(userId!, {
      category: category as string,
      color: color as string,
      style: style as string,
      season: season as string,
      material: material as string,
      occasion: occasion as string,
    });

    return res.json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erreur lors du filtrage du dressing",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
   }


}
