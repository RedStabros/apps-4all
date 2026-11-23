import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
  Modal,
  KeyboardAvoidingView,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as IntentLauncher from "expo-intent-launcher";
import { useTranslation } from "react-i18next";
import i18n from "@apps4all/i18n";
import { SettingsModal4All } from "@apps4all/ui-components";
import {
  BookOpen,
  Scan,
  CopyPlus,
  Scissors,
  Share,
  X,
  RotateCw,
  Stamp,
  FileCheck,
  Settings,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Minimize2,
} from "lucide-react-native";

// PDF Lib for 100% Local Offline Processing
import { PDFDocument, degrees, rgb, StandardFonts } from "pdf-lib";
import DocumentScanner from "react-native-document-scanner-plugin";

export default function MainScreen() {
  const { t } = useTranslation();
  const isDark = useColorScheme() === "dark";
  const accentHex = isDark ? "#60A5FA" : "#2563EB";

  const [isProcessing, setIsProcessing] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [outputFile, setOutputFile] = useState<string | null>(null);
  const [outputMeta, setOutputMeta] = useState<string | null>(null);

  // Split modal state
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitSourceUri, setSplitSourceUri] = useState<string | null>(null);
  const [splitPages, setSplitPages] = useState("");

  // Watermark modal state
  const [showWatermarkModal, setShowWatermarkModal] = useState(false);
  const [watermarkSourceUri, setWatermarkSourceUri] = useState<string | null>(
    null,
  );
  const [watermarkText, setWatermarkText] = useState("CONFIDENCIAL");

  // Organize (Reorder / Delete pages) modal state
  const [showOrganizeModal, setShowOrganizeModal] = useState(false);
  const [organizeSourceUri, setOrganizeSourceUri] = useState<string | null>(
    null,
  );
  const [organizePages, setOrganizePages] = useState<number[]>([]);

  const formatKB = (bytes: number) =>
    bytes >= 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toFixed(2)} MB`
      : `${Math.max(1, Math.round(bytes / 1024))} KB`;

  // 1. READ PDF
  const handleReadPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (result.canceled || result.assets.length === 0) return;
      const uri = result.assets[0].uri;

      if (Platform.OS === "android") {
        try {
          const contentUri = await FileSystem.getContentUriAsync(uri);
          await IntentLauncher.startActivityAsync(
            "android.intent.action.VIEW",
            {
              data: contentUri,
              flags: 1,
              type: "application/pdf",
            },
          );
        } catch {
          await Sharing.shareAsync(uri);
        }
      } else {
        await Sharing.shareAsync(uri);
      }
    } catch {
      Alert.alert(
        t("pdf_err_open_title", "No se pudo abrir el PDF"),
        t(
          "pdf_err_open_desc",
          "El archivo podría estar dañado o protegido con contraseña. Prueba con otro documento.",
        ),
      );
    }
  };

  // 2. SCAN OR IMPORT IMAGES TO PDF
  const createPdfFromImageUris = async (uris: string[]) => {
    setIsProcessing(true);
    setOutputMeta(null);
    try {
      const pdfDoc = await PDFDocument.create();

      for (const imagePath of uris) {
        const imageBase64 = await FileSystem.readAsStringAsync(imagePath, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const isPng = imagePath.toLowerCase().endsWith(".png");
        let image;
        try {
          image = isPng
            ? await pdfDoc.embedPng(imageBase64)
            : await pdfDoc.embedJpg(imageBase64);
        } catch {
          try {
            image = await pdfDoc.embedJpg(imageBase64);
          } catch {
            image = await pdfDoc.embedPng(imageBase64);
          }
        }

        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }

      const pdfBase64 = await pdfDoc.saveAsBase64();
      const targetPath = `${FileSystem.documentDirectory}scanned_${Date.now()}.pdf`;
      await FileSystem.writeAsStringAsync(targetPath, pdfBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      setOutputFile(targetPath);
      Alert.alert(t("pdf_done", "¡Listo! PDF generado."));
    } catch {
      Alert.alert(
        t("pdf_err_create_title", "No se pudo crear el PDF"),
        t(
          "pdf_err_create_desc",
          "Usa imágenes JPG o PNG válidas y verifica el espacio disponible en tu dispositivo.",
        ),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScanWithCamera = async () => {
    try {
      setIsProcessing(true);
      const { scannedImages } = await DocumentScanner.scanDocument({
        croppedImageQuality: 90,
      });

      if (scannedImages && scannedImages.length > 0) {
        await createPdfFromImageUris(scannedImages);
      }
    } catch (e: any) {
      if (e?.message && e.message.includes("Native module cannot be null")) {
        Alert.alert(
          t("pdf_camera", "Escáner nativo"),
          t(
            "pdf_error_expo",
            "El escáner de cámara requiere el APK nativo. Puedes usar 'Galería / Archivos' directamente.",
          ),
        );
      } else {
        Alert.alert(
          t("pdf_err_scan_title", "No se completó el escaneo"),
          t(
            "pdf_err_scan_desc",
            "Revisa el permiso de cámara o importa las fotos desde tu galería.",
          ),
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePickImagesFromGallery = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/jpeg", "image/png"],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled || result.assets.length === 0) return;
      await createPdfFromImageUris(result.assets.map((a) => a.uri));
    } catch {
      Alert.alert(
        t("pdf_err_gallery_title", "No se pudieron importar las fotos"),
        t(
          "pdf_err_gallery_desc",
          "Selecciona imágenes JPG o PNG desde tu dispositivo e intenta de nuevo.",
        ),
      );
    }
  };

  const handleScanToPDF = () => {
    Alert.alert(
      t("pdf_choose_source", "Seleccionar Origen"),
      t("pdf_choose_source_desc", "¿Cómo deseas añadir las páginas?"),
      [
        {
          text: t("pdf_camera", "Escanear Cámara"),
          onPress: handleScanWithCamera,
        },
        {
          text: t("pdf_gallery", "Galería / Archivos"),
          onPress: handlePickImagesFromGallery,
        },
        { text: t("cancel", "Cancelar"), style: "cancel" },
      ],
    );
  };

  // 3. MERGE PDFs
  const handleMergePDFs = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      if (result.assets.length < 2) {
        Alert.alert(
          t("pdf_merge", "Unir PDFs"),
          t(
            "pdf_merge_min_two",
            "Selecciona al menos 2 archivos PDF para combinarlos en uno solo.",
          ),
        );
        return;
      }

      setIsProcessing(true);
      setOutputMeta(null);
      const mergedPdf = await PDFDocument.create();

      for (const asset of result.assets) {
        const fileBase64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const pdf = await PDFDocument.load(fileBase64);
        const copiedPages = await mergedPdf.copyPages(
          pdf,
          pdf.getPageIndices(),
        );
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedBase64 = await mergedPdf.saveAsBase64();
      const targetPath = `${FileSystem.documentDirectory}merged_${Date.now()}.pdf`;
      await FileSystem.writeAsStringAsync(targetPath, mergedBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      setOutputFile(targetPath);
      Alert.alert(t("pdf_done", "¡Listo! Documentos unidos."));
    } catch {
      Alert.alert(
        t("pdf_err_merge_title", "No se pudieron unir los PDFs"),
        t(
          "pdf_err_merge_desc",
          "Asegúrate de que ninguno de los archivos esté protegido con contraseña o dañado.",
        ),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. SPLIT PDF
  const handleStartSplit = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (result.canceled || result.assets.length === 0) return;

      setSplitSourceUri(result.assets[0].uri);
      setSplitPages("");
      setShowSplitModal(true);
    } catch {
      // Cancelled
    }
  };

  const executeSplit = async () => {
    if (!splitSourceUri || !splitPages) return;
    setShowSplitModal(false);
    setIsProcessing(true);
    setOutputMeta(null);

    try {
      const fileBase64 = await FileSystem.readAsStringAsync(splitSourceUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const sourcePdf = await PDFDocument.load(fileBase64);
      const newPdf = await PDFDocument.create();

      const totalPages = sourcePdf.getPageCount();
      const pagesToExtract = new Set<number>();

      const parts = splitPages.replace(/\s/g, "").split(",");
      for (const part of parts) {
        if (part.includes("-")) {
          const [startStr, endStr] = part.split("-");
          const start = parseInt(startStr, 10);
          const end = parseInt(endStr, 10);
          if (
            !isNaN(start) &&
            !isNaN(end) &&
            start > 0 &&
            end <= totalPages &&
            start <= end
          ) {
            for (let i = start; i <= end; i++) pagesToExtract.add(i - 1);
          }
        } else {
          const pageNum = parseInt(part, 10);
          if (!isNaN(pageNum) && pageNum > 0 && pageNum <= totalPages) {
            pagesToExtract.add(pageNum - 1);
          }
        }
      }

      if (pagesToExtract.size === 0) {
        Alert.alert(
          t("pdf_err_range_title", "Rango fuera de límites"),
          t(
            "pdf_err_range_desc",
            `Este documento tiene ${totalPages} páginas. Usa un formato como "1, 3, 5-7".`,
            { total: totalPages },
          ),
        );
        setIsProcessing(false);
        return;
      }

      const indices = Array.from(pagesToExtract).sort((a, b) => a - b);
      const copiedPages = await newPdf.copyPages(sourcePdf, indices);
      copiedPages.forEach((page) => newPdf.addPage(page));

      const splitBase64 = await newPdf.saveAsBase64();
      const targetPath = `${FileSystem.documentDirectory}extracted_${Date.now()}.pdf`;
      await FileSystem.writeAsStringAsync(targetPath, splitBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      setOutputFile(targetPath);
      Alert.alert(t("pdf_done", "¡Listo! Páginas extraídas."));
    } catch {
      Alert.alert(
        t("pdf_err_split_title", "No se pudieron extraer las páginas"),
        t(
          "pdf_err_split_desc",
          "Verifica que el PDF no esté cifrado con contraseña e intenta de nuevo.",
        ),
      );
    } finally {
      setIsProcessing(false);
      setSplitSourceUri(null);
    }
  };

  // 5. ROTATE PAGES (90° Clockwise)
  const handleRotatePDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (result.canceled || result.assets.length === 0) return;
      setIsProcessing(true);
      setOutputMeta(null);

      const fileBase64 = await FileSystem.readAsStringAsync(
        result.assets[0].uri,
        { encoding: FileSystem.EncodingType.Base64 },
      );
      const pdf = await PDFDocument.load(fileBase64);

      pdf.getPages().forEach((page) => {
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees((currentRotation + 90) % 360));
      });

      const rotatedBase64 = await pdf.saveAsBase64();
      const targetPath = `${FileSystem.documentDirectory}rotated_${Date.now()}.pdf`;
      await FileSystem.writeAsStringAsync(targetPath, rotatedBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      setOutputFile(targetPath);
      Alert.alert(t("pdf_done", "¡Listo! Páginas giradas 90°."));
    } catch {
      Alert.alert(
        t("pdf_err_rotate_title", "No se pudo girar el documento"),
        t(
          "pdf_err_rotate_desc",
          "El PDF puede estar protegido contra edición o dañado.",
        ),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // 6. WATERMARK TEXT
  const handleStartWatermark = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (result.canceled || result.assets.length === 0) return;
      setWatermarkSourceUri(result.assets[0].uri);
      setShowWatermarkModal(true);
    } catch {
      // Cancelled
    }
  };

  const executeWatermark = async () => {
    if (!watermarkSourceUri || !watermarkText.trim()) return;
    setShowWatermarkModal(false);
    setIsProcessing(true);
    setOutputMeta(null);

    try {
      const fileBase64 = await FileSystem.readAsStringAsync(
        watermarkSourceUri,
        { encoding: FileSystem.EncodingType.Base64 },
      );
      const pdf = await PDFDocument.load(fileBase64);
      const helveticaFont = await pdf.embedFont(StandardFonts.HelveticaBold);

      let cleanText = watermarkText
        .trim()
        .normalize("NFKD")
        .replace(/[^\x20-\x7E\xA0-\xFF]/g, "");
      if (!cleanText) cleanText = "CONFIDENCIAL";

      pdf.getPages().forEach((page) => {
        const { width, height } = page.getSize();
        const fontSize = 42;
        let textWidth = 200;
        try {
          textWidth = helveticaFont.widthOfTextAtSize(cleanText, fontSize);
        } catch {
          cleanText = "CONFIDENCIAL";
          textWidth = helveticaFont.widthOfTextAtSize(cleanText, fontSize);
        }

        page.drawText(cleanText, {
          x: Math.max(10, (width - textWidth) / 2),
          y: height / 2,
          size: fontSize,
          font: helveticaFont,
          color: rgb(0.8, 0.1, 0.1),
          opacity: 0.22,
          rotate: degrees(45),
        });
      });

      const stampedBase64 = await pdf.saveAsBase64();
      const targetPath = `${FileSystem.documentDirectory}watermarked_${Date.now()}.pdf`;
      await FileSystem.writeAsStringAsync(targetPath, stampedBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      setOutputFile(targetPath);
      Alert.alert(t("pdf_done", "¡Listo! Marca de agua aplicada."));
    } catch {
      Alert.alert(
        t("pdf_err_watermark_title", "No se pudo aplicar la marca de agua"),
        t(
          "pdf_err_watermark_desc",
          "Verifica que el PDF no esté cifrado e intenta con texto estándar.",
        ),
      );
    } finally {
      setIsProcessing(false);
      setWatermarkSourceUri(null);
    }
  };

  // 7. ORGANIZE (REORDER / DELETE PAGES — Lightweight, zero RAM thumbnails)
  const handleStartOrganize = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });
      if (result.canceled || result.assets.length === 0) return;

      setIsProcessing(true);
      const uri = result.assets[0].uri;
      const fileBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const pdf = await PDFDocument.load(fileBase64);
      const count = pdf.getPageCount();
      setOrganizeSourceUri(uri);
      setOrganizePages(Array.from({ length: count }, (_, i) => i));
      setShowOrganizeModal(true);
    } catch {
      Alert.alert(
        t("pdf_err_open_title", "No se pudo abrir el PDF"),
        t(
          "pdf_err_open_desc",
          "El archivo podría estar dañado o protegido con contraseña.",
        ),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const moveOrganizePage = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= organizePages.length) return;
    const copy = [...organizePages];
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    setOrganizePages(copy);
  };

  const removeOrganizePage = (idx: number) => {
    if (organizePages.length <= 1) return;
    setOrganizePages(organizePages.filter((_, i) => i !== idx));
  };

  const executeOrganize = async () => {
    if (!organizeSourceUri || organizePages.length === 0) return;
    setShowOrganizeModal(false);
    setIsProcessing(true);
    setOutputMeta(null);

    try {
      const fileBase64 = await FileSystem.readAsStringAsync(organizeSourceUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const sourcePdf = await PDFDocument.load(fileBase64);
      const newPdf = await PDFDocument.create();
      const copied = await newPdf.copyPages(sourcePdf, organizePages);
      copied.forEach((p) => newPdf.addPage(p));

      const outBase64 = await newPdf.saveAsBase64({ useObjectStreams: true });
      const targetPath = `${FileSystem.documentDirectory}organized_${Date.now()}.pdf`;
      await FileSystem.writeAsStringAsync(targetPath, outBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      setOutputFile(targetPath);
      setOutputMeta(
        t("pdf_organized_meta", `${organizePages.length} páginas guardadas`, {
          count: organizePages.length,
        }),
      );
      Alert.alert(t("pdf_done", "¡Listo! Páginas organizadas."));
    } catch {
      Alert.alert(
        t("pdf_err_organize_title", "No se pudo reorganizar el PDF"),
        t(
          "pdf_err_organize_desc",
          "Intenta nuevamente o verifica que el archivo no esté protegido.",
        ),
      );
    } finally {
      setIsProcessing(false);
      setOrganizeSourceUri(null);
    }
  };

  // 8. OPTIMIZE / LIGHTEN PDF (Zero extra deps, removes metadata & orphaned objects)
  const handleOptimizePDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });
      if (result.canceled || result.assets.length === 0) return;

      setIsProcessing(true);
      setOutputMeta(null);
      const srcUri = result.assets[0].uri;
      const srcInfo = await FileSystem.getInfoAsync(srcUri);
      const origSize = (srcInfo as any).size || 0;

      const fileBase64 = await FileSystem.readAsStringAsync(srcUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const srcPdf = await PDFDocument.load(fileBase64);
      const cleanPdf = await PDFDocument.create();
      const copied = await cleanPdf.copyPages(srcPdf, srcPdf.getPageIndices());
      copied.forEach((p) => cleanPdf.addPage(p));

      // Strip redundant metadata for privacy & size reduction
      cleanPdf.setTitle("");
      cleanPdf.setAuthor("");
      cleanPdf.setSubject("");
      cleanPdf.setProducer("PDF 4All");
      cleanPdf.setCreator("");

      const optBase64 = await cleanPdf.saveAsBase64({ useObjectStreams: true });
      const targetPath = `${FileSystem.documentDirectory}optimized_${Date.now()}.pdf`;
      await FileSystem.writeAsStringAsync(targetPath, optBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const outInfo = await FileSystem.getInfoAsync(targetPath);
      const newSize = (outInfo as any).size || 0;
      const savedPct =
        origSize > 0
          ? Math.max(0, Math.round(((origSize - newSize) / origSize) * 100))
          : 0;

      setOutputFile(targetPath);
      setOutputMeta(
        `${formatKB(origSize)} ➔ ${formatKB(newSize)} (-${savedPct}%)`,
      );
      Alert.alert(t("pdf_done", "¡Listo! PDF optimizado."));
    } catch {
      Alert.alert(
        t("pdf_err_opt_title", "No se pudo optimizar el PDF"),
        t(
          "pdf_err_opt_desc",
          "El archivo podría estar cifrado o ya optimizado al máximo.",
        ),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const shareFile = async () => {
    if (!outputFile) return;
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(outputFile);
    }
  };

  const tools = [
    {
      key: "read",
      label: t("pdf_read", "Leer PDF"),
      icon: <BookOpen color={accentHex} size={24} />,
      onPress: handleReadPDF,
    },
    {
      key: "scan",
      label: t("pdf_scan", "Fotos a PDF"),
      icon: <Scan color={accentHex} size={24} />,
      onPress: handleScanToPDF,
    },
    {
      key: "merge",
      label: t("pdf_merge", "Unir PDFs"),
      icon: <CopyPlus color={accentHex} size={24} />,
      onPress: handleMergePDFs,
    },
    {
      key: "split",
      label: t("pdf_split", "Extraer Páginas"),
      icon: <Scissors color={accentHex} size={24} />,
      onPress: handleStartSplit,
    },
    {
      key: "organize",
      label: t("pdf_organize", "Organizar Páginas"),
      icon: <ArrowUpDown color={accentHex} size={24} />,
      onPress: handleStartOrganize,
    },
    {
      key: "optimize",
      label: t("pdf_optimize", "Optimizar PDF"),
      icon: <Minimize2 color={accentHex} size={24} />,
      onPress: handleOptimizePDF,
    },
    {
      key: "rotate",
      label: t("pdf_rotate", "Girar (90°)"),
      icon: <RotateCw color={accentHex} size={24} />,
      onPress: handleRotatePDF,
    },
    {
      key: "watermark",
      label: t("pdf_watermark", "Marca de Agua"),
      icon: <Stamp color={accentHex} size={24} />,
      onPress: handleStartWatermark,
    },
  ];

  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 bg-white dark:bg-zinc-900"
    >
      <View className="flex-1 bg-zinc-50 dark:bg-zinc-950">
        {/* Header */}
        <View className="pt-3 pb-4 px-6 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm flex-row items-center justify-between">
          <View className="flex-row items-center">
            <BookOpen color={accentHex} size={24} className="mr-2" />
            <Text className="text-2xl font-black text-zinc-900 dark:text-white">
              {t("pdf_title", "PDF 4All")}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setSettingsVisible(true)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t("settings", "Ajustes")}
            className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full"
          >
            <Settings color={accentHex} size={20} />
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1 px-6 pt-6"
          keyboardShouldPersistTaps="handled"
        >
          {/* ACTION GRID (8 MASTER TOOLS) */}
          <View className="flex-row flex-wrap justify-between gap-y-3 mb-6">
            {tools.map((tool) => (
              <TouchableOpacity
                key={tool.key}
                onPress={tool.onPress}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={tool.label}
                className="w-[48%] bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm items-center"
              >
                <View className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 items-center justify-center mb-2 border border-blue-500/20">
                  {tool.icon}
                </View>
                <Text
                  className="font-bold text-zinc-800 dark:text-zinc-200 text-sm text-center"
                  numberOfLines={1}
                >
                  {tool.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Processing Indicator */}
          {isProcessing && (
            <View className="items-center py-6">
              <ActivityIndicator size="large" color={accentHex} />
              <Text className="text-zinc-500 mt-2 font-medium">
                {t("pdf_processing", "Procesando documento...")}
              </Text>
            </View>
          )}

          {/* Output PDF File Card */}
          {outputFile && !isProcessing && (
            <View className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm mb-8">
              <View className="flex-row items-center mb-2">
                <FileCheck color="#10b981" size={22} className="mr-2" />
                <Text className="font-black text-zinc-900 dark:text-white text-base">
                  {t("pdf_output_ready", "Documento Generado")}
                </Text>
              </View>

              <Text
                className="text-zinc-500 text-xs font-mono mb-1"
                numberOfLines={1}
              >
                {outputFile.split("/").pop()}
              </Text>

              {outputMeta && (
                <Text className="text-blue-600 dark:text-blue-400 text-xs font-bold mb-3">
                  {outputMeta}
                </Text>
              )}

              <TouchableOpacity
                onPress={shareFile}
                className="w-full py-3.5 mt-2 bg-blue-600 rounded-2xl flex-row items-center justify-center shadow-sm"
              >
                <Share color="#fff" size={16} className="mr-2" />
                <Text className="text-white font-bold text-sm">
                  {t("pdf_share_save", "Compartir o Guardar")}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <View className="h-8" />
        </ScrollView>

        {/* SPLIT MODAL */}
        <Modal visible={showSplitModal} transparent={true} animationType="fade">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 bg-black/60 items-center justify-center p-6"
          >
            <View className="bg-white dark:bg-zinc-900 w-full p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-black text-zinc-900 dark:text-white">
                  {t("pdf_split", "Extraer Páginas")}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowSplitModal(false)}
                  className="p-2"
                >
                  <X color="#71717a" size={20} />
                </TouchableOpacity>
              </View>

              <Text className="text-xs text-zinc-500 mb-2">
                {t("pdf_split_prompt", "Páginas a extraer (ej. 1, 3, 5-7)")}:
              </Text>

              <TextInput
                value={splitPages}
                onChangeText={setSplitPages}
                placeholder="1, 3, 5-7"
                placeholderTextColor="#a1a1aa"
                className="bg-zinc-100 dark:bg-zinc-800 p-3.5 rounded-2xl text-zinc-900 dark:text-white font-mono mb-4"
                autoFocus
              />

              <TouchableOpacity
                onPress={executeSplit}
                className="w-full py-3.5 rounded-2xl bg-blue-600 items-center justify-center shadow-sm"
              >
                <Text className="text-white font-bold text-sm">
                  {t("pdf_split_btn", "Extraer y Guardar")}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* WATERMARK MODAL */}
        <Modal
          visible={showWatermarkModal}
          transparent={true}
          animationType="fade"
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 bg-black/60 items-center justify-center p-6"
          >
            <View className="bg-white dark:bg-zinc-900 w-full p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-black text-zinc-900 dark:text-white">
                  {t("pdf_watermark", "Marca de Agua")}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowWatermarkModal(false)}
                  className="p-2"
                >
                  <X color="#71717a" size={20} />
                </TouchableOpacity>
              </View>

              <Text className="text-xs text-zinc-500 mb-2">
                {t("pdf_watermark_prompt", "Texto para estampar")}:
              </Text>

              <TextInput
                value={watermarkText}
                onChangeText={setWatermarkText}
                placeholder={t("pdf_watermark_ph", "Ej. CONFIDENCIAL")}
                placeholderTextColor="#a1a1aa"
                className="bg-zinc-100 dark:bg-zinc-800 p-3.5 rounded-2xl text-zinc-900 dark:text-white font-bold mb-4"
                autoFocus
              />

              <TouchableOpacity
                onPress={executeWatermark}
                className="w-full py-3.5 rounded-2xl bg-blue-600 items-center justify-center shadow-sm"
              >
                <Text className="text-white font-bold text-sm">
                  {t("pdf_watermark_btn", "Aplicar Marca de Agua")}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* ORGANIZE (REORDER / DELETE) MODAL */}
        <Modal
          visible={showOrganizeModal}
          transparent={true}
          animationType="slide"
        >
          <View className="flex-1 bg-black/60 justify-end">
            <View className="bg-white dark:bg-zinc-900 rounded-t-3xl p-6 max-h-[80%] border-t border-zinc-200 dark:border-zinc-800">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-black text-zinc-900 dark:text-white">
                  {t("pdf_organize", "Organizar Páginas")}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowOrganizeModal(false)}
                  className="p-2"
                >
                  <X color="#71717a" size={20} />
                </TouchableOpacity>
              </View>

              <FlatList
                data={organizePages}
                keyExtractor={(pageIdx, idx) => `${pageIdx}-${idx}`}
                className="mb-4"
                renderItem={({ item: origIdx, index }) => (
                  <View className="flex-row items-center justify-between bg-zinc-100 dark:bg-zinc-800 p-3 rounded-2xl mb-2">
                    <Text className="font-bold text-zinc-900 dark:text-white text-sm">
                      {t("pdf_page_label", `Página ${origIdx + 1}`, {
                        num: origIdx + 1,
                      })}
                    </Text>
                    <View className="flex-row items-center gap-1.5">
                      <TouchableOpacity
                        onPress={() => moveOrganizePage(index, -1)}
                        disabled={index === 0}
                        className="p-2 bg-white dark:bg-zinc-700 rounded-xl"
                      >
                        <ArrowUp
                          color={index === 0 ? "#a1a1aa" : accentHex}
                          size={16}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => moveOrganizePage(index, 1)}
                        disabled={index === organizePages.length - 1}
                        className="p-2 bg-white dark:bg-zinc-700 rounded-xl"
                      >
                        <ArrowDown
                          color={
                            index === organizePages.length - 1
                              ? "#a1a1aa"
                              : accentHex
                          }
                          size={16}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => removeOrganizePage(index)}
                        disabled={organizePages.length <= 1}
                        className="p-2 bg-red-500/10 rounded-xl"
                      >
                        <Trash2
                          color={
                            organizePages.length <= 1 ? "#a1a1aa" : "#ef4444"
                          }
                          size={16}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />

              <TouchableOpacity
                onPress={executeOrganize}
                className="w-full py-3.5 rounded-2xl bg-blue-600 items-center justify-center shadow-sm"
              >
                <Text className="text-white font-bold text-sm">
                  {t("pdf_organize_save", "Guardar Nuevo Orden")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <SettingsModal4All
          visible={settingsVisible}
          onClose={() => setSettingsVisible(false)}
          appName="PDF 4All"
          accentColor="#2563EB"
          i18nInstance={i18n}
        />
      </View>
    </SafeAreaView>
  );
}
