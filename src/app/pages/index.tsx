import { useEffect, useState } from "react";
import Layout from "@/components/Layout";

export default function Home() {
  const [files, setFiles] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  async function fetchFiles() {
    const res = await fetch("/api/file/list", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) setFiles(data.files);
  }

  async function uploadFile(e: any) {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/file/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (res.ok) {
      alert("File uploaded");
      setFile(null);
      fetchFiles();
    } else {
      alert("Upload failed");
    }
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

  useEffect(() => {
    if (token) fetchFiles();
  }, []);

  return (
    <Layout>
      <h1 className="text-xl font-bold mb-4">My Files</h1>

      <form onSubmit={uploadFile} className="mb-6">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button
          className="ml-2 bg-blue-600 text-white px-4 py-1 rounded"
          type="submit"
        >
          Upload
        </button>
      </form>

      <ul className="space-y-2">
        {files.map((f) => (
          <li
            key={f._id}
            className="flex justify-between items-center border-b pb-1"
          >
            <span>{f.originalName}</span>
            <div className="space-x-2">
              <a
                href={`/api/file/download?id=${f._id}`}
                className="text-blue-600"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download
              </a>
              <button
                onClick={() => deleteFile(f._id)}
                className="text-red-500"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </Layout>
  );
}
