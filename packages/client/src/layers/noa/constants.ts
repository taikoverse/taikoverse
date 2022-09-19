import { EntityID } from "@latticexyz/recs";
import { BlockType } from "../network";
import { Block } from "./types";

export enum MaterialType {
  Grass = "Grass",
  GrassSide = "GrassSide",
  GrassBottom = "GrassBottom",
  Dirt = "Dirt",
  Log = "Log",
  LogTop = "LogTop",
  Sand = "Sand",
  Stone = "Stone",
  Water = "Water",
  TransparentWater = "TransparentWater",
  Cobblestone = "Cobblestone",
  Coal = "Coal",
  Iron = "Iron",
  Gold = "Gold",
  Diamond = "Diamond",
  Leaves = "Leaves",
  Planks = "Planks",
  Crafting = "Crafting",
  CraftingSide = "CraftingSide",
  CraftingBottom = "CraftingBottom",
}

export const Textures = {
  [MaterialType.Grass]: "./assets/blocks/4-Grass_block-top.png",
  [MaterialType.GrassSide]: "./assets/blocks/4-Grass_block-side.png",
  [MaterialType.GrassBottom]: "./assets/blocks/4-Grass_block-bottom.png",
  [MaterialType.Dirt]: "./assets/blocks/3-Dirt.png",
  [MaterialType.Log]: "./assets/blocks/log_oak.png",
  [MaterialType.LogTop]: "./assets/blocks/log_oak_top.png",
  [MaterialType.Sand]: "./assets/blocks/07-Sand.png",
  [MaterialType.Stone]: "./assets/blocks/stone.png",
  [MaterialType.Water]: "./assets/blocks/10-Water.png",
  [MaterialType.TransparentWater]: "./assets/blocks/10-Water.png",
  [MaterialType.Cobblestone]: "./assets/blocks/1-Cobblestone.png",
  [MaterialType.Coal]: "./assets/blocks/39-Coal_Ore.png",
  [MaterialType.Iron]: "./assets/blocks/38-Iron_Ore.png",
  [MaterialType.Gold]: "./assets/blocks/40-Gold_Ore.png",
  [MaterialType.Diamond]: "./assets/blocks/diamond_ore.png",
  [MaterialType.Leaves]: "./assets/blocks/06-Leaves.png",
  [MaterialType.Planks]: "./assets/blocks/05-Wood_plank.png",
  [MaterialType.Crafting]: "./assets/blocks/46-Crafting_Table-0-top.png",
  [MaterialType.CraftingSide]: "./assets/blocks/46-Crafting_Table-1-sides.png",
  [MaterialType.CraftingBottom]: "./assets/blocks/46-Crafting_Table-2-bottom.png",
};

export const Blocks: { [key in keyof typeof BlockType]: Block | undefined } = {
  Air: undefined,
  Grass: { material: [MaterialType.Grass, MaterialType.GrassSide] },
  Dirt: { material: MaterialType.Dirt },
  Log: { material: [MaterialType.LogTop, MaterialType.Log] },
  Sand: { material: MaterialType.Sand },
  Stone: { material: MaterialType.Stone },
  Water: {
    material: [MaterialType.Water, MaterialType.TransparentWater, MaterialType.TransparentWater],
    opaque: false,
    fluid: true,
    solid: false,
  },
  Cobblestone: { material: MaterialType.Cobblestone },
  Coal: { material: MaterialType.Coal },
  Crafting: { material: [MaterialType.Crafting, MaterialType.CraftingBottom, MaterialType.CraftingSide] },
  Iron: { material: MaterialType.Iron },
  Gold: { material: MaterialType.Gold },
  Diamond: { material: MaterialType.Diamond },
  Leaves: { material: MaterialType.Leaves },
  Planks: { material: MaterialType.Planks },
};

export const Singleton = "Singleton" as EntityID;

export function getBlockIconUrl(blockType: keyof typeof BlockType) {
  const block = Blocks[blockType];
  if (!block) return "";
  const material = Array.isArray(block.material) ? block.material[0] : block.material;
  return Textures[material as MaterialType];
}
