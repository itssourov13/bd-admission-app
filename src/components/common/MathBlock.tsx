import { Fragment } from "react";
import { ScrollView, View } from "react-native";
import { Txt, type TxtProps } from "@/components/ui/Text";
import type { MathNode } from "../../services/mathLayout";

interface Ctx { fontSize: number; lineHeight: number; className: string; weight?: TxtProps["weight"] }

const LINE = "border-ink-900";

function Seq({ nodes, ctx, wrap = false }: { nodes: readonly MathNode[]; ctx: Ctx; wrap?: boolean }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: wrap ? "wrap" : "nowrap", alignItems: "center", flexShrink: 1 }}>
      {nodes.map((n, i) => <Node key={i} node={n} ctx={ctx} wrap={wrap} />)}
    </View>
  );
}

function Delim({ ch, side, height, ctx }: { ch: string; side: "left" | "right"; height: number; ctx: Ctx }) {
  if (ch === "") return <View style={{ width: 4 }} />;
  const edge = side === "left" ? "borderLeftWidth" : "borderRightWidth";
  if (ch === "[" || ch === "]") {
    return <View className={LINE} style={{ width: 6, borderTopWidth: 1.5, borderBottomWidth: 1.5, [edge]: 1.5 }} />;
  }
  if (ch === "|" || ch === "‖") {
    return <View className={LINE} style={{ width: ch === "‖" ? 6 : 3, borderLeftWidth: 1.5, borderRightWidth: ch === "‖" ? 1.5 : 0 }} />;
  }
  if (ch === "(" || ch === ")") {
    return <View className={LINE} style={{ width: 8, [edge]: 1.5, borderRadius: 10, borderTopWidth: 0, borderBottomWidth: 0 }} />;
  }
  // Braces and angle brackets: a stretched glyph.
  return <Txt className={ctx.className} style={{ fontSize: Math.min(height, ctx.fontSize * 6), lineHeight: Math.min(height, ctx.fontSize * 6) * 1.05, includeFontPadding: false }} accessible={false}>{ch}</Txt>;
}

function Node({ node, ctx, wrap }: { node: MathNode; ctx: Ctx; wrap: boolean }) {
  switch (node.kind) {
    case "text":
      return <Txt weight={ctx.weight} className={ctx.className} style={{ fontSize: ctx.fontSize, lineHeight: ctx.lineHeight, flexShrink: wrap ? 1 : 0 }}>{node.text}</Txt>;
    case "frac":
      return (
        <View style={{ alignItems: "center", marginHorizontal: 3 }}>
          <View style={{ paddingHorizontal: 3 }}><Seq nodes={node.num} ctx={ctx} /></View>
          <View className={LINE} style={{ alignSelf: "stretch", borderTopWidth: 1.5, marginVertical: 1 }} />
          <View style={{ paddingHorizontal: 3 }}><Seq nodes={node.den} ctx={ctx} /></View>
        </View>
      );
    case "sqrt":
      return (
        <View style={{ flexDirection: "row", alignItems: "stretch", marginHorizontal: 1 }}>
          {node.index ? <View style={{ justifyContent: "flex-start" }}><Seq nodes={node.index} ctx={{ ...ctx, fontSize: ctx.fontSize * 0.65, lineHeight: ctx.lineHeight * 0.65 }} /></View> : null}
          <Txt className={ctx.className} style={{ fontSize: ctx.fontSize * 1.25, lineHeight: ctx.lineHeight }} accessible={false}>√</Txt>
          <View className={LINE} style={{ borderTopWidth: 1.5, paddingHorizontal: 2, justifyContent: "center" }}><Seq nodes={node.body} ctx={ctx} /></View>
        </View>
      );
    case "lines":
      return (
        <View style={{ gap: 2, flexShrink: 1 }}>
          {node.lines.map((line, i) => <Seq key={i} nodes={line} ctx={ctx} wrap />)}
        </View>
      );
    case "matrix": {
      const rowCount = node.rows.length;
      const cols = Math.max(...node.rows.map((r) => r.length));
      const height = Math.max(ctx.lineHeight * rowCount + (rowCount - 1) * 6 + 6, ctx.lineHeight);
      return (
        // A wide matrix scrolls inside its own box; the surrounding text keeps wrapping normally.
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, flexShrink: 1, marginHorizontal: 4, marginVertical: 2 }}>
          <View style={{ flexDirection: "row", alignItems: "stretch" }}>
            <Delim ch={node.open} side="left" height={height} ctx={ctx} />
            <View style={{ flexDirection: "row", paddingHorizontal: 6, paddingVertical: 3, gap: 14 }}>
              {Array.from({ length: cols }, (_c, ci) => (
                <View key={ci} style={{ gap: 6, alignItems: node.align === "left" ? "flex-start" : "center" }}>
                  {node.rows.map((row, ri) => (
                    <Fragment key={ri}>
                      {row[ci] ? <Seq nodes={row[ci]!} ctx={ctx} /> : <View style={{ height: ctx.lineHeight }} />}
                    </Fragment>
                  ))}
                </View>
              ))}
            </View>
            <Delim ch={node.close} side="right" height={height} ctx={ctx} />
          </View>
        </ScrollView>
      );
    }
  }
}

/**
 * Lays out a parsed `MathNode` tree with plain Views and Text: no WebView, no bundled fonts, fully offline, and it
 * inherits the question text size and theme colour classes from the caller. One accessible element carries the
 * spoken description so a screen reader does not walk every fragment.
 */
export function MathBlock({ nodes, fontSize, lineHeight, className, weight, accessibilityLabel }: {
  nodes: readonly MathNode[]; fontSize: number; lineHeight: number; className?: string; weight?: TxtProps["weight"]; accessibilityLabel: string;
}) {
  const colourOnly = (className ?? "text-ink-900").split(/\s+/).filter((c) => c.startsWith("text-") || c.startsWith("dark:text-")).join(" ") || "text-ink-900";
  return (
    <View accessible accessibilityLabel={accessibilityLabel} importantForAccessibility="yes" style={{ flexShrink: 1, flex: (className ?? "").split(/\s+/).includes("flex-1") ? 1 : undefined }}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Seq nodes={nodes} ctx={{ fontSize, lineHeight, className: colourOnly, weight }} wrap />
      </View>
    </View>
  );
}
