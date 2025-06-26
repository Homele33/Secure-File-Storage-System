"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) router.push("/login");
    else alert("Registration failed");
  }

  return (
    <Layout>
      <div className="text-center mb-6">
        <h1 className="text-4xl font-extrabold text-blue-600">Register</h1>
        <p className="text-gray-600">Create your secure file storage account</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
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
          Register
        </button>
      </form>

      <div className="text-center mt-6">
        <p className="text-gray-600">Already have an account?</p>
        <button
          onClick={() => router.push("/login")}
          className="mt-2 text-blue-500 hover:underline font-medium"
        >
          Login here
        </button>
      </div>
    </Layout>
  );
}
