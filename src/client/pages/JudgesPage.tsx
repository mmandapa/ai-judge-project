import { useEffect, useState, type FormEvent } from "react";
import type { JudgeRecord } from "../../shared/types";
import { Card } from "../components/Card";
import { api } from "../lib/api";

type JudgeFormState = {
  id?: string;
  name: string;
  rubricPrompt: string;
  provider: string;
  model: string;
  active: boolean;
};

const emptyForm: JudgeFormState = {
  name: "",
  rubricPrompt: "",
  provider: "openai",
  model: "gpt-4.1-mini",
  active: true,
};

export function JudgesPage() {
  const [judges, setJudges] = useState<JudgeRecord[]>([]);
  const [form, setForm] = useState<JudgeFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="grid-two">
      <Card title={form.id ? "Edit judge" : "New judge"}>
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
            <input
              value={form.provider}
              onChange={(event) => setForm({ ...form, provider: event.target.value })}
              required
            />
          </label>
          <label className="field">
            <span>Model</span>
            <input value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} required />
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
          </div>
          {error ? <p className="error">{error}</p> : null}
        </form>
      </Card>

      <Card title="Saved judges">
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
