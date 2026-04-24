import { useRef, useState } from 'react';
import { ArrowLeft, Download, Upload, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button.jsx';
import SettingsRow from '../components/SettingsRow.jsx';
import {
  clearAll,
  getSettings,
  getState,
  replaceState,
  updateSettings,
} from '../lib/storage.js';
import {
  downloadJSON,
  mergeImport,
  parseImport,
} from '../lib/exportImport.js';

const APP_VERSION = '0.3.0';

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={[
        'relative w-11 h-6 rounded-full transition-colors',
        'focus:outline-none focus-visible:ring-1 focus-visible:ring-crimson focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
        checked ? 'bg-crimson-bright' : 'bg-surface-high',
      ].join(' ')}
    >
      <span
        className={[
          'absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all',
          checked ? 'left-5' : 'left-0.5',
        ].join(' ')}
      />
    </button>
  );
}

export default function Settings({ setToast }) {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(() => getSettings());
  const [confirm, setConfirm] = useState(null);
  const [pendingImport, setPendingImport] = useState(null);
  const fileInputRef = useRef(null);

  function toggle(key) {
    const next = updateSettings({ [key]: !settings[key] });
    setSettings({ ...settings, ...next });
  }

  function handleExport() {
    downloadJSON(getState());
    setToast?.('Data exported.');
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChosen(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseImport(text);
      setPendingImport(parsed);
      setConfirm('import');
    } catch (err) {
      setToast?.(`Import failed: ${err.message}`);
    }
  }

  function applyImport(mode) {
    if (!pendingImport) return;
    if (mode === 'replace') {
      replaceState(pendingImport);
    } else {
      const current = getState();
      replaceState(mergeImport(current, pendingImport));
    }
    setConfirm(null);
    setPendingImport(null);
    setSettings(getSettings());
    setToast?.(`Import ${mode === 'replace' ? 'replaced' : 'merged'}.`);
  }

  function handleClearConfirm() {
    clearAll();
    setSettings(getSettings());
    setConfirm(null);
    setToast?.('All data cleared.');
    navigate('/', { replace: true });
  }

  return (
    <div className="min-h-full pt-safe pb-32">
      <header className="px-8 pt-12 flex items-start gap-4">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="w-10 h-10 flex items-center justify-center text-ink-faint hover:text-crimson transition-colors focus:outline-none focus-visible:text-crimson"
        >
          <ArrowLeft size={20} strokeWidth={1.4} />
        </button>
        <div className="flex-1">
          <div className="label-md text-crimson tracking-[0.32em]">◆&nbsp;&nbsp;Colophon</div>
          <h1 className="mt-3 font-serif text-4xl font-light text-ink leading-tight">
            Settings
          </h1>
          <div className="hairline-strong mt-6" />
        </div>
      </header>

      <div className="px-8 mt-10 space-y-10">
        <section>
          <div className="flex items-center gap-4 mb-4">
            <h2 className="label-md text-crimson tracking-[0.2em]">Workout</h2>
            <span className="hairline flex-1" />
          </div>
          <div className="space-y-px bg-hairline">
            <SettingsRow title="Audio cues" description="Beeps during countdown and phase changes">
              <Toggle
                label="Audio cues"
                checked={settings.audioEnabled}
                onChange={() => toggle('audioEnabled')}
              />
            </SettingsRow>
            <SettingsRow title="Haptics" description="Vibration on phase transitions">
              <Toggle
                label="Haptics"
                checked={settings.hapticsEnabled}
                onChange={() => toggle('hapticsEnabled')}
              />
            </SettingsRow>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-4 mb-4">
            <h2 className="label-md text-crimson tracking-[0.2em]">Data</h2>
            <span className="hairline flex-1" />
          </div>
          <div className="space-y-px bg-hairline">
            <SettingsRow
              as="button"
              title="Export data"
              description="Download all sessions and settings as JSON"
              onClick={handleExport}
            >
              <Download size={16} strokeWidth={1.4} className="text-ink-faint" aria-hidden />
            </SettingsRow>
            <SettingsRow
              as="button"
              title="Import data"
              description="Merge or replace from a previous export"
              onClick={handleImportClick}
            >
              <Upload size={16} strokeWidth={1.4} className="text-ink-faint" aria-hidden />
            </SettingsRow>
            <SettingsRow
              as="button"
              title="Clear all data"
              description="Permanently delete every session and setting"
              onClick={() => setConfirm('clear')}
            >
              <Trash2 size={16} strokeWidth={1.4} className="text-error" aria-hidden />
            </SettingsRow>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-4 mb-4">
            <h2 className="label-md text-crimson tracking-[0.2em]">About</h2>
            <span className="hairline flex-1" />
          </div>
          <div className="bg-surface-1 px-5 py-5">
            <div className="font-serif text-2xl text-ink leading-tight">Build At Home</div>
            <div className="mt-2 font-mono text-[12px] tabular text-ink-faint tracking-[0.18em] uppercase">
              Version&nbsp;{APP_VERSION}
            </div>
            <p className="mt-4 font-serif italic text-ink-dim text-sm leading-relaxed">
              A quiet ledger for skipping intervals and push/pull/legs strength work.
            </p>
          </div>
        </section>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleFileChosen}
      />

      {confirm === 'clear' ? (
        <Modal
          title="Clear all data?"
          body="This permanently deletes every session, PR, and setting. This can't be undone."
          onCancel={() => setConfirm(null)}
          primary={{ label: 'Clear everything', variant: 'danger', onClick: handleClearConfirm }}
        />
      ) : null}

      {confirm === 'import' ? (
        <Modal
          title="Import data"
          body={`Found ${pendingImport?.sessions?.length ?? 0} session${pendingImport?.sessions?.length === 1 ? '' : 's'}. Replace current data or merge with it?`}
          onCancel={() => { setConfirm(null); setPendingImport(null); }}
          primary={{ label: 'Merge', variant: 'primary', onClick: () => applyImport('merge') }}
          secondary={{ label: 'Replace', variant: 'danger', onClick: () => applyImport('replace') }}
        />
      ) : null}
    </div>
  );
}

function Modal({ title, body, onCancel, primary, secondary }) {
  return (
    <div className="fixed inset-0 z-30 bg-black/80 backdrop-blur flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface-low border border-hairline-strong p-6">
        <div className="label-md text-crimson tracking-[0.32em]">◆&nbsp;&nbsp;Confirm</div>
        <h3 className="mt-3 font-serif text-2xl text-ink leading-tight">{title}</h3>
        <p className="mt-3 body-md text-ink-dim">{body}</p>
        <div className="hairline mt-5" />
        <div className="mt-5 space-y-2">
          <Button variant={primary.variant} size="md" className="w-full" onClick={primary.onClick}>
            {primary.label}
          </Button>
          {secondary ? (
            <Button variant={secondary.variant} size="md" className="w-full" onClick={secondary.onClick}>
              {secondary.label}
            </Button>
          ) : null}
          <Button variant="ghost" size="md" className="w-full" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
