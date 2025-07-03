<h1 align="center">🔐 Secure File Storage System</h1>
<p align="center">
  A full-stack, secure file storage platform built with <b>Next.js</b>, <b>MongoDB</b>, <b>SFTP</b>, <b>JWT Auth</b>, and <b>SSH Containerization</b>.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/next.js-13-blue?logo=next.js" />
  <img src="https://img.shields.io/badge/docker-compose-blue?logo=docker" />
  <img src="https://img.shields.io/badge/mongodb-atlas-green?logo=mongodb" />
  <img src="https://img.shields.io/badge/sftp-secure%20transfer-red?logo=linux" />
</p>

---

## 🚀 Features

<ul>
  <li>🔐 Secure user authentication using <b>JWT</b> and password hashing (bcrypt)</li>
  <li>📦 File encryption and decryption during upload/download</li>
  <li>📂 File management via <b>SFTP over SSH</b> inside Docker container</li>
  <li>🧠 Intelligent auth context with auto-login via localStorage</li>
  <li>📁 MongoDB-based file metadata storage with ownership checks</li>
  <li>📜 Clean API routes with <code>/api/auth</code> and <code>/api/file</code> endpoints</li>
</ul>

---

## 📁 Folder Structure

```txt
├── app/                    # Next.js App Router pages
│   └── api/               # API route handlers
│       └── auth/          # Login route
│       └── file/          # Upload/download/delete
├── context/AuthContext.tsx  # Authentication context
├── lib/                   # Shared logic
│   └── db.ts              # MongoDB connector
│   └── sftp.ts            # SSH SFTP logic
│   └── crypto.ts          # AES encryption/decryption
├── models/                # Mongoose models
├── ssh-server/            # SSH-enabled container Dockerfile
├── Dockerfile             # App Dockerfile
├── docker-compose.yml     # Multi-service orchestration
└── .env.docker            # Environment config
```
