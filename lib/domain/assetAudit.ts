import {
  Asset,
  AssetStage,
  DocumentRecord,
  EventRecord,
  EventType,
  MockLedgerSubmission,
  STAGES
} from "@/lib/types";
import { getExpectedTransition, getNextAllowedEvent } from "@/lib/validation/lifecycleRules";

const STALLED_THRESHOLD_HOURS = 24 * 7;

export type IntegrityStatus = "valid" | "stage_gap_detected";
export type VerificationStatus = "verified" | "incomplete";
export type LifecycleStepState = "completed" | "current" | "upcoming" | "warning";
export type AssetIssueCode =
  | "missing_certification"
  | "skipped_stage"
  | "missing_document_hash"
  | "stalled_asset"
  | "state_mismatch";

export interface AssetIssueFlag {
  code: AssetIssueCode;
  label: string;
  description: string;
}

export interface LifecycleStepViewModel {
  stage: AssetStage;
  label: string;
  state: LifecycleStepState;
}

export interface EventTimelineItem {
  event: EventRecord;
  eventLabel: string;
  stageLabel: string;
  actorLabel: string;
  locationLabel: string;
  custodyLabel: string;
  documentStatus: {
    label: string;
    tone: "default" | "success" | "warning";
  };
  timestampLabel: string;
  ledgerRecord: MockLedgerSubmission | null;
  ledgerHref: string | null;
}

export interface NextRecommendedAction {
  eventType: EventType | null;
  toStage: AssetStage | null;
  label: string;
  description: string;
  blocked: boolean;
}

export interface EventWorkflowDefaults {
  assetId: string;
  fromStage: AssetStage | null;
  fromCustodian: string | null;
  suggestedEventType: EventType | null;
  suggestedToStage: AssetStage | null;
  suggestedActionLabel: string;
  guidance: string;
  integrityBlocked: boolean;
}

export interface EventWorkflowAssetOption {
  asset: Asset;
  workflow: EventWorkflowDefaults;
  audit: AssetAuditViewModel;
}

export interface AssetAuditViewModel {
  derivedCurrentStage: AssetStage | null;
  derivedCurrentCustodian: string | null;
  lifecycle: {
    steps: LifecycleStepViewModel[];
    currentStageLabel: string;
  };
  verification: {
    status: VerificationStatus;
    label: string;
    description: string;
  };
  processIntegrity: {
    status: IntegrityStatus;
    label: string;
    description: string;
  };
  documents: {
    total: number;
    requiredDocumentHashMissing: boolean;
    label: string;
    description: string;
  };
  issues: AssetIssueFlag[];
  chainOfCustody: {
    custodians: string[];
    display: string;
    description: string;
  };
  nextAction: NextRecommendedAction;
  timeline: EventTimelineItem[];
  hasStateMismatch: boolean;
  lastEventAt: string | null;
}

function titleCaseStage(stage: AssetStage): string {
  return stage.charAt(0).toUpperCase() + stage.slice(1);
}

function titleCaseEvent(eventType: EventType): string {
  return eventType.replaceAll("_", " ");
}

function hasUsableHash(value: string | null | undefined): boolean {
  return Boolean(value && value.trim().startsWith("sha256:") && value.trim().length > 7);
}

function getStageIndex(stage: AssetStage | null): number {
  if (!stage) {
    return -1;
  }

  return STAGES.indexOf(stage);
}

