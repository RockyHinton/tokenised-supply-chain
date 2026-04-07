"use client";

import { useRouter } from "next/navigation";
import {
  FormEvent,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  useMemo,
  useState
} from "react";

import { Asset, EventType } from "@/lib/types";
import { getExpectedTransition } from "@/lib/validation/lifecycleRules";

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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? "Request failed.");
  }

  return data;
}

export function CreateAssetForm() {
  const router = useRouter();
  const [state, setState] = useState<SubmitState>({ pending: false, error: null });

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
        batchNumber: form.get("batchNumber"),
        initialCustodian: form.get("initialCustodian"),
        actorId: form.get("actorId"),
        actorRole: form.get("actorRole"),
        locationName: form.get("locationName"),
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
      <Input name="originSupplier" label="Origin Supplier" placeholder="Kumasi Growers Cooperative" required />
      <Input name="batchNumber" label="Batch Number" placeholder="BATCH-003" required />
      <Input name="initialCustodian" label="Initial Custodian" placeholder="supplier_003" required />
      <Input name="actorId" label="Actor ID" placeholder="supplier_003" required />
      <Input name="actorRole" label="Actor Role" placeholder="supplier" required />
      <Input name="locationName" label="Location" placeholder="Supplier Warehouse B" required />
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
  initialAssetId
}: {
  assets: Asset[];
  initialAssetId?: string;
}) {
  const router = useRouter();
  const [selectedAssetId, setSelectedAssetId] = useState<string>(
    initialAssetId ?? assets[0]?.id ?? ""
  );
  const [eventType, setEventType] = useState<EventType>("certificate_attached");
  const [state, setState] = useState<SubmitState>({ pending: false, error: null });

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.id === selectedAssetId) ?? null,
    [assets, selectedAssetId]
  );

  const transition = getExpectedTransition(eventType);

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
          {assets.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {asset.assetId} · {asset.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-ink">Event Type</label>
        <select
          name="eventType"
          value={eventType}
          onChange={(event) => setEventType(event.target.value as EventType)}
          className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-accent"
        >
          <option value="certificate_attached">certificate_attached</option>
          <option value="shipped">shipped</option>
          <option value="received">received</option>
          <option value="inspected">inspected</option>
        </select>
      </div>
      <Input name="actorId" label="Actor ID" placeholder="logistics_001" required />
      <Input name="actorRole" label="Actor Role" placeholder="logistics" required />
      <Input name="locationName" label="Location" placeholder="Distribution Hub West" />
      <Input
        name="fromStage"
        label="Previous Stage"
        value={(selectedAsset?.currentStage ?? transition.from ?? "") as string}
        readOnly
      />
      <Input name="toStage" label="New Stage" value={transition.to} readOnly />
      <Input
        name="fromCustodian"
        label="Previous Custodian"
        value={selectedAsset?.currentCustodian ?? ""}
        readOnly
      />
      <Input name="toCustodian" label="New Custodian" placeholder="carrier_001" required />
      <TextArea
        name="notes"
        label="Notes"
        placeholder="Add operational context for this event"
        className="md:col-span-2"
      />
      <Input name="documentHash" label="Document Hash" placeholder="sha256:abc123example" />
      <Input name="documentFilename" label="Document Filename" placeholder="inspection-report.pdf" />
      <Input name="documentType" label="Document Type" placeholder="inspection_report" />
      {state.error ? <ErrorText message={state.error} /> : null}
      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={state.pending}
          className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-70"
        >
          {state.pending ? "Submitting..." : "Record Event"}
        </button>
      </div>
    </form>
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
