# Security Design Notes (Aspirational)

**Status:** Design / Future considerations
**Last Updated:** 2026-05-28

This document captures aspirational security improvements that were considered during the v1 design phase but are **not yet implemented**. They are preserved here for future development planning.

---

## Incident Response Plan

### Vulnerability Disclosure

```
Email: security@promptforge.dev
PGP Key: [available at promptforge.dev/security.asc]
Response SLA: 72 hours acknowledgment, 14 days for fix
```

### Incident Severity Levels

| Level | Example | Response |
|---|---|---|
| **Critical** | Remote code execution, API key leak | Immediate patch, user notification, forced update |
| **High** | Storage files accessible to other users | Patch within 7 days, advisory |
| **Medium** | CSP bypass, minor information disclosure | Patch within 30 days |
| **Low** | Dependency with low-severity advisory | Patch in next release cycle |

### Incident Response Steps

1. **Triage** — Confirm severity, affected users, attack vector
2. **Contain** — If cloud service: advise users to rotate keys. If local: advise users
3. **Fix** — Patch in main branch, create release
4. **Notify** — GitHub Security Advisory, release notes, forced update for critical
5. **Post-mortem** — Root cause analysis, security control improvements

---

## Build & Distribution Security (Future)

### Code Signing

| Platform | Requirement | Tool |
|---|---|---|
| macOS | Developer ID Application certificate | `electron-builder` with `notarize: true` |
| Windows | EV Code Signing certificate | `electron-builder` with `certificateFile` and `certificatePassword` |
| Linux | No signing required (AppImage) | GPG signature for release artifacts recommended |

### macOS Entitlements (Minimal)

```xml
<!-- build/entitlements.mac.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <!-- Required for microphone access -->
  <key>com.apple.security.device.audio-input</key>
  <true/>
  <!-- Required for safeStorage (keychain access) -->
  <key>com.apple.security.personal-information.photos-library</key>
  <false/>
  <key>com.apple.security.personal-information.location</key>
  <false/>
  <!-- REQUIRED: Hardened runtime exceptions -->
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
  <key>com.apple.security.cs.disable-library-validation</key>
  <true/>
</dict>
</plist>
```

### Auto-Update Integrity

Future implementation should use `electron-updater` with:

- GitHub release feed
- Signature verification of update manifest
- SHA256 verification of downloaded artifacts
- Prerelease and downgrade prevention

### Build Pipeline Security (Target)

```yaml
1. ✅ pnpm install --frozen-lockfile   # Reproducible dependency tree
2. ✅ pnpm audit --audit-level=high    # No known vulnerabilities
3. ✅ pnpm lint                        # Code quality
4. ✅ pnpm typecheck                   # Type safety
5. ✅ pnpm test                        # Test suite
6. ❌ Code signing                     # Not yet configured
7. ❌ Notarization                     # Not yet configured
8. ❌ SHA256 checksum of release       # Not yet implemented
```

### Release Artifact Verification (Future)

```bash
# macOS
shasum -a 256 Prompter-*.dmg
# Compare with published checksum

# Windows
certutil -hashfile Prompter-Setup-*.exe SHA256
# Compare with published checksum

# Linux
sha256sum Prompter-*.AppImage
# Compare with published checksum
```

---

## Nice-to-Have Improvements

- Certificate pinning for cloud API endpoints
- Binary transparency log
- Electron Fuses for runtime security
- Custom update server (instead of GitHub)
- ASLR and DEP hardening flags
- Seccomp filter on Linux
- AppArmor/SELinux policy
- SCA tooling (Socket.dev or Snyk) in CI
- Privacy notice on first launch
- Hardened session configuration with `onBeforeRequest` blocking non-localhost HTTP
- `ELECTRON_HTTPS_ONLY` environment variable enforcement
- `disable-http-cache`, `no-proxy-server`, `disable-ntp` CLI switches
- `will-navigate` and `setWindowOpenHandler` navigation blocking
- `form-action 'none'` CSP directive
- `mode: 0o600` file permissions on storage files