export function analyzeAssetAudit(input: {
  asset: Asset;
  events: EventRecord[];
  documents: DocumentRecord[];
  ledgerRecords: MockLedgerSubmission[];
  now?: Date;
}): AssetAuditViewModel {
  const events = [...input.events].sort((a, b) => a.appTimestamp.localeCompare(b.appTimestamp));
  const documentsByEventId = new Map<string, DocumentRecord[]>();
  const ledgerById = new Map(input.ledgerRecords.map((record) => [record.ledgerRecordId, record]));
  const now = input.now ?? new Date();

  for (const document of input.documents) {
    const existing = documentsByEventId.get(document.eventId) ?? [];
    existing.push(document);
    documentsByEventId.set(document.eventId, existing);
  }

  let derivedCurrentStage: AssetStage | null = null;
  let derivedCurrentCustodian: string | null = null;
  let hasStageGap = false;

  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    const expected = getExpectedTransition(event.eventType);
    const previousStage = index === 0 ? null : events[index - 1]?.toStage ?? null;

    if (event.fromStage !== previousStage) {
      hasStageGap = true;
    }

    if (event.fromStage !== expected.from || event.toStage !== expected.to) {
      hasStageGap = true;
    }

    const previousIndex = getStageIndex(previousStage);
    const currentIndex = getStageIndex(event.toStage);

    if (currentIndex - previousIndex > 1) {
      hasStageGap = true;
    }

    derivedCurrentStage = event.toStage;
    derivedCurrentCustodian = event.toCustodian ?? derivedCurrentCustodian ?? event.fromCustodian;
  }

  const hasStateMismatch =
    (derivedCurrentStage !== null && derivedCurrentStage !== input.asset.currentStage) ||
    (derivedCurrentCustodian !== null && derivedCurrentCustodian !== input.asset.currentCustodian);

  const currentStage = derivedCurrentStage ?? input.asset.currentStage;
  const currentCustodian = derivedCurrentCustodian ?? input.asset.currentCustodian;
  const currentStageIndex = getStageIndex(currentStage);

  const certificateEvents = events.filter((event) => event.eventType === "certificate_attached");
  const hasCertification = certificateEvents.length > 0;
  const hasCertifiedHash = certificateEvents.some((event) => {
    if (hasUsableHash(event.documentHash)) {
      return true;
    }

    return (documentsByEventId.get(event.id) ?? []).some((document) => hasUsableHash(document.hash));
  });

  const requiresCertification = currentStageIndex >= getStageIndex("certified");
  const requiredDocumentHashMissing = requiresCertification && !hasCertifiedHash;

  const verificationStatus: VerificationStatus =
    (!requiresCertification || hasCertification) && !requiredDocumentHashMissing
      ? "verified"
      : "incomplete";

  const issues: AssetIssueFlag[] = [];

  if (requiresCertification && !hasCertification) {
    issues.push({
      code: "missing_certification",
      label: "Missing certification",
      description:
        "This asset has progressed beyond the created stage without a certificate attachment event."
    });
  }

  if (hasStageGap) {
    issues.push({
      code: "skipped_stage",
      label: "Skipped stage",
      description:
        "The event history contains a lifecycle transition that does not follow the expected stage order."
    });
  }

  const hasDocumentRelatedEventWithoutHash = events.some((event) => {
    const linkedDocuments = documentsByEventId.get(event.id) ?? [];
    const hasLinkedHash = linkedDocuments.some((document) => hasUsableHash(document.hash));
    const isDocumentRelevant =
      event.eventType === "certificate_attached" || linkedDocuments.length > 0 || !!event.documentHash;

    return isDocumentRelevant && !hasUsableHash(event.documentHash) && !hasLinkedHash;
  });

  if (hasDocumentRelatedEventWithoutHash) {
    issues.push({
      code: "missing_document_hash",
      label: "Missing document hash",
      description:
        "A document-related event exists without a usable content hash, reducing verification quality."
    });
  }

  const lastEventAt = events.at(-1)?.appTimestamp ?? null;
  const lastObservedAt = lastEventAt ? new Date(lastEventAt) : new Date(input.asset.updatedAt);
  const stalledHours = (now.getTime() - lastObservedAt.getTime()) / (1000 * 60 * 60);

  if (stalledHours > STALLED_THRESHOLD_HOURS) {
    issues.push({
      code: "stalled_asset",
      label: "Stalled asset",
      description: `No lifecycle event has been recorded for more than ${STALLED_THRESHOLD_HOURS / 24} days.`
    });
  }

  if (hasStateMismatch) {
    issues.push({
      code: "state_mismatch",
      label: "State mismatch",
      description:
        "Stored asset state and event-derived state do not match, so the audit view is surfacing the discrepancy."
    });
  }

  const lifecycleSteps: LifecycleStepViewModel[] = STAGES.map((stage) => {
    const stageIndex = getStageIndex(stage);
    let state: LifecycleStepState = "upcoming";

    if (stageIndex < currentStageIndex) {
      state = "completed";
    } else if (stageIndex === currentStageIndex) {
      state = hasStageGap || hasStateMismatch ? "warning" : "current";
    }

    return {
      stage,
      label: titleCaseStage(stage),
      state
    };
  });

  const custodyTrail = buildCustodyTrail({
    asset: input.asset,
    events
  });

  const nextAction = deriveNextRecommendedAction({
    currentStage,
    hasStageGap,
    hasStateMismatch
  });

  const timeline = events.map((event) => {
    const linkedDocuments = documentsByEventId.get(event.id) ?? [];
    const hasLinkedHash = linkedDocuments.some((document) => hasUsableHash(document.hash));
    const hasEventHash = hasUsableHash(event.documentHash);
    const hasDocumentEvidence = hasEventHash || hasLinkedHash;
    const ledgerRecord = ledgerById.get(event.ledgerRecordId) ?? null;

    return {
      event,
      eventLabel: titleCaseEvent(event.eventType),
      stageLabel: `${event.fromStage ?? "null"} -> ${event.toStage}`,
      actorLabel: `${event.actorId} · ${event.actorRole}`,
      locationLabel: event.locationName ?? "Location not recorded",
      custodyLabel:
        event.fromCustodian || event.toCustodian
          ? `${event.fromCustodian ?? "unknown"} -> ${event.toCustodian ?? "unknown"}`
          : "No custody transition recorded",
      documentStatus: hasDocumentEvidence
        ? { label: "Hash verified", tone: "success" as const }
        : linkedDocuments.length > 0 || event.eventType === "certificate_attached"
          ? { label: "Missing hash", tone: "warning" as const }
          : { label: "No document", tone: "default" as const },
      timestampLabel: event.appTimestamp,
      ledgerRecord,
      ledgerHref: ledgerRecord ? `/ledger/mock/${ledgerRecord.ledgerRecordId}` : null
    };
  });

  return {
    derivedCurrentStage: currentStage,
    derivedCurrentCustodian: currentCustodian,
    lifecycle: {
      steps: lifecycleSteps,
      currentStageLabel: currentStage ? titleCaseStage(currentStage) : "Unknown"
    },
    verification: {
      status: verificationStatus,
      label: verificationStatus === "verified" ? "Verified" : "Incomplete",
      description:
        verificationStatus === "verified"
          ? "The current lifecycle position has the expected verification evidence."
          : "The current lifecycle position is missing required certification evidence or document hashes."
    },
    processIntegrity: {
      status: hasStageGap || hasStateMismatch ? "stage_gap_detected" : "valid",
      label: hasStageGap || hasStateMismatch ? "Stage gap detected" : "Valid",
      description:
        hasStageGap || hasStateMismatch
          ? "The recorded lifecycle path has a missing step or conflicts with stored asset state."
          : "The lifecycle path follows the expected stage sequence."
    },
    documents: {
      total: input.documents.length,
      requiredDocumentHashMissing,
      label: `${input.documents.length} attached`,
      description: requiredDocumentHashMissing
        ? "Required certification evidence is missing a usable document hash."
        : "Linked documents are available for review."
    },
    issues,
    chainOfCustody: custodyTrail,
    nextAction,
    timeline,
    hasStateMismatch,
    lastEventAt
  };
}

