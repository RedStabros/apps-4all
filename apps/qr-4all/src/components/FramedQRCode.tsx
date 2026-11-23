import React, { useRef, useImperativeHandle, forwardRef } from "react";
import { View, Text } from "react-native";
import Svg, { Rect, Path, Circle } from "react-native-svg";
import QRCode from "react-native-qrcode-svg";
import { QRStyleConfig } from "../store/useQRStore";

export interface FramedQRCodeRef {
  toDataURL: (callback: (data: string) => void) => void;
}

interface Props {
  value: string;
  size?: number;
  styleConfig: QRStyleConfig;
}

interface PresetSvgProps {
  width?: number;
  height?: number;
  fill?: string;
}

// Preset SVG icon components for center logo (0 KB extra deps)
export const PRESET_SVGS: Record<string, React.FC<PresetSvgProps>> = {
  wifi: ({ width, height, fill }) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={fill || "#0F766E"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 20h.01" />
      <Path d="M8.5 16.5a5 5 0 0 1 7 0" />
      <Path d="M5 13a10 10 0 0 1 14 0" />
      <Path d="M1.5 9.5a15 15 0 0 1 21 0" />
    </Svg>
  ),
  url: ({ width, height, fill }) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={fill || "#2563EB"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <Path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </Svg>
  ),
  whatsapp: ({ width, height, fill }) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={fill || "#16A34A"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </Svg>
  ),
  user: ({ width, height, fill }) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={fill || "#0F766E"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <Path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
    </Svg>
  ),
  mail: ({ width, height, fill }) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={fill || "#2563EB"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Rect x="2" y="4" width="20" height="16" rx="2" />
      <Path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </Svg>
  ),
  phone: ({ width, height, fill }) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={fill || "#0F766E"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </Svg>
  ),
  pin: ({ width, height, fill }) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={fill || "#E11D48"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <Circle cx="12" cy="10" r="3" />
    </Svg>
  ),
  pay: ({ width, height, fill }) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={fill || "#2563EB"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <Path d="M1 10h22" />
    </Svg>
  ),
  lock: ({ width, height, fill }) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={fill || "#B45309"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Svg>
  ),
  star: ({ width, height, fill }) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={fill || "#D97706"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </Svg>
  ),
};

const FramedQRCode = forwardRef<FramedQRCodeRef, Props>(
  ({ value, size = 220, styleConfig }, ref) => {
    const qrRef = useRef<{ toDataURL?: (cb: (data: string) => void) => void } | null>(null);

    useImperativeHandle(ref, () => ({
      toDataURL: (callback: (data: string) => void) => {
        if (qrRef.current?.toDataURL) {
          qrRef.current.toDataURL(callback);
        }
      },
    }));

    const hasLogo = Boolean(styleConfig.logoUri || styleConfig.presetIcon);
    const logoSource = styleConfig.logoUri ? { uri: styleConfig.logoUri } : undefined;
    const logoSvgComponent = styleConfig.presetIcon
      ? PRESET_SVGS[styleConfig.presetIcon]
      : undefined;

    const frameColor =
      styleConfig.frameColor ||
      (styleConfig.isGradient ? styleConfig.gradientColors[0] : styleConfig.fgColor);
    const frameText = styleConfig.frameText || "SCAN ME";

    // When no frame is selected, render QRCode directly
    if (styleConfig.frameType === "none") {
      return (
        <View className="items-center justify-center">
          <QRCode
            value={value}
            size={size}
            color={styleConfig.fgColor}
            backgroundColor={styleConfig.bgColor}
            enableLinearGradient={styleConfig.isGradient}
            linearGradient={styleConfig.gradientColors}
            gradientDirection={["0%", "0%", "100%", "100%"]}
            logo={logoSource}
            logoSVG={logoSvgComponent}
            logoSize={size * 0.22}
            logoBackgroundColor="#ffffff"
            logoBorderRadius={12}
            logoMargin={4}
            ecl={hasLogo ? "H" : "M"}
            getRef={(c) => {
              qrRef.current = c;
            }}
          />
        </View>
      );
    }

    // When a frame is selected, render styled card container
    return (
      <View className="items-center justify-center p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        {/* Top Scan Me Pill */}
        {styleConfig.frameType === "scanme-top" && (
          <View
            className="px-6 py-2 rounded-full mb-4 items-center justify-center"
            style={{ backgroundColor: frameColor }}
          >
            <Text className="text-white text-xs font-bold uppercase tracking-wider">
              {frameText}
            </Text>
          </View>
        )}

        {/* QR Code */}
        <QRCode
          value={value}
          size={size}
          color={styleConfig.fgColor}
          backgroundColor={styleConfig.bgColor}
          enableLinearGradient={styleConfig.isGradient}
          linearGradient={styleConfig.gradientColors}
          gradientDirection={["0%", "0%", "100%", "100%"]}
          logo={logoSource}
          logoSVG={logoSvgComponent}
          logoSize={size * 0.22}
          logoBackgroundColor="#ffffff"
          logoBorderRadius={12}
          logoMargin={4}
          ecl={hasLogo ? "H" : "M"}
          getRef={(c) => {
            qrRef.current = c;
          }}
        />

        {/* Bottom Scan Me Pill */}
        {styleConfig.frameType === "scanme-bottom" && (
          <View
            className="px-6 py-2 rounded-full mt-4 items-center justify-center"
            style={{ backgroundColor: frameColor }}
          >
            <Text className="text-white text-xs font-bold uppercase tracking-wider">
              {frameText}
            </Text>
          </View>
        )}

        {/* Card Template Footer */}
        {styleConfig.frameType === "card" && (
          <Text className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold mt-3 text-center">
            {frameText}
          </Text>
        )}
      </View>
    );
  },
);

export default FramedQRCode;
