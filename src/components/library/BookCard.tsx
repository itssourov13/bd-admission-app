import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card, Txt } from "@/components/ui";
import { BookChips } from "@/components/library/BookMeta";
import { href } from "@/features/navigation/links";
import { bookPracticeState, localizedName } from "@/features/library/model";
import { useLang, useNum, useT } from "@/i18n";
import { useTheme } from "@/settings";
import type { BookSummary } from "@/types/domain";

/** One publication card, identical for every publisher and collection (no publisher-specific UI). */
export function BookCard({ book: b, showPublisher = false }: { book: BookSummary; showPublisher?: boolean }) {
  const { colors } = useTheme();
  const t = useT();
  const num = useNum();
  const { lang } = useLang();
  const router = useRouter();
  const practice = bookPracticeState(b);
  const meta = [showPublisher ? localizedName(b.publisherName, b.publisherNameBn, lang) : null, b.collection, b.authors].filter((x): x is string => Boolean(x)).join(" · ");
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={localizedName(b.title, b.titleBn, lang)} onPress={() => router.push(href(`/library/book/${encodeURIComponent(b.id)}`))} className="active:opacity-90">
      <Card className="p-4 gap-2">
        <View className="flex-row items-center gap-2">
          <View className="flex-1"><Txt weight="bold" className="text-ink-900 text-base leading-6">{localizedName(b.title, b.titleBn, lang)}</Txt></View>
          <Ionicons name="chevron-forward" size={19} color={colors.ink400} />
        </View>
        {meta ? <Txt className="text-ink-700 text-xs leading-5">{meta}</Txt> : null}
        <Txt className="text-ink-500 text-xs leading-5">{practice === "provisional"
          ? t("library.provisionalStats", { total: num(b.questionCount), candidates: num(b.reviewCandidateCount) })
          : t("library.questionStats", { total: num(b.questionCount), eligible: num(b.eligibleCount) })}</Txt>
        <BookChips book={b} />
      </Card>
    </Pressable>
  );
}
