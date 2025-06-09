// components/HistoryList.tsx
import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Card, Button, Searchbar, Menu, Portal, Dialog, ActivityIndicator, Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

interface HistoryFile {
  name: string;
  uri: string;
  modificationTime: number;
  size: number;
  selected?: boolean;
}

interface HistoryListProps {}

const customTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200ee',
    surface: '#ffffff',
    background: '#f5f5f5',
    text: '#000000',
    onSurface: '#000000',
    surfaceVariant: '#ffffff',
  },
};

export const HistoryList = forwardRef((props: HistoryListProps, ref) => {
  const [historyFiles, setHistoryFiles] = useState<HistoryFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [sortOrder, setSortOrder] = useState('date_desc');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [previewFileName, setPreviewFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sortOptions = [
  { label: 'Data (decrescente)', value: 'date_desc' },
  { label: 'Data (crescente)', value: 'date_asc' },
  { label: 'Nome (A-Z)', value: 'name_asc' },
  { label: 'Nome (Z-A)', value: 'name_desc' },
];

  const loadHistoryFiles = async () => {
    try {
      setIsLoading(true);
      const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory!);
      const txtFiles = files.filter(file => file.endsWith('.txt') && file.includes('barcode_export'));
      
      const fileDetails = await Promise.all(
        txtFiles.map(async (file) => {
          const fileInfo = await FileSystem.getInfoAsync(FileSystem.documentDirectory + file, { size: true });
          return {
            name: file,
            uri: FileSystem.documentDirectory + file,
            modificationTime: (fileInfo.exists && 'modificationTime' in fileInfo && fileInfo.modificationTime) ? fileInfo.modificationTime : 0,
            size: (fileInfo.exists && 'size' in fileInfo && typeof fileInfo.size === 'number') ? fileInfo.size : 0,
          };
        })
      );

      setHistoryFiles(sortFiles(fileDetails, sortOrder));
    } catch (error) {
      console.error('Error loading history files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  
  useImperativeHandle(ref, () => ({
    loadHistoryFiles,
  }));

  useEffect(() => {
    loadHistoryFiles();
  }, []);

  const sortFiles = (files: HistoryFile[], order: string) => {
    return [...files].sort((a, b) => {
      switch (order) {
        case 'date_desc':
          return b.modificationTime - a.modificationTime;
        case 'date_asc':
          return a.modificationTime - b.modificationTime;
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });
  };

  const deleteFile = async (uri: string) => {
    try {
      await FileSystem.deleteAsync(uri);
      loadHistoryFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const shareFile = async (uri: string) => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      }
    } catch (error) {
      console.error('Error sharing file:', error);
    }
  };

  const toggleFileSelection = (uri: string) => {
    if (selectedFiles.includes(uri)) {
      setSelectedFiles(selectedFiles.filter(f => f !== uri));
    } else {
      setSelectedFiles([...selectedFiles, uri]);
    }
  };

  const handleMultiDelete = async () => {
    try {
      await Promise.all(selectedFiles.map(uri => FileSystem.deleteAsync(uri)));
      setSelectedFiles([]);
      setIsSelectionMode(false);
      loadHistoryFiles();
    } catch (error) {
      console.error('Error deleting multiple files:', error);
    }
  };

  const previewFile = async (uri: string, fileName: string) => {
    try {
      const content = await FileSystem.readAsStringAsync(uri);
      setPreviewContent(content);
      setPreviewFileName(fileName);
      setPreviewVisible(true);
    } catch (error) {
      console.error('Error reading file:', error);
    }
  };

  const formatDate = (timestamp: number) => new Date(timestamp * 1000).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  };

  const filteredFiles = historyFiles.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderHistoryItem = ({ item }: { item: HistoryFile }) => (
    <Card style={[styles.card, selectedFiles.includes(item.uri) && styles.selectedCard]}>
      <TouchableOpacity
        onPress={() => isSelectionMode ? toggleFileSelection(item.uri) : previewFile(item.uri, item.name)}
        onLongPress={() => {
          setIsSelectionMode(true);
          toggleFileSelection(item.uri);
        }}
        activeOpacity={0.85}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.cardInfo}>
              <Text style={styles.fileName} numberOfLines={2} ellipsizeMode="tail">
                {isSelectionMode && (
                  <MaterialIcons
                    name={selectedFiles.includes(item.uri) ? "check-box" : "check-box-outline-blank"}
                    size={24}
                    color="#6200ee"
                    style={{ marginRight: 8 }}
                  />
                )}
                {item.name}
              </Text>
              <Text style={styles.cardText}>Criado: {formatDate(item.modificationTime)}</Text>
              <Text style={styles.cardText}>Tamanho: {formatFileSize(item.size)}</Text>
            </View>
            {!isSelectionMode && (
              <View style={styles.cardActions}>
                <Button
                  icon="share"
                  mode="text"
                  onPress={() => shareFile(item.uri)}
                  style={styles.actionButton}
                  labelStyle={{ color: '#6200ee', fontWeight: 'bold' }}
                  contentStyle={{ flexDirection: 'row-reverse' }}
                >
                  Compartilhar
                </Button>
                <Button
                  icon="delete"
                  mode="text"
                  onPress={() => deleteFile(item.uri)}
                  style={styles.actionButton}
                  labelStyle={{ color: '#d32f2f', fontWeight: 'bold' }}
                  contentStyle={{ flexDirection: 'row-reverse' }}
                >
                  Excluir
                </Button>
              </View>
            )}
          </View>
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );

  if (isLoading) {
    return (
      <PaperProvider theme={customTheme}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6200ee" />
            <Text style={styles.loadingText}>Carregando arquivos...</Text>
          </View>
        </SafeAreaView>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={customTheme}>
      
        <View style={styles.container}>
          <View style={styles.header}>
            <Searchbar
              placeholder="Pesquisar arquivos"
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
              inputStyle={{ color: '#222' }}
              placeholderTextColor="#888"
            />
            <View style={styles.headerActions}>
              {isSelectionMode ? (
                <>
                  <Button
                    mode="contained"
                    onPress={handleMultiDelete}
                    style={styles.headerButton}
                    disabled={selectedFiles.length === 0}
                  >
                    Excluir ({selectedFiles.length})
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      setIsSelectionMode(false);
                      setSelectedFiles([]);
                    }}
                    style={styles.headerButton}
                  >
                    Cancelar
                  </Button>
                </>
              ) : (
                  <Menu
                      visible={sortMenuVisible}
                      onDismiss={() => setSortMenuVisible(false)}
                      anchor={
                      <Button mode="text" icon="sort" onPress={() => setSortMenuVisible(true)}>
                          Ordenar
                      </Button>
                      }
                      contentStyle={{ backgroundColor: '#fff', borderRadius: 16 }}
                  >
                      {sortOptions.map(option => (
                      <Menu.Item
                          key={option.value}
                          onPress={() => { setSortOrder(option.value); setSortMenuVisible(false); }}
                          title={option.label}
                      />
                      ))}
                  </Menu>
              )}
            </View>
          </View>

          {filteredFiles.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="history" size={64} color="#cccccc" />
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'Nenhum arquivo encontrado' : 'Nenhum arquivo exportado'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'Tente uma pesquisa diferente'
                  : 'Os arquivos exportados aparecerão aqui'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredFiles}
              renderItem={renderHistoryItem}
              keyExtractor={(item) => item.uri}
              style={styles.list}
              contentContainerStyle={styles.listContent}
            />
          )}

          <Portal>
            <Dialog
              visible={previewVisible}
              onDismiss={() => setPreviewVisible(false)}
              style={styles.previewDialog}
            >
              <Dialog.Title>{previewFileName}</Dialog.Title>
              <Dialog.ScrollArea style={styles.previewScrollArea}>
                <Text style={styles.previewText}>{previewContent}</Text>
              </Dialog.ScrollArea>
              <Dialog.Actions>
                <Button onPress={() => setPreviewVisible(false)}>Fechar</Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
        </View>
    </PaperProvider>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    alignItems: 'center', 
    paddingHorizontal: 8 
  },
  headerButton: {
    marginLeft: 8,
  },  searchBar: {
    elevation: 2,
    backgroundColor: '#f0f0f0', // light gray background
    borderRadius: 50,
    marginBottom: 0,
    marginTop: 32,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#fff', // white card background
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  selectedCard: {
    backgroundColor: '#ede7f6', // subtle purple for selection
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardInfo: {
    flex: 1,
    marginRight: 8,
    padding: 8
  },
  cardActions: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  actionButton: {
    marginVertical: 4,
  },
  fileName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#222', // strong dark color for clarity
  },
  cardText: {
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyTitle: {
    marginTop: 16,
    color: '#666',
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  previewDialog: {
    maxHeight: '80%',
  },
  previewScrollArea: {
    paddingHorizontal: 0,
  },
  previewText: {
    fontFamily: 'monospace',
  },
});