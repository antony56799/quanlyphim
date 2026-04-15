import Background from "../components/layout/Background";
import Header from "../components/layout/Header";
import { Link } from "react-router-dom";

const Register = () => {
  return (
    <Background>
      <Header />
      <main className="login-page">
        <section className="login-window" aria-labelledby="register-title">
          <form className="login-form">
            <h2 id="register-title" style={{ marginBottom: "1rem", fontSize: "1.5rem", fontWeight: "bold" }}>Đăng ký</h2>
            
            <div className="login-form__group">
              <label htmlFor="username">Tên người dùng</label>
              <input id="username" type="text" placeholder="Nhập tên người dùng" />
            </div>

            <div className="login-form__group">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" placeholder="email@example.com" />
            </div>

            <div className="login-form__group">
              <label htmlFor="password">Mật khẩu</label>
              <input id="password" type="password" placeholder="Nhập mật khẩu" />
            </div>

            <div className="login-form__group">
              <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
              <input id="confirmPassword" type="password" placeholder="Nhập lại mật khẩu" />
            </div>

            <button type="submit" className="login-form__submit">
              Đăng ký
            </button>

            <p className="login-form__register">
              Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
            </p>
          </form>
        </section>
      </main>
    </Background>
  );
};

export default Register;
