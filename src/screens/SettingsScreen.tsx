import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { exportAllCredentials } from '../helpers/exportHelper';
import { colors } from '../styles/colors';

export default function SettingsScreen() {
  const { logout, masterKey } = useAuth();
  const [isExporting, setIsExporting] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleExport = async () => {
    if (!masterKey) {
      Alert.alert('Erro', 'Chave de criptografia não encontrada. Faça login novamente.');
      return;
    }

    Alert.alert(
      'Exportar Credenciais',
      'Isso irá gerar um arquivo JSON com todas as suas senhas DESCRIPTOGRAFADAS. Certifique-se de compartilhar ou salvar este arquivo em um local seguro.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar e Exportar',
          onPress: async () => {
            try {
              setIsExporting(true);
              await exportAllCredentials(masterKey);
            } catch (error: any) {
              Alert.alert('Erro na Exportação', error.message || 'Ocorreu um erro desconhecido.');
            } finally {
              setIsExporting(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity style={styles.buttonLogout} onPress={handleLogout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { marginTop: 20 }]}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        
        <TouchableOpacity 
          style={styles.buttonExport} 
          onPress={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Exportar Credenciais (JSON)</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 30,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 15,
  },
  buttonLogout: {
    backgroundColor: colors.destructiveAlt,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonExport: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
