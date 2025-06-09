import React, { useRef } from 'react';
import { StyleSheet } from 'react-native';
import { HistoryList } from '@/components/HistoryList';

export default function HistoryScreen() {
  // Import or define the correct type for the ref
  // Assuming HistoryList is a class component or uses forwardRef with loadHistoryFiles exposed
  type HistoryListRef = {
    loadHistoryFiles: () => void;
  };

  const historyListRef = useRef<HistoryListRef>(null);

  // Function to trigger the refresh in the child component
  const handleRefresh = () => {
    historyListRef.current?.loadHistoryFiles();
  };

  return <HistoryList ref={historyListRef} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});