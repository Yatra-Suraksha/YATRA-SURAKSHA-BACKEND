# 🔒 Security Guidelines for Hyperledger Fabric

## 🚨 **CRITICAL: Files to NEVER Commit to Git**

### **Absolutely Forbidden:**
```
❌ fabric-network/crypto-config/           # Private keys and certificates
❌ fabric-network/wallet/                  # User identities and credentials  
❌ fabric-network/connection-profiles/connection-profile.json  # Contains real certificates
❌ .env                                    # API keys and secrets
❌ config/*.json (service accounts)       # Firebase credentials
```

### **Safe to Commit:**
```
✅ fabric-network/connection-profiles/connection-profile.template.json  # Template with placeholders
✅ fabric-network/scripts/*.sh            # Setup scripts
✅ fabric-network/chaincodes/*.js         # Smart contracts (public logic)
✅ README.md, HYPERLEDGER-SETUP.md       # Documentation
```

## 🛡️ **Security Best Practices**

### **Development Environment:**
1. **Use .gitignore** - All sensitive files are excluded
2. **Template-based configs** - Real certificates generated locally
3. **Environment variables** - Secrets stored in .env (not committed)
4. **Mock identities** - Development uses non-production credentials

### **Production Environment:**
1. **Hardware Security Modules (HSM)** - Store private keys securely
2. **Certificate Authority (CA)** - Use enterprise-grade CA
3. **TLS Encryption** - Enable for all network communications
4. **Access Control** - Implement proper user management
5. **Network Isolation** - Use private networks and firewalls

### **Certificate Management:**
1. **Rotation Policy** - Regular certificate renewal
2. **Backup Strategy** - Secure backup of certificates
3. **Monitoring** - Certificate expiry alerts
4. **Revocation** - Process for compromised certificates

## 🔐 **What's Protected:**

### **Private Keys (`crypto-config/`):**
- Organization signing keys
- User enrollment certificates  
- TLS certificates
- **Exposure Risk**: Complete network compromise

### **User Wallets (`wallet/`):**
- Application user identities
- Private keys for transaction signing
- **Exposure Risk**: Unauthorized transactions

### **Connection Profile (`connection-profile.json`):**
- Contains embedded CA certificates
- Network topology and endpoints
- **Exposure Risk**: Network reconnaissance

## 🚀 **Safe Development Workflow:**

### **Initial Setup:**
```bash
# 1. Clone repository (no secrets included)
git clone https://github.com/Yatra-Suraksha/YATRA-SURAKSHA-BACKEND.git

# 2. Setup environment (creates local secrets)
npm run fabric:setup
npm run fabric:crypto

# 3. Start development (uses local certificates)
npm run fabric:start
npm run dev
```

### **Working with Team:**
```bash
# Safe to commit (public code only)
git add src/ fabric-network/chaincodes/ *.md
git commit -m "Add new features"
git push

# Never commit (will be ignored by .gitignore)
# - crypto-config/
# - wallet/  
# - connection-profile.json
# - .env
```

### **Sharing Network Config:**
```bash
# ✅ Share template (safe)
git add fabric-network/connection-profiles/connection-profile.template.json

# ❌ Never share real config (contains certificates)
# connection-profile.json
```

## 🔧 **Emergency Response:**

### **If Secrets Are Accidentally Committed:**
```bash
# 1. Remove from repository history
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch fabric-network/crypto-config/*' \
  --prune-empty --tag-name-filter cat -- --all

# 2. Force push (if safe to do so)
git push origin --force --all

# 3. Regenerate ALL certificates
npm run fabric:clean
npm run fabric:setup
npm run fabric:crypto

# 4. Notify team to re-clone repository
```

### **Certificate Compromise:**
1. **Immediately revoke** compromised certificates
2. **Generate new crypto materials**
3. **Update all network participants**
4. **Audit transaction history**

## 📊 **Monitoring Checklist:**

- [ ] No private keys in git history
- [ ] .gitignore properly configured
- [ ] Environment variables not hardcoded
- [ ] TLS enabled for production
- [ ] Certificate expiry monitoring
- [ ] Access logs reviewed regularly
- [ ] Network security audited

## 🎯 **Quick Security Check:**

```bash
# Check what will be committed
git status
git diff --cached

# Verify no secrets in history
git log --oneline --grep="crypto-config\|wallet\|connection-profile.json"

# Check .gitignore effectiveness
git check-ignore fabric-network/crypto-config/
git check-ignore fabric-network/wallet/
git check-ignore .env
```

---

**🛡️ Remember: Security is not optional. Protect your network, protect your users, protect your data.**