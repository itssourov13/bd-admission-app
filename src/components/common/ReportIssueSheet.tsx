import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Txt } from "@/components/ui";
import { TextField } from "@/components/common/TextField";
import { useNum, useT, type TranslationKey } from "@/i18n";
import { useHaptics, useTheme } from "@/settings";
import { ISSUE_DETAILS_MAX, ISSUE_TYPES, questionPreview, validateIssueReport, type IssueType } from "../../services/issueReports";

export interface ReportDraft { types: IssueType[]; details: string }

interface Props {
  visible: boolean;
  /** Question text shown so the person can see exactly which question is being reported. */
  questionText: string;
  /** Existing report values; presence switches the sheet to edit mode. */
  initial?: ReportDraft | null;
  /** True while an exam/flash timer is running behind the sheet. */
  timerRunning?: boolean;
  onSubmit: (draft: ReportDraft) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

interface SheetProps extends Props {
  /**
   * Identifies one "opening" of the composer (for example `${questionId}:${openCount}`). A new key remounts the form, so
   * every open starts from `initial` and a previous draft, error or success state can never leak in. The key must stay
   * constant while the sheet is open and during its close animation, so a parent re-render never wipes a draft.
   */
  sessionKey: string;
}

const SAVED_CLOSE_MS = 1400;

/**
 * Bottom-sheet composer for a question issue report. A Modal keeps the underlying screen (and its exam/flash state,
 * scroll position and timer) untouched, so reporting never disrupts practice. Saving shows a short confirmation and closes.
 */
export function ReportIssueSheet({ sessionKey, ...props }: SheetProps) {
  return <ReportIssueSheetBody key={sessionKey} {...props} />;
}

function ReportIssueSheetBody({ visible, questionText, initial, timerRunning = false, onSubmit, onDelete, onClose }: Props) {
  const { colors, feedback } = useTheme();
  const t = useT();
  const num = useNum();
  const haptics = useHaptics();
  const insets = useSafeAreaInsets();
  const editing = Boolean(initial);
  const [types, setTypes] = useState<IssueType[]>(() => initial?.types ?? []);
  const [details, setDetails] = useState(() => initial?.details ?? "");
  const [error, setError] = useState<TranslationKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<"saved" | "updated" | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

  const toggle = (type: IssueType) => {
    haptics.select();
    setError(null);
    setTypes((cur) => (cur.includes(type) ? cur.filter((x) => x !== type) : [...cur, type]));
  };

  const submit = async () => {
    if (busy) return;
    const v = validateIssueReport(types, details);
    if (!v.ok) { setError(v.error === "no_type" ? "report.errNoType" : "report.errOther"); return; }
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ types: v.types, details: v.details });
      haptics.success();
      setDone(editing ? "updated" : "saved");
      closeTimer.current = setTimeout(onClose, SAVED_CLOSE_MS);
    } catch {
      setError("error.saveFailed");
    } finally {
      setBusy(false);
    }
  };

  const otherOnly = types.length === 1 && types[0] === "other";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={busy ? undefined : onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable accessibilityRole="button" accessibilityLabel={t("common.close")} onPress={busy ? undefined : onClose}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)" }} />
        <KeyboardAvoidingView behavior="padding">
          <View className="bg-surface rounded-t-3xl" style={{ maxHeight: "92%", paddingBottom: Math.max(insets.bottom, 12) }}>
            {done ? (
              <View className="items-center px-6 py-10" accessibilityLiveRegion="polite">
                <View className="w-16 h-16 rounded-full bg-brand-100 items-center justify-center">
                  <Ionicons name="checkmark" size={34} color={colors.brand700} />
                </View>
                <Txt font="display" weight="bold" className="text-ink-900 text-lg text-center mt-4">{t(done === "saved" ? "report.savedTitle" : "report.updatedTitle")}</Txt>
                <Txt className="text-ink-500 text-sm leading-6 text-center mt-2">{t("report.savedBody")}</Txt>
                <View className="mt-5 w-full"><Button label={t("report.done")} variant="outline" onPress={onClose} /></View>
              </View>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: 12 }}>
                <View className="flex-row items-center justify-between">
                  <Txt font="display" weight="bold" className="text-ink-900 text-xl flex-1" accessibilityRole="header">{t(editing ? "report.editTitle" : "report.title")}</Txt>
                  <Pressable accessibilityRole="button" accessibilityLabel={t("common.close")} disabled={busy} onPress={onClose} hitSlop={8}
                    className="w-11 h-11 items-center justify-center rounded-full active:bg-sand-100">
                    <Ionicons name="close" size={24} color={colors.ink700} />
                  </Pressable>
                </View>

                <View className="mt-3 rounded-2xl bg-sand-100 p-3.5">
                  <Txt weight="semibold" className="text-ink-500 text-xs uppercase" style={{ letterSpacing: 0.6 }}>{t("report.questionLabel")}</Txt>
                  <Txt className="text-ink-900 text-sm leading-6 mt-1" numberOfLines={3}>{questionPreview(questionText, 180)}</Txt>
                </View>

                {timerRunning ? (
                  <View className="flex-row items-center gap-2 mt-3">
                    <Ionicons name="timer-outline" size={16} color={colors.gold700} />
                    <Txt className="text-ink-700 text-xs leading-5 flex-1">{t("report.timerNotice")}</Txt>
                  </View>
                ) : null}

                <Txt weight="semibold" className="text-ink-900 mt-5">{t("report.whatWrong")}</Txt>
                <Txt className="text-ink-500 text-xs mt-0.5">{t("report.selectAll")}</Txt>
                <View className="mt-3 gap-2" accessibilityRole="list">
                  {ISSUE_TYPES.map((type) => {
                    const on = types.includes(type);
                    return (
                      <Pressable
                        key={type}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: on, disabled: busy }}
                        disabled={busy}
                        onPress={() => toggle(type)}
                        style={{ minHeight: 48, borderColor: on ? colors.brand500 : colors.outline, backgroundColor: on ? colors.brand100 : colors.surface, borderWidth: on ? 2 : 1 }}
                        className="flex-row items-center gap-3 rounded-2xl px-3.5 py-2.5 active:opacity-80"
                      >
                        <View className="w-6 h-6 rounded-md items-center justify-center" style={{ backgroundColor: on ? colors.brand600 : colors.sand100 }}>
                          {on ? <Ionicons name="checkmark" size={16} color={colors.white} /> : null}
                        </View>
                        <Txt className="text-ink-900 text-sm leading-5 flex-1">{t(`report.type.${type}` as TranslationKey)}</Txt>
                      </Pressable>
                    );
                  })}
                </View>

                <Txt weight="semibold" className="text-ink-900 mt-5 mb-2">{t(otherOnly ? "report.detailsRequired" : "report.details")}</Txt>
                <TextField
                  value={details}
                  onChangeText={(v) => { setDetails(v); if (error) setError(null); }}
                  editable={!busy}
                  multiline
                  maxLength={ISSUE_DETAILS_MAX}
                  placeholder={t("report.detailsPlaceholder")}
                  accessibilityLabel={t(otherOnly ? "report.detailsRequired" : "report.details")}
                  textAlignVertical="top"
                  style={{ minHeight: 112, paddingTop: 12, paddingBottom: 12 }}
                />
                <Txt className="text-ink-500 text-xs mt-1 text-right">{num(details.length)}/{num(ISSUE_DETAILS_MAX)}</Txt>

                <Txt accessibilityLiveRegion="polite" accessibilityRole={error ? "alert" : undefined} className="text-sm mt-2" style={{ color: feedback.danger700, minHeight: error ? undefined : 0 }}>
                  {error ? t(error) : ""}
                </Txt>
                <Txt className="text-ink-500 text-xs leading-5 mt-2">{t("report.localNote")}</Txt>

                <View className="mt-4 gap-2">
                  <Button label={t(editing ? "report.saveChanges" : "report.submit")} loading={busy} onPress={() => void submit()} />
                  <Button label={t("common.cancel")} variant="ghost" disabled={busy} onPress={onClose} />
                  {editing && onDelete ? (
                    <Pressable accessibilityRole="button" disabled={busy} onPress={() => void onDelete()} className="items-center justify-center py-3 active:opacity-70" style={{ minHeight: 44 }}>
                      <Txt weight="semibold" className="text-sm" style={{ color: feedback.danger700 }}>{t("report.delete")}</Txt>
                    </Pressable>
                  ) : null}
                </View>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
