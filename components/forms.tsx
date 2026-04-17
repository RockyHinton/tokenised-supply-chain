"use client";

import { useRouter } from "next/navigation";
import {
  FormEvent,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  useEffect,
  useMemo,
  useState
} from "react";

import { EventWorkflowAssetOption } from "@/lib/domain/assetAudit";
import { EventType } from "@/lib/types";
import { getExpectedTransition } from "@/lib/validation/lifecycleRules";
import {
  FormLocationOption,
  FormOrganisationOption,
  FormUserOption
} from "@/lib/services/referenceDataService";

type SubmitState = {
  pending: boolean;
  error: string | null;
};

async function postJson(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const raw = await response.text();
  let data: Record<string, unknown> = {};

  if (raw) {
    try {
      data = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      data = {};
    }
  }

  if (!response.ok) {
    const message = typeof data.error === "string" ? data.error : "Request failed.";
    throw new Error(message);
  }

  return data;
}

export function CreateAssetForm({
  options
}: {
  options: {
    organisations: FormOrganisationOption[];
    users: FormUserOption[];
    locations: FormLocationOption[];
  };
}) {
  const router = useRouter();
  const [state, setState] = useState<SubmitState>({ pending: false, error: null });
  const [originOrganisationId, setOriginOrganisationId] = useState(
    options.organisations[0]?.id ?? ""
  );
  const [initialCustodian, setInitialCustodian] = useState(options.organisations[0]?.id ?? "");
  const [actorId, setActorId] = useState(options.users[0]?.id ?? "");
  const [locationId, setLocationId] = useState(options.locations[0]?.id ?? "");

  const selectedOrigin = options.organisations.find((item) => item.id === originOrganisationId);
  const selectedActor = options.users.find((item) => item.id === actorId);
  const selectedLocation = options.locations.find((item) => item.id === locationId);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      setState({ pending: true, error: null });
      await postJson("/api/assets", {
        assetId: form.get("assetId"),
        assetType: form.get("assetType"),
        name: form.get("name"),
        description: form.get("description"),
        originSupplier: form.get("originSupplier"),
        originOrganisationId: form.get("originOrganisationId"),
        batchNumber: form.get("batchNumber"),
        initialCustodian: form.get("initialCustodian"),
        actorId: form.get("actorId"),
        actorRole: form.get("actorRole"),
        locationName: form.get("locationName"),
        locationId: form.get("locationId"),
        notes: form.get("notes")
      });
      router.push("/assets");
      router.refresh();
    } catch (error) {
      setState({
        pending: false,
        error: error instanceof Error ? error.message : "Unable to create asset."
      });
      return;
    }

    setState({ pending: false, error: null });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
      <Input name="assetId" label="Asset ID" placeholder="RM-COCOA-003" required />
      <Input name="assetType" label="Asset Type" placeholder="raw_material_batch" required />
      <Input name="name" label="Material / Component Name" placeholder="Premium Cocoa Beans" required />
      <Select
        name="originOrganisationId"
        label="Origin Supplier"
        value={originOrganisationId}
        onChange={setOriginOrganisationId}
        options={options.organisations.map((organisation) => ({
          value: organisation.id,
          label: `${organisation.name} (${organisation.id})`
        }))}
      />
      <Input name="batchNumber" label="Batch Number" placeholder="BATCH-003" required />
      <Select
        name="initialCustodian"
        label="Initial Custodian"
        value={initialCustodian}
        onChange={setInitialCustodian}
        options={options.organisations.map((organisation) => ({
          value: organisation.id,
          label: `${organisation.name} (${organisation.id})`
        }))}
      />
      <Select
        name="actorId"
        label="Actor"
        value={actorId}
        onChange={setActorId}
        options={options.users.map((user) => ({
          value: user.id,
          label: `${user.name} (${user.id})`
        }))}
      />
      <ReadOnlyField label="Actor Role" value={selectedActor?.role ?? "Not available"} />
      <Select
        name="locationId"
        label="Location"
        value={locationId}
        onChange={setLocationId}
        options={options.locations.map((location) => ({
          value: location.id,
          label: `${location.name} (${location.id})`
        }))}
      />
      <input type="hidden" name="originSupplier" value={selectedOrigin?.name ?? ""} />
      <input type="hidden" name="actorRole" value={selectedActor?.role ?? ""} />
      <input type="hidden" name="locationName" value={selectedLocation?.name ?? ""} />
      <TextArea
        name="description"
        label="Description"
        placeholder="Describe the batch or component"
        className="md:col-span-2"
        required
      />
      <TextArea
        name="notes"
        label="Metadata Notes"
        placeholder="Initial batch registration"
        className="md:col-span-2"
      />
      {state.error ? <ErrorText message={state.error} /> : null}
      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={state.pending}
          className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-70"
        >
          {state.pending ? "Creating..." : "Create Asset"}
        </button>
      </div>
    </form>
  );
}

