export interface ApiError extends Error {
  status?: number;
}

export async function apiFetch<T>(
  url: string,
  options: RequestInit & { skipDefaultJsonHeaders?: boolean } = {}
): Promise<T> {
  const { skipDefaultJsonHeaders, headers, ...rest } = options;
  const mergedHeaders = {
    ...(skipDefaultJsonHeaders ? {} : { "Content-Type": "application/json" }),
    ...(headers || {}),
  } as HeadersInit;

  const response = await fetch(url, {
    credentials: "include",
    ...rest,
    headers: mergedHeaders,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error: ApiError = new Error(
      (data && typeof data.message === "string" && data.message) ||
        "Une erreur est survenue lors de la communication avec le serveur."
    );
    error.status = response.status;
    throw error;
  }

  return data as T;
}
