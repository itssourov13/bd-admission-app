import { useT } from "@/i18n";
import { FeaturePlaceholder } from "@/components/common/FeaturePlaceholder";

export default function MedicalScreen() {
  const t = useT();
  return <FeaturePlaceholder title={t("feature.medicalTitle")} description={t("feature.medicalBody")} icon="medkit-outline" />;
}
