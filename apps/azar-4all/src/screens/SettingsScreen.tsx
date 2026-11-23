import React from "react";
import { SettingsModal4All } from "@apps4all/ui-components";
import i18n from "@apps4all/i18n";

export default function SettingsScreen({ navigation }: any) {
  return (
    <SettingsModal4All
      visible={true}
      onClose={() => navigation.goBack()}
      appName="Azar 4All"
      accentColor="#B45309"
      i18nInstance={i18n}
    />
  );
}
