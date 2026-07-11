import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, updateProfile, sendPasswordResetEmail } from "firebase/auth";
import {
  Box, Settings as SettingsIcon,
  Moon, LogOut, Globe, Lock, ArrowLeft, Camera,
  ChevronDown, Check, X, Sun, Loader2
} from "lucide-react";
import { useLanguage } from "./LanguageContext";
import "../styles/Settings.css";

const Settings = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t, languages } = useLanguage();

  // Language dropdown open/close + click-outside handling
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef(null);

  useEffect(() => {
    if (!langMenuOpen) return;
    const handleClickOutside = (e) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [langMenuOpen]);

  const currentLanguageLabel =
    languages.find((l) => l.code === language)?.label || "English (US)";

  const handleSelectLanguage = (code) => {
    setLanguage(code);
    setLangMenuOpen(false);
  };
  
  // App Theme synchronized with global document element and localStorage
  const [theme, setTheme] = useState(() => localStorage.getItem("appTheme") || "dark");
  
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("appTheme", theme);
  }, [theme]);
  
  const isDark = theme === "dark";

  // Firebase Auth User state management
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState("User");
  const [email, setEmail] = useState("user@example.com");
  const [isPremium, setIsPremium] = useState(false);
  const [planName, setPlanName] = useState("Free");

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setEmail(firebaseUser.email || "user@example.com");

        // 🔥 Pull the real profile name AND subscription status from
        // MongoDB (same source the sidebar uses) instead of Firebase's
        // displayName / a hardcoded "Free" plan. Onboarding only ever
        // saves the name to Mongo via /save-profile, so displayName was
        // silently falling back to the email prefix, and the plan card
        // never reflected an actual upgrade.
        try {
          const token = await firebaseUser.getIdToken();
          const res = await fetch("http://127.0.0.1:8000/check-user", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();

          setUserName(
            data?.name ||
            firebaseUser.displayName ||
            firebaseUser.email?.split("@")[0] ||
            "User"
          );
          setIsPremium(Boolean(data?.premium));
          setPlanName(data?.plan || "Free");
        } catch (err) {
          console.error("Could not fetch profile/subscription info:", err);
          setUserName(firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User");
          setIsPremium(false);
          setPlanName("Free");
        }
      } else {
        setUser(null);
        setUserName("User");
        setEmail("user@example.com");
        setIsPremium(false);
        setPlanName("Free");
      }
    });
    return () => unsubscribe();
  }, []);

  const initial = userName.charAt(0).toUpperCase();

  // --- CHANGE PASSWORD (sends a Firebase reset link to the user's email) ---
  const [resetStatus, setResetStatus] = useState(""); // "", "sending", "sent", "error"
  const [resetMessage, setResetMessage] = useState("");

  const handleChangePassword = async () => {
    if (!user) {
      setResetStatus("error");
      setResetMessage("You need to be logged in to reset your password.");
      return;
    }

    setResetStatus("sending");
    setResetMessage("");

    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
      setResetStatus("sent");
      setResetMessage(`Reset link sent to ${email}`);
    } catch (err) {
      console.error("Error sending password reset email:", err);
      setResetStatus("error");
      // Firebase throws auth/too-many-requests if spammed — surface that
      // specifically, otherwise a generic fallback.
      setResetMessage(
        err.code === "auth/too-many-requests"
          ? "Too many attempts. Please try again later."
          : "Couldn't send reset link. Please try again."
      );
    } finally {
      // Clear the inline message after a few seconds so it doesn't linger forever
      setTimeout(() => {
        setResetStatus("");
        setResetMessage("");
      }, 5000);
    }
  };

  // --- EDIT PROFILE MODAL ---
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(userName);
  const [editError, setEditError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const openEditProfile = () => {
    setEditName(userName);
    setEditError("");
    setEditModalOpen(true);
  };

  const closeEditProfile = () => {
    if (savingProfile) return; // don't let a stray click close it mid-save
    setEditModalOpen(false);
  };

  const handleSaveProfile = async () => {
    const trimmedName = editName.trim();

    if (!trimmedName) {
      setEditError("Please enter a name");
      return;
    }

    if (!user) {
      setEditError("You need to be logged in to update your profile");
      return;
    }

    setSavingProfile(true);
    setEditError("");

    try {
      const token = await user.getIdToken();

      const res = await fetch("http://127.0.0.1:8000/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: trimmedName }),
      });

      const data = await res.json();

      if (data.error) {
        setEditError(data.error);
        return;
      }

      // 🔥 Keep Firebase's own displayName in sync too, so it's consistent
      // anywhere else in the app that reads firebaseUser.displayName.
      try {
        await updateProfile(user, { displayName: trimmedName });
      } catch (fbErr) {
        console.error("Could not sync display name to Firebase:", fbErr);
        // Not fatal — Mongo is the source of truth for the app, this is best-effort.
      }

      setUserName(trimmedName);
      setEditModalOpen(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      setEditError("Something went wrong. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await auth.signOut();
      navigate("/login");
    } catch (err) {
      console.error("Error signing out: ", err);
    }
  };

  return (
    <div className={`settings-container ${isDark ? 'dark-theme' : 'light-theme'}`}>
      
      {/* --- TOP NAVBAR --- */}
      <nav className="settings-top-navbar">
        <div className="nav-left">
          <button className="nav-icon-btn" onClick={() => navigate("/")} title="Back to Chat">
            <ArrowLeft size={24} />
          </button>
          <h2 className="nav-title">{t("settings")}</h2>
        </div>
        <div className="nav-right">
          <button className="nav-icon-btn" onClick={() => setTheme(isDark ? "light" : "dark")} title="Toggle Theme">
            {isDark ? <Sun size={22} /> : <Moon size={22} />}
          </button>
          <button className="nav-icon-btn nav-logout" onClick={handleLogout} title="Log Out">
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="settings-main">
        {/* Spacer for Top Navbar */}
        <div className="settings-top-spacer"></div>

        <div className="settings-content-wrapper">
          
          {/* SECTION: PROFILE */}
          <section className="settings-section">
            <div className="section-info">
              <h3>{t("profile")}</h3>
              <p>{t("profileDesc")}</p>
            </div>
            <div className="section-card">
              <div className="profile-card-content">
                <div className="profile-avatar-group">
                  <div className="huge-avatar profile-circle-huge">
                    {initial}
                    <button className="avatar-edit-btn">
                      <Camera size={14} />
                    </button>
                  </div>
                  <div className="profile-details">
                    <h4>{userName}</h4>
                    <p>{email}</p>
                  </div>
                </div>
                <button className="gradient-btn" onClick={openEditProfile}>{t("editProfile")}</button>
              </div>
            </div>
          </section>

          {/* SECTION: PREFERENCES */}
          <section className="settings-section">
            <div className="section-info">
              <h3>{t("preferences")}</h3>
              <p>{t("preferencesDesc")}</p>
            </div>
            <div className="section-card list-card">
              <div className="list-item">
                <div className="item-left">
                  <Moon size={20} className="item-icon" />
                  <span>{t("themeToggle")}</span>
                </div>
                <div className="item-right">
                  <div className={`theme-toggle ${isDark ? 'on' : 'off'}`} onClick={() => setTheme(isDark ? "light" : "dark")}>
                    <div className="toggle-thumb" />
                  </div>
                </div>
              </div>
              <div className="list-item">
                <div className="item-left">
                  <Globe size={20} className="item-icon" />
                  <span>{t("interfaceLanguage")}</span>
                </div>
                <div className="item-right lang-dropdown-wrap" ref={langMenuRef}>
                  <button
                    className="dropdown-btn"
                    onClick={() => setLangMenuOpen((open) => !open)}
                  >
                    {currentLanguageLabel}
                    <ChevronDown size={16} className={langMenuOpen ? "chevron-open" : ""} />
                  </button>
                  {langMenuOpen && (
                    <ul className="lang-dropdown-menu">
                      {languages.map((l) => (
                        <li key={l.code}>
                          <button
                            className={`lang-option ${l.code === language ? "selected" : ""}`}
                            onClick={() => handleSelectLanguage(l.code)}
                          >
                            <span>{l.label}</span>
                            {l.code === language && <Check size={15} />}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION: SUBSCRIPTION */}
          <section className="settings-section">
            <div className="section-info">
              <h3>{t("subscription")}</h3>
              <p>{t("subscriptionDesc")}</p>
            </div>
            <div className="section-card subscription-card">
              <div className="subscription-left">
                <div className="plan-badge">{t("activePlan")}</div>
                <h3 className="plan-title">
                  {t("currentPlan")}: {isPremium ? planName : "Free"}
                </h3>
                <p className="plan-desc">
                  {isPremium
                    ? `You're on the ${planName} plan with expanded daily limits and priority access.`
                    : "You are using the standard intelligence model. Limit: 50 prompts/day."}
                </p>
              </div>
              <div className="subscription-right">
                {isPremium ? (
                  <button className="gradient-btn" onClick={() => navigate("/pricing")}>
                    {t("manageSubscription")}
                  </button>
                ) : (
                  <button className="upgrade-btn" onClick={() => navigate("/pricing")}>
                    {t("upgradeToPro")}
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* SECTION: SECURITY */}
          <section className="settings-section">
            <div className="section-info">
              <h3>{t("security")}</h3>
              <p>{t("securityDesc")}</p>
            </div>
            <div className="section-card list-card">
              <div className="list-item">
                <div className="item-left security-item">
                  <Lock size={20} className="item-icon" />
                  <div className="security-text">
                    <span className="security-title">{t("password")}</span>
                    <span className="security-sub">Last changed 3 months ago</span>
                  </div>
                </div>
                <div className="item-right">
                  <button
                    className="gradient-btn"
                    onClick={handleChangePassword}
                    disabled={resetStatus === "sending"}
                  >
                    {resetStatus === "sending" ? "Sending..." : t("changePassword")}
                  </button>
                  {resetMessage && (
                    <p
                      className={`reset-status-msg ${resetStatus === "error" ? "reset-status-error" : "reset-status-ok"}`}
                    >
                      {resetMessage}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* --- EDIT PROFILE MODAL --- */}
      {editModalOpen && (
        <div className="edit-profile-overlay" onClick={closeEditProfile}>
          <div className="edit-profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="edit-profile-header">
              <h3>Edit Profile</h3>
              <button className="edit-profile-close-btn" onClick={closeEditProfile} disabled={savingProfile}>
                <X size={18} />
              </button>
            </div>

            <div className="edit-profile-avatar-row">
              <div className="huge-avatar profile-circle-huge edit-profile-avatar">
                {editName.trim() ? editName.trim().charAt(0).toUpperCase() : initial}
                <button className="avatar-edit-btn" title="Coming soon" disabled>
                  <Camera size={14} />
                </button>
              </div>
            </div>

            <div className="edit-profile-field">
              <label>Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => {
                  setEditName(e.target.value);
                  setEditError("");
                }}
                placeholder="Enter your name"
                autoFocus
                disabled={savingProfile}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveProfile();
                }}
              />
            </div>

            <div className="edit-profile-field">
              <label>Email</label>
              <input type="email" value={email} disabled className="edit-profile-input-locked" />
              <span className="edit-profile-hint">Email is linked to your login and can't be changed here.</span>
            </div>

            {editError && <p className="edit-profile-error">{editError}</p>}

            <div className="edit-profile-actions">
              <button className="edit-profile-cancel-btn" onClick={closeEditProfile} disabled={savingProfile}>
                Cancel
              </button>
              <button className="edit-profile-save-btn" onClick={handleSaveProfile} disabled={savingProfile}>
                {savingProfile ? (
                  <>
                    <Loader2 size={16} className="spin-icon" /> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;