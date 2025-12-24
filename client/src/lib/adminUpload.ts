import { buildApiUrl } from "../config/api";

export type AdminUploadResponse = {
  url: string;
  absoluteUrl?: string;
  filename?: string;
  mimeType?: string;
  size?: number;
};

export async function uploadAdminImage(file: File): Promise<AdminUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(buildApiUrl("/admin/uploads"), {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const data = (await response.json().catch(() => ({}))) as
    | AdminUploadResponse
    | { message?: string };

  if (!response.ok) {
    throw new Error(
      (data as { message?: string }).message ||
        "Impossible de téléverser l'image pour le moment."
    );
  }

  if (!data || !(data as AdminUploadResponse).url) {
    throw new Error("Réponse inattendue lors du téléversement.");
  }

  return data as AdminUploadResponse;
}
