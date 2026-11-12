import { View } from "react-native";
import { Chip, Txt } from "@/components/ui";
import { INSTALL_STATE_KEYS, LICENSE_KEYS, VERIFICATION_KEYS, isBookAvailable, localizedName } from "@/features/library/model";
import { useLang, useNum, useT } from "@/i18n";
import type { BookSummary } from "@/types/domain";

/** Metadata chips shared by book list rows and the book screen (edition, year, subject, language, type, status ...). */
export function BookChips({ book }: { book: BookSummary }) {
  const t = useT();
  const num = useNum();
  return (
    <View className="flex-row flex-wrap gap-2">
      <Chip label={t(`library.type.${book.contentType}` as const)} tone="brand" />
      <Chip label={t(`library.category.${book.targetCategory}` as const)} />
      <Chip label={t(`library.language.${book.language}` as const)} />
      {book.edition ? <Chip label={t("library.edition", { edition: book.edition })} /> : null}
      {book.publicationYear ? <Chip label={t("library.year", { year: num(book.publicationYear) })} /> : null}
      {book.subject ? <Chip label={t("library.subject", { subject: book.subject })} /> : null}
      <Chip label={t(VERIFICATION_KEYS[book.verificationStatus])} tone={book.verificationStatus === "verified" ? "brand" : "neutral"} />
      <Chip label={t(INSTALL_STATE_KEYS[book.installState])} tone={isBookAvailable(book.installState) ? "gold" : "neutral"} />
    </View>
  );
}

/** Provenance block: publisher, version, source and licence. Shown in full so licensing state is never hidden. */
export function BookProvenance({ book }: { book: BookSummary }) {
  const t = useT();
  const num = useNum();
  const { lang } = useLang();
  const lines = [
    t("library.publisherLine", { name: localizedName(book.publisherName, book.publisherNameBn, lang) }),
    t("library.contentVersion", { n: num(book.contentVersion) }) + (book.versionLabel ? ` (${book.versionLabel})` : ""),
    book.sourceNote ? t("library.sourceInfo", { note: book.sourceNote }) : null,
    t("library.licenseInfo", { status: t(LICENSE_KEYS[book.licenseStatus]) }),
    book.licenseNote ? t("library.licenseNote", { note: book.licenseNote }) : null
  ].filter((x): x is string => x !== null);
  return <View className="gap-1">{lines.map((l) => <Txt key={l} className="text-ink-500 text-xs leading-5">{l}</Txt>)}</View>;
}
