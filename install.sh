#!/bin/sh
set -e

# VidJutsu CLI Installer
# Usage: curl -fsSL https://vidjutsu.ai/install.sh | bash

REPO="tfcbot/vidjutsu-sdk"
BINARY_NAME="vidjutsu"
INSTALL_DIR="$HOME/.local/bin"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

info() { printf "${CYAN}>${RESET} %s\n" "$1"; }
success() { printf "${GREEN}✓${RESET} %s\n" "$1"; }
warn() { printf "${YELLOW}!${RESET} %s\n" "$1"; }
error() { printf "${RED}✗${RESET} %s\n" "$1" >&2; exit 1; }

# --- Detect OS and Architecture ---

detect_platform() {
  OS=$(uname -s | tr '[:upper:]' '[:lower:]')
  ARCH=$(uname -m)

  case "$OS" in
    darwin) OS="darwin" ;;
    linux)  OS="linux" ;;
    *)      error "Unsupported operating system: $OS" ;;
  esac

  case "$ARCH" in
    x86_64|amd64)  ARCH="x64" ;;
    aarch64|arm64) ARCH="arm64" ;;
    *)             error "Unsupported architecture: $ARCH" ;;
  esac

  PLATFORM="${OS}-${ARCH}"
  info "Detected platform: ${BOLD}${PLATFORM}${RESET}"
}

# --- Prerequisites ---

ensure_node() {
  if command -v node >/dev/null 2>&1; then
    success "Node.js $(node --version) found"
    return
  fi

  error "Node.js is required. Install it from https://nodejs.org"
}

ensure_bun() {
  if command -v bun >/dev/null 2>&1; then
    success "Bun $(bun --version) found"
    return
  fi

  info "Installing Bun..."
  curl -fsSL https://bun.sh/install | bash
  export BUN_INSTALL="$HOME/.bun"
  export PATH="$BUN_INSTALL/bin:$PATH"
  success "Bun installed: $(bun --version)"
}

ensure_typescript() {
  if command -v tsc >/dev/null 2>&1; then
    success "TypeScript $(tsc --version) found"
    return
  fi

  info "Installing TypeScript globally..."
  if command -v bun >/dev/null 2>&1; then
    bun add -g typescript
  elif command -v npm >/dev/null 2>&1; then
    npm install -g typescript
  fi
  success "TypeScript installed"
}

# --- Version Detection ---

get_version() {
  if [ -n "$VERSION" ]; then
    info "Using specified version: v${VERSION}"
    return
  fi

  info "Fetching latest release..."

  RELEASE_RESPONSE=$(curl -sL -w "\n%{http_code}" \
    "https://api.github.com/repos/${REPO}/releases/latest")

  HTTP_CODE=$(echo "$RELEASE_RESPONSE" | tail -1)
  RELEASE_BODY=$(echo "$RELEASE_RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" != "200" ]; then
    error "Could not fetch latest release (HTTP ${HTTP_CODE}). Check that a release exists at https://github.com/${REPO}/releases or set VERSION env var manually."
  fi

  VERSION=$(echo "$RELEASE_BODY" | grep '"tag_name"' | sed -E 's/.*"v?([^"]+)".*/\1/')

  if [ -z "$VERSION" ]; then
    error "Could not parse version from release response. Set VERSION env var manually."
  fi

  info "Latest version: ${BOLD}v${VERSION}${RESET}"
}

# --- Download and Install ---

install_binary() {
  DOWNLOAD_URL="https://github.com/${REPO}/releases/download/v${VERSION}/${BINARY_NAME}-${PLATFORM}"
  TMPFILE=$(mktemp)

  info "Downloading ${BINARY_NAME} v${VERSION} for ${PLATFORM}..."
  curl -fsSL "$DOWNLOAD_URL" -o "$TMPFILE" || error "Download failed. Check that v${VERSION} exists at ${DOWNLOAD_URL}"

  # Verify checksum if available
  CHECKSUM_URL="https://github.com/${REPO}/releases/download/v${VERSION}/checksums.txt"
  if curl -fsSL "$CHECKSUM_URL" -o /tmp/vidjutsu-checksums.txt 2>/dev/null; then
    EXPECTED=$(grep "${BINARY_NAME}-${PLATFORM}" /tmp/vidjutsu-checksums.txt | awk '{print $1}')
    if [ -n "$EXPECTED" ]; then
      if command -v sha256sum >/dev/null 2>&1; then
        ACTUAL=$(sha256sum "$TMPFILE" | awk '{print $1}')
      else
        ACTUAL=$(shasum -a 256 "$TMPFILE" | awk '{print $1}')
      fi
      if [ "$ACTUAL" != "$EXPECTED" ]; then
        rm -f "$TMPFILE" /tmp/vidjutsu-checksums.txt
        error "Checksum verification failed. The binary may have been tampered with."
      fi
      success "Checksum verified"
    fi
    rm -f /tmp/vidjutsu-checksums.txt
  fi

  chmod +x "$TMPFILE"

  mkdir -p "$INSTALL_DIR"
  mv "$TMPFILE" "${INSTALL_DIR}/${BINARY_NAME}"
  success "Installed to ${INSTALL_DIR}/${BINARY_NAME}"

  # Auto-add to PATH if needed
  case ":$PATH:" in
    *":${INSTALL_DIR}:"*) ;;
    *)
      export PATH="${INSTALL_DIR}:$PATH"
      SHELL_RC=""
      if [ -n "$ZSH_VERSION" ] || [ "$(basename "$SHELL")" = "zsh" ]; then
        SHELL_RC="$HOME/.zshrc"
      else
        SHELL_RC="$HOME/.bashrc"
      fi
      if [ -n "$SHELL_RC" ] && ! grep -q '.local/bin' "$SHELL_RC" 2>/dev/null; then
        printf '\nexport PATH="$HOME/.local/bin:$PATH"\n' >> "$SHELL_RC"
        success "Added $INSTALL_DIR to PATH in $SHELL_RC"
      fi
      ;;
  esac
}

# --- Verify ---

verify() {
  if command -v "$BINARY_NAME" >/dev/null 2>&1; then
    success "Verification passed"
  else
    warn "Binary installed but not found in PATH. You may need to restart your shell."
  fi
}

# --- Main ---

main() {
  printf "\n${BOLD}  VidJutsu CLI Installer${RESET}\n\n"

  detect_platform
  ensure_node
  ensure_bun
  ensure_typescript
  get_version
  install_binary
  verify

  printf "\n${GREEN}${BOLD}  ✓ VidJutsu CLI v${VERSION} installed successfully${RESET}\n"
  printf "\n  Get started:\n"
  printf "    ${CYAN}vidjutsu auth${RESET}       — authenticate your account\n"
  printf "    ${CYAN}vidjutsu generate${RESET}   — generate AI video\n"
  printf "    ${CYAN}vidjutsu --help${RESET}     — see all commands\n\n"
}

main