export function RecordEventForm({
  assets,
  options,
  initialAssetId,
  initialEventType
}: {
  assets: EventWorkflowAssetOption[];
  options: {
    organisations: FormOrganisationOption[];
    users: FormUserOption[];
    locations: FormLocationOption[];
  };
  initialAssetId?: string;
  initialEventType?: EventType;
}) {
  const router = useRouter();
  const [selectedAssetId, setSelectedAssetId] = useState<string>(
    initialAssetId ?? assets[0]?.asset.id ?? ""
  );
  const [eventType, setEventType] = useState<EventType>(initialEventType ?? "certificate_attached");
  const [actorId, setActorId] = useState<string>(options.users[0]?.id ?? "");
  const [locationId, setLocationId] = useState<string>(options.locations[0]?.id ?? "");
  const [toCustodian, setToCustodian] = useState<string>(options.organisations[0]?.id ?? "");
  const [state, setState] = useState<SubmitState>({ pending: false, error: null });

  const selectedOption = useMemo(
    () => assets.find((entry) => entry.asset.id === selectedAssetId) ?? null,
    [assets, selectedAssetId]
  );
  const selectedAsset = selectedOption?.asset ?? null;
  const selectedActor = options.users.find((user) => user.id === actorId);
  const selectedLocation = options.locations.find((location) => location.id === locationId);

  useEffect(() => {
    if (!selectedOption) {
      return;
    }

    const suggested = selectedOption.workflow.suggestedEventType;
    setEventType((current) => {
      if (
        initialEventType &&
        selectedOption.asset.id === initialAssetId
      ) {
        return initialEventType;
      }

      return suggested ?? current;
    });
  }, [initialAssetId, initialEventType, selectedOption]);

  useEffect(() => {
    if (!selectedOption) {
      return;
    }

    setToCustodian(selectedOption.workflow.fromCustodian ?? options.organisations[0]?.id ?? "");
  }, [options.organisations, selectedOption]);

  const transition = getExpectedTransition(eventType);
  const fromStage = selectedOption?.workflow.fromStage ?? transition.from;
  const fromCustodian =
    selectedOption?.workflow.fromCustodian ?? selectedOption?.asset.currentCustodian ?? null;
  const toStage = transition.to;
  const requiresCustodianChange = eventType === "shipped" || eventType === "received";
  const requiresDocumentFields = eventType === "certificate_attached";
  const showOptionalDocumentFields = eventType === "inspected";
  const canSubmit = selectedOption
    ? !selectedOption.workflow.integrityBlocked && Boolean(selectedOption.workflow.suggestedEventType)
    : false;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      setState({ pending: true, error: null });
      await postJson("/api/events", {
        assetId: form.get("assetId"),
        eventType: form.get("eventType"),
        actorId: form.get("actorId"),
        actorRole: form.get("actorRole"),
        locationName: form.get("locationName"),
        locationId: form.get("locationId"),
        fromStage: form.get("fromStage") || null,
        toStage: form.get("toStage"),
        fromCustodian: form.get("fromCustodian") || null,
        toCustodian: form.get("toCustodian") || null,
        notes: form.get("notes"),
        documentHash: form.get("documentHash"),
        documentFilename: form.get("documentFilename"),
        documentType: form.get("documentType")
      });
      router.push(selectedAsset ? `/assets/${selectedAsset.id}` : "/assets");
      router.refresh();
    } catch (error) {
      setState({
        pending: false,
        error: error instanceof Error ? error.message : "Unable to record event."
      });
      return;
    }

    setState({ pending: false, error: null });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2">
        <label className="text-sm font-medium text-ink">Asset</label>
        <select
          name="assetId"
          value={selectedAssetId}
          onChange={(event) => setSelectedAssetId(event.target.value)}
          className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-accent"
          required
        >
          {assets.map((option) => (
            <option key={option.asset.id} value={option.asset.id}>
              {option.asset.assetId} · {option.asset.name}
            </option>
          ))}
        </select>
      </div>

      {selectedOption ? (
        <div className="md:col-span-2 rounded-2xl border border-line bg-mist/40 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate">
            Next Recommended Action
          </p>
          <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold">{selectedOption.workflow.suggestedActionLabel}</p>
              <p className="text-sm text-slate">{selectedOption.workflow.guidance}</p>
            </div>
            <div className="text-sm text-slate">
              Current state: {selectedOption.audit.lifecycle.currentStageLabel} ·{" "}
              {selectedOption.audit.processIntegrity.label}
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-medium text-ink">Event Type</label>
        <select
          name="eventType"
          value={eventType}
          onChange={(event) => setEventType(event.target.value as EventType)}
          className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-accent"
          disabled={!selectedOption || selectedOption.workflow.integrityBlocked}
        >
          <option value="certificate_attached">certificate_attached</option>
          <option value="shipped">shipped</option>
          <option value="received">received</option>
          <option value="inspected">inspected</option>
        </select>
      </div>
      <Select
        name="actorId"
        label="Actor"
        value={actorId}
        onChange={setActorId}
        options={options.users.map((user) => ({
          value: user.id,
          label: `${user.name} (${user.id})`
        }))}
      />
      <ReadOnlyField label="Actor Role" value={selectedActor?.role ?? "Not available"} />
      <Select
        name="locationId"
        label="Location"
        value={locationId}
        onChange={setLocationId}
        options={options.locations.map((location) => ({
          value: location.id,
          label: `${location.name} (${location.id})`
        }))}
      />
      <input type="hidden" name="actorRole" value={selectedActor?.role ?? ""} />
      <input type="hidden" name="locationName" value={selectedLocation?.name ?? ""} />

      <input type="hidden" name="fromStage" value={fromStage ?? ""} />
      <input type="hidden" name="toStage" value={toStage} />
      <input type="hidden" name="fromCustodian" value={fromCustodian ?? ""} />
      {!requiresCustodianChange ? (
        <input type="hidden" name="toCustodian" value={fromCustodian ?? ""} />
      ) : null}

      <ReadOnlyField label="Previous Stage" value={fromStage ?? "None"} />
      <ReadOnlyField label="New Stage" value={toStage} />
      <ReadOnlyField label="Previous Custodian" value={fromCustodian ?? "Not recorded"} />
      {requiresCustodianChange ? (
        <Select
          name="toCustodian"
          label="New Custodian"
          value={toCustodian}
          onChange={setToCustodian}
          options={options.organisations.map((organisation) => ({
            value: organisation.id,
            label: `${organisation.name} (${organisation.id})`
          }))}
        />
      ) : (
        <ReadOnlyField label="Next Custodian" value={fromCustodian ?? "No change"} />
      )}
      <TextArea
        name="notes"
        label="Notes"
        placeholder="Add operational context for this event"
        className="md:col-span-2"
      />

      {requiresDocumentFields || showOptionalDocumentFields ? (
        <>
          <Input
            name="documentHash"
            label="Document Hash"
            placeholder="sha256:abc123example"
            required={requiresDocumentFields}
          />
          <Input
            name="documentFilename"
            label="Document Filename"
            placeholder="inspection-report.pdf"
            required={requiresDocumentFields}
          />
          <Input
            name="documentType"
            label="Document Type"
            placeholder="certificate_of_origin"
            required={requiresDocumentFields}
          />
        </>
      ) : (
        <>
          <input type="hidden" name="documentHash" value="" />
          <input type="hidden" name="documentFilename" value="" />
          <input type="hidden" name="documentType" value="" />
        </>
      )}

      {!canSubmit && selectedOption ? (
        <p className="md:col-span-2 text-sm text-amber-700">
          {selectedOption.workflow.guidance}
        </p>
      ) : null}
      {state.error ? <ErrorText message={state.error} /> : null}
      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={state.pending || !canSubmit}
          className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-70"
        >
          {state.pending ? "Submitting..." : "Record Event"}
        </button>
      </div>
    </form>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      <div className="rounded-2xl border border-line bg-mist/30 px-4 py-3 text-sm text-slate">
        {value}
      </div>
    </div>
  );
}

function Input({
  label,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={`block space-y-2 ${className}`}>
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        {...props}
        className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-accent"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  name,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  name: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      <select
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-accent"
        required
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextArea({
  label,
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className={`block space-y-2 ${className}`}>
      <span className="text-sm font-medium text-ink">{label}</span>
      <textarea
        {...props}
        rows={4}
        className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-accent"
      />
    </label>
  );
}

function ErrorText({ message }: { message: string }) {
  return <p className="md:col-span-2 text-sm text-red-600">{message}</p>;
}
