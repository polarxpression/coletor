#!/bin/bash

echo "🚀 Setting up Coletor Barcode Scanner App..."

# Install base dependencies
echo "📦 Installing dependencies..."
npm install

# Install Expo packages
echo "📱 Installing Expo packages..."
npx expo install expo-camera expo-file-system expo-sharing expo-document-picker

# Install React Native Paper and Vector Icons
echo "🎨 Installing UI components..."
npm install react-native-paper react-native-vector-icons

echo "✅ Setup complete!"
echo ""
echo "To start the development server, run:"
echo "  npm start"
echo ""
echo "To run on specific platforms:"
echo "  npm run android  # For Android"
echo "  npm run ios      # For iOS"
echo "  npm run web      # For Web"