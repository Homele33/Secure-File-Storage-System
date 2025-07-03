# Use Ubuntu as base image
FROM ubuntu:22.04

# Avoid prompts from apt
ENV DEBIAN_FRONTEND=noninteractive

# Install OpenSSH server and other utilities
RUN apt-get update && \
    apt-get install -y \
        openssh-server \
        sudo \
        curl \
        wget \
        nano \
        vim \
        && rm -rf /var/lib/apt/lists/*

# Create the SSH directory
RUN mkdir /var/run/sshd

# Create a user for SSH access
RUN useradd -rm -d /home/sftpuser -s /bin/bash -g root -G sudo -u 1001 sftpuser

# Set password for the user (change 'password' to your preferred password)
RUN echo 'sftpuser:password' | chpasswd

# Configure SSH
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config
RUN sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config
RUN sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config

# Create directories for file transfers
RUN mkdir -p /home/sftpuser/uploads /home/sftpuser/downloads
RUN chown -R sftpuser:root /home/sftpuser

# Expose SSH port
EXPOSE 22

# Start SSH daemon
CMD ["/usr/sbin/sshd", "-D"]