import { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";

const CURRENCIES = ["₦ (NGN)", "$ (USD)", "£ (GBP)", "€ (EUR)", "GH₵ (GHS)"];
const TIMEZONES = ["Africa/Lagos", "Africa/Accra", "Africa/Nairobi", "Europe/London", "America/New_York"];

export default function SettingsPage() {
  const [form, setForm] = useState({
    companyName: "",
    currency: "₦ (NGN)",
    timezone: "Africa/Lagos",
    lowStockThreshold: 10,
    enableEmailAlerts: false,
    enableLowStockAlerts: true,
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, "settings", "general"));
      if (snap.exists()) setForm((f) => ({ ...f, ...snap.data() }));
    }
    load();
  }, []);

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); setSaved(false); }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    await setDoc(doc(db, "settings", "general"), form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const Section = ({ title, children }) => (
    <div className="bg-[#1a1d27] border border-slate-700/50 rounded-xl p-6 space-y-4">
      <h3 className="text-white font-semibold border-b border-slate-700/50 pb-3">{title}</h3>
      {children}
    </div>
  );

  const Field = ({ label, field, type = "text", placeholder = "" }) => (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
      <input type={type} value={form[field]} onChange={(e) => set(field, type === "number" ? Number(e.target.value) : e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#0f1117] text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-indigo-500 placeholder-slate-600" />
    </div>
  );

  const Toggle = ({ label, field, description }) => (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-white text-sm font-medium">{label}</p>
        {description && <p className="text-slate-500 text-xs mt-0.5">{description}</p>}
      </div>
      <button type="button" onClick={() => set(field, !form[field])}
        className={`relative w-11 h-6 rounded-full transition-colors ${form[field] ? "bg-indigo-600" : "bg-slate-700"}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form[field] ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Settings</h2>
        <p className="text-slate-400 text-sm mt-0.5">Configure your inventory system</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4 max-w-2xl">
        <Section title="Company">
          <Field label="Company Name" field="companyName" placeholder="e.g. Acme Enterprises" />
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Currency</label>
            <select value={form.currency} onChange={(e) => set("currency", e.target.value)}
              className="w-full bg-[#0f1117] text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-indigo-500">
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Timezone</label>
            <select value={form.timezone} onChange={(e) => set("timezone", e.target.value)}
              className="w-full bg-[#0f1117] text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-indigo-500">
              {TIMEZONES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </Section>

        <Section title="Stock Alerts">
          <Field label="Low Stock Threshold (units)" field="lowStockThreshold" type="number" />
          <Toggle label="Enable Low Stock Alerts" field="enableLowStockAlerts"
            description="Show alerts when stock falls below reorder point" />
          <Toggle label="Enable Email Alerts" field="enableEmailAlerts"
            description="Send email notifications for stock alerts" />
        </Section>

        <div className="flex items-center gap-4 pt-2">
          <button type="submit" disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold transition">
            {saving ? "Saving..." : "Save Settings"}
          </button>
          {saved && <p className="text-emerald-400 text-sm">✓ Settings saved</p>}
        </div>
      </form>
    </div>
  );
}