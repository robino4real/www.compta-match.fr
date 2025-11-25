import React from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

type ProviderType = "SMTP" | "SENDGRID" | "RESEND" | "OTHER";

interface EmailSettingsResponse {
  id: number;
  providerType: ProviderType;
  fromNameDefault: string;
  fromEmailDefault: string;
  replyToEmailDefault?: string | null;
  ordersFromEmail?: string | null;
  billingEmail?: string | null;
  supportEmail?: string | null;
  technicalContactEmail?: string | null;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUsername?: string | null;
  smtpPasswordSet: boolean;
  apiKeySet: boolean;
}

interface EmailTemplateSummary {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

interface EmailTemplateDetail extends EmailTemplateSummary {
  subject: string;
  bodyHtml: string;
  bodyText?: string | null;
  placeholders?: string[];
}

const providerOptions: ProviderType[] = ["SMTP", "SENDGRID", "RESEND", "OTHER"];

const AdminEmailsPage: React.FC = () => {
  const [settings, setSettings] = React.useState<EmailSettingsResponse | null>(
    null
  );
  const [isLoadingSettings, setIsLoadingSettings] = React.useState(true);
  const [settingsError, setSettingsError] = React.useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = React.useState<string | null>(
    null
  );
  const [smtpPasswordInput, setSmtpPasswordInput] = React.useState("");
  const [apiKeyInput, setApiKeyInput] = React.useState("");
  const [resetSmtpPassword, setResetSmtpPassword] = React.useState(false);
  const [resetApiKey, setResetApiKey] = React.useState(false);

  const [templates, setTemplates] = React.useState<EmailTemplateSummary[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = React.useState(true);
  const [templatesError, setTemplatesError] = React.useState<string | null>(
    null
  );
  const [selectedTemplate, setSelectedTemplate] =
    React.useState<EmailTemplateDetail | null>(null);
  const [templateMessage, setTemplateMessage] = React.useState<string | null>(
    null
  );
  const [templateError, setTemplateError] = React.useState<string | null>(null);
  const [isSavingTemplate, setIsSavingTemplate] = React.useState(false);

  React.useEffect(() => {
    loadSettings();
    loadTemplates();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoadingSettings(true);
      setSettingsError(null);
      const response = await fetch(`${API_BASE_URL}/admin/email-settings`, {
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          data.message || "Impossible de charger la configuration email."
        );
      }
      setSettings(data.settings as EmailSettingsResponse);
      setSmtpPasswordInput("");
      setApiKeyInput("");
      setResetApiKey(false);
      setResetSmtpPassword(false);
    } catch (err: any) {
      console.error("Erreur chargement email settings", err);
      setSettingsError(err?.message || "Erreur lors du chargement des données.");
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const loadTemplates = async () => {
    try {
      setIsLoadingTemplates(true);
      setTemplatesError(null);
      const response = await fetch(`${API_BASE_URL}/admin/email-templates`, {
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          data.message || "Impossible de charger les templates d'email."
        );
      }
      setTemplates(Array.isArray(data.templates) ? data.templates : []);
    } catch (err: any) {
      console.error("Erreur chargement templates", err);
      setTemplatesError(
        err?.message || "Erreur lors du chargement des templates email."
      );
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const selectTemplate = async (templateId: string) => {
    try {
      setTemplateError(null);
      setTemplateMessage(null);
      const response = await fetch(
        `${API_BASE_URL}/admin/email-templates/${templateId}`,
        {
          credentials: "include",
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Impossible de charger le template.");
      }
      setSelectedTemplate(data.template as EmailTemplateDetail);
    } catch (err: any) {
      console.error("Erreur sélection template", err);
      setTemplateError(
        err?.message || "Erreur lors de la récupération du template."
      );
    }
  };

  const normalizeString = (value?: string | null) =>
    value === undefined || value === null || value === "" ? null : value;

  const handleSettingsChange = (
    field: keyof EmailSettingsResponse,
    value: string | number | null
  ) => {
    setSettings((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setSettingsError(null);
      setSettingsSuccess(null);
      const payload: any = {
        providerType: settings.providerType,
        fromNameDefault: settings.fromNameDefault,
        fromEmailDefault: settings.fromEmailDefault,
        replyToEmailDefault: normalizeString(settings.replyToEmailDefault),
        ordersFromEmail: normalizeString(settings.ordersFromEmail),
        billingEmail: normalizeString(settings.billingEmail),
        supportEmail: normalizeString(settings.supportEmail),
        technicalContactEmail: normalizeString(settings.technicalContactEmail),
      };

      if (settings.providerType === "SMTP") {
        payload.smtpHost = normalizeString(settings.smtpHost);
        payload.smtpUsername = normalizeString(settings.smtpUsername);
        payload.smtpPort = settings.smtpPort ? Number(settings.smtpPort) : null;
        if (smtpPasswordInput.trim()) {
          payload.smtpPassword = smtpPasswordInput.trim();
        } else if (resetSmtpPassword) {
          payload.smtpPassword = null;
        }
        payload.apiKey = null;
      } else {
        payload.smtpHost = null;
        payload.smtpPort = null;
        payload.smtpUsername = null;
        if (resetSmtpPassword) {
          payload.smtpPassword = null;
        }
        if (apiKeyInput.trim()) {
          payload.apiKey = apiKeyInput.trim();
        } else if (resetApiKey) {
          payload.apiKey = null;
        }
      }

      const response = await fetch(`${API_BASE_URL}/admin/email-settings`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Impossible d'enregistrer les réglages.");
      }
      setSettings(data.settings as EmailSettingsResponse);
      setSmtpPasswordInput("");
      setApiKeyInput("");
      setResetApiKey(false);
      setResetSmtpPassword(false);
      setSettingsSuccess(data.message || "Paramètres enregistrés");
    } catch (err: any) {
      console.error("Erreur sauvegarde email settings", err);
      setSettingsError(err?.message || "Erreur lors de la sauvegarde des données.");
    }
  };

  const handleTemplateChange = (
    field: keyof EmailTemplateDetail,
    value: string | boolean
  ) => {
    setSelectedTemplate((prev) =>
      prev ? { ...prev, [field]: value as any } : prev
    );
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    try {
      setTemplateError(null);
      setTemplateMessage(null);
      setIsSavingTemplate(true);
      const response = await fetch(
        `${API_BASE_URL}/admin/email-templates/${selectedTemplate.id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: selectedTemplate.subject,
            bodyHtml: selectedTemplate.bodyHtml,
            bodyText: selectedTemplate.bodyText,
            isActive: selectedTemplate.isActive,
          }),
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          data.message || "Impossible de mettre à jour le template."
        );
      }
      setSelectedTemplate(data.template as EmailTemplateDetail);
      setTemplateMessage(data.message || "Template mis à jour.");
      loadTemplates();
    } catch (err: any) {
      console.error("Erreur sauvegarde template", err);
      setTemplateError(
        err?.message || "Erreur lors de la sauvegarde du template."
      );
    } finally {
      setIsSavingTemplate(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-black">
              Emails & notifications
            </h1>
            <p className="text-xs text-slate-600">
              Configurez l'expéditeur et les templates des emails transactionnels.
            </p>
          </div>
          {isLoadingSettings && (
            <span className="text-[11px] text-slate-500">Chargement...</span>
          )}
        </div>

        {settingsError && (
          <p className="text-[11px] text-red-600">{settingsError}</p>
        )}
        {settingsSuccess && (
          <p className="text-[11px] text-green-600">{settingsSuccess}</p>
        )}

        {!isLoadingSettings && settings && (
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSaveSettings}>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-600">Fournisseur</label>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={settings.providerType}
                onChange={(e) =>
                  handleSettingsChange(
                    "providerType",
                    e.target.value as ProviderType
                  )
                }
              >
                {providerOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-600">Nom expéditeur</label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={settings.fromNameDefault}
                onChange={(e) =>
                  handleSettingsChange("fromNameDefault", e.target.value)
                }
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-600">Email expéditeur</label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={settings.fromEmailDefault}
                onChange={(e) =>
                  handleSettingsChange("fromEmailDefault", e.target.value)
                }
                type="email"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-600">Reply-to global</label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={settings.replyToEmailDefault || ""}
                onChange={(e) =>
                  handleSettingsChange("replyToEmailDefault", e.target.value)
                }
                type="email"
                placeholder="contact@exemple.fr"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-600">Email commandes</label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={settings.ordersFromEmail || ""}
                onChange={(e) =>
                  handleSettingsChange("ordersFromEmail", e.target.value)
                }
                type="email"
                placeholder="no-reply@exemple.fr"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-600">Email facturation</label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={settings.billingEmail || ""}
                onChange={(e) =>
                  handleSettingsChange("billingEmail", e.target.value)
                }
                type="email"
                placeholder="facturation@exemple.fr"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-600">Support client</label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={settings.supportEmail || ""}
                onChange={(e) =>
                  handleSettingsChange("supportEmail", e.target.value)
                }
                type="email"
                placeholder="support@exemple.fr"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-600">Contact technique</label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={settings.technicalContactEmail || ""}
                onChange={(e) =>
                  handleSettingsChange("technicalContactEmail", e.target.value)
                }
                type="email"
                placeholder="tech@exemple.fr"
              />
            </div>

            {settings.providerType === "SMTP" ? (
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-600">Hôte SMTP</label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={settings.smtpHost || ""}
                    onChange={(e) =>
                      handleSettingsChange("smtpHost", e.target.value)
                    }
                    placeholder="smtp.exemple.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-600">Port SMTP</label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={settings.smtpPort ?? ""}
                    onChange={(e) =>
                      handleSettingsChange(
                        "smtpPort",
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    type="number"
                    min={1}
                    placeholder="587"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-600">Utilisateur SMTP</label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={settings.smtpUsername || ""}
                    onChange={(e) =>
                      handleSettingsChange("smtpUsername", e.target.value)
                    }
                    placeholder="login SMTP"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-600 flex items-center justify-between">
                    <span>Mot de passe SMTP</span>
                    {settings.smtpPasswordSet && (
                      <span className="text-[10px] text-slate-500">déjà défini</span>
                    )}
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={smtpPasswordInput}
                    onChange={(e) => setSmtpPasswordInput(e.target.value)}
                    type="password"
                    placeholder="••••••"
                  />
                  <label className="flex items-center gap-2 text-[11px] text-slate-600">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={resetSmtpPassword}
                      onChange={(e) => setResetSmtpPassword(e.target.checked)}
                    />
                    <span>Supprimer le mot de passe existant</span>
                  </label>
                </div>
              </div>
            ) : (
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-600 flex items-center justify-between">
                    <span>Clé API du provider</span>
                    {settings.apiKeySet && (
                      <span className="text-[10px] text-slate-500">clé enregistrée</span>
                    )}
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    type="password"
                    placeholder="••••••"
                  />
                  <label className="flex items-center gap-2 text-[11px] text-slate-600">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={resetApiKey}
                      onChange={(e) => setResetApiKey(e.target.checked)}
                    />
                    <span>Supprimer la clé enregistrée</span>
                  </label>
                </div>
              </div>
            )}

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="rounded-full bg-black text-white px-4 py-2 text-sm font-semibold hover:bg-slate-800"
              >
                Enregistrer
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-black">Templates d'emails</h2>
            <p className="text-xs text-slate-600">
              Activez et modifiez les sujets et corps des notifications envoyées
              aux clients.
            </p>
          </div>
          {isLoadingTemplates && (
            <span className="text-[11px] text-slate-500">Chargement...</span>
          )}
        </div>

        {templatesError && (
          <p className="text-[11px] text-red-600">{templatesError}</p>
        )}

        {!isLoadingTemplates && templates.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">
                    Nom
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">
                    Clé
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">
                    Description
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">
                    Actif
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {templates.map((tpl) => (
                  <tr key={tpl.id} className="odd:bg-white even:bg-slate-50">
                    <td className="px-3 py-2 align-top text-slate-800">
                      {tpl.name}
                    </td>
                    <td className="px-3 py-2 align-top text-slate-800">
                      {tpl.key}
                    </td>
                    <td className="px-3 py-2 align-top text-slate-700">
                      {tpl.description || "—"}
                    </td>
                    <td className="px-3 py-2 align-top text-slate-800">
                      {tpl.isActive ? "Oui" : "Non"}
                    </td>
                    <td className="px-3 py-2 align-top text-slate-800">
                      <button
                        className="rounded-full border border-slate-300 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:border-black hover:text-black"
                        onClick={() => selectTemplate(tpl.id)}
                      >
                        Modifier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedTemplate && (
          <form className="space-y-3" onSubmit={handleSaveTemplate}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-semibold text-slate-500">
                  Édition du template
                </p>
                <h3 className="text-lg font-semibold text-black">
                  {selectedTemplate.name}
                </h3>
                <p className="text-[11px] text-slate-600">
                  Clé : {selectedTemplate.key}
                </p>
              </div>
              <label className="flex items-center gap-2 text-[11px] text-slate-700">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={selectedTemplate.isActive}
                  onChange={(e) =>
                    handleTemplateChange("isActive", e.target.checked)
                  }
                />
                <span>Activer l'envoi</span>
              </label>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-600">Sujet</label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={selectedTemplate.subject}
                onChange={(e) =>
                  handleTemplateChange("subject", e.target.value)
                }
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-600">Corps HTML</label>
              <textarea
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[160px]"
                value={selectedTemplate.bodyHtml}
                onChange={(e) =>
                  handleTemplateChange("bodyHtml", e.target.value)
                }
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-600">Corps texte (optionnel)</label>
              <textarea
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[120px]"
                value={selectedTemplate.bodyText || ""}
                onChange={(e) =>
                  handleTemplateChange("bodyText", e.target.value)
                }
                placeholder="Version texte brut"
              />
            </div>

            {selectedTemplate.placeholders && (
              <div className="space-y-1">
                <p className="text-[11px] text-slate-600">
                  Variables disponibles :
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.placeholders.map((ph) => (
                    <span
                      key={ph}
                      className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-[11px] text-slate-700"
                    >
                      {ph}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {templateError && (
              <p className="text-[11px] text-red-600">{templateError}</p>
            )}
            {templateMessage && (
              <p className="text-[11px] text-green-600">{templateMessage}</p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-full bg-black text-white px-4 py-2 text-sm font-semibold hover:bg-slate-800 disabled:opacity-70"
                disabled={isSavingTemplate}
              >
                {isSavingTemplate ? "Enregistrement..." : "Enregistrer le template"}
              </button>
            </div>
          </form>
        )}

        {!isLoadingTemplates && templates.length === 0 && !templatesError && (
          <p className="text-[11px] text-slate-600">Aucun template configuré.</p>
        )}
      </section>
    </div>
  );
};

export default AdminEmailsPage;
