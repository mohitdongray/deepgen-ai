// DeepGenNavbar.jsx
import React from "react";
import { Menu, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./ModernNavbar.css";

const DeepGenNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/generate", label: "Generate", hasDropdown: true },
    { path: "/explore", label: "Explore" },
    { path: "/architecture", label: "Architecture" },
    { path: "/contact", label: "Contact" },
  ];

  const generateDropdown = [
    { icon: "🎭", title: "Face Swap", path: "/generate/face-swap" },
    { icon: "🎤", title: "Talking Avatar", path: "/generate/talking-avatar" },
    { icon: "🖼", title: "Image to Video", path: "/generate/image-to-video" },
    { icon: "📝", title: "Text to Video", path: "/generate/text-to-video" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
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
                {link.hasDropdown && <i className="ri-arrow-down-s-line generate-arrow"></i>}
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
          <button className="btn-secondary" onClick={() => navigate("/signin")}>
            Sign In
          </button>
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
              <button className="btn-secondary" onClick={() => navigate("/signin")}>
                Sign In
              </button>
              <button className="btn-primary" onClick={() => navigate("/create")}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default DeepGenNavbar;
