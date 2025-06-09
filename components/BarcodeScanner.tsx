// BarcodeScanner.tsx

import { CameraView, useCameraPermissions } from 'expo-camera';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  Appbar,
  Button,
  Card,
  DefaultTheme,
  Dialog,
  Divider,
  FAB,
  Icon,
  IconButton,
  Menu,
  Provider as PaperProvider,
  Portal,
  Snackbar,
  Surface,
  Text,
  TextInput
} from 'react-native-paper';

interface BarcodeItem {
  barcode: string;
  quantity: number;
  timestamp: string;
  name?: string;
}

interface BarcodeCollection {
  name: string;
  items: BarcodeItem[];
  createdAt: string;
}

const customTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200ee',
    surface: '#ffffff',
    background: '#f5f5f5',
    text: '#000000',
    onSurface: '#000000', // for Appbar title
    surfaceVariant: '#ffffff', // for the button in appbar
  },
};

const sortOptions = [
  { label: 'Data (decrescente)', value: 'date_desc' },
  { label: 'Data (crescente)', value: 'date_asc' },
  { label: 'Nome (A-Z)', value: 'name_asc' },
  { label: 'Nome (Z-A)', value: 'name_desc' },
  { label: 'Quantidade (maior)', value: 'qty_desc' },
  { label: 'Quantidade (menor)', value: 'qty_asc' },
];

