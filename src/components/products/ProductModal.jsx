import { useState, useEffect } from "react";

const CATEGORIES = ["Electronics", "Clothing", "Food & Beverage", "Hardware", "Stationery", "Furniture", "Other"];
const UNITS = ["each", "box", "kg", "litre", "pair", "set", "roll", "pack"];

const EMPTY = {
  name: "", sku: "", upc: "", category: "", unitOfMeasure: "each",
  costPrice: "", sellingPrice: "", reorderPoint: "", reorderQty: "",
  supplierId: "", leadTimeDays: "", description: "", stockQty: 0,
};

export default function ProductModal({ product, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (product) setForm({ ...EMPTY, ...product });
    else setForm(EMPTY);
  }, [product]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Product name is required";
    if (!form.sku.trim()) e.sku = "SKU is required";
    if (form.sellingPrice !== "" && isNaN(form.sellingPrice)) e.sellingPrice = "Must be a number";
    if (form.costPrice !== "" && isNaN(form.costPrice)) e.costPrice = "Must be a number";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    await onSave({
      ...form,
      costPrice: Number(form.costPrice) || 0,
      sellingPrice: Number(form.sellingPrice) || 0,
      reorderPoint: Number(form.reorderPoint) || 0,
      reorderQty: Number(form.reorderQty) || 0,
      leadTimeDays: Number(form.leadTimeDays) || 0,
      stockQty: Number(form.stockQty) || 0,
    });
    setSaving(false);
  }

  const Field = ({ label, field, type = "text", placeholder = "" }) => (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
      <input
        type={type} value={form[field]} onChange={(e) => set(field, e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-[#0f1117] text-white text-sm rounded-lg px-3 py-2 border ${
          errors[field] ? "border-red-500" : "border-slate-700"
        } focus:outline-none focus:border-indigo-500 placeholder-slate-600 transition`}
      />
      {errors[field] && <p className="text-red-400 text-xs mt-1">{errors[field]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1d27] border border-slate-700/50 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
          <h3 className="text-white font-semibold">{product ? "Edit Product" : "Add New Product"}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Basic Info */}
          <div>
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">Basic Info</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Product Name *" field="name" placeholder="e.g. Office Chair" />
              <Field label="SKU *" field="sku" placeholder="e.g. CHR-001" />
              <Field label="UPC / Barcode" field="upc" placeholder="e.g. 012345678905" />
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
                <select value={form.category} onChange={(e) => set("category", e.target.value)}
                  className="w-full bg-[#0f1117] text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-indigo-500">
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Unit of Measure</label>
                <select value={form.unitOfMeasure} onChange={(e) => set("unitOfMeasure", e.target.value)}
                  className="w-full bg-[#0f1117] text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-indigo-500">
                  {UNITS.map((u) => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
                  rows={2} placeholder="Optional product description"
                  className="w-full bg-[#0f1117] text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-indigo-500 placeholder-slate-600 resize-none" />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">Pricing</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Cost Price (₦)" field="costPrice" type="number" placeholder="0" />
              <Field label="Selling Price (₦)" field="sellingPrice" type="number" placeholder="0" />
            </div>
          </div>

          {/* Stock */}
          <div>
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">Stock & Reorder</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {!product && <Field label="Opening Stock" field="stockQty" type="number" placeholder="0" />}
              <Field label="Reorder Point" field="reorderPoint" type="number" placeholder="0" />
              <Field label="Reorder Qty" field="reorderQty" type="number" placeholder="0" />
              <Field label="Lead Time (days)" field="leadTimeDays" type="number" placeholder="0" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-700/50 transition">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold transition">
              {saving ? "Saving..." : product ? "Save Changes" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
