import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useTranslation } from "react-i18next";
import i18n from "@apps4all/i18n";
import { SettingsModal4All } from "@apps4all/ui-components";
import {
  FileText,
  FileSpreadsheet,
  X,
  Search,
  Printer,
  Layers,
  Settings,
  History,
  Minus,
  Plus,
} from "lucide-react-native";

// Parsers
import * as mammoth from "mammoth";
import * as XLSX from "xlsx";
import { Buffer } from "buffer";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const RECENTS_STORAGE_KEY = "4all_docs_recent_v1";

interface RecentDoc {
  name: string;
  type: "docx" | "xlsx" | "text";
  openedAt: number;
}

const escapeHtml = (str: string) =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export default function MainScreen() {
  const { t } = useTranslation();
  const isDark = useColorScheme() === "dark";
  const accentHex = isDark ? "#60A5FA" : "#2563EB";

  const [isProcessing, setIsProcessing] = useState(false);
  const [docContent, setDocContent] = useState<string | null>(null);
  const [excelData, setExcelData] = useState<any[][] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<"docx" | "xlsx" | "text" | null>(
    null,
  );
  const [fontSize, setFontSize] = useState(15);
  const [recents, setRecents] = useState<RecentDoc[]>([]);

  // Search inside document
  const [searchKeyword, setSearchKeyword] = useState("");

  // Multi-sheet Excel support
  const [sheetsList, setSheetsList] = useState<string[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [cachedWorkbook, setCachedWorkbook] = useState<XLSX.WorkBook | null>(
    null,
  );
  const [settingsVisible, setSettingsVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(RECENTS_STORAGE_KEY)
      .then((raw) => {
        if (raw) setRecents(JSON.parse(raw));
      })
      .catch(() => {});
  }, []);

  const recordRecent = (name: string, type: "docx" | "xlsx" | "text") => {
    setRecents((prev) => {
      const next = [
        { name, type, openedAt: Date.now() },
        ...prev.filter((r) => r.name !== name),
      ].slice(0, 8);
      AsyncStorage.setItem(RECENTS_STORAGE_KEY, JSON.stringify(next)).catch(
        () => {},
      );
      return next;
    });
  };

  const clearRecents = () => {
    setRecents([]);
    AsyncStorage.removeItem(RECENTS_STORAGE_KEY).catch(() => {});
  };

  const handleOpenDoc = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "text/csv",
          "text/plain",
          "text/markdown",
          "application/msword",
          "application/vnd.ms-excel",
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || result.assets.length === 0) return;

      const file = result.assets[0];
      const name = file.name.toLowerCase();

      // 1. Format Check (Block Legacy binary .doc / .xls)
      if (name.endsWith(".doc") || name.endsWith(".xls")) {
        Alert.alert(
          t("docs_err_format_title", "Formato antiguo no compatible"),
          t(
            "docs_error_format",
            "Guarda el archivo como .docx o .xlsx para abrirlo sin pérdida de datos.",
          ),
        );
        return;
      }

      // 2. Memory Shield (10MB Limit)
      if (file.size && file.size > MAX_FILE_SIZE) {
        Alert.alert(
          t("docs_err_size_title", "Archivo demasiado grande"),
          t(
            "docs_error_size",
            "Para proteger la memoria de tu teléfono, abre documentos de máximo 10 MB.",
          ),
        );
        return;
      }

      setIsProcessing(true);
      setFileName(file.name);
      setSearchKeyword("");

      if (name.endsWith(".txt") || name.endsWith(".md")) {
        const text = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        setFileType("text");
        setDocContent(
          text || t("docs_empty_doc", "No se encontró texto en el documento."),
        );
        setExcelData(null);
        setSheetsList([]);
        setCachedWorkbook(null);
        recordRecent(file.name, "text");
      } else if (name.endsWith(".docx")) {
        const fileBase64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const buffer = Buffer.from(fileBase64, "base64");
        setFileType("docx");
        const { value } = await mammoth.extractRawText({ buffer });
        setDocContent(
          value || t("docs_empty_doc", "No se encontró texto en el documento."),
        );
        setExcelData(null);
        setSheetsList([]);
        setCachedWorkbook(null);
        recordRecent(file.name, "docx");
      } else if (name.endsWith(".xlsx") || name.endsWith(".csv")) {
        const fileBase64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const buffer = Buffer.from(fileBase64, "base64");
        setFileType("xlsx");
        const workbook = XLSX.read(buffer, {
          type: "buffer",
          codepage: 65001,
          cellFormula: false,
          cellHTML: false,
          cellText: false,
        });
        setCachedWorkbook(workbook);
        setSheetsList(workbook.SheetNames);
        setActiveSheetIndex(0);

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(firstSheet, {
          header: 1,
        }) as any[][];
        setExcelData(data);
        setDocContent(null);
        recordRecent(file.name, "xlsx");
      } else {
        setFileName(null);
        Alert.alert(
          t("docs_err_format_title", "Formato no compatible"),
          t(
            "docs_err_unsupported_desc",
            "Formatos soportados: .docx, .xlsx, .csv, .txt y .md.",
          ),
        );
      }
    } catch {
      setFileName(null);
      Alert.alert(
        t("docs_err_read_title", "No se pudo leer el documento"),
        t(
          "docs_err_read_desc",
          "El archivo puede estar dañado o protegido con contraseña. Prueba con otro archivo.",
        ),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const switchSheet = (index: number) => {
    if (!cachedWorkbook || !sheetsList[index]) return;
    setActiveSheetIndex(index);
    const sheetName = sheetsList[index];
    const worksheet = cachedWorkbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    setExcelData(data);
  };

  const closeDocument = () => {
    setDocContent(null);
    setExcelData(null);
    setFileName(null);
    setFileType(null);
    setSheetsList([]);
    setCachedWorkbook(null);
    setSearchKeyword("");
  };

  // EXPORT TO PDF via expo-print
  const handleExportToPDF = async () => {
    try {
      setIsProcessing(true);
      let html = "";

      if ((fileType === "docx" || fileType === "text") && docContent) {
        const safeName = escapeHtml(fileName || "Documento");
        const safeContent = escapeHtml(docContent);
        html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>${safeName}</title>
              <style>
                body { font-family: -apple-system, sans-serif; padding: 40px; line-height: 1.6; color: #18181b; }
                h1 { color: #2563eb; font-size: 20px; border-bottom: 2px solid #e4e4e7; padding-bottom: 10px; margin-bottom: 20px; }
                p { font-size: 13px; margin-bottom: 12px; white-space: pre-wrap; }
              </style>
            </head>
            <body>
              <h1>${safeName}</h1>
              <p>${safeContent}</p>
            </body>
          </html>
        `;
      } else if (fileType === "xlsx" && excelData) {
        const safeName = escapeHtml(fileName || "Libro Excel");
        const currentSheetName = escapeHtml(
          sheetsList[activeSheetIndex] || "Hoja 1",
        );
        let tableRows = "";
        excelData.forEach((row) => {
          tableRows += "<tr>";
          row.forEach((cell: any) => {
            const safeCell =
              cell !== undefined && cell !== null
                ? escapeHtml(String(cell))
                : "";
            tableRows += `<td>${safeCell}</td>`;
          });
          tableRows += "</tr>";
        });

        html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>${safeName} - ${currentSheetName}</title>
              <style>
                body { font-family: -apple-system, sans-serif; padding: 25px; color: #18181b; }
                h1 { font-size: 18px; color: #2563eb; margin-bottom: 4px; }
                h2 { font-size: 13px; color: #71717a; margin-top: 0; margin-bottom: 15px; }
                table { width: 100%; border-collapse: collapse; font-size: 10px; font-family: monospace; }
                th, td { border: 1px solid #d4d4d8; padding: 6px 8px; text-align: left; }
                tr:nth-child(even) { background-color: #f4f4f5; }
              </style>
            </head>
            <body>
              <h1>${safeName}</h1>
              <h2>${currentSheetName}</h2>
              <table>
                ${tableRows}
              </table>
            </body>
          </html>
        `;
      }

      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert(t("docs_pdf_created", "PDF Creado"), uri);
      }
    } catch {
      Alert.alert(
        t("docs_err_export_title", "No se pudo exportar a PDF"),
        t(
          "docs_err_export_desc",
          "Verifica el espacio disponible en tu dispositivo e intenta de nuevo.",
        ),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Render Word / Text / Markdown document with real-time text highlight and font zoom
  const renderTextContent = () => {
    if (!docContent) return null;

    const paragraphs = docContent.split("\n");
    const query = searchKeyword.trim().toLowerCase();

    return (
      <ScrollView className="flex-1 p-5">
        {paragraphs.map((p, idx) => {
          if (!p.trim()) return <View key={idx} className="h-2" />;
          const matches = query && p.toLowerCase().includes(query);

          return (
            <Text
              key={idx}
              style={{ fontSize, lineHeight: Math.round(fontSize * 1.6) }}
              className={`mb-2.5 ${
                matches
                  ? "bg-amber-200 dark:bg-amber-900/60 text-zinc-900 dark:text-white font-bold px-1.5 py-0.5 rounded"
                  : "text-zinc-800 dark:text-zinc-200"
              }`}
            >
              {p}
            </Text>
          );
        })}
      </ScrollView>
    );
  };

  // Render Excel grid with multi-sheet and cell search highlight
  const renderExcelGrid = () => {
    if (!excelData || excelData.length === 0) {
      return (
        <Text className="p-6 text-zinc-400 text-center">
          {t("docs_empty_sheet", "Hoja vacía sin datos.")}
        </Text>
      );
    }

    const query = searchKeyword.trim().toLowerCase();
    const MAX_PREVIEW_ROWS = 150;
    const displayedRows = excelData.slice(0, MAX_PREVIEW_ROWS);

    return (
      <View className="flex-1">
        <ScrollView horizontal className="flex-1">
          <ScrollView className="flex-1 p-2">
            {displayedRows.map((row, rIdx) => {
              const rowMatches =
                query &&
                row.some((cell: any) =>
                  String(cell || "")
                    .toLowerCase()
                    .includes(query),
                );

              return (
                <View
                  key={rIdx}
                  className={`flex-row border-b border-zinc-200 dark:border-zinc-800 ${
                    rIdx === 0
                      ? "bg-zinc-100 dark:bg-zinc-800"
                      : rowMatches
                        ? "bg-amber-500/10"
                        : "bg-transparent"
                  }`}
                >
                  <View className="w-10 p-2 items-center justify-center border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                    <Text className="text-[10px] text-zinc-400 font-mono font-bold">
                      {rIdx + 1}
                    </Text>
                  </View>

                  {row.map((cell: any, cIdx: number) => {
                    const strVal =
                      cell !== undefined && cell !== null ? String(cell) : "";
                    const cellMatches =
                      query && strVal.toLowerCase().includes(query);

                    return (
                      <View
                        key={cIdx}
                        className={`w-32 p-2 border-r border-zinc-200 dark:border-zinc-800 justify-center ${
                          cellMatches ? "bg-amber-300 dark:bg-amber-600/60" : ""
                        }`}
                      >
                        <Text
                          className={`text-xs font-mono ${
                            rIdx === 0
                              ? "font-black text-blue-600 dark:text-blue-400"
                              : "text-zinc-800 dark:text-zinc-200"
                          }`}
                          numberOfLines={1}
                        >
                          {strVal}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              );
            })}

            {excelData.length > MAX_PREVIEW_ROWS && (
              <View className="py-3 items-center border-t border-zinc-200 dark:border-zinc-800">
                <Text className="text-xs text-zinc-500 font-medium">
                  {t(
                    "docs_showing_rows",
                    `Mostrando ${MAX_PREVIEW_ROWS} de ${excelData.length} filas. Exporta a PDF para el documento completo.`,
                    { rows: MAX_PREVIEW_ROWS, total: excelData.length },
                  )}
                </Text>
              </View>
            )}
          </ScrollView>
        </ScrollView>

        {sheetsList.length > 1 && (
          <View className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 py-2.5 px-4 flex-row items-center">
            <Layers color="#71717a" size={16} className="mr-2" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {sheetsList.map((sheet, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => switchSheet(index)}
                  className={`px-3 py-1.5 mr-2 rounded-xl border ${
                    activeSheetIndex === index
                      ? "bg-blue-600 border-blue-600"
                      : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      activeSheetIndex === index
                        ? "text-white"
                        : "text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    {sheet}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 bg-white dark:bg-zinc-900"
    >
      <View className="flex-1 bg-zinc-50 dark:bg-zinc-950">
        {/* Header */}
        <View className="pt-3 pb-4 px-6 flex-row justify-between items-center bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
          <View className="flex-1 mr-3">
            <Text
              className="text-2xl font-black text-zinc-900 dark:text-white"
              numberOfLines={1}
            >
              {fileName || t("docs_title", "Docs 4All")}
            </Text>
            <Text className="text-zinc-400 text-xs font-bold">
              {fileName
                ? fileType === "docx"
                  ? t("docs_word_doc", "Documento Word")
                  : fileType === "text"
                    ? t("docs_text_doc", "Texto / Markdown")
                    : t("docs_excel_doc", "Libro Excel")
                : t("docs_subtitle", "Visor Ligero")}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            {fileName && (
              <>
                <TouchableOpacity
                  onPress={handleExportToPDF}
                  className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-500/20"
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={t("docs_export_pdf", "Exportar a PDF")}
                >
                  <Printer color={accentHex} size={18} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={closeDocument}
                  className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl"
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={t("docs_close", "Cerrar Documento")}
                >
                  <X color="#71717a" size={18} />
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              onPress={() => setSettingsVisible(true)}
              className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full"
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t("settings", "Ajustes")}
            >
              <Settings color={accentHex} size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content Area */}
        {isProcessing ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={accentHex} />
            <Text className="text-zinc-500 mt-4 font-medium">
              {t("docs_processing", "Procesando documento...")}
            </Text>
          </View>
        ) : fileName ? (
          <View className="flex-1">
            {/* Real-time Document Search Bar + Font Size Zoom (for text/docx) */}
            <View className="px-4 py-2.5 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex-row items-center gap-2">
              <View className="flex-1 flex-row items-center bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-1.5">
                <Search color="#71717a" size={16} />
                <TextInput
                  value={searchKeyword}
                  onChangeText={setSearchKeyword}
                  placeholder={t("docs_search_in_doc", "Buscar en documento...")}
                  placeholderTextColor="#a1a1aa"
                  className="flex-1 ml-2 text-xs font-medium text-zinc-900 dark:text-white py-0.5"
                />
                {searchKeyword.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchKeyword("")}
                    className="p-1"
                  >
                    <X color="#a1a1aa" size={14} />
                  </TouchableOpacity>
                )}
              </View>

              {(fileType === "docx" || fileType === "text") && (
                <View className="flex-row items-center gap-1">
                  <TouchableOpacity
                    onPress={() => setFontSize((s) => Math.max(12, s - 2))}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={t("docs_zoom_out", "Reducir texto")}
                    className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl"
                  >
                    <Minus color={accentHex} size={15} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setFontSize((s) => Math.min(24, s + 2))}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={t("docs_zoom_in", "Aumentar texto")}
                    className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl"
                  >
                    <Plus color={accentHex} size={15} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {fileType === "xlsx" ? renderExcelGrid() : renderTextContent()}
          </View>
        ) : (
          <ScrollView
            className="flex-1 px-6"
            contentContainerStyle={{ paddingVertical: 32, alignItems: "center" }}
          >
            <View className="flex-row mb-6 gap-3">
              <View className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/40 items-center justify-center border border-blue-500/20">
                <FileText color={accentHex} size={30} />
              </View>
              <View className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/40 items-center justify-center border border-blue-500/20">
                <FileSpreadsheet color={accentHex} size={30} />
              </View>
            </View>

            <Text className="text-xl font-black text-zinc-900 dark:text-white mb-2 text-center">
              {t("docs_hero_title", "Visor Universal Offline")}
            </Text>
            <Text className="text-zinc-400 text-xs text-center mb-8 max-w-xs leading-5">
              {t(
                "docs_open_desc_v2",
                "Soporta .docx, .xlsx, .csv, .txt y .md (Máx 10 MB). 100% local en tu dispositivo.",
              )}
            </Text>

            <TouchableOpacity
              onPress={handleOpenDoc}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t("docs_open", "Abrir Documento")}
              className="w-full max-w-xs py-4 rounded-2xl bg-blue-600 items-center justify-center shadow-lg mb-10"
            >
              <Text className="text-white font-black text-base">
                {t("docs_open", "Abrir Documento")}
              </Text>
            </TouchableOpacity>

            {/* Recent Documents History */}
            {recents.length > 0 && (
              <View className="w-full">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <History size={15} color="#71717a" />
                    <Text className="ml-2 text-xs font-bold uppercase text-zinc-400 tracking-wider">
                      {t("docs_recent", "Documentos Recientes")}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={clearRecents} className="p-1">
                    <Text className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      {t("clear", "Borrar")}
                    </Text>
                  </TouchableOpacity>
                </View>

                {recents.map((item, idx) => (
                  <View
                    key={`${item.name}-${idx}`}
                    className="bg-white dark:bg-zinc-900 p-3.5 rounded-2xl mb-2 flex-row items-center justify-between border border-zinc-200 dark:border-zinc-800"
                  >
                    <View className="flex-row items-center flex-1 mr-2">
                      {item.type === "xlsx" ? (
                        <FileSpreadsheet color={accentHex} size={18} />
                      ) : (
                        <FileText color={accentHex} size={18} />
                      )}
                      <Text
                        className="ml-2.5 text-sm font-bold text-zinc-800 dark:text-zinc-200 flex-1"
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                    </View>
                    <Text className="text-[11px] text-zinc-400 font-mono">
                      {new Date(item.openedAt).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}

        <SettingsModal4All
          visible={settingsVisible}
          onClose={() => setSettingsVisible(false)}
          appName="Docs 4All"
          accentColor="#2563EB"
          i18nInstance={i18n}
        />
      </View>
    </SafeAreaView>
  );
}
