# Coletor - Barcode Scanner App

A React Native app built with Expo that allows you to scan barcodes and create inventory files in the format `barcode,quantity`.

## Features

- 📱 **Barcode Scanning**: Use your device's camera to scan barcodes
- 📊 **Quantity Management**: Set quantities for each barcode
- 💾 **File Export**: Export scanned data as .txt files
- 📋 **Item Management**: View, edit, and delete scanned items
- 📈 **Statistics**: View total items and quantities
- 🗂️ **History**: View and manage exported files
- 🎨 **Material Design**: Clean, modern UI using React Native Paper

## Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Install Additional Required Packages**
   ```bash
   npx expo install expo-camera expo-barcode-scanner expo-file-system expo-sharing expo-document-picker
   npm install react-native-paper react-native-vector-icons
   ```

3. **Start the Development Server**
   ```bash
   npm start
   ```

## Usage

### Scanning Barcodes
1. Open the app and tap the "Scan" button
2. Point your camera at a barcode
3. When the barcode is detected, enter the quantity
4. Tap "Add" to save the item

### Managing Items
- **View Items**: All scanned items appear in the main list
- **Update Quantity**: Scan the same barcode again to add to existing quantity
- **Delete Items**: Tap the delete icon next to any item
- **Clear All**: Use the sweep icon in the top bar to clear all items

### Exporting Data
1. Tap the export icon in the top bar
2. Choose where to save or share the file
3. The file will be in the format: `barcode,quantity`

### Viewing History
- Switch to the "History" tab to see all exported files
- View file details like creation date and size
- Delete old files to free up space

## File Format

The exported files use a simple CSV format:
```
123456789012,5
987654321098,3
111222333444,1
```

Each line contains:
- Barcode (as scanned)
- Quantity (as entered)

## Permissions

The app requires the following permissions:
- **Camera**: To scan barcodes
- **Storage**: To save and export files

## Troubleshooting

### Camera Not Working
- Ensure camera permissions are granted
- Try restarting the app
- Check if other apps can access the camera

### Export Not Working
- Ensure storage permissions are granted
- Check available storage space
- Try using a different sharing method

### Barcode Not Scanning
- Ensure good lighting conditions
- Hold the device steady
- Make sure the barcode is clear and not damaged

## Development

### Project Structure
```
coletor/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Main scanner screen
│   │   ├── explore.tsx        # History screen
│   │   └── _layout.tsx        # Tab navigation
│   └── _layout.tsx            # Root layout
├── components/
│   └── BarcodeScanner.tsx     # Main scanner component
├── assets/                    # Images and fonts
└── constants/                 # App constants
```

### Key Components
- **BarcodeScanner**: Main scanning functionality
- **History Screen**: File management
- **Material UI**: React Native Paper components

### Build Commands
```bash
# Development
npm start

# Build for Android
npx expo build:android

# Build for iOS
npx expo build:ios
```

## Technical Details

### Dependencies Added
- `expo-camera`: Camera access and barcode scanning
- `expo-barcode-scanner`: Barcode detection
- `expo-file-system`: File operations
- `expo-sharing`: File sharing functionality
- `react-native-paper`: Material Design components
- `react-native-vector-icons`: Icon library

### Permissions Configuration
The app requires camera and storage permissions, which are configured in `app.json`:

```json
{
  "android": {
    "permissions": [
      "CAMERA",
      "WRITE_EXTERNAL_STORAGE",
      "READ_EXTERNAL_STORAGE"
    ]
  },
  "ios": {
    "infoPlist": {
      "NSCameraUsageDescription": "This app uses camera to scan barcodes for inventory management."
    }
  }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues and questions, please create an issue in the repository or contact the development team.