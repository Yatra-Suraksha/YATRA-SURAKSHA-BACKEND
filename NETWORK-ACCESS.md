# 🌐 Network Access Guide

## Server Configuration

The Yatra Suraksha backend server is now configured to bind to all network interfaces, allowing both local and external access.

### Default Configuration
```bash
HOST=0.0.0.0  # Binds to all network interfaces
PORT=3000     # Default port
```

### Access Points

**Local Development:**
- http://localhost:3000
- http://127.0.0.1:3000

**Network Access:**
- http://192.168.0.245:3000 (your current IP)
- http://[your-machine-ip]:3000

**API Documentation:**
- http://localhost:3000/api-docs
- http://192.168.0.245:3000/api-docs

### Security Considerations

**Development Environment:**
- ✅ Binding to 0.0.0.0 allows testing from other devices
- ✅ Useful for mobile app development and team collaboration

**Production Environment:**
- ⚠️  Consider using a reverse proxy (nginx/Apache)
- ⚠️  Implement proper authentication and rate limiting
- ⚠️  Use HTTPS with SSL certificates
- ⚠️  Configure firewall rules appropriately

### Firewall Configuration

If you need to allow external access, ensure port 3000 is open:

```bash
# Ubuntu/Debian with ufw
sudo ufw allow 3000

# CentOS/RHEL with firewalld
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

### Testing Network Access

**From same network:**
```bash
# Test from another device on the same network
curl http://192.168.0.245:3000/health

# Or open in browser
http://192.168.0.245:3000/api-docs
```

**Mobile Testing:**
- Connect your mobile device to the same WiFi network
- Open browser and navigate to: http://192.168.0.245:3000

### Configuration Options

**Bind to localhost only (more secure for development):**
```bash
HOST=localhost
PORT=3000
```

**Custom port:**
```bash
HOST=0.0.0.0
PORT=8080
```

**Production with specific interface:**
```bash
HOST=192.168.0.245  # Bind to specific interface
PORT=3000
```

### Troubleshooting

**Cannot access from other devices:**
1. Check if firewall is blocking the port
2. Verify the server is binding to 0.0.0.0 (not localhost)
3. Ensure devices are on the same network
4. Check router/network configuration

**Security warnings:**
- This configuration is intended for development
- For production, use proper security measures and reverse proxy