function buildCustodyTrail(input: {
  asset: Asset;
  events: EventRecord[];
}): AssetAuditViewModel["chainOfCustody"] {
  const custodians: string[] = [];

  for (const event of input.events) {
    for (const candidate of [event.fromCustodian, event.toCustodian]) {
      if (!candidate) {
        continue;
      }

      if (custodians.at(-1) !== candidate) {
        custodians.push(candidate);
      }
    }
  }

  if (custodians.length === 0) {
    const fallback = input.asset.currentCustodian || input.asset.originSupplier;
    return {
      custodians: fallback ? [fallback] : [],
      display: fallback || "No custody data available",
      description: fallback
        ? "Only the latest available custodian is known for this asset."
        : "No meaningful chain-of-custody data has been recorded yet."
    };
  }

  return {
    custodians,
    display: custodians.join(" -> "),
    description: "Custody trail derived from recorded custody transitions."
  };
}

function deriveNextRecommendedAction(input: {
  currentStage: AssetStage | null;
  hasStageGap: boolean;
  hasStateMismatch: boolean;
}): NextRecommendedAction {
  if (input.hasStageGap || input.hasStateMismatch) {
    return {
      eventType: null,
      toStage: null,
      label: "Resolve lifecycle inconsistency",
      description:
        "No guided next step is suggested until the lifecycle history and stored asset state are reconciled.",
      blocked: true
    };
  }

  if (!input.currentStage) {
    return {
      eventType: null,
      toStage: null,
      label: "No next step available",
      description: "This asset does not yet have enough lifecycle history to recommend a next action.",
      blocked: true
    };
  }

  const nextEvent = getNextAllowedEvent(input.currentStage);

  if (!nextEvent) {
    return {
      eventType: null,
      toStage: null,
      label: "Lifecycle complete",
      description: "The asset has reached the final inspected stage.",
      blocked: true
    };
  }

  const transition = getExpectedTransition(nextEvent);
  const labelMap: Record<EventType, string> = {
    batch_created: "Register batch",
    certificate_attached: "Attach certificate",
    shipped: "Mark as shipped",
    received: "Confirm receipt",
    inspected: "Mark as inspected"
  };

  return {
    eventType: nextEvent,
    toStage: transition.to,
    label: labelMap[nextEvent],
    description: `${titleCaseStage(input.currentStage)} -> ${titleCaseStage(transition.to)}`,
    blocked: false
  };
}

export function buildEventWorkflowDefaults(input: {
  asset: Asset;
  analysis: AssetAuditViewModel;
}): EventWorkflowDefaults {
  return {
    assetId: input.asset.id,
    fromStage: input.analysis.derivedCurrentStage,
    fromCustodian: input.analysis.derivedCurrentCustodian,
    suggestedEventType: input.analysis.nextAction.eventType,
    suggestedToStage: input.analysis.nextAction.toStage,
    suggestedActionLabel: input.analysis.nextAction.label,
    guidance: input.analysis.nextAction.description,
    integrityBlocked: input.analysis.nextAction.blocked
  };
}
