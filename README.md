[<h1 align="center">🔐 Secure File Storage System</h1>
<p align="center">
  A full-stack, encrypted file storage platform using <b>Next.js</b>, <b>MongoDB</b>, <b>JWT Auth</b>, and <b>SFTP over SSH</b> in Docker.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/next.js-13-blue?logo=next.js" />
  <img src="https://img.shields.io/badge/docker-compose-blue?logo=docker" />
  <img src="https://img.shields.io/badge/mongodb-database-green?logo=mongodb" />
  <img src="https://img.shields.io/badge/ssh2-sftp-client-secure%20transfer-red?logo=linux" />
</p>

---

## 📌 Tech Stack

- ⚙️ Next.js App Router
- 🧱 MongoDB (via Mongoose)
- 🔐 JWT authentication
- 🔁 `ssh2-sftp-client` to manage file transfers via SFTP
- 🔑 AES-256 encryption per file
- 🐳 Docker Compose for local orchestration

---

## ✅ Features

<ul>
  <li>🔒 Secure login & token-based auth</li>
  <li>📤 Encrypted file uploads over SSH/SFTP</li>
  <li>📥 Authenticated, decrypted file downloads</li>
  <li>🧠 Auto-login via localStorage & AuthContext</li>
  <li>📁 Metadata stored securely in MongoDB</li>
</ul>

---

## 📦 Prerequisites

You must have installed:

- 🐳 **[Docker](https://www.docker.com/)** and **Docker Compose**
- 🟩 **[Node.js 18+](https://nodejs.org/)**
- 🧩 (Optional) A terminal with `ssh` support (e.g., WSL, Linux, Git Bash)

---

## 🚀 Getting Started (Docker-Based Setup)

### 1. Clone the Project

```bash
git clone https://github.com/your-username/secure-file-storage.git
cd secure-file-storage
](https://gitingest.com/)