const BarcodeScanner: React.FC = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [collections, setCollections] = useState<BarcodeCollection[]>([]);
  const [currentCollection, setCurrentCollection] = useState<BarcodeCollection | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [manualInputVisible, setManualInputVisible] = useState(false);
  const [newCollectionVisible, setNewCollectionVisible] = useState(true); // Open create dialog by default
  const [currentBarcode, setCurrentBarcode] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [itemName, setItemName] = useState('');
  const [collectionName, setCollectionName] = useState(''); // Default name with current date
  const [editingItem, setEditingItem] = useState<BarcodeItem | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [mainMenuVisible, setMainMenuVisible] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [sortOrder, setSortOrder] = useState('date_desc');
  const [itemSortMenuVisible, setItemSortMenuVisible] = useState(false);
  const [collectionMenuVisible, setCollectionMenuVisible] = useState(false);
  const [importDialogVisible, setImportDialogVisible] = useState(false);
  const [importedItems, setImportedItems] = useState<BarcodeItem[]>([]);
  const [importedListName, setImportedListName] = useState('');
  const [collectionNameTouched, setCollectionNameTouched] = useState(false);

  useEffect(() => {
    // Do not auto-create a default collection. Show the new collection dialog on first load.
    // The user must create a collection before proceeding.
    // If you want to auto-select a collection after creation, handle it in createNewCollection.
  }, []);

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanning) {
      setCurrentBarcode(data);
      setDialogVisible(true);
      setScanning(false);
    }
  };

  const saveAppHistoryFile = async (items: BarcodeItem[], collectionName: string) => {
    const appContent = items.map(item =>
      `${item.name ? item.name : ''},${item.barcode},${item.quantity}`
    ).join('\n');
    const appFileName = `${collectionName}_barcode_export.txt`;
    const appFileUri = FileSystem.documentDirectory + appFileName;
    await FileSystem.writeAsStringAsync(appFileUri, appContent);
  };

  const addItem = async () => {
    if (!currentCollection) {
      showSnackbar('Erro: Nenhuma lista selecionada');
      return;
    }

    const barcode = currentBarcode || manualBarcode;
    if (!barcode.trim()) {
      showSnackbar('Código de barras não pode estar vazio');
      return;
    }

    const qty = parseInt(quantity) || 1;
    const existingItemIndex = currentCollection.items.findIndex(item => item.barcode === barcode);
    
    const updatedCollections = [...collections];
    const collectionIndex = collections.findIndex(c => c.name === currentCollection.name);
    
    if (existingItemIndex >= 0) {
      updatedCollections[collectionIndex].items[existingItemIndex].quantity += qty;
      if (itemName.trim()) {
        updatedCollections[collectionIndex].items[existingItemIndex].name = itemName.trim();
      }
      showSnackbar(`Quantidade atualizada para ${barcode}`);
    } else {
      const newItem: BarcodeItem = {
        barcode: barcode,
        quantity: qty,
        timestamp: new Date().toISOString(),
        name: itemName.trim() || undefined
      };
      updatedCollections[collectionIndex].items.push(newItem);
      showSnackbar(`Adicionado ${barcode} com quantidade ${qty}`);
    }
    setCollections(updatedCollections);
    setCurrentCollection(updatedCollections[collectionIndex]);
    await saveAppHistoryFile(updatedCollections[collectionIndex].items, updatedCollections[collectionIndex].name);
    
    setDialogVisible(false);
    setManualInputVisible(false);
    setQuantity('1');
    setItemName('');
    setCurrentBarcode('');
    setManualBarcode('');
  };

  const editItem = (item: BarcodeItem) => {
    setEditingItem(item);
    setCurrentBarcode(item.barcode);
    setQuantity(item.quantity.toString());
    setItemName(item.name || '');
    setEditDialogVisible(true);
  };

  const updateItem = async () => {
    if (!currentCollection || !editingItem) return;
    const updatedCollections = [...collections];
    const collectionIndex = collections.findIndex(c => c.name === currentCollection.name);
    const itemIndex = currentCollection.items.findIndex(item => item.barcode === editingItem.barcode);
    if (itemIndex >= 0) {
      updatedCollections[collectionIndex].items[itemIndex] = {
        ...editingItem,
        barcode: currentBarcode,
        quantity: parseInt(quantity) || 1,
        name: itemName.trim() || undefined
      };
      setCollections(updatedCollections);
      setCurrentCollection(updatedCollections[collectionIndex]);
      showSnackbar('Item atualizado com sucesso');
      await saveAppHistoryFile(updatedCollections[collectionIndex].items, updatedCollections[collectionIndex].name);
    }
    setEditDialogVisible(false);
    setEditingItem(null);
    setQuantity('1');
    setItemName('');
    setCurrentBarcode('');
  };

  const removeItem = (barcode: string) => {
    if (!currentCollection) return;
    Alert.alert(
      'Remover Item',
      `Tem certeza que deseja remover o item ${barcode}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: async () => {
          const updatedCollections = [...collections];
          const collectionIndex = collections.findIndex(c => c.name === currentCollection.name);
          updatedCollections[collectionIndex].items = currentCollection.items.filter(item => item.barcode !== barcode);
          setCollections(updatedCollections);
          setCurrentCollection(updatedCollections[collectionIndex]);
          showSnackbar(`${barcode} removido`);
          await saveAppHistoryFile(updatedCollections[collectionIndex].items, updatedCollections[collectionIndex].name);
        }}
      ]
    );
  };

  const createNewCollection = () => {
    setCollectionNameTouched(true);
    if (!collectionName.trim()) {
      showSnackbar('Nome da lista não pode estar vazio');
      return;
    }
    if (collections.some(c => c.name === collectionName.trim())) {
      showSnackbar('Já existe uma lista com esse nome');
      return;
    }

    const newCollection: BarcodeCollection = {
      name: collectionName.trim(),
      items: [],
      createdAt: new Date().toISOString()
    };

    const updatedCollections = [...collections, newCollection];
    setCollections(updatedCollections);
    setCurrentCollection(newCollection);
    setNewCollectionVisible(false);
    setCollectionName('');
    setCollectionNameTouched(false);
    showSnackbar(`Nova lista "${newCollection.name}" criada`);
  };

  const exportFile = async () => {
    if (!currentCollection || currentCollection.items.length === 0) {
      showSnackbar('Nenhum item para exportar');
      return;
    }

    try {
      const appContent = currentCollection.items.map(item =>
        `${item.name ? item.name : ''}, ${item.barcode}, ${item.quantity}`
      ).join('\n');
      const appFileName = `${currentCollection.name}_barcode_export_${new Date().toISOString().split('T')[0]}.txt`;
      const appFileUri = FileSystem.documentDirectory + appFileName;
      await FileSystem.writeAsStringAsync(appFileUri, appContent);

      const shareContent = currentCollection.items.map(item =>
        `${item.barcode},${item.quantity}`
      ).join('\n');
      const shareFileName = `${currentCollection.name}_${new Date().toISOString().split('T')[0]}.txt`;
      const shareFileUri = FileSystem.documentDirectory + shareFileName;
      await FileSystem.writeAsStringAsync(shareFileUri, shareContent);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(shareFileUri);
      } else {
        showSnackbar(`Arquivo salvo em ${shareFileName}`);
      }
    } catch (error) {
      console.error('Erro na exportação:', error);
      showSnackbar('Erro ao exportar arquivo');
    }
  };

  const clearAll = () => {
    if (!currentCollection) return;
    Alert.alert(
      'Limpar Todos os Itens',
      `Tem certeza que deseja limpar todos os itens da lista "${currentCollection.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Limpar', style: 'destructive', onPress: async () => {
          const updatedCollections = [...collections];
          const collectionIndex = collections.findIndex(c => c.name === currentCollection.name);
          updatedCollections[collectionIndex].items = [];
          setCollections(updatedCollections);
          setCurrentCollection(updatedCollections[collectionIndex]);
          showSnackbar('Todos os itens foram removidos');
          await saveAppHistoryFile(updatedCollections[collectionIndex].items, updatedCollections[collectionIndex].name);
        }}
      ]
    );
  };

  const switchCollection = (collection: BarcodeCollection) => {
    setCurrentCollection(collection);
    setCollectionMenuVisible(false);
    showSnackbar(`Mudou para lista "${collection.name}"`);
  };

  const deleteCollection = (collectionToDelete: BarcodeCollection) => {
    if (collections.length <= 1) {
      showSnackbar('Você deve ter pelo menos uma lista.');
      return;
    }
    Alert.alert(
      'Excluir Lista',
      `Tem certeza que deseja excluir a lista "${collectionToDelete.name}"? Todos os itens serão perdidos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            const updatedCollections = collections.filter(c => c.name !== collectionToDelete.name);
            setCollections(updatedCollections);
            if (currentCollection?.name === collectionToDelete.name) {
              setCurrentCollection(updatedCollections[0]);
              showSnackbar(`Lista "${collectionToDelete.name}" excluída. Mudou para a lista "${updatedCollections[0].name}".`);
            } else {
              showSnackbar(`Lista "${collectionToDelete.name}" excluída.`);
            }
            setCollectionMenuVisible(false);
          },
        },
      ],
    );
  };
  
  const getSortedItems = () => {
    if (!currentCollection) return [];
    const items = [...currentCollection.items];
    switch (sortOrder) {
      case 'date_desc':
        return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      case 'date_asc':
        return items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      case 'name_asc':
        return items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      case 'name_desc':
        return items.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
      case 'qty_desc':
        return items.sort((a, b) => b.quantity - a.quantity);
      case 'qty_asc':
        return items.sort((a, b) => a.quantity - b.quantity);
      default:
        return items;
    }
  };

  const parseHistoryFile = (content: string): BarcodeItem[] => {
    return content.split('\n').map(line => {
      const parts = line.split(',');
      if (parts.length >= 2) {
        // name,barcode,quantity OR barcode,quantity
        const hasName = parts.length === 3;
        return {
          name: hasName ? (parts[0] || undefined) : undefined,
          barcode: hasName ? parts[1] : parts[0],
          quantity: parseInt(hasName ? parts[2] : parts[1]) || 1,
          timestamp: new Date().toISOString(),
        };
      }
      return null;
    }).filter(Boolean) as BarcodeItem[];
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/plain',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets || !result.assets[0].uri) return;

      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri);
      const items = parseHistoryFile(content);

      if (items.length === 0) {
        showSnackbar('Arquivo inválido ou vazio');
        return;
      }
      setImportedItems(items);
      setImportedListName(result.assets[0].name.replace('.txt', '').replace('.csv', ''));
      setImportDialogVisible(true);
    } catch (e) {
      showSnackbar('Erro ao importar arquivo');
      console.error('Import Error:', e);
    }
  };

  const doImportAsNewList = async () => {
    const listName = importedListName.trim() || `Lista Importada`;
    if (collections.some(c => c.name === listName)) {
        showSnackbar(`Uma lista com o nome "${listName}" já existe.`);
        return;
    }
    const newList: BarcodeCollection = {
      name: listName,
      items: importedItems,
      createdAt: new Date().toISOString(),
    };
    const updatedCollections = [...collections, newList];
    setCollections(updatedCollections);
    setCurrentCollection(newList);
    setImportDialogVisible(false);
    setImportedItems([]);
    setImportedListName('');
    showSnackbar('Lista importada com sucesso');
    await saveAppHistoryFile(newList.items, newList.name);
  };

  const doImportMerge = async () => {
    if (!currentCollection) return;
    const merged = [...currentCollection.items];
    importedItems.forEach(imported => {
      const idx = merged.findIndex(i => i.barcode === imported.barcode);
      if (idx >= 0) {
        merged[idx].quantity += imported.quantity;
        if (imported.name && !merged[idx].name) merged[idx].name = imported.name;
      } else {
        merged.push(imported);
      }
    });

    const updatedCollections = [...collections];
    const collectionIndex = collections.findIndex(c => c.name === currentCollection.name);
    updatedCollections[collectionIndex].items = merged;
    setCollections(updatedCollections);
    setCurrentCollection(updatedCollections[collectionIndex]);
    setImportDialogVisible(false);
    setImportedItems([]);
    setImportedListName('');
    showSnackbar('Itens importados e mesclados com sucesso');
    await saveAppHistoryFile(merged, updatedCollections[collectionIndex].name);
  };

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <PaperProvider theme={customTheme}>
        <View style={styles.container}>
          <Card style={styles.permissionCard}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.titleText}>Permissão da Câmera Necessária</Text>
              <Text variant="bodyMedium" style={styles.paragraphText}>
                Este aplicativo precisa de acesso à câmera para escanear códigos de barras.
              </Text>
              <Button mode="contained" onPress={requestPermission} style={styles.permissionButton}>
                Conceder Permissão
              </Button>
            </Card.Content>
          </Card>
        </View>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={customTheme}>
      <View style={styles.container}>
        <Appbar.Header>
          <TouchableOpacity
            style={styles.listDropdown}
            onPress={() => setCollectionMenuVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.listDropdownText, { color: '#000' }]} numberOfLines={1} ellipsizeMode="tail">
              {currentCollection ? currentCollection.name : "Coletor"}
            </Text>
            <Icon source="menu-down" size={22} color="#000" />
          </TouchableOpacity>
          <Menu
            visible={collectionMenuVisible}
            onDismiss={() => setCollectionMenuVisible(false)}
            anchor={<View style={{ width: 1, height: 1 }} />}
            contentStyle={styles.collectionMenu}
          >
            {collections.map(c => (
              <View key={c.name} style={styles.collectionMenuItem}>
                <TouchableOpacity
                  style={styles.collectionMenuItemButton}
                  onPress={() => switchCollection(c)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.collectionMenuItemText}>{c.name}</Text>
                </TouchableOpacity>
                <IconButton
                  icon="delete-outline"
                  size={20}
                  onPress={() => deleteCollection(c)}
                  disabled={collections.length <= 1}
                  style={styles.collectionMenuDelete}
                />
              </View>
            ))}

            <Divider />
            <Menu.Item
              onPress={() => { setMainMenuVisible(false); setCollectionMenuVisible(false); setNewCollectionVisible(true); }}
              title="Criar nova lista"
              leadingIcon="plus"
            />
          </Menu>
          <Appbar.Action icon="keyboard" onPress={() => setManualInputVisible(true)} />
          <Appbar.Action
            icon="export"
            onPress={exportFile}
            disabled={!currentCollection || currentCollection.items.length === 0}
          />
          <Menu
            visible={mainMenuVisible}
            onDismiss={() => setMainMenuVisible(false)}
            anchor={<Appbar.Action icon="dots-vertical" onPress={() => setMainMenuVisible(true)} />}
            contentStyle={styles.menuContent}
          >
            <Menu.Item
              onPress={() => { setMainMenuVisible(false); handleImport(); }}
              title="Importar de arquivo"
              leadingIcon="file-download"
              style={styles.menuItem}
            />
            <Divider style={styles.menuDivider} />
            <Menu.Item
              onPress={() => { setMainMenuVisible(false); clearAll(); }}
              title="Limpar lista atual"
              leadingIcon="delete-sweep"
              disabled={!currentCollection || currentCollection.items.length === 0}
              titleStyle={{ color: customTheme.colors.error }}
              style={styles.menuItem}
            />
          </Menu>
        </Appbar.Header>

        {scanning ? (
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={handleBarcodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "qr", "code128"] }}
            />
            <View style={styles.overlay}>
              <View style={styles.scanArea} />
            </View>
            <Button
              mode="contained"
              onPress={() => setScanning(false)}
              style={styles.cancelButton}
            >
              Cancelar Escaneamento
            </Button>
          </View>
        ) : (
          <View style={styles.content}>
            <Surface style={styles.statsCard} elevation={2}>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statsLabel}>Itens Únicos</Text>
                  <Text style={styles.statsNumberPrimary}>
                    {currentCollection ? currentCollection.items.length : 0}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statsLabel}>Quantidade Total</Text>
                  <Text style={styles.statsNumberPrimary}>
                    {currentCollection ? currentCollection.items.reduce((sum, item) => sum + item.quantity, 0) : 0}
                  </Text>
                </View>
              </View>
            </Surface>

            <View style={styles.listHeader}>
                <Text variant="titleMedium">Itens Coletados</Text>
                <Menu
                    visible={itemSortMenuVisible}
                    onDismiss={() => setItemSortMenuVisible(false)}
                    anchor={
                    <Button mode="text" icon="sort" onPress={() => setItemSortMenuVisible(true)}>
                        Ordenar
                    </Button>
                    }
                    contentStyle={{ backgroundColor: '#fff', borderRadius: 16 }}
                >
                    {sortOptions.map(option => (
                    <Menu.Item
                        key={option.value}
                        onPress={() => { setSortOrder(option.value); setItemSortMenuVisible(false); }}
                        title={option.label}
                    />
                    ))}
                </Menu>
            </View>

            <FlatList
              data={getSortedItems()}
              keyExtractor={(item, index) => item.barcode + index}
              renderItem={({ item }) => (
                <Card style={[styles.itemCard, {backgroundColor: customTheme.colors.surface}]}
                  elevation={1}
                >
                  <Card.Content style={styles.itemCardContent}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemBarcode} numberOfLines={1} ellipsizeMode="tail">{item.barcode}</Text>
                      {item.name && <Text style={styles.itemName} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>}
                      <Text style={styles.itemQty}>Quantidade: {item.quantity}</Text>
                    </View>
                    <View style={styles.itemActions}>
                      <IconButton
                        icon="pencil"
                        size={22}
                        onPress={() => editItem(item)}
                        accessibilityLabel="Editar"
                      />
                      <IconButton
                        icon="delete"
                        size={22}
                        iconColor={customTheme.colors.error}
                        onPress={() => removeItem(item.barcode)}
                        accessibilityLabel="Excluir"
                      />
                    </View>
                  </Card.Content>
                </Card>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Icon source="package-variant-closed" size={64} color="#cccccc" />
                  <Text variant="titleLarge" style={styles.emptyText}>Nenhum Item</Text>
                  <Text variant="bodyMedium" style={styles.emptyText}>
                    Pressione 'Escanear' para começar.
                  </Text>
                </View>
              }
              contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}
              style={{ flex: 1, maxHeight: '60%' }}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {!scanning && (
          <FAB
            style={[styles.fab, { backgroundColor: customTheme.colors.primary }]}
            icon="barcode-scan"
            onPress={() => setScanning(true)}
            label="Escanear"
            color="#fff"
          />
        )}

        <Portal>
          <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
            <Dialog.Title>Adicionar Item</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyLarge">Código: {currentBarcode}</Text>
              <TextInput
                label="Nome do Item (opcional)"
                value={itemName}
                onChangeText={setItemName}
                mode="outlined"
                style={styles.textInput}
              />
              <TextInput
                label="Quantidade"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                mode="outlined"
                style={styles.textInput}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setDialogVisible(false)}>Cancelar</Button>
              <Button onPress={addItem}>Adicionar</Button>
            </Dialog.Actions>
          </Dialog>

          <Dialog visible={editDialogVisible} onDismiss={() => setEditDialogVisible(false)}>
            <Dialog.Title>Editar Item</Dialog.Title>
            <Dialog.Content>
              <TextInput label="Código de Barras" value={currentBarcode} onChangeText={setCurrentBarcode} mode="outlined" style={styles.textInput} />
              <TextInput label="Nome do Item (opcional)" value={itemName} onChangeText={setItemName} mode="outlined" style={styles.textInput} />
              <TextInput label="Quantidade" value={quantity} onChangeText={setQuantity} keyboardType="numeric" mode="outlined" style={styles.textInput} />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setEditDialogVisible(false)}>Cancelar</Button>
              <Button onPress={updateItem}>Salvar</Button>
            </Dialog.Actions>
          </Dialog>

          <Dialog visible={manualInputVisible} onDismiss={() => setManualInputVisible(false)}>
            <Dialog.Title>Entrada Manual</Dialog.Title>
            <Dialog.Content>
              <TextInput label="Código de Barras" value={manualBarcode} onChangeText={setManualBarcode} mode="outlined" style={styles.textInput} />
              <TextInput label="Nome do Item (opcional)" value={itemName} onChangeText={setItemName} mode="outlined" style={styles.textInput} />
              <TextInput label="Quantidade" value={quantity} onChangeText={setQuantity} keyboardType="numeric" mode="outlined" style={styles.textInput} />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setManualInputVisible(false)}>Cancelar</Button>
              <Button onPress={addItem}>Adicionar</Button>
            </Dialog.Actions>
          </Dialog>

          <Dialog visible={newCollectionVisible} onDismiss={() => { setNewCollectionVisible(false); setCollectionNameTouched(false); }}>
            <Dialog.Title>Nova Lista de Coleta</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium" style={{ marginBottom: 12, color: '#666' }}>
              Crie uma nova lista para organizar seus itens coletados
              </Text>
              <TextInput 
                label="Nome da Lista"
                value={collectionName}
                onChangeText={text => { setCollectionName(text); if (collectionNameTouched) setCollectionNameTouched(false); }}
                mode="outlined"
                style={[styles.textInput, { transitionProperty: 'border-color, color', transitionDuration: '0.3s', borderColor: collectionNameTouched && !collectionName.trim() ? '#d32f2f' : undefined }]}
                placeholder="Ex: Lista de Produtos"
                placeholderTextColor={'#999'}
                autoFocus={true}
                onSubmitEditing={createNewCollection}
                error={collectionNameTouched && !collectionName.trim()}
                theme={{ colors: { primary: collectionNameTouched && !collectionName.trim() ? '#d32f2f' : customTheme.colors.primary, text: collectionNameTouched && !collectionName.trim() ? '#d32f2f' : customTheme.colors.text } }}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => { setNewCollectionVisible(false); setCollectionNameTouched(false); }}>Cancelar</Button>
              <Button mode="contained" onPress={createNewCollection} style={{ marginLeft: 8 }}>
                Criar Lista
              </Button>
            </Dialog.Actions>
          </Dialog>

          <Dialog visible={importDialogVisible} onDismiss={() => setImportDialogVisible(false)}>
            <Dialog.Title>Importar Itens</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium" style={{marginBottom: 16}}>
                Encontrados {importedItems.length} itens. Deseja mesclar com a lista atual ou criar uma nova?
              </Text>
              <TextInput
                label="Nome da nova lista"
                value={importedListName}
                onChangeText={setImportedListName}
                mode="outlined"
                style={styles.textInput}
                placeholder="Ex: Lista Importada"
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={doImportMerge}>Mesclar</Button>
              <Button onPress={doImportAsNewList}>Criar Nova</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={2000}
        >
          {snackbarMessage}
        </Snackbar>
      </View>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, paddingHorizontal: 16 },
  cameraContainer: { flex: 1, justifyContent: 'center' },
  camera: { flex: 1 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  scanArea: { width: 280, height: 280, borderWidth: 2, borderColor: '#fff', borderRadius: 12, backgroundColor: 'transparent' },
  cancelButton: { position: 'absolute', bottom: 50, left: 20, right: 20 },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0 },
  permissionCard: { position: 'absolute', left: 16, right: 16, top: '50%', transform: [{ translateY: -120 }], justifyContent: 'center', alignContent: 'center', padding: 16 },
  permissionButton: { marginTop: 16 },
  textInput: { 
    marginTop: 8, 
    transitionProperty: 'border-color, color', // for web, ignored on native
    transitionDuration: '0.3s', // for web, ignored on native
  },
  statsCard: { 
    padding: 16, 
    marginVertical: 16, // more space from top
    borderRadius: 16, 
    backgroundColor: '#fff', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 8, 
    elevation: 2, 
  },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#cccccc', marginTop: 8 },
  itemCard: { marginBottom: 8, borderRadius: 12 },
  itemCardContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemInfo: { flex: 1, marginRight: 8 },
  itemBarcode: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  itemName: { fontSize: 14, color: '#666' },
  itemQty: { fontSize: 14, color: '#333', marginTop: 2 },
  itemActions: { flexDirection: 'row', alignItems: 'center' },
  appBarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'none',
    maxWidth: 120,
  },
  titleText: { fontWeight: 'bold' },
  paragraphText: { color: '#666666' },
  collectionSwitcherButton: {
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
    minWidth: 0,
    marginLeft: 0,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 0,
  },
  // Add styles for the new dropdown and menu
  listDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    flex: 1,
    minWidth: 0,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  listDropdownText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    maxWidth: 180,
    flexShrink: 1,
    marginRight: 4,
  },
  collectionMenu: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 8,
    minWidth: 220,
    marginTop: 48,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  collectionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginVertical: 2,
  },
  collectionMenuItemButton: {
    flex: 1,
    paddingVertical: 4,
  },
  collectionMenuItemText: {
    fontSize: 16,
    color: '#222',
    fontWeight: '500',
  },
  collectionMenuDelete: {
    marginLeft: 8,
  },
  listHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 8, 
    marginTop: 16, 
    marginBottom: 8 
  },
  statsLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    marginBottom: 2,
    textAlign: 'center',
  },
  statsNumberPrimary: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6200ee',
    marginTop: 2,
    textAlign: 'center',
    letterSpacing: 1,
  },
  statsNumberError: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginTop: 2,
    textAlign: 'center',
    letterSpacing: 1,
  },
  menuContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  menuItem: {
    paddingVertical: 8,
    marginHorizontal: 4,
  },
  menuDivider: {
    marginVertical: 8,
  },
});

export default BarcodeScanner;