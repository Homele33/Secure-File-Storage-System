"use client";
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
type StoredFile = {
  _id: string;
  originalName: string;
  createdAt: string;
};

export default function Home() {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (token) fetchFiles();
  }, [token]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  // while checking auth, you can show nothing or a spinner
  if (!isAuthenticated) {
    return null;
  }

  async function fetchFiles() {
    const res = await fetch("/api/file/list", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setFiles(data.files);
    }
  }

  async function uploadFile(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/file/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    if (res.ok) {
      setFile(null);
      fetchFiles();
    } else {
      alert("Upload failed");
    }
  }

  async function downloadFile(id: string, originalName: string) {
    const res = await fetch(`/api/file/download?id=${id}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      alert("Failed to download");
      return;
    }
    const blob = await res.blob();
    // Create a temporary link and click it to trigger browser download
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = originalName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
  async function deleteFile(id: string) {
    if (!confirm("Delete this file?")) return;
    const res = await fetch(`/api/file/delete?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) fetchFiles();
    else alert("Failed to delete");
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-mono font-bold text-black">
            Secure File Storage 🖥️💾
          </h1>
          <button
            onClick={logout}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
          >
            Logout
          </button>
        </header>

        {/* Upload Section */}
        <section className="bg-white shadow-md border border-gray-200 p-6 rounded-lg mb-10">
          <h2 className="text-2xl font-mono font-semibold text-black mb-4">
            🔼 Upload New File
          </h2>
          <form
            className="flex flex-col sm:flex-row items-center gap-4"
            onSubmit={uploadFile}
          >
            <input
              type="file"
              id="fileInput"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <label
              htmlFor="fileInput"
              className="cursor-pointer px-4 py-2 border border-gray-400 rounded-md font-mono text-black hover:bg-gray-100 transition"
            >
              Select File
            </label>
            <span className="font-mono text-black flex-1">
              {file?.name || "No file selected"}
            </span>
            <button
              type="submit"
              disabled={!file}
              className="px-4 py-2 bg-gray-800 text-white rounded-md font-mono hover:bg-gray-900 disabled:opacity-50 transition"
            >
              Upload
            </button>
          </form>
        </section>

        {/* Files List Section */}
        <section className="bg-white shadow-md border border-gray-200 p-6 rounded-lg">
          <h2 className="text-2xl font-mono font-semibold text-black mb-4">
            📂 My Files
          </h2>

          {files.length > 0 ? (
            <ul className="divide-y divide-gray-300">
              {files.map((f) => (
                <li
                  key={f._id}
                  className="py-4 flex justify-between items-center"
                >
                  <div>
                    <p className="font-mono text-black mb-1">{`> ${f.originalName}`}</p>
                    <p className="text-sm font-mono text-black opacity-70">
                      {new Date(f.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => downloadFile(f._id, f.originalName)}
                      className="font-mono text-black hover:underline"
                    >
                      [download]
                    </button>
                    <button
                      onClick={() => deleteFile(f._id)}
                      className="font-mono text-red-600 hover:underline"
                    >
                      [delete]
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-mono text-black opacity-70">
              // No files uploaded yet...
            </p>
          )}
        </section>
      </div>
    </Layout>
  );
}
