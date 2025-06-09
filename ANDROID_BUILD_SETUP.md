# Android Build Setup Guide

This guide will help you set up automated Android builds for your Expo/React Native project using GitHub Actions.

## Prerequisites

1. **Expo Account**: You need an Expo account and project
2. **EAS CLI**: Make sure you have EAS CLI installed globally
3. **GitHub Repository**: Your code should be in a GitHub repository

## Setup Steps

### 1. Configure Expo Project

First, you need to set up your EAS project ID:

```bash
# Install EAS CLI if you haven't already
npm install -g eas-cli

# Login to your Expo account
eas login

# Initialize EAS in your project (if not done already)
eas build:configure

# This will update your app.json with the correct project ID
```

### 2. GitHub Secrets Setup

Add the following secrets to your GitHub repository:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add the following repository secrets:

#### Required Secrets:

- **`EXPO_TOKEN`**: Your Expo access token
  - Get it from: https://expo.dev/accounts/[account]/settings/access-tokens
  - Create a new token with appropriate permissions

#### Optional Secrets (for production builds):

- **`ANDROID_KEYSTORE`**: Base64 encoded Android keystore file
- **`ANDROID_KEYSTORE_PASSWORD`**: Keystore password
- **`ANDROID_KEY_ALIAS`**: Key alias
- **`ANDROID_KEY_PASSWORD`**: Key password

### 3. Update App Configuration

Make sure your `app.json` has the correct EAS project ID:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-actual-project-id-here"
      }
    }
  }
}
```

## Available Workflows

### 1. EAS Build (Recommended)
- **File**: `.github/workflows/build-android.yml`
- **Triggers**: Push to main/master/develop, PRs, manual trigger
- **Features**:
  - Automatic profile selection based on branch
  - APK download and artifact upload
  - GitHub releases for main/master branch
  - Build status notifications

### 2. Local Build
- **File**: `.github/workflows/build-android-local.yml`
- **Triggers**: Manual trigger only
- **Features**:
  - Builds APK locally without EAS
  - Faster for development builds
  - No Expo account required for building

## Build Profiles

### Development
- **Purpose**: Development builds with dev client
- **Output**: APK for internal testing
- **Trigger**: Manual or develop branch

### Preview
- **Purpose**: Preview builds for testing
- **Output**: APK for internal distribution
- **Trigger**: Feature branches, PRs

### Production
- **Purpose**: Production-ready builds
- **Output**: AAB for Play Store
- **Trigger**: Main/master branch

## Usage

### Automatic Builds
Builds are triggered automatically on:
- Push to `main`, `master`, or `develop` branches
- Pull requests to `main` or `master`

### Manual Builds
1. Go to your repository's **Actions** tab
2. Select **Build Android App** workflow
3. Click **Run workflow**
4. Choose your build type and trigger

### Downloading Built APKs

#### From GitHub Actions:
1. Go to **Actions** tab
2. Click on the completed workflow run
3. Download the APK from **Artifacts** section

#### From GitHub Releases:
- Releases are automatically created for main/master branch builds
- Find them in the **Releases** section of your repository

## Troubleshooting

### Common Issues:

1. **"EXPO_TOKEN not found"**
   - Make sure you've added the `EXPO_TOKEN` secret
   - Verify the token has correct permissions

2. **"Project not found"**
   - Update your `app.json` with the correct EAS project ID
   - Run `eas build:configure` to set it up

3. **Build fails with Gradle errors**
   - Check your Android configuration in `app.json`
   - Ensure all required permissions are listed

4. **APK not downloading**
   - Check if the build completed successfully on EAS
   - Verify the build URL is accessible

### Getting Help:

- Check the [Expo EAS documentation](https://docs.expo.dev/build/introduction/)
- Review GitHub Actions logs for detailed error messages
- Ensure your project builds locally before setting up CI/CD

## Build Optimization

To improve build times and reliability:

1. **Use caching**: The workflows already include Node.js caching
2. **Minimize dependencies**: Only include necessary packages
3. **Use appropriate build profiles**: Don't use production profile for testing
4. **Monitor build quotas**: EAS has monthly build limits

## Security Notes

- Never commit sensitive information (keystores, passwords) to your repository
- Use GitHub Secrets for all sensitive data
- Regularly rotate your Expo access tokens
- Use different keystores for development and production builds
