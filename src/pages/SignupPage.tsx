import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../api/auth";
import { ApiError } from "../api/client";
import "./AuthPages.css";

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    phoneNumber: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    setSubmitting(true);
    try {
      await signup(form);
      navigate("/login", {
        replace: true,
        state: { flash: "회원가입이 완료되었습니다. 로그인해주세요." },
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "회원가입에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container auth-wrap">
      <form onSubmit={handleSubmit} className="auth-card card" noValidate>
        <h1 className="auth-title">회원가입</h1>
        <p className="auth-sub">3초만에 시작하세요.</p>

        {error && <div className="alert alert-error" role="alert">{error}</div>}

        <div className="field">
          <label className="field-label" htmlFor="su-email">이메일</label>
          <input
            id="su-email"
            type="email"
            className="input"
            autoComplete="email"
            value={form.email}
            onChange={update("email")}
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="su-pw">비밀번호</label>
          <input
            id="su-pw"
            type="password"
            className="input"
            autoComplete="new-password"
            value={form.password}
            onChange={update("password")}
            required
            minLength={8}
          />
          <span className="field-help">8자 이상으로 입력해주세요.</span>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="su-name">이름</label>
          <input
            id="su-name"
            className="input"
            value={form.name}
            onChange={update("name")}
            required
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="su-phone">전화번호</label>
          <input
            id="su-phone"
            className="input"
            placeholder="010-1234-5678"
            value={form.phoneNumber}
            onChange={update("phoneNumber")}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
          {submitting ? <span className="spinner" /> : null}
          가입하기
        </button>

        <p className="auth-alt">
          이미 회원이신가요? <Link to="/login">로그인</Link>
        </p>
      </form>
    </div>
  );
}
