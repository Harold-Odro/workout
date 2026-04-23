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
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500',
        checked ? 'bg-green-500' : 'bg-neutral-700',
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
  const [confirm, setConfirm] = useState(null); // 'clear' | 'import' | null
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
    <div className="min-h-full pt-safe pb-24">
      <header className="px-5 pt-6 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-semibold text-neutral-100">Settings</h1>
      </header>

      <div className="px-5 mt-6 space-y-6">
        <section>
          <h2 className="text-xs uppercase tracking-wider text-neutral-500 mb-2">Workout</h2>
          <div className="space-y-2">
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
          <h2 className="text-xs uppercase tracking-wider text-neutral-500 mb-2">Data</h2>
          <div className="space-y-2">
            <SettingsRow
              as="button"
              title="Export data"
              description="Download all sessions + settings as JSON"
              onClick={handleExport}
            >
              <Download size={18} className="text-neutral-500" aria-hidden />
            </SettingsRow>
            <SettingsRow
              as="button"
              title="Import data"
              description="Merge or replace from a previous export"
              onClick={handleImportClick}
            >
              <Upload size={18} className="text-neutral-500" aria-hidden />
            </SettingsRow>
            <SettingsRow
              as="button"
              title="Clear all data"
              description="Permanently delete every session and setting"
              onClick={() => setConfirm('clear')}
            >
              <Trash2 size={18} className="text-red-500" aria-hidden />
            </SettingsRow>
          </div>
        </section>

        <section>
          <h2 className="text-xs uppercase tracking-wider text-neutral-500 mb-2">About</h2>
          <SettingsRow title="Skip Tracker" description={`Version ${APP_VERSION}`} />
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
    <div className="fixed inset-0 z-30 bg-black/70 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-5">
        <h3 className="text-lg font-semibold text-neutral-100">{title}</h3>
        <p className="mt-1 text-sm text-neutral-400">{body}</p>
        <div className="mt-4 space-y-2">
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
