// src/services/wardrobeService.ts
import WardrobeItem, { IWardrobeItem } from "../models/WardrobeItem";
import { Types } from "mongoose";

export const getAllItems = async (userId: string): Promise<IWardrobeItem[]> => {
  return WardrobeItem.find({ user: userId }).sort({ createdAt: -1 });
};

export const addItem = async (
  userId: string,
  data: Partial<IWardrobeItem>
): Promise<IWardrobeItem> => {
  const newItem = new WardrobeItem({
    ...data,
    user: new Types.ObjectId(userId),
  });
  return newItem.save();
};

export const updateItem = async (
  userId: string,
  itemId: string,
  updates: Partial<IWardrobeItem>
): Promise<IWardrobeItem | null> => {
  return WardrobeItem.findOneAndUpdate(
    { _id: itemId, user: userId },
    { $set: updates },
    { new: true }
  );
};

export const deleteItem = async (
  userId: string,
  itemId: string
): Promise<IWardrobeItem | null> => {
  return WardrobeItem.findOneAndDelete({ _id: itemId, user: userId });
};

export const getItemById = async (
  userId: string,
  itemId: string
): Promise<IWardrobeItem | null> => {
  return WardrobeItem.findOne({ _id: itemId, user: userId });
};


// src/services/wardrobeService.ts
export const filterItems = async (
  userId: string,
  filters: { category?: string; color?: string; style?: string; season?: string; material?: string; occasion?: string }
) => {
  const query: any = { user: userId };

  if (filters.category) query.category = filters.category;
  if (filters.color) query.color = filters.color;
  if (filters.style) query.styleTags = { $in: [filters.style] };
  if (filters.season) query.season = filters.season;
  if (filters.material) query.material = filters.material;
  if (filters.occasion) query.occasion = { $in: [filters.occasion] };

  return WardrobeItem.find(query).sort({ createdAt: -1 });
};
