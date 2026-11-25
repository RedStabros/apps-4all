import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Share,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useNotesStore, ChecklistItem } from "../store/useNotesStore";
import {
  encryptPrivateText,
  decryptPrivateText,
  isEncryptedPayload,
} from "../utils/privateVault";
import MarkdownPreview from "../components/MarkdownPreview";
import {
  ChevronLeft,
  Share as ShareIcon,
  Pin,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Bold,
  Italic,
  Heading1,
  List,
  Image as ImageIcon,
  Eye,
  Edit3,
  X,
  Lock,
} from "lucide-react-native";

export default function EditorScreen({ route, navigation }: any) {
  const { noteId, folderId, type = "text" } = route.params;
  const { t } = useTranslation();
  const isDark = useColorScheme() === "dark";
  const accentHex = isDark ? "#60A5FA" : "#2563EB";
  const { notes, folders, saveNote, deleteNote } = useNotesStore();

  const existingNote = noteId ? notes.find((n) => n.id === noteId) : null;
  const targetFolderId = existingNote?.folderId ?? folderId ?? null;
  const isPrivateFolder = Boolean(
    targetFolderId && folders.find((f) => f.id === targetFolderId)?.isPrivate,
  );
  const initialType = existingNote?.type || type;

  const [id] = useState(
    existingNote?.id ||
      "n-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6),
  );
  const [title, setTitle] = useState(existingNote?.title || "");
  const [textContent, setTextContent] = useState(
    existingNote && !isEncryptedPayload(existingNote.textContent)
      ? existingNote.textContent
      : "",
  );
  const [listContent, setListContent] = useState<ChecklistItem[]>(
    existingNote?.listContent || [],
  );
  const [images, setImages] = useState<string[]>(existingNote?.images || []);
  const [isPinned, setIsPinned] = useState(existingNote?.isPinned || false);
  const [isPreview, setIsPreview] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(
    Boolean(
      existingNote &&
        (existingNote.isEncrypted ||
          isEncryptedPayload(existingNote.textContent)),
    ),
  );

  const isDeletedRef = useRef(false);
  const noteStateRef = useRef({ title, textContent, listContent, images, isPinned });

  useEffect(() => {
    noteStateRef.current = { title, textContent, listContent, images, isPinned };
  }, [title, textContent, listContent, images, isPinned]);

  // Decrypt private note content on mount
  useEffect(() => {
    let active = true;
    (async () => {
      if (!existingNote) return;
      if (
        existingNote.isEncrypted ||
        isEncryptedPayload(existingNote.textContent)
      ) {
        const plainText = await decryptPrivateText(existingNote.textContent);
        const decryptedList = await Promise.all(
          (existingNote.listContent || []).map(async (item) => ({
            ...item,
            text: await decryptPrivateText(item.text),
          })),
        );
        if (active) {
          setTextContent(plainText);
          setListContent(decryptedList);
          setIsDecrypting(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Auto-save on unmount (encrypts automatically if inside a private folder)
  useEffect(() => {
    return () => {
      if (isDeletedRef.current) return;
      const current = noteStateRef.current;
      if (
        !current.title.trim() &&
        !current.textContent.trim() &&
        current.listContent.length === 0 &&
        current.images.length === 0 &&
        !existingNote
      ) {
        return;
      }

      (async () => {
        const finalText = isPrivateFolder
          ? await encryptPrivateText(current.textContent)
          : current.textContent;
        const finalList = isPrivateFolder
          ? await Promise.all(
              current.listContent.map(async (item) => ({
                ...item,
                text: await encryptPrivateText(item.text),
              })),
            )
          : current.listContent;

        saveNote({
          id,
          folderId: targetFolderId,
          title: current.title,
          type: initialType,
          textContent: finalText,
          listContent: finalList,
          images: current.images,
          isEncrypted: isPrivateFolder,
          isPinned: current.isPinned,
        });
      })();
    };
  }, []);

  const appendMarkdown = (snippet: string) => {
    setIsPreview(false);
    setTextContent((prev) =>
      prev.length > 0 && !prev.endsWith("\n") && snippet.startsWith("\n")
        ? prev + snippet
        : prev + snippet,
    );
  };

  const handleAttachImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("apuntes_photo_perm_title", "Permiso de galería"),
          t(
            "apuntes_photo_perm_desc",
            "Autoriza el acceso a tus fotos para adjuntar imágenes locales a esta nota.",
          ),
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      const dir = `${FileSystem.documentDirectory}apuntes_images/`;
      const dirInfo = await FileSystem.getInfoAsync(dir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      }

      const ext = result.assets[0].uri.split(".").pop()?.split("?")[0] || "jpg";
      const dest = `${dir}img_${Date.now()}.${ext}`;
      await FileSystem.copyAsync({ from: result.assets[0].uri, to: dest });
      setImages((prev) => [...prev, dest]);
    } catch {
      Alert.alert(
        t("apuntes_photo_error_title", "No se pudo adjuntar la imagen"),
        t(
          "apuntes_photo_error_desc",
          "Intenta seleccionar otra foto desde tu galería.",
        ),
      );
    }
  };

  const handleRemoveImage = async (uri: string) => {
    setImages((prev) => prev.filter((img) => img !== uri));
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch {
      // Ignore cleanup failure
    }
  };

  const handleShare = async () => {
    let msg = title ? `📝 ${title}\n\n` : "";
    if (initialType === "text") {
      msg += textContent;
    } else {
      msg += listContent
        .map((i) => `${i.checked ? "[✅]" : "[ ]"} ${i.text}`)
        .join("\n");
    }

    try {
      await Share.share({ message: msg });
    } catch {
      // Cancelled by user
    }
  };

  const addListItem = () => {
    setListContent([
      ...listContent,
      {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        text: "",
        checked: false,
      },
    ]);
  };

  const updateListItem = (itemId: string, text: string) => {
    setListContent(
      listContent.map((i) => (i.id === itemId ? { ...i, text } : i)),
    );
  };

  const toggleListItem = (itemId: string) => {
    setListContent(
      listContent.map((i) =>
        i.id === itemId ? { ...i, checked: !i.checked } : i,
      ),
    );
  };

  const removeListItem = (itemId: string) => {
    setListContent(listContent.filter((i) => i.id !== itemId));
  };

  const handleDelete = () => {
    isDeletedRef.current = true;
    images.forEach((uri) => {
      FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
    });
    deleteNote(id);
    navigation.goBack();
  };

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      className="flex-1 bg-zinc-50 dark:bg-zinc-950"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-zinc-50 dark:bg-zinc-950"
      >
        {/* Header */}
        <View className="pt-2 pb-2 px-4 flex-row justify-between items-center bg-zinc-50 dark:bg-zinc-950">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t("back", "Volver")}
            className="flex-row items-center py-1 pr-2"
          >
            <ChevronLeft color={accentHex} size={28} />
            <Text className="text-blue-600 dark:text-blue-400 font-medium text-lg">
              {t("back", "Volver")}
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center gap-1">
            {isPrivateFolder && (
              <View className="flex-row items-center bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-full mr-1">
                <Lock color={accentHex} size={13} />
              </View>
            )}
            <TouchableOpacity
              onPress={() => setIsPinned(!isPinned)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t("apuntes_pinned", "Fijar nota")}
              className="p-2.5"
            >
              <Pin color={isPinned ? accentHex : "#a1a1aa"} size={22} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShare}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t("share", "Compartir")}
              className="p-2.5"
            >
              <ShareIcon color={accentHex} size={22} />
            </TouchableOpacity>
            {existingNote && (
              <TouchableOpacity
                onPress={handleDelete}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t("delete", "Eliminar")}
                className="p-2.5"
              >
                <Trash2 color="#ef4444" size={22} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Markdown + Image Toolbar (Text notes) */}
        {initialType === "text" && (
          <View className="px-4 py-2 border-y border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex-row items-center justify-between">
            <View className="flex-row items-center gap-1">
              <TouchableOpacity
                onPress={() => appendMarkdown("**texto**")}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t("apuntes_md_bold", "Negrita")}
                className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800"
              >
                <Bold color={isDark ? "#e4e4e7" : "#27272a"} size={16} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => appendMarkdown("*texto*")}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t("apuntes_md_italic", "Cursiva")}
                className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800"
              >
                <Italic color={isDark ? "#e4e4e7" : "#27272a"} size={16} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => appendMarkdown("\n# ")}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t("apuntes_md_heading", "Título")}
                className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800"
              >
                <Heading1 color={isDark ? "#e4e4e7" : "#27272a"} size={16} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => appendMarkdown("\n- ")}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t("apuntes_md_list", "Lista")}
                className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800"
              >
                <List color={isDark ? "#e4e4e7" : "#27272a"} size={16} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAttachImage}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t("apuntes_attach_image", "Adjuntar imagen")}
                className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50"
              >
                <ImageIcon color={accentHex} size={16} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setIsPreview(!isPreview)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={
                isPreview
                  ? t("apuntes_edit_mode", "Editar")
                  : t("apuntes_preview_mode", "Vista previa")
              }
              className="flex-row items-center px-3 py-2 rounded-xl bg-blue-600"
            >
              {isPreview ? (
                <>
                  <Edit3 color="#ffffff" size={14} />
                  <Text className="text-white font-bold text-xs ml-1.5">
                    {t("apuntes_edit_mode", "Editar")}
                  </Text>
                </>
              ) : (
                <>
                  <Eye color="#ffffff" size={14} />
                  <Text className="text-white font-bold text-xs ml-1.5">
                    {t("apuntes_preview_mode", "Vista")}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View className="flex-1 px-6">
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t("apuntes_title_ph", "Título...")}
            placeholderTextColor="#a1a1aa"
            className="text-3xl font-black text-zinc-900 dark:text-white py-4"
            multiline
          />

          {/* Attached Local Images Strip */}
          {images.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="max-h-28 mb-3"
            >
              {images.map((uri) => (
                <View key={uri} className="mr-3 relative">
                  <Image
                    source={{ uri }}
                    className="w-24 h-24 rounded-2xl bg-zinc-200 dark:bg-zinc-800"
                  />
                  <TouchableOpacity
                    onPress={() => handleRemoveImage(uri)}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={t("delete", "Eliminar")}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500 items-center justify-center shadow"
                  >
                    <X color="#ffffff" size={13} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          {isDecrypting ? (
            <Text className="text-zinc-400 text-sm py-4">
              {t("apuntes_decrypting", "Descifrando nota privada...")}
            </Text>
          ) : initialType === "text" ? (
            isPreview ? (
              <ScrollView className="flex-1">
                <MarkdownPreview
                  content={textContent}
                  emptyText={t("apuntes_write_ph", "Empieza a escribir...")}
                />
              </ScrollView>
            ) : (
              <TextInput
                value={textContent}
                onChangeText={setTextContent}
                placeholder={t("apuntes_write_ph", "Empieza a escribir...")}
                placeholderTextColor="#a1a1aa"
                className="flex-1 text-lg text-zinc-900 dark:text-zinc-300"
                multiline
                textAlignVertical="top"
              />
            )
          ) : (
            <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
              {listContent.map((item) => (
                <View key={item.id} className="flex-row items-center mb-3">
                  <TouchableOpacity
                    onPress={() => toggleListItem(item.id)}
                    accessible={true}
                    accessibilityRole="checkbox"
                    accessibilityLabel={item.text || t("apuntes_add_item", "Ítem")}
                    className="mr-3 p-2"
                  >
                    {item.checked ? (
                      <CheckSquare color={accentHex} size={24} />
                    ) : (
                      <Square color="#a1a1aa" size={24} />
                    )}
                  </TouchableOpacity>
                  <TextInput
                    value={item.text}
                    onChangeText={(val) => updateListItem(item.id, val)}
                    placeholder={t("apuntes_add_item", "Ítem")}
                    placeholderTextColor="#a1a1aa"
                    className={`flex-1 text-lg ${item.checked ? "text-zinc-400 line-through" : "text-zinc-900 dark:text-white"}`}
                    multiline
                  />
                  <TouchableOpacity
                    onPress={() => removeListItem(item.id)}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={t("delete", "Eliminar")}
                    className="ml-2 p-2"
                  >
                    <Trash2 color="#a1a1aa" size={20} />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                onPress={addListItem}
                className="flex-row items-center mt-2 p-2.5"
              >
                <Plus color={accentHex} size={24} />
                <Text className="ml-2 text-blue-600 dark:text-blue-400 font-medium text-lg">
                  {t("apuntes_add_item", "Agregar ítem...")}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
