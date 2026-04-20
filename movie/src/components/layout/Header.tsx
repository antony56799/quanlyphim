import { useEffect, useRef, useState } from "react";
import { FaFilm, FaSearch, FaUser, FaSignOutAlt } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

type User = {
  id?: number;
  name: string;
  email?: string;
  role?: string;
};

const USER_CHANGED_EVENT = "user-changed";

const readStoredUser = (): User | null => {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) return null;

  try {
    const parsed: unknown = JSON.parse(storedUser);
    if (!parsed || typeof parsed !== "object") return null;
    const rec = parsed as Record<string, unknown>;
    const name = typeof rec.name === "string" ? rec.name : "";
    if (!name) return null;
    const id = typeof rec.id === "number" ? rec.id : undefined;
    const email = typeof rec.email === "string" ? rec.email : undefined;
    const role = typeof rec.role === "string" ? rec.role : undefined;
    return { id, name, email, role };
  } catch {
    return null;
  }
};

const Header = () => {
  const navigate = useNavigate();
  const [openSearch, setOpenSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<User | null>(() => readStoredUser());

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setOpenSearch(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const syncUser = () => setUser(readStoredUser());

    window.addEventListener("storage", syncUser);
    window.addEventListener(USER_CHANGED_EVENT, syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener(USER_CHANGED_EVENT, syncUser);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.dispatchEvent(new Event(USER_CHANGED_EVENT));
    setUser(null);
    navigate("/login");
  };

  const headerStyle: React.CSSProperties = {
    boxSizing: "border-box",
    borderBottom: "2px solid white",
    width: "100%",
    padding: "20px 40px",
    justifyContent: "space-between",
    alignItems: "center",
    display: "flex",
    flexWrap: "nowrap",
  };

  const logoStyle: React.CSSProperties = {
    fontFamily: "'Playfair Display', serif",
    fontSize: "32px",
    fontWeight: "700",
    color: "#e6e3e2",
    textDecoration: "none",
  };

  const navContainerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  };

  const rightGroupStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "clamp(20px, 4vw, 50px)",
    position: "relative",
  };

  const searchWrapperStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    position: "relative",
  };

  const searchInputStyle: React.CSSProperties = {
    position: "absolute",
    right: "30px",
    width: openSearch ? "180px" : "0px",
    opacity: openSearch ? 1 : 0,
    padding: openSearch ? "6px 10px" : "0px",
    marginRight: "10px",
    borderRadius: "20px",
    border: "none",
    outline: "none",
    transition: "all 0.3s ease",
    background: "rgba(255,255,255,0.95)",
    color: "#222",
  };

  return (
    <header style={headerStyle}>
      <Link to="/" style={logoStyle}>
        <FaFilm size={22} color="white" style={{ marginRight: "8px" }} />
        LODESTAR
      </Link>
      <div style={navContainerStyle}>
        <Navbar />
      </div>

      <div style={{ ...rightGroupStyle, marginLeft: "auto" }}>
        <div ref={searchRef} style={searchWrapperStyle}>
          <input type="text" placeholder="Search..." style={searchInputStyle} />

          <FaSearch
            size={18}
            color="white"
            style={{ cursor: "pointer" }}
            onClick={() => setOpenSearch((prev) => !prev)}
          />
        </div>

        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "15px", color: "white" }}>
            {user.role === "customer" ? (
              <Link to="/account" style={{ fontSize: "0.9rem", color: "white", textDecoration: "none" }}>
                {user.name}
              </Link>
            ) : (
              <span style={{ fontSize: "0.9rem" }}>{user.name}</span>
            )}
            {user.role === "admin" && (
              <Link to="/admin" style={{ color: "white", textDecoration: "none", fontSize: "0.9rem", border: "1px solid white", padding: "2px 8px", borderRadius: "4px" }}>
                Admin
              </Link>
            )}
            <FaSignOutAlt size={20} color="white" style={{ cursor: "pointer" }} onClick={handleLogout} />
          </div>
        ) : (
          <Link to="/login">
            <FaUser size={22} color="white" />
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
