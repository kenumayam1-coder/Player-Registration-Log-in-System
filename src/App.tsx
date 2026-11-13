import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent, MouseEvent } from "react";
import type { Player, PlayerClass } from "./types";
import { supabase } from "./lib/supabase";

const classes: PlayerClass[] = [
  "Swordsman", "Archer", "Assassin", "Tank", "SwordMage", "Mage",
];

export default function App() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [page, setPage] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [playerClass, setPlayerClass] = useState<PlayerClass>("Swordsman");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadPlayer(userId: string) {
    const { data, error: profileError } = await supabase
      .from("player_profiles")
      .select("player_id, username, player_class")
      .eq("player_id", userId)
      .single();

    if (profileError || !data) {
      setError("Player profile could not be loaded.");
      return;
    }
    setPlayer({
      playerId: data.player_id,
      username: data.username,
      playerClass: data.player_class as PlayerClass,
    });
  }

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted && session) loadPlayer(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted && session) {
        setTimeout(() => { if (mounted) loadPlayer(session.user.id); }, 0);
      } else if (mounted) {
        setPlayer(null);
      }
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);
  
  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanUsername || !password || !cleanEmail) {
      setError("Please complete all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Use a password with at least 6 characters.");
      return;
    }

    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { data: { username: cleanUsername, player_class: playerClass } },
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    setUsername("");
    setPassword("");
    setEmail("");
    if (data.session) {
      await loadPlayer(data.user!.id);
    } else {
      setNotice("Welcome New Player!");
      setPage("login");
    }
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const identifier = username.trim();
    if (!identifier || !password) {
      setError("Enter your username/email and password.");
      return;
    }

    setLoading(true);
    let loginEmail = identifier.toLowerCase();
    if (!identifier.includes("@")) {
      const { data, error: lookupError } = await supabase.rpc("get_player_email_by_username", {
        input_username: identifier,
      });
      if (lookupError || !data) {
        setLoading(false);
        setError("Incorrect username/email or password. Please try again.");
        return;
      }
      loginEmail = data as string;
    }

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });
    setLoading(false);
    if (loginError || !data.user) {
      setError("Incorrect username/email or password. Please try again.");
      return;
    }
    await loadPlayer(data.user.id);
    setUsername("");
    setPassword("");
  }

  async function logout() {
    await supabase.auth.signOut();
    setPlayer(null);
    setPage("login");
    setNotice("You have logged out.");
    setError("");
  }

  if (player) {
    return (
      <main className="app-shell">
        <header className="topbar">
          <a className="brand" href="#" onClick={(event: MouseEvent<HTMLAnchorElement>) => event.preventDefault()}>
            <span className="brand-mark">P</span>
            <span>PLAYER<span className="brand-light">SYSTEM</span></span>
          </a>
          <div className="topbar-right">
            <span className="online-dot" />
            <span className="signed-in">Signed in as <strong>{player.username}</strong></span>
            <button className="button button-quiet" onClick={logout}>Log out ↗</button>
          </div>
        </header>

        <section className="dashboard-heading">
          <div>
            <h1>Dashboard<span className="accent">.</span></h1>
            <p className="subheading">Welcome back, {player.username}.</p>
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
              <div className="avatar">{player.username.slice(0, 1).toUpperCase()}</div>
              <div><h3>{player.username}</h3><p>{player.playerClass}</p></div>
              <span className="status-pill">ACTIVE</span>
            </div>
            <div className="profile-details">
              <div><span>PLAYER ID</span><strong>{player.playerId}</strong></div>
              <div><span>USERNAME</span><strong>{player.username}</strong></div>
              <div><span>CLASS</span><strong>{player.playerClass}</strong></div>
            </div>
          </article>
        </section>
        
      </main>
    );
  }

  return (
    <main className="auth-layout">
      <div className="auth-decoration">
        <div className="hero-copy" />
        <div className="hero-footer"><span /></div>
      </div>
      <section className="auth-side">
        <div className="auth-card">
          <div className="Decoration-orb orb-three" />
          <div className="mobile-brand"><span className="brand-mark">P</span> PLAYER<span className="brand-light">SYSTEM</span></div>
          <div className="auth-heading">
            <p className="eyebrow">{page === "login" ? "WELCOME TO PLAYER SYSTEM" : "Player Register"}</p>
            <h2>{page === "login" ? "Player System" : "Create Account"}<span className="accent">.</span></h2>
            <p>{page === "login" ? "Log in to your account" : "Register for a new account"}</p>
          </div>
          <div className="auth-tabs">
            <button className={page === "login" ? "active" : ""} onClick={() => { setPage("login"); setError(""); }}>Log in</button>
            <button className={page === "register" ? "active" : ""} onClick={() => { setPage("register"); setError(""); }}>Registration</button>
          </div>
          {notice && <div className="notice-message">{notice}</div>}
          {error && <div className="error-message">{error}</div>}

          {page === "login" ? (
            <form className="auth-form" onSubmit={login}>
              <label>USERNAME OR EMAIL<input autoComplete="username" placeholder="Enter username or email" value={username} onChange={(event: ChangeEvent<HTMLInputElement>) => setUsername(event.target.value)} /></label>
              <label>PASSWORD<div className="password-wrap"><input autoComplete="current-password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)} /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "HIDE" : "SHOW"}</button></div></label>
              <button className="button button-primary submit-button" type="submit" disabled={loading}>{loading ? "Please wait..." : "Log in"} <span>→</span></button>

            </form>
          ) : (
            <form className="auth-form" onSubmit={register}>
              <label>USERNAME<input autoComplete="username" placeholder="Choose a username" value={username} onChange={(event: ChangeEvent<HTMLInputElement>) => setUsername(event.target.value)} /></label>
              <label>PASSWORD<div className="password-wrap"><input autoComplete="new-password" type={showPassword ? "text" : "password"} placeholder="At least 6 characters" value={password} onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)} /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "HIDE" : "SHOW"}</button></div></label>
              <label>EMAIL<input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)} /></label>
              <label>CHOOSE YOUR CLASS<select value={playerClass} onChange={(event: ChangeEvent<HTMLSelectElement>) => setPlayerClass(event.target.value as PlayerClass)}>{classes.map((item) => <option key={item}>{item}</option>)}</select></label>
              <button className="button button-primary submit-button" type="submit" disabled={loading}>{loading ? "Please wait..." : "Register account"} <span>→</span></button>
              <p className="switch-copy">Already registered? <button type="button" onClick={() => { setPage("login"); setError(""); setNotice(""); }}>Back to log in</button></p>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
