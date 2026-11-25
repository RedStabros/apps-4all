import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useNotesStore, Note } from "../store/useNotesStore";
import { isEncryptedPayload } from "../utils/privateVault";
import {
  ChevronLeft,
  Search,
  Pin,
  FileText,
  CheckSquare,
  FilePlus,
  Lock,
  Image as ImageIcon,
} from "lucide-react-native";

export default function NotesListScreen({ route, navigation }: any) {
  const { folderId, folderName } = route.params;
  const { t } = useTranslation();
  const { notes, folders } = useNotesStore();
  const isDark = useColorScheme() === "dark";
  const accentHex = isDark ? "#60A5FA" : "#2563EB";

  const [searchQuery, setSearchQuery] = useState("");

  const privateFolderIds = useMemo(
    () => new Set(folders.filter((f) => f.isPrivate).map((f) => f.id)),
    [folders],
  );

  // Filter & sort notes (pinned first, then most recently updated)
  const orderedNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return notes
      .filter((n) => {
        const inFolder = folderId
          ? n.folderId === folderId
          : !n.folderId || !privateFolderIds.has(n.folderId);
        if (!inFolder) return false;
        if (!q) return true;
        const searchableBody = isEncryptedPayload(n.textContent)
          ? ""
          : n.textContent.toLowerCase();
        return n.title.toLowerCase().includes(q) || searchableBody.includes(q);
      })
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      });
  }, [notes, folderId, privateFolderIds, searchQuery]);

  const renderNoteItem = ({ item: note }: { item: Note }) => {
    const encrypted = note.isEncrypted || isEncryptedPayload(note.textContent);
    const hasImages = (note.images?.length || 0) > 0;

    return (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("Editor", { noteId: note.id, folderId })
        }
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={note.title || t("apuntes_new_note", "New Note")}
        className="bg-white dark:bg-zinc-900 p-4 rounded-2xl mb-3 border border-zinc-100 dark:border-zinc-800 shadow-sm"
      >
        <View className="flex-row justify-between items-start mb-2">
          <Text
            className="text-lg font-bold text-zinc-900 dark:text-white flex-1 mr-2"
            numberOfLines={1}
          >
            {note.title || t("apuntes_new_note", "New Note")}
          </Text>
          <View className="flex-row items-center gap-2">
            {hasImages && <ImageIcon color="#a1a1aa" size={15} />}
            {encrypted && <Lock color={accentHex} size={15} />}
            {note.isPinned && <Pin color={accentHex} size={16} />}
          </View>
        </View>
        <View className="flex-row items-center">
          {note.type === "list" ? (
            <CheckSquare color="#a1a1aa" size={14} className="mr-2" />
          ) : (
            <FileText color="#a1a1aa" size={14} className="mr-2" />
          )}
          <Text className="text-zinc-500 text-sm flex-1" numberOfLines={2}>
            {encrypted
              ? t("apuntes_encrypted_preview", "Contenido cifrado localmente")
              : note.type === "list"
                ? `${note.listContent.filter((i) => i.checked).length}/${note.listContent.length} ${t("apuntes_items_label", "ítems")}`
                : note.textContent}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      className="flex-1 bg-zinc-50 dark:bg-zinc-950"
    >
      <View className="pt-2 pb-2 px-4 flex-row items-center bg-zinc-50 dark:bg-zinc-950">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t("apuntes_folders", "Carpetas")}
          className="flex-row items-center mr-2 py-1 pr-2"
        >
          <ChevronLeft color={accentHex} size={28} />
          <Text className="text-blue-600 dark:text-blue-400 font-medium text-lg">
            {t("apuntes_folders", "Carpetas")}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="px-6 pb-4 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
        <Text className="text-3xl font-black text-zinc-900 dark:text-white mb-4">
          {folderName}
        </Text>
        <View className="flex-row items-center bg-zinc-200 dark:bg-zinc-800 rounded-xl px-4 py-2">
          <Search color="#a1a1aa" size={20} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t("apuntes_search", "Buscar notas...")}
            placeholderTextColor="#a1a1aa"
            className="flex-1 ml-2 text-zinc-900 dark:text-white font-medium"
          />
        </View>
      </View>

      <FlatList
        data={orderedNotes}
        keyExtractor={(item) => item.id}
        renderItem={renderNoteItem}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 110 }}
        ListEmptyComponent={
          <Text className="text-zinc-500 text-center mt-10">
            {t("apuntes_empty", "Vacío.")}
          </Text>
        }
      />

      {/* Floating Action Buttons */}
      <View className="absolute bottom-10 right-6 flex-row">
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("Editor", { folderId, type: "list" })
          }
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t("apuntes_new_checklist", "Nueva lista")}
          className="bg-zinc-800 dark:bg-zinc-200 w-14 h-14 rounded-full items-center justify-center mr-4 shadow-lg"
        >
          <CheckSquare color={isDark ? "#18181b" : "#fff"} size={24} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("Editor", { folderId, type: "text" })
          }
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t("apuntes_new_note", "Nueva nota")}
          className="bg-blue-600 dark:bg-blue-500 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        >
          <FilePlus color="#fff" size={24} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
