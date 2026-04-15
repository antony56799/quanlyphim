import { Link } from "react-router-dom";

const Navbar = () => {
  const navStyle: React.CSSProperties = {
    display: "flex",
    gap: "clamp(20px, 4vw, 50px)",
    flexWrap: "nowrap",
  };

  const linkStyle: React.CSSProperties = {
    color: "white",
    fontSize: "clamp(10px, 2vw, 16px)",
    fontFamily: "'Inter', sans-serif",
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  return (
    <nav style={navStyle}>
      <Link to="/" style={linkStyle}>
        Trang chu
      </Link>
      <a style={linkStyle}>Phim</a>
      <a style={linkStyle}>Lich chieu</a>
      <a style={linkStyle}>Rap</a>
      <a style={linkStyle}>Blog</a>
    </nav>
  );
};

export default Navbar;
