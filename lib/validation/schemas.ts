import { z } from "zod";

import { EVENT_TYPES, STAGES } from "@/lib/types";

export const createAssetSchema = z.object({
  assetId: z.string().min(1, "Asset ID is required."),
  assetType: z.string().min(1, "Asset type is required."),
  name: z.string().min(1, "Material or component name is required."),
  description: z.string().min(1, "Description is required."),
  originSupplier: z.string().min(1, "Origin supplier is required."),
  batchNumber: z.string().min(1, "Batch number is required."),
  initialCustodian: z.string().min(1, "Initial custodian is required."),
  actorId: z.string().min(1, "Actor ID is required."),
  actorRole: z.string().min(1, "Actor role is required."),
  locationName: z.string().min(1, "Location is required."),
  notes: z.string().trim().optional().default("")
});

export const createEventSchema = z.object({
  assetId: z.string().min(1, "Asset is required."),
  eventType: z.enum(EVENT_TYPES),
  actorId: z.string().min(1, "Actor ID is required."),
  actorRole: z.string().min(1, "Actor role is required."),
  locationName: z.string().trim().optional().default(""),
  fromStage: z.enum(STAGES).nullable(),
  toStage: z.enum(STAGES),
  fromCustodian: z.string().trim().nullable(),
  toCustodian: z.string().trim().nullable(),
  notes: z.string().trim().optional().default(""),
  documentHash: z.string().trim().optional().default(""),
  documentFilename: z.string().trim().optional().default(""),
  documentType: z.string().trim().optional().default("")
});

export const createDocumentSchema = z.object({
  assetId: z.string().min(1, "Asset is required."),
  eventId: z.string().min(1, "Event is required."),
  filename: z.string().min(1, "Filename is required."),
  documentType: z.string().min(1, "Document type is required."),
  hash: z.string().min(1, "Document hash is required.")
});

export const prepareLedgerSchema = z.object({
  assetId: z.string().min(1),
  eventType: z.enum(EVENT_TYPES),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  fromStage: z.enum(STAGES).nullable(),
  toStage: z.enum(STAGES),
  fromCustodian: z.string().nullable().optional(),
  toCustodian: z.string().nullable().optional(),
  locationName: z.string().optional(),
  notes: z.string().optional(),
  documentHash: z.string().optional(),
  documentFilename: z.string().optional(),
  documentType: z.string().optional()
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type PrepareLedgerInput = z.infer<typeof prepareLedgerSchema>;
