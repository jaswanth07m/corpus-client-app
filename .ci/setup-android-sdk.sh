#!/bin/sh
# Source this script — do NOT run it as a subprocess.
# Usage: . .ci/setup-android-sdk.sh
#
# Requires env vars: CI_PROJECT_DIR, ANDROID_SDK_TOOLS,
#                    ANDROID_COMPILE_SDK, ANDROID_BUILD_TOOLS
#
# The SDK is installed into .android-sdk/ inside the project directory so
# GitLab CI can cache it between runs using a version-keyed cache entry.

export ANDROID_SDK_ROOT="$CI_PROJECT_DIR/.android-sdk"
export PATH="$PATH:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/build-tools/$ANDROID_BUILD_TOOLS"

if [ ! -d "$ANDROID_SDK_ROOT/cmdline-tools/latest" ]; then
  echo "Downloading Android SDK cmdline-tools (one-time, will be cached)..."
  mkdir -p "$ANDROID_SDK_ROOT/cmdline-tools"
  curl -q -o /tmp/cmdline-tools.zip \
    "https://dl.google.com/android/repository/commandlinetools-linux-${ANDROID_SDK_TOOLS}_latest.zip"
  unzip -q /tmp/cmdline-tools.zip -d /tmp/
  mv /tmp/cmdline-tools "$ANDROID_SDK_ROOT/cmdline-tools/latest"
  rm /tmp/cmdline-tools.zip
fi

if [ ! -d "$ANDROID_SDK_ROOT/platforms/android-${ANDROID_COMPILE_SDK}" ]; then
  echo "Installing SDK platform + build tools (one-time, will be cached)..."
  yes | sdkmanager --licenses >/dev/null 2>&1 || true
  sdkmanager \
    "platforms;android-${ANDROID_COMPILE_SDK}" \
    "build-tools;${ANDROID_BUILD_TOOLS}" \
    >/dev/null 2>&1
fi
