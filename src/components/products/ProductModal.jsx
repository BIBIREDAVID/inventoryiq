import { useState, useEffect } from "react";
import { storage } from "../../firebase/config";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";

const CATEGORIES = ["Electronics", "Clothing", "Food & Beverage", "Hardware", "Stationery", "Furniture", "Other"];
const UNITS = ["each", "box", "kg", "litre", "pair", "set", "roll", "pack"];

const EMPTY = {
  name: "", sku: "", upc: "", category: "", unitOfMeasure: "each",
  costPrice: "", sellingPrice: "", reorderPoint: "", reorderQty: "",
  supplierId: "", leadTimeDays: "", description: "", stockQty: 0,
  imageUrl: "",
};

export default function ProductModal({ product, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
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

  let imageUrl = form.imageUrl || "";

  if (imageFile) {
    const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
    await new Promise((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, imageFile);
      task.on("state_changed",
        (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        reject,
        async () => { imageUrl = await getDownloadURL(task.snapshot.ref); resolve(); }
      );
    });
  }

  await onSave({
    ...form,
    imageUrl,
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

          {/* Image Upload */}
<div className="sm:col-span-2">
  <label className="block text-xs font-medium text-slate-400 mb-1">Product Image</label>
  <div className="flex items-center gap-4">
    <div className="w-16 h-16 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
      {(imagePreview || form.imageUrl)
        ? <img src={imagePreview || form.imageUrl} alt="preview" className="w-full h-full object-cover" />
        : <span className="text-2xl">📦</span>
      }
    </div>
    <div className="flex-1">
      <input type="file" accept="image/*" id="img-upload" className="hidden"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
          }
        }}
      />
        <label htmlFor="img-upload"
          className="cursor-pointer px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg transition inline-block">
          Choose Image
        </label>
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-2 w-full bg-slate-700 rounded-full h-1.5">
            <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
        )}
        <p className="text-slate-500 text-xs mt-1">JPG, PNG up to 5MB</p>
      </div>
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
