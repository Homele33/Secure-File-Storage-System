import Link from "next/link";
import Layout from "@/components/Layout";

export default function LandingPage() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center text-center py-20 px-4 space-y-8">
        {/* Hero Section */}
        <h1 className="text-5xl font-extrabold text-black">SecureFileStore</h1>
        <p className="text-lg text-gray-700 max-w-2xl">
          SecureFileStore is a lightweight, end-to-end encrypted file storage
          solution. Files are encrypted client-side with AES-256-CBC,
          transferred securely over SSH/SFTP, and stored in a containerized
          environment.
        </p>

        {/* Features List */}
        <ul className="text-left list-disc list-inside text-gray-700 max-w-xl space-y-2">
          <li>🔐 AES-256-CBC encryption per file with unique IVs</li>
          <li>🛡️ User authentication via JWT & bcrypt</li>
          <li>🚀 Secure file transfer over SSH/SFTP</li>
          <li>🐳 Fully containerized with Docker & Kubernetes ready</li>
        </ul>

        {/* Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/login"
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
          >
            Register
          </Link>
        </div>
      </div>
    </Layout>
  );
}
