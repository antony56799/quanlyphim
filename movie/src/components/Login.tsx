import Background from "../components/layout/Background";
import Header from "../components/layout/Header";
import { Link, useNavigate } from "react-router-dom";
import { useState} from "react";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("user-changed"));

        if (data.user.role === "admin" || data.user.role === "staff") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      } else {
        setError(data.message || "Đăng nhập thất bại");
      }
    } catch (err) {
      setError("Không thể kết nối đến máy chủ");
      console.error(err);
    }
  };

  return (
    <Background>
      <Header />
      <main className="login-page">
        <section className="login-window">
          <form className="login-form" onSubmit={handleLogin}>
            <h2 style={{ marginBottom: "0.5rem", fontSize: "1.5rem", fontWeight: "bold", textAlign:"center" }}>Đăng nhập</h2>
            
            {error && <p style={{ color: "#ff4d4d", marginBottom: "1rem", fontSize: "0.9rem" }}>{error}</p>}

            <div className="login-form__group">
              <label htmlFor="email">Tài khoản</label>
              <input 
                id="email" type="email" placeholder="email@example.com" required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="login-form__group">
              <div className="login-form__row">
                <label htmlFor="password">Mật khẩu</label>
                <a href="#">Quên mật khẩu?</a>
              </div>
              <input 
                id="password" type="password" placeholder="Nhap mat khau" required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="login-form__options">
              <label className="login-form__checkbox">
                <input type="checkbox" />
                <span>Ghi nhớ đăng nhập</span>
              </label>
            </div>

            <button type="submit" className="login-form__submit">
              Đăng nhập
            </button>

            <p className="login-form__register">
              Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
            </p>
          </form>
        </section>
      </main>
    </Background>
  );
};

export default Login;
