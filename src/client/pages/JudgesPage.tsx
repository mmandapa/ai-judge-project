/**
 * Judge management page.
 */
import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { GEMINI_DEFAULT_MODEL, OPENAI_DEFAULT_MODEL, type JudgeRecord, type ModelProvider } from "../../shared/types";
import { Card } from "../components/Card";
import { api } from "../lib/api";

type JudgeFormState = {
  id?: string;
  name: string;
  rubricPrompt: string;
  provider: ModelProvider;
  model: string;
  active: boolean;
};

/**
 * Blank form state used when creating a new judge or after save/delete.
 */
const emptyForm: JudgeFormState = {
  name: "",
  rubricPrompt: "",
  provider: "openai",
  model: OPENAI_DEFAULT_MODEL,
  active: true,
};

function getDefaultModel(provider: ModelProvider) {
  return provider === "gemini" ? GEMINI_DEFAULT_MODEL : OPENAI_DEFAULT_MODEL;
}

/**
 * Lets the user create, edit, and delete reusable judge definitions.
 */
export function JudgesPage() {
  const [searchParams] = useSearchParams();
  const [judges, setJudges] = useState<JudgeRecord[]>([]);
  const [form, setForm] = useState<JudgeFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const returnTo = searchParams.get("returnTo");

  /**
   * Loads the current judge list from the backend.
   */
  async function loadJudges() {
    try {
      setLoading(true);
      setError(null);
      setJudges(await api.listJudges());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load judges");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadJudges();
  }, []);

  /**
   * Saves either a new judge or edits the selected judge.
   */
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    try {
      setSaving(true);
      setError(null);
      if (form.id) {
        await api.updateJudge(form.id, form);
      } else {
        await api.createJudge(form);
      }

      setForm(emptyForm);
      await loadJudges();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save judge");
    } finally {
      setSaving(false);
    }
  }

  function handleProviderChange(nextProvider: ModelProvider) {
    setForm((current) => {
      const currentDefaultModel = getDefaultModel(current.provider);
      const nextModel = nextProvider === "gemini"
        ? GEMINI_DEFAULT_MODEL
        : current.provider === "gemini" || current.model === currentDefaultModel
          ? OPENAI_DEFAULT_MODEL
          : current.model;

      return {
        ...current,
        provider: nextProvider,
        model: nextModel,
      };
    });
  }

  /**
   * Deletes the currently selected judge after user confirmation.
   */
  async function handleDeleteJudge() {
    if (!form.id) {
      return;
    }

    const confirmed = window.confirm(
      `Delete judge "${form.name}"? This will also remove its queue assignments.`,
    );
    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      await api.deleteJudge(form.id);
      setForm(emptyForm);
      await loadJudges();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete judge");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="grid-two">
      <Card title={form.id ? "Edit judge" : "New judge"}>
        {returnTo ? (
          <div className="actions">
            <Link className="button" to={returnTo}>
              Back to queue setup
            </Link>
          </div>
        ) : null}
        <form className="stack" onSubmit={handleSubmit}>
          <label className="field">
            <span>Name</span>
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </label>
          <label className="field">
            <span>Rubric prompt</span>
            <textarea
              rows={8}
              value={form.rubricPrompt}
              onChange={(event) => setForm({ ...form, rubricPrompt: event.target.value })}
              required
            />
          </label>
          <label className="field">
            <span>Provider</span>
            <select
              value={form.provider}
              onChange={(event) => handleProviderChange(event.target.value as ModelProvider)}
            >
              <option value="openai">OpenAI</option>
              <option value="gemini">Gemini</option>
            </select>
          </label>
          <label className="field">
            <span>Model</span>
            <input
              value={form.model}
              onChange={(event) => setForm({ ...form, model: event.target.value })}
              required
              disabled={form.provider === "gemini"}
            />
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => setForm({ ...form, active: event.target.checked })}
            />
            <span>Active judge</span>
          </label>
          <div className="actions">
            <button className="button button-primary" disabled={saving}>
              {saving ? "Saving..." : form.id ? "Update judge" : "Create judge"}
            </button>
            {form.id ? (
              <button type="button" className="button" onClick={() => setForm(emptyForm)}>
                Reset
              </button>
            ) : null}
            {form.id ? (
              <button type="button" className="button button-danger" onClick={() => void handleDeleteJudge()} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete judge"}
              </button>
            ) : null}
          </div>
          {error ? <p className="error">{error}</p> : null}
        </form>
      </Card>

      <Card title="Saved judges">
        <p className="table-subtext">
          Judges are reusable templates. Queue-specific prompt field selection now happens during queue setup.
        </p>
        {loading ? <p>Loading judges…</p> : null}
        {!loading && judges.length === 0 ? <p className="muted">Create your first judge to start assigning reviews.</p> : null}
        <div className="stack">
          {judges.map((judge) => (
            <button key={judge.id} type="button" className="judge-card" onClick={() => setForm(judge)}>
              <div className="judge-card-top">
                <strong>{judge.name}</strong>
                <span className={judge.active ? "pill pill-active" : "pill"}>{judge.active ? "Active" : "Inactive"}</span>
              </div>
              <div className="judge-card-meta">
                {judge.provider} / {judge.model}
              </div>
              <p>{judge.rubricPrompt}</p>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
