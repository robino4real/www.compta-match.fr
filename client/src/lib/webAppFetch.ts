export class WebAppApiError extends Error {
  constructor(message: string, public status?: number, public code?: string) {
    super(message);
  }
}

interface WebAppErrorResponse {
  ok?: boolean;
  error?: { code?: string; message?: string };
  message?: string;
}

export async function webAppFetch<T>(
  url: string,
  options: RequestInit & { skipDefaultJsonHeaders?: boolean } = {}
): Promise<T> {
  const { skipDefaultJsonHeaders, headers, ...rest } = options;
  const mergedHeaders = {
    ...(skipDefaultJsonHeaders ? {} : { "Content-Type": "application/json" }),
    ...(headers || {}),
  } as HeadersInit;

  let response: Response;
  let payload: WebAppErrorResponse = {};

  try {
    response = await fetch(url, {
      credentials: "include",
      ...rest,
      headers: mergedHeaders,
    });
  } catch (error) {
    throw new WebAppApiError(
      "Impossible de se connecter au serveur. Vérifiez votre connexion puis réessayez.",
      0
    );
  }

  try {
    payload = ((await response.json()) as WebAppErrorResponse) ?? {};
  } catch (error) {
    payload = {};
  }

  if (!response.ok) {
    const message =
      payload?.error?.message || payload?.message || "Une erreur est survenue lors de l'appel API.";
    const appError = new WebAppApiError(message, response.status, payload?.error?.code);

    throw appError;
  }

  return payload as T;
}
