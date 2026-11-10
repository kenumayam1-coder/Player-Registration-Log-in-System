import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { InventoryCategory, InventoryItem, Player, PlayerClass } from "./types";

const STORAGE_KEY = "player-system-players-v1";
const SESSION_KEY = "player-system-current-player";

const classes: PlayerClass[] = [
  "Swordsman",
  "Archer",
  "Assassin",
  "Tank",
  "SwordMage",
  "Mage",
];

const categories: InventoryCategory[] = ["Armor", "Weapons", "Misc Item"];

function readPlayers(): Player[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as Player[];
  } catch {
    return [];
  }
}

function makeAccountNumber(): string {
  return `PLY-${Date.now().toString().slice(-7)}-${Math.floor(100 + Math.random() * 900)}`;
}

export default function App() {
  const [players, setPlayers] = useState<Player[]>(readPlayers);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(
    () => localStorage.getItem(SESSION_KEY),
  );
  const [page, setPage] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [playerClass, setPlayerClass] = useState<PlayerClass>("Swordsman");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState<InventoryCategory>("Weapons");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    if (currentPlayerId) localStorage.setItem(SESSION_KEY, currentPlayerId);
    else localStorage.removeItem(SESSION_KEY);
  }, [currentPlayerId]);

  const currentPlayer = useMemo(
    () => players.find((player) => player.accountNumber === currentPlayerId) ?? null,
    [players, currentPlayerId],
  );

  function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    const cleanUsername = username.trim();
    const cleanEmail = email.trim();
    if (!cleanUsername || !password || !cleanEmail) {
      setError("Please complete all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Use a password with at least 6 characters.");
      return;
    }
    if (players.some((player) => player.username.toLowerCase() === cleanUsername.toLowerCase())) {
      setError("That username is already registered. Please choose another.");
      return;
    }

    const player: Player = {
      accountNumber: makeAccountNumber(),
      username: cleanUsername,
      password,
      email: cleanEmail,
      playerClass,
      inventory: [],
    };
    setPlayers((previous) => [...previous, player]);
    setCurrentPlayerId(player.accountNumber);
    setUsername("");
    setPassword("");
    setEmail("");
  }

  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const player = players.find(
      (candidate) =>
        candidate.username.toLowerCase() === username.trim().toLowerCase() &&
        candidate.password === password,
    );
    if (!player) {
      setError("Username or password is incorrect. If you're new, register first.");
      return;
    }
    setCurrentPlayerId(player.accountNumber);
    setUsername("");
    setPassword("");
  }

  function logout() {
    setCurrentPlayerId(null);
    setPage("login");
    setNotice("You have logged out.");
    setError("");
  }

  function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentPlayer || !itemName.trim()) return;
    const newItem: InventoryItem = {
      id: crypto.randomUUID(),
      name: itemName.trim(),
      category: itemCategory,
    };
    setPlayers((previous) =>
      previous.map((player) =>
        player.accountNumber === currentPlayer.accountNumber
          ? { ...player, inventory: [...player.inventory, newItem] }
          : player,
      ),
    );
    setItemName("");
  }

  function removeItem(itemId: string) {
    if (!currentPlayer) return;
    setPlayers((previous) =>
      previous.map((player) =>
        player.accountNumber === currentPlayer.accountNumber
          ? { ...player, inventory: player.inventory.filter((item) => item.id !== itemId) }
          : player,
      ),
    );
  }

  if (currentPlayer) {
    return (
      <main className="app-shell">
        <header className="topbar">
          <a className="brand" href="#" onClick={(event) => event.preventDefault()}>
            <span className="brand-mark">P</span>
            <span>PLAYER<span className="brand-light">SYSTEM</span></span>
          </a>
          <div className="topbar-right">
            <span className="online-dot" />
            <span className="signed-in">Signed in as <strong>{currentPlayer.username}</strong></span>
            <button className="button button-quiet" onClick={logout}>Log out ↗</button>
          </div>
        </header>

        <section className="dashboard-heading">
          <div>
            <p className="eyebrow">PLAYER COMMAND CENTER</p>
            <h1>Dashboard<span className="accent">.</span></h1>
            <p className="subheading">Welcome back, {currentPlayer.username}. Your adventure starts here.</p>
          </div>
          <div className="level-chip"><span>✦</span> PLAYER PROFILE</div>
        </section>

        <section className="dashboard-grid">
          <article className="panel profile-panel">
            <div className="panel-heading">
              <div><p className="eyebrow">ACCOUNT OVERVIEW</p><h2>Player Profile</h2></div>
              <span className="panel-icon">♙</span>
            </div>
            <div className="avatar-row">
              <div className="avatar">{currentPlayer.username.slice(0, 1).toUpperCase()}</div>
              <div><h3>{currentPlayer.username}</h3><p>{currentPlayer.playerClass}</p></div>
              <span className="status-pill">ACTIVE</span>
            </div>
            <div className="profile-details">
              <div><span>PLAYER ID</span><strong>{currentPlayer.accountNumber}</strong></div>
              <div><span>USERNAME</span><strong>{currentPlayer.username}</strong></div>
              <div><span>EMAIL</span><strong>{currentPlayer.email}</strong></div>
              <div><span>CLASS</span><strong>{currentPlayer.playerClass}</strong></div>
            </div>
          </article>

          <article className="panel inventory-panel">
            <div className="panel-heading">
              <div><p className="eyebrow">YOUR COLLECTION</p><h2>Inventory</h2></div>
              <span className="item-count">{currentPlayer.inventory.length} ITEMS</span>
            </div>
            <form className="add-item-form" onSubmit={addItem}>
              <input
                aria-label="Item name"
                placeholder="Enter item name..."
                value={itemName}
                onChange={(event) => setItemName(event.target.value)}
                maxLength={40}
              />
              <select
                aria-label="Item category"
                value={itemCategory}
                onChange={(event) => setItemCategory(event.target.value as InventoryCategory)}
              >
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
              <button className="button button-primary" type="submit" disabled={!itemName.trim()}>+ Add</button>
            </form>
            <div className="inventory-categories">
              {categories.map((category) => {
                const items = currentPlayer.inventory.filter((item) => item.category === category);
                const symbol = category === "Armor" ? "⬡" : category === "Weapons" ? "⚔" : "✧";
                return (
                  <div className="inventory-category" key={category}>
                    <div className="category-title">
                      <span className="category-symbol">{symbol}</span>
                      <strong>{category}</strong>
                      <span className="category-count">{items.length}</span>
                    </div>
                    {items.length === 0 ? (
                      <p className="empty-state">No {category.toLowerCase()} added yet.</p>
                    ) : (
                      <ul className="item-list">
                        {items.map((item) => (
                          <li key={item.id}>
                            <span>{item.name}</span>
                            <button className="remove-button" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name}`}>×</button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </article>
        </section>
        <footer className="footer">PLAYER SYSTEM <span>•</span> LOCAL DEMO BUILD</footer>
      </main>
    );
  }

  return (
    <main className="auth-layout">
      <div className="auth-decoration">
        <div className="decoration-orb orb-one" />
        <div className="decoration-orb orb-two" />
        <div className="auth-brand"><span className="brand-mark">P</span> PLAYER<span className="brand-light">SYSTEM</span></div>
        <div className="hero-copy">
          <p className="eyebrow">YOUR JOURNEY BEGINS</p>
          <h1>Enter a world<br />of <span>possibilities.</span></h1>
          <p>Create your player account, choose your class, and keep your gear organized in one place.</p>
        </div>
        <div className="hero-footer"><span>✦</span> BUILD YOUR LEGACY</div>
      </div>

      <section className="auth-side">
        <div className="auth-card">
          <div className="mobile-brand"><span className="brand-mark">P</span> PLAYER<span className="brand-light">SYSTEM</span></div>
          <div className="auth-heading">
            <p className="eyebrow">{page === "login" ? "WELCOME BACK" : "NEW PLAYER REGISTRATION"}</p>
            <h2>{page === "login" ? "Player Log in" : "Create Account"}<span className="accent">.</span></h2>
            <p>{page === "login" ? "Enter your credentials to access your dashboard." : "Set up your player profile to begin your journey."}</p>
          </div>

          <div className="auth-tabs">
            <button className={page === "login" ? "active" : ""} onClick={() => { setPage("login"); setError(""); }}>Log in</button>
            <button className={page === "register" ? "active" : ""} onClick={() => { setPage("register"); setError(""); }}>Registration</button>
          </div>

          {notice && <div className="notice-message">{notice}</div>}
          {error && <div className="error-message">{error}</div>}

          {page === "login" ? (
            <form className="auth-form" onSubmit={login}>
              <label>USERNAME<input autoComplete="username" placeholder="Enter your username" value={username} onChange={(event) => setUsername(event.target.value)} /></label>
              <label>PASSWORD<div className="password-wrap"><input autoComplete="current-password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "HIDE" : "SHOW"}</button></div></label>
              <button className="button button-primary submit-button" type="submit">Log in <span>→</span></button>
              <p className="switch-copy">New to the system? <button type="button" onClick={() => { setPage("register"); setError(""); }}>Create an account</button></p>
            </form>
          ) : (
            <form className="auth-form" onSubmit={register}>
              <label>USERNAME<input autoComplete="username" placeholder="Choose a username" value={username} onChange={(event) => setUsername(event.target.value)} /></label>
              <label>PASSWORD<div className="password-wrap"><input autoComplete="new-password" type={showPassword ? "text" : "password"} placeholder="At least 6 characters" value={password} onChange={(event) => setPassword(event.target.value)} /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "HIDE" : "SHOW"}</button></div></label>
              <label>EMAIL<input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
              <label>CHOOSE YOUR CLASS<select value={playerClass} onChange={(event) => setPlayerClass(event.target.value as PlayerClass)}>{classes.map((item) => <option key={item}>{item}</option>)}</select></label>
              <button className="button button-primary submit-button" type="submit">Register account <span>→</span></button>
              <p className="switch-copy">Already registered? <button type="button" onClick={() => { setPage("login"); setError(""); }}>Back to log in</button></p>
            </form>
          )}
          <p className="storage-note"><span>●</span> Your demo account is saved locally in this browser.</p>
        </div>
      </section>
    </main>
  );
}
