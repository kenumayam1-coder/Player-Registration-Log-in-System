export type PlayerClass = "Swordsman" | "Archer" | "Assassin" | "Tank" | "SwordMage" | "Mage";

export interface Player {
  playerId: string;
  username: string;
  playerClass: PlayerClass;
}
