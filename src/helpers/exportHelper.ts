import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getCredentials } from '../services/credentialService';
import { decryptPassword } from '../services/cryptoService';
import { Credential } from '../types';

export const exportAllCredentials = async (masterKey: string): Promise<void> => {
  try {
    let allCredentials: any[] = [];
    let page = 0;
    let hasNext = true;
    const pageSize = 50; // Busca em lotes de 50 para evitar sobrecarga

    // 1. Busca todas as páginas de credenciais
    while (hasNext) {
      const response = await getCredentials(page, pageSize);
      
      const decryptedBatch = response.content.map((cred: Credential) => {
        try {
          return {
            id: cred.uuid,
            empresa: cred.iv1 
              ? decryptPassword(cred.company, masterKey, cred.iv1) 
              : cred.company,
            email: cred.iv3
              ? decryptPassword(cred.email, masterKey, cred.iv3)
              : cred.email,
            senha: cred.iv2 
              ? decryptPassword(cred.senha, masterKey, cred.iv2) 
              : '[Erro ao descriptografar senha]',
            criado_em: cred.createdAt,
            atualizado_em: cred.updatedAt
          };
        } catch (err) {
          console.error(`Erro ao descriptografar credencial ${cred.uuid}:`, err);
          return {
            id: cred.uuid,
            empresa: cred.company + ' (Criptografado)',
            erro: 'Falha na descriptografia'
          };
        }
      });

      allCredentials = [...allCredentials, ...decryptedBatch];
      
      hasNext = response.hasNext;
      page++;
    }

    if (allCredentials.length === 0) {
      throw new Error('Nenhuma credencial encontrada para exportar.');
    }

    // 2. Prepara o arquivo JSON
    const fileUri = FileSystem.documentDirectory + 'memoir_credentials_export.json';
    const jsonString = JSON.stringify(allCredentials, null, 2);

    // 3. Escreve no sistema de arquivos
    // Usando string 'utf8' direta para compatibilidade
    await FileSystem.writeAsStringAsync(fileUri, jsonString, {
      encoding: 'utf8'
    });

    // 4. Abre menu de compartilhamento
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Exportar Credenciais Memoir',
        UTI: 'public.json' // Ajuda no iOS a identificar o tipo de arquivo
      });
    } else {
      throw new Error('Compartilhamento não disponível neste dispositivo');
    }

  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
};
