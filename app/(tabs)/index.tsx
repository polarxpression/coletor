import React from 'react';
import { StyleSheet } from 'react-native';
import BarcodeScanner from '@/components/BarcodeScanner';

export default function HomeScreen() {
  return <BarcodeScanner />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});