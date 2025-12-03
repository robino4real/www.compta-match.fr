import { useHomepageSettings } from "./useHomepageSettings";

export function useHomepageContent() {
  // Compatibilité : renvoie les mêmes données que useHomepageSettings.
  const { data, isLoading, error, reload } = useHomepageSettings();
  return { settings: data, isLoading, error, reload };
}
