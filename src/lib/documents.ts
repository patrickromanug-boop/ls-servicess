import { jsPDF } from "jspdf";
import { supabase } from "./supabase";
import { documentTypeLabel, type DocumentType } from "./plans";

const BUCKET = "document-requests";

type Field = { label: string; value: string };

/** Builds a simple, readable PDF from whatever the user typed in the form. */
export function buildDocumentPdf(input: {
  documentType: DocumentType;
  personName: string;
  fields: Field[];
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 56;
  const width = doc.internal.pageSize.getWidth() - marginX * 2;
  let y = 72;

  const newPageIfNeeded = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 64) {
      doc.addPage();
      y = 72;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(documentTypeLabel(input.documentType), marginX, y);
  y += 26;

  doc.setFontSize(13);
  doc.text(input.personName || "Applicant", marginX, y);
  y += 14;

  doc.setDrawColor(31, 63, 212);
  doc.setLineWidth(2);
  doc.line(marginX, y, marginX + width, y);
  y += 26;

  for (const field of input.fields) {
    if (!field.value.trim()) continue;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    newPageIfNeeded(40);
    doc.text(field.label.toUpperCase(), marginX, y);
    y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(field.value.trim(), width) as string[];
    for (const line of lines) {
      newPageIfNeeded(18);
      doc.text(line, marginX, y);
      y += 15;
    }
    y += 14;
  }

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(120);
  newPageIfNeeded(30);
  doc.text("Prepared with LS Services — lsservices.ug", marginX, y + 8);

  return doc.output("blob");
}

/**
 * Uploads to the private "document-requests" bucket. We store the object PATH
 * (not a public URL) in document_requests.pdf_url — the bucket is private, so
 * both the user and the admin fetch it through a signed URL.
 */
export async function uploadDocumentPdf(userId: string, requestId: string, blob: Blob) {
  const path = `${userId}/${requestId}.pdf`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: "application/pdf", upsert: true });
  if (error) throw error;
  return path;
}

export async function signedDocumentUrl(path: string) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 10);
  if (error) throw error;
  return data.signedUrl;
}
