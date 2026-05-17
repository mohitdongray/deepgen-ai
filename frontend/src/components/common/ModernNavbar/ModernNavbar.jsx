// DeepGenNavbar.jsx
import React from "react";
import { Menu, X, User, LogOut, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import "./ModernNavbar.css";

/* ── Sign-In Modal ──────────────────────────────────── */
const SignInModal = ({ isOpen, onClose, onSignIn }) => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const overlayRef = React.useRef(null);

  // Close on overlay click
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Close on Escape key
  React.useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    if (isOpen) {
      document.addEventListener("keydown", handleKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    // Simulate network delay for realistic feel
    await new Promise((r) => setTimeout(r, 900));
    setIsLoading(false);

    onSignIn({ email, name: email.split("@")[0] });
    setEmail("");
    setPassword("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className={`signin-overlay ${isOpen ? "open" : ""}`}
      ref={overlayRef}
      onClick={handleOverlayClick}
    >
      <div className="signin-modal">
        {/* Close button */}
        <button className="signin-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        {/* Header */}
        <div className="signin-header">
          <div className="signin-logo-ring">
            <User size={28} />
          </div>
          <h2 className="signin-title">Welcome Back</h2>
          <p className="signin-subtitle">Sign in to continue to DeepGen AI</p>
        </div>

        {/* Form */}
        <form className="signin-form" onSubmit={handleSubmit}>
          {error && <div className="signin-error">{error}</div>}

          <div className="signin-field">
            <label className="signin-label" htmlFor="signin-email">
              Email
            </label>
            <div className="signin-input-wrapper">
              <Mail size={16} className="signin-input-icon" />
              <input
                id="signin-email"
                type="email"
                className="signin-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <div className="signin-field">
            <label className="signin-label" htmlFor="signin-password">
              Password
            </label>
            <div className="signin-input-wrapper">
              <Lock size={16} className="signin-input-icon" />
              <input
                id="signin-password"
                type={showPassword ? "text" : "password"}
                className="signin-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="signin-toggle-pw"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="signin-options">
            <label className="signin-remember">
              <input type="checkbox" /> <span>Remember me</span>
            </label>
            <button type="button" className="signin-forgot">
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="signin-submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="signin-spinner" />
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="signin-footer-text">
          Don&apos;t have an account?{" "}
          <button type="button" className="signin-link">
            Create one
          </button>
        </p>
      </div>
    </div>
  );
};

/* ── Navbar ──────────────────────────────────────────── */
const DeepGenNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [signInOpen, setSignInOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/generate", label: "Generate", hasDropdown: true },
    { path: "/explore-features", label: "Explore" },
    { path: "/architecture", label: "Architecture" },
    { path: "/contact", label: "Contact" },
  ];

  const generateDropdown = [
    { icon: "🎭", title: "Face Swap", path: "/workspace?type=face-swap" },
    { icon: "🎤", title: "Talking Avatar", path: "/workspace?type=avatar-video" },
    { icon: "🖼", title: "Image to Video", path: "/workspace?type=image-to-video" },
    { icon: "📝", title: "Text to Video", path: "/workspace?type=text-to-video" },
  ];

  const isActive = (path) => location.pathname === path;

  const handleSignIn = (userData) => {
    login(userData);                // sets user in context with name from form
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
  };

  return (
    <>
      <nav className="modern-navbar">
        <div className="navbar-container">
          {/* Brand */}
          <Link to="/" className="navbar-brand">
            <span className="brand-text">DeepGen AI</span>
          </Link>

          {/* Desktop Links */}
          <div className="navbar-links desktop-only">
            {navLinks.map((link) => (
              <div
                key={link.path}
                className="nav-item-container"
                onMouseEnter={() => link.hasDropdown && setDropdownOpen(true)}
                onMouseLeave={() => link.hasDropdown && setDropdownOpen(false)}
              >
                <Link
                  to={link.path}
                  className={`nav-link ${isActive(link.path) ? "active" : ""}`}
                >
                  {link.label}{" "}
                  {link.hasDropdown && (
                    <i className="ri-arrow-down-s-line generate-arrow"></i>
                  )}
                </Link>

                {/* Generate Dropdown */}
                {link.hasDropdown && dropdownOpen && (
                  <div className="generate-dropdown">
                    {generateDropdown.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className="dropdown-item"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <span className="dropdown-icon">{item.icon}</span>
                        <span className="dropdown-title">{item.title}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Buttons */}
          <div className="navbar-actions desktop-only">
            {user ? (
              <div
                className="user-menu-container"
                onMouseEnter={() => setUserMenuOpen(true)}
                onMouseLeave={() => setUserMenuOpen(false)}
              >
                <button className="user-avatar-btn">
                  <div className="user-avatar-circle">
                    <User size={16} />
                  </div>
                  <span className="user-name-label">{user.name}</span>
                </button>

                {userMenuOpen && (
                  <div className="user-dropdown">
                    <button className="user-dropdown-item" onClick={handleLogout}>
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                className="btn-secondary"
                onClick={() => setSignInOpen(true)}
              >
                Sign In
              </button>
            )}
            <button className="btn-primary" onClick={() => navigate("/create")}>
              Create
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-btn mobile-only"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="mobile-menu open">
            <div className="mobile-menu-content">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="mobile-nav-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              <div className="mobile-actions">
                {user ? (
                  <button className="btn-secondary" onClick={handleLogout}>
                    <LogOut size={16} style={{ marginRight: 8 }} />
                    Sign Out ({user.name})
                  </button>
                ) : (
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setSignInOpen(true);
                    }}
                  >
                    Sign In
                  </button>
                )}
                <button
                  className="btn-primary"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/create");
                  }}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Sign In Modal — rendered outside nav for proper z-index stacking */}
      <SignInModal
        isOpen={signInOpen}
        onClose={() => setSignInOpen(false)}
        onSignIn={handleSignIn}
      />
    </>
  );
};

export default DeepGenNavbar;
