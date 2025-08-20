import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // 🔑

export default function Login() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth(); // 🔑 context login function

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const req = await fetch("http://5.133.122.226:8001/api/login/", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username_or_email: user, password: pass }),
      });

      const data = await req.json();
      console.log("Server javobi:", data);

      if (req.ok) {
        // context orqali saqlash
        login(data.user, data.access);
        navigate("/page1"); // logindan keyin yo‘naltirish
      } else {
        alert(data.detail || "Login yoki parol noto‘g‘ri!");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Xatolik yuz berdi!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-200">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded-xl shadow-md w-80"
      >
        <h2 className="text-xl font-bold mb-4 text-center">Login</h2>

        <input
          type="text"
          placeholder="Username"
          className="w-full border p-2 mb-3 rounded"
          value={user}
          onChange={(e) => setUser(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-2 mb-3 rounded"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? "Kirish..." : "Kirish"}
        </button>
      </form>
    </div>
  );
}
