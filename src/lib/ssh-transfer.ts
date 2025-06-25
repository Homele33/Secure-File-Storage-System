import { Client } from 'ssh2';
import fs from 'fs/promises';
import path from 'path';

export class SSHTransferService {
  private conn: Client;
  private connected: boolean = false;

  constructor() {
    this.conn = new Client();
  }

  async connect(): Promise<void> {
    if (this.connected) return;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('SSH connection timeout'));
      }, 30000);

      this.conn.connect({
        host: process.env.SSH_HOST!,
        username: process.env.SSH_USERNAME!,
        privateKey: require('fs').readFileSync(process.env.SSH_PRIVATE_KEY_PATH!),
        readyTimeout: 30000,
        keepaliveInterval: 10000,
      });

      this.conn.on('ready', () => {
        clearTimeout(timeout);
        this.connected = true;
        resolve();
      });

      this.conn.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  async uploadFile(localPath: string, remotePath: string): Promise<void> {
    if (!this.connected) {
      throw new Error('SSH connection not established');
    }

    return new Promise((resolve, reject) => {
      this.conn.sftp((err, sftp) => {
        if (err) return reject(err);
        
        // Ensure remote directory exists
        const remoteDir = path.dirname(remotePath);
        sftp.mkdir(remoteDir, { mode: 0o755 }, (mkdirErr) => {
          // Ignore error if directory already exists
          
          sftp.fastPut(localPath, remotePath, (putErr) => {
            if (putErr) return reject(putErr);
            resolve();
          });
        });
      });
    });
  }

  async downloadFile(remotePath: string, localPath: string): Promise<void> {
    if (!this.connected) {
      throw new Error('SSH connection not established');
    }

    return new Promise((resolve, reject) => {
      this.conn.sftp((err, sftp) => {
        if (err) return reject(err);
        
        sftp.fastGet(remotePath, localPath, (getErr) => {
          if (getErr) return reject(getErr);
          resolve();
        });
      });
    });
  }

  async deleteFile(remotePath: string): Promise<void> {
    if (!this.connected) {
      throw new Error('SSH connection not established');
    }

    return new Promise((resolve, reject) => {
      this.conn.sftp((err, sftp) => {
        if (err) return reject(err);
        
        sftp.unlink(remotePath, (unlinkErr) => {
          if (unlinkErr) return reject(unlinkErr);
          resolve();
        });
      });
    });
  }

  disconnect(): void {
    if (this.connected) {
      this.conn.end();
      this.connected = false;
    }
  }
}