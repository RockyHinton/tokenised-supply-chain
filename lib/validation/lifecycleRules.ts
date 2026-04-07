import { AssetStage, EventType } from "@/lib/types";

type TransitionRule = {
  from: AssetStage | null;
  to: AssetStage;
};

const EVENT_TRANSITIONS: Record<EventType, TransitionRule> = {
  batch_created: { from: null, to: "created" },
  certificate_attached: { from: "created", to: "certified" },
  shipped: { from: "certified", to: "shipped" },
  received: { from: "shipped", to: "received" },
  inspected: { from: "received", to: "inspected" }
};

export function getExpectedTransition(eventType: EventType): TransitionRule {
  return EVENT_TRANSITIONS[eventType];
}

export function validateLifecycleTransition(input: {
  eventType: EventType;
  fromStage: AssetStage | null;
  toStage: AssetStage;
}): void {
  const expected = getExpectedTransition(input.eventType);

  if (expected.from !== input.fromStage || expected.to !== input.toStage) {
    throw new Error(
      `Invalid transition for ${input.eventType}. Expected ${expected.from ?? "null"} -> ${expected.to}.`
    );
  }
}

export function getNextAllowedEvent(stage: AssetStage): EventType | null {
  const rule = Object.entries(EVENT_TRANSITIONS).find(
    ([, transition]) => transition.from === stage
  );

  return (rule?.[0] as EventType | undefined) ?? null;
}
