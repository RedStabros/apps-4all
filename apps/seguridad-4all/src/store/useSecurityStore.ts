import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import i18n from "@apps4all/i18n";
import { encryptDeviceVault, decryptDeviceVault } from "../utils/vaultCrypto";

export interface VaultItem {
  id: string;
  name: string;
  username?: string;
  notes?: string;
  passwordEncrypted: string;
  timestamp: number;
  expiryDays?: number;
  expiryTimestamp?: number;
}

interface GeneratorOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
  customSymbols: string;
}

interface SecurityState {
  manualLanguage: string | null;
  generatorOptions: GeneratorOptions;
  vault: VaultItem[];
  isVaultUnlocked: boolean;
  setLanguage: (lang: string) => void;
  setGeneratorOptions: (options: Partial<GeneratorOptions>) => void;
  unlockVault: (vaultData: VaultItem[]) => void;
  lockVault: () => void;
  addVaultItem: (item: VaultItem) => Promise<void>;
  removeVaultItem: (id: string) => Promise<void>;
  importVaultItems: (incoming: VaultItem[]) => Promise<number>;
}

const LEGACY_VAULT_SECURE_KEY = "4all_seguridad_vault_data";
const ENCRYPTED_VAULT_STORAGE_KEY = "4all_seguridad_vault_enc_v1";

async function persistVaultSecurely(items: VaultItem[]): Promise<void> {
  const encryptedBlob = await encryptDeviceVault(JSON.stringify(items));
  await AsyncStorage.setItem(ENCRYPTED_VAULT_STORAGE_KEY, encryptedBlob);
}

export const useSecurityStore = create<SecurityState>()(
  persist(
    (set, get) => ({
      manualLanguage: null,
      isVaultUnlocked: false,
      vault: [], // Populated only when unlocked
      generatorOptions: {
        length: 16,
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
        excludeAmbiguous: true,
        customSymbols: "!@#$%^&*",
      },

      setLanguage: (lang) => {
        i18n.changeLanguage(lang);
        set({ manualLanguage: lang });
      },

      setGeneratorOptions: (options) => {
        set((state) => ({
          generatorOptions: { ...state.generatorOptions, ...options },
        }));
      },

      unlockVault: (vaultData) =>
        set({ isVaultUnlocked: true, vault: vaultData }),

      lockVault: () => set({ isVaultUnlocked: false, vault: [] }),

      addVaultItem: async (item) => {
        const newVault = [item, ...get().vault];
        set({ vault: newVault });
        await persistVaultSecurely(newVault);
      },

      removeVaultItem: async (id) => {
        const newVault = get().vault.filter((i) => i.id !== id);
        set({ vault: newVault });
        await persistVaultSecurely(newVault);
      },

      importVaultItems: async (incoming) => {
        const current = get().vault;
        const existingIds = new Set(current.map((i) => i.id));
        const validNew = incoming.filter(
          (item) =>
            item &&
            typeof item.id === "string" &&
            typeof item.name === "string" &&
            typeof item.passwordEncrypted === "string" &&
            !existingIds.has(item.id),
        );
        if (validNew.length === 0) return 0;
        const merged = [...validNew, ...current];
        set({ vault: merged });
        await persistVaultSecurely(merged);
        return validNew.length;
      },
    }),
    {
      name: "4all-seguridad-state",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        manualLanguage: state.manualLanguage,
        generatorOptions: state.generatorOptions,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.manualLanguage) {
          i18n.changeLanguage(state.manualLanguage);
        }
      },
    },
  ),
);

// Helper to read & decrypt vault (with automatic migration from legacy SecureStore key)
export const fetchSecureVault = async (): Promise<VaultItem[]> => {
  try {
    const encRaw = await AsyncStorage.getItem(ENCRYPTED_VAULT_STORAGE_KEY);
    if (encRaw) {
      const decrypted = await decryptDeviceVault(encRaw);
      if (decrypted) return JSON.parse(decrypted);
    }

    // Legacy migration (if user had items stored directly in SecureStore)
    const legacyRaw = await SecureStore.getItemAsync(LEGACY_VAULT_SECURE_KEY);
    if (legacyRaw) {
      const parsed: VaultItem[] = JSON.parse(legacyRaw);
      await persistVaultSecurely(parsed);
      await SecureStore.deleteItemAsync(LEGACY_VAULT_SECURE_KEY).catch(() => {});
      return parsed;
    }
  } catch {
    // Fail-safe empty vault on unreadable state
  }
  return [];
};
