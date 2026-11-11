export type PlayerClass =
  | "Swordsman"
  | "Archer"
  | "Assassin"
  | "Tank"
  | "SwordMage"
  | "Mage"
  ;

export type InventoryCategory = "Armor" | "Weapons"| "Skills" | "Misc Item" ;

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
}

export interface Player {
  accountNumber: string;
  username: string;
  password: string;
  email: string;
  playerClass: PlayerClass;
  inventory: InventoryItem[];
}
