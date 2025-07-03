"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext"; // ← import
import Layout from "@/components/Layout";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isAuthenticated, isLoading } = useAuth(); // ← grab login()
  const router = useRouter();

  useEffect(() => {
    // Only redirect if not loading and authenticated
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.error("Failed to parse response JSON:", jsonErr);
        alert("Unexpected server error.");
        return;
      }

      if (res.ok) {
        login(data.token);
      } else {
        alert(data?.message || "Login failed");
      }
    } catch (err) {
      console.error("Network or server error:", err);
      alert("Unable to reach server.");
    }
  }
  return (
    <Layout>
      <div className="text-center mb-6">
        <h1 className="text-4xl font-extrabold text-blue-600">Login</h1>
        <p className="text-gray-600">Access your secure files</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full border p-3 rounded-md bg-blue-100 text-black"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full border p-3 rounded-md bg-blue-100 text-black"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-3 rounded-md font-bold hover:bg-blue-600 transition"
        >
          Login
        </button>
      </form>

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => router.push("/")}
          className="text-gray-600 hover:underline font-medium"
        >
          ← Back to Home
        </button>
        <button
          onClick={() => router.push("/register")}
          className="text-blue-500 hover:underline font-medium"
        >
          Create an account →
        </button>
      </div>
    </Layout>
  );
}
