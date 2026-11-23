import React from "react";
import { View, Text } from "react-native";

interface MarkdownPreviewProps {
  content: string;
  emptyText: string;
}

function renderInlineSegments(line: string, baseClass: string) {
  // Parse **bold**, *italic*, and `code` inline tokens without external packages
  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const parts = line.split(tokenRegex);

  return (
    <Text className={baseClass}>
      {parts.map((part, idx) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          return (
            <Text key={idx} className="font-black text-zinc-900 dark:text-white">
              {part.slice(2, -2)}
            </Text>
          );
        }
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
          return (
            <Text key={idx} className="italic">
              {part.slice(1, -1)}
            </Text>
          );
        }
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
          return (
            <Text
              key={idx}
              className="font-mono text-sm bg-zinc-200 dark:bg-zinc-800 text-blue-700 dark:text-blue-400"
            >
              {` ${part.slice(1, -1)} `}
            </Text>
          );
        }
        return <Text key={idx}>{part}</Text>;
      })}
    </Text>
  );
}

export default function MarkdownPreview({
  content,
  emptyText,
}: MarkdownPreviewProps) {
  if (!content.trim()) {
    return (
      <Text className="text-zinc-400 dark:text-zinc-500 text-base italic py-4">
        {emptyText}
      </Text>
    );
  }

  const lines = content.split("\n");

  return (
    <View className="py-2">
      {lines.map((rawLine, index) => {
        const line = rawLine.trimEnd();
        if (!line.trim()) {
          return <View key={index} className="h-3" />;
        }
        if (line.startsWith("### ")) {
          return (
            <View key={index} className="mt-3 mb-1">
              {renderInlineSegments(
                line.slice(4),
                "text-lg font-bold text-zinc-900 dark:text-white",
              )}
            </View>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <View key={index} className="mt-4 mb-1.5">
              {renderInlineSegments(
                line.slice(3),
                "text-xl font-black text-zinc-900 dark:text-white",
              )}
            </View>
          );
        }
        if (line.startsWith("# ")) {
          return (
            <View key={index} className="mt-4 mb-2">
              {renderInlineSegments(
                line.slice(2),
                "text-2xl font-black text-zinc-900 dark:text-white",
              )}
            </View>
          );
        }
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <View key={index} className="flex-row items-start mb-1.5 pl-1">
              <Text className="text-blue-600 dark:text-blue-400 font-black mr-2 text-base">
                •
              </Text>
              <View className="flex-1">
                {renderInlineSegments(
                  line.slice(2),
                  "text-base leading-6 text-zinc-800 dark:text-zinc-200",
                )}
              </View>
            </View>
          );
        }
        return (
          <View key={index} className="mb-1.5">
            {renderInlineSegments(
              line,
              "text-base leading-6 text-zinc-800 dark:text-zinc-200",
            )}
          </View>
        );
      })}
    </View>
  );
}

