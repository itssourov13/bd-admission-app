import type { QuestionPackItem, QuestionSourceDocument } from "./question-pack.ts";
import type { BookContentType, BookLanguage, BookTargetCategory, BookVerification, LicenseStatus, PublisherKind, UnitKind } from "./domain.ts";

/**
 * Library pack: one publisher book (or question bank) with its unit tree and questions, installable without any
 * university paper. Questions reuse the shared question/option shape (so the whole practice engine works on them)
 * but have no paper appearances; membership is expressed through `unitIds`. The question order in `questions` is the
 * book's own printed order.
 *
 * A pack that carries questions MUST declare a licence under which the content may be shipped
 * (licensed | public_domain | owner_created). permission_pending / metadata_only packs may only carry metadata.
 */
export interface LibraryPackUnit {
  id: string;
  parentId?: string | null;
  kind: UnitKind;
  title: string;
  titleBn?: string | null;
  sortOrder: number;
}

export interface LibraryPackQuestion extends Omit<QuestionPackItem, "appearances" | "source"> {
  /** Units (chapter/section/test) this question belongs to; at least one. */
  unitIds: string[];
  source: { documentId: string; pageNumber?: number | null; questionNumber?: number | null };
}

export interface LibraryPack {
  schemaVersion: 1;
  kind: "library";
  publisher: { id: string; slug: string; name: string; nameBn?: string | null; kind?: PublisherKind; description?: string | null; website?: string | null };
  book: {
    id: string;
    title: string;
    titleBn?: string | null;
    edition?: string | null;
    publicationYear?: number | null;
    subject?: string | null;
    language: BookLanguage;
    targetCategory: BookTargetCategory;
    contentType: BookContentType;
    verificationStatus: BookVerification;
    /** Monotonic integer; an installed higher version is never replaced by a lower one. */
    contentVersion: number;
    versionLabel?: string | null;
    sourceNote?: string | null;
    licenseStatus: LicenseStatus;
    licenseNote?: string | null;
  };
  sourceDocuments: QuestionSourceDocument[];
  units: LibraryPackUnit[];
  questions: LibraryPackQuestion[];
}
