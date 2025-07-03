import SftpClient from "ssh2-sftp-client";

interface SftpConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: Buffer | string;
  timeout: number;
}

// Get SFTP configuration from environment variables
const getSftpConfig = (): SftpConfig => {
  return {
    host: process.env.SFTP_HOST || "localhost",
    port: parseInt(process.env.SFTP_PORT || "2222"),
    username: process.env.SFTP_USERNAME || "sftpuser",
    password: process.env.SFTP_PASSWORD || "password",
    // Optionally use SSH key instead of password
    // privateKey: process.env.SFTP_PRIVATE_KEY ? Buffer.from(process.env.SFTP_PRIVATE_KEY, 'base64') : undefined,
    timeout: 30000, // 30 seconds timeout
  };
};

/**
 * Upload a buffer directly to the SFTP container (preferred method)
 * @param buffer - Buffer containing the file data
 * @param remotePath - Destination path in the container
 * @returns Promise that resolves when upload is complete
 */
export async function uploadBufferToContainer(
  buffer: Buffer,
  remotePath: string
): Promise<void> {
  const sftp = new SftpClient();
  const config = getSftpConfig();

  try {
    console.log(`Connecting to SFTP server at ${config.host}:${config.port}`);
    await sftp.connect(config);

    console.log(
      `Uploading buffer directly to container: ${remotePath} (${buffer.length} bytes)`
    );

    // Ensure the remote directory exists
    const remoteDir = remotePath.substring(0, remotePath.lastIndexOf("/"));
    try {
      await sftp.mkdir(remoteDir, true); // recursive mkdir
    } catch (error) {
      // Directory might already exist, that's okay
      console.log(
        `Directory ${remoteDir} already exists or creation failed:`,
        error
      );
    }

    // Upload the buffer directly
    await sftp.put(buffer, remotePath);
    console.log(`Buffer successfully uploaded to container: ${remotePath}`);
  } catch (error) {
    console.error("SFTP buffer upload failed:", error);
    throw new Error(
      `Failed to upload buffer to container: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  } finally {
    // Always close the connection
    try {
      await sftp.end();
      console.log("SFTP connection closed");
    } catch (closeError) {
      console.error("Error closing SFTP connection:", closeError);
    }
  }
}

/**
 * Transfer a file from local storage to the SFTP container (legacy method)
 * @param localPath - Full path to the local file
 * @param remotePath - Destination path in the container
 * @returns Promise that resolves when transfer is complete
 */
export async function transferFileToContainer(
  localPath: string,
  remotePath: string
): Promise<void> {
  const sftp = new SftpClient();
  const config = getSftpConfig();

  try {
    console.log(`Connecting to SFTP server at ${config.host}:${config.port}`);
    await sftp.connect(config);

    console.log(`Transferring file: ${localPath} -> ${remotePath}`);

    // Ensure the remote directory exists
    const remoteDir = remotePath.substring(0, remotePath.lastIndexOf("/"));
    try {
      await sftp.mkdir(remoteDir, true); // recursive mkdir
    } catch (error) {
      // Directory might already exist, that's okay
      console.log(
        `Directory ${remoteDir} already exists or creation failed:`,
        error
      );
    }

    // Upload the file
    await sftp.put(localPath, remotePath);
    console.log(`File successfully transferred to container: ${remotePath}`);
  } catch (error) {
    console.error("SFTP transfer failed:", error);
    throw new Error(
      `Failed to transfer file to container: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  } finally {
    // Always close the connection
    try {
      await sftp.end();
      console.log("SFTP connection closed");
    } catch (closeError) {
      console.error("Error closing SFTP connection:", closeError);
    }
  }
}

/**
 * Download a file from the container to local storage
 * @param remotePath - Path to file in the container
 * @param localPath - Destination path on local filesystem
 * @returns Promise that resolves when download is complete
 */
export async function downloadFileFromContainer(
  remotePath: string,
  localPath: string
): Promise<void> {
  const sftp = new SftpClient();
  const config = getSftpConfig();

  try {
    console.log(`Connecting to SFTP server for download`);
    await sftp.connect(config);

    console.log(`Downloading file: ${remotePath} -> ${localPath}`);
    await sftp.get(remotePath, localPath);
    console.log(`File successfully downloaded from container`);
  } catch (error) {
    console.error("SFTP download failed:", error);
    throw new Error(
      `Failed to download file from container: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  } finally {
    try {
      await sftp.end();
    } catch (closeError) {
      console.error("Error closing SFTP connection:", closeError);
    }
  }
}

/**
 * Delete a file from the container
 * @param remotePath - Path to file in the container
 * @returns Promise that resolves when deletion is complete
 */
export async function deleteFileFromContainer(
  remotePath: string
): Promise<void> {
  const sftp = new SftpClient();
  const config = getSftpConfig();

  try {
    console.log(`Connecting to SFTP server for deletion`);
    await sftp.connect(config);

    console.log(`Deleting file: ${remotePath}`);
    await sftp.delete(remotePath);
    console.log(`File successfully deleted from container`);
  } catch (error) {
    console.error("SFTP deletion failed:", error);
    throw new Error(
      `Failed to delete file from container: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  } finally {
    try {
      await sftp.end();
    } catch (closeError) {
      console.error("Error closing SFTP connection:", closeError);
    }
  }
}

/**
 * List files in a directory on the container
 * @param remotePath - Directory path in the container
 * @returns Promise that resolves to array of file information
 */
export async function listContainerFiles(remotePath: string): Promise<any[]> {
  const sftp = new SftpClient();
  const config = getSftpConfig();

  try {
    console.log(`Connecting to SFTP server for listing`);
    await sftp.connect(config);

    console.log(`Listing files in: ${remotePath}`);
    const files = await sftp.list(remotePath);
    console.log(`Found ${files.length} files`);

    return files;
  } catch (error) {
    console.error("SFTP listing failed:", error);
    throw new Error(
      `Failed to list files in container: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  } finally {
    try {
      await sftp.end();
    } catch (closeError) {
      console.error("Error closing SFTP connection:", closeError);
    }
  }
}
