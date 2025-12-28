#!/bin/bash

# Update template bare repos with assets from working copies

set -e

MOBIGEN_ROOT="/home/ubuntu/base99/mobigen"
TEMPLATES_DIR="$MOBIGEN_ROOT/templates"
BARE_REPOS_DIR="$MOBIGEN_ROOT/templates-bare"
TEMP_DIR="/tmp/template-update-$$"

echo "Updating template bare repos with assets..."

for template in base ecommerce loyalty news ai-assistant; do
  echo "Processing template: $template"

  BARE_REPO="$BARE_REPOS_DIR/$template.git"
  WORKING_COPY="$TEMPLATES_DIR/$template"
  TEMP_CHECKOUT="$TEMP_DIR/$template"

  if [ ! -d "$BARE_REPO" ]; then
    echo "  Bare repo not found: $BARE_REPO"
    continue
  fi

  if [ ! -d "$WORKING_COPY/assets" ]; then
    echo "  No assets directory in working copy: $WORKING_COPY"
    continue
  fi

  # Clone the bare repo to a temp directory
  echo "  Cloning bare repo to temp directory..."
  git clone "$BARE_REPO" "$TEMP_CHECKOUT"

  # Copy assets from working copy to temp checkout
  echo "  Copying assets..."
  cp -r "$WORKING_COPY/assets" "$TEMP_CHECKOUT/"

  # Configure git and commit
  cd "$TEMP_CHECKOUT"
  git config user.email "mobigen@generated.local"
  git config user.name "Mobigen Generator"

  git add assets/

  if git diff --cached --quiet; then
    echo "  No changes to commit for $template"
  else
    git commit -m "Add placeholder assets (icon, splash, adaptive-icon, favicon)"
    git push origin master
    echo "  Assets committed and pushed for $template"
  fi

  cd "$MOBIGEN_ROOT"
done

# Cleanup
echo "Cleaning up temp directory..."
rm -rf "$TEMP_DIR"

echo "Done! All templates updated with assets."
