import { useState } from "react";
import { login } from "../api/Auth";
import { ApiError } from "../api/request";
import { RoleText } from "../constants/Role";

const ACCOUNTS = [
  { username: "inspector", password: "inspect123" },
  { username: "maintainer", password: "maintain123" },
  { username: "supervisor", password: "super123" },
  { username: "auditor", password: "audit123" }
];

export function LoginPage() {
  const [username, setUsername] = useState("inspector");
  const [password, setPassword] = useState("inspect123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      const user = await login(username, password);
      window.dispatchEvent(new CustomEvent("auth-changed", { detail: user }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
        <p className="eyebrow">fire-inspect</p>
        <h1>消防设施巡检维保平台</h1>
        <p className="login-sub">地下室离线巡检 · 冲突复核 · 合规达标率</p>
        <label>账号
          <input value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <label>密码
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="btn btn-primary" disabled={loading}>{loading ? "登录中…" : "登录"}</button>
        <div className="account-hints">
          {ACCOUNTS.map((a) => (
            <button type="button" key={a.username} className="account-chip"
              onClick={() => { setUsername(a.username); setPassword(a.password); }}>
              {RoleText[Object.keys(RoleText)[ACCOUNTS.indexOf(a)] as keyof typeof RoleText]} / {a.username}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
