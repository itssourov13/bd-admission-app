import { useT } from "@/i18n";
import { FeaturePlaceholder } from "@/components/common/FeaturePlaceholder";

export default function VarsityScreen() {
  const t = useT();
  return <FeaturePlaceholder title={t("feature.varsityTitle")} description={t("feature.varsityBody")} icon="school-outline" />;
}
