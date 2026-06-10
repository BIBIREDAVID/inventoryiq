import { useState } from "react";
import { db } from "../../firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const REQUIRED = ["name", "sku"];

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/ /g, ""));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ""; });
    return obj;
  });
}

export default function CSVImport({ onClose }) {
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCSV(ev.target.result);
      const errs = [];
      parsed.forEach((row, i) => {
        REQUIRED.forEach((field) => {
          if (!row[field]) errs.push(`Row ${i + 2}: missing "${field}"`);
        });
      });
      setErrors(errs);
      setRows(parsed);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (errors.length > 0) return;
    setImporting(true);
    for (const row of rows) {
      await addDoc(collection(db, "products"), {
        name: row.name || "",
        sku: row.sku || "",
        upc: row.upc || "",
        category: row.category || "",
        unitOfMeasure: row.unit || "each",
        costPrice: Number(row.costprice) || 0,
        sellingPrice: Number(row.sellingprice) || 0,
        stockQty: Number(row.stockqty) || 0,
        reorderPoint: Number(row.reorderpoint) || 0,
        description: row.description || "",
        imageUrl: "",
        createdAt: serverTimestamp(),
      });
    }
    setImporting(false);
    setDone(true);
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1d27] border border-slate-700/50 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
          <h3 className="text-white font-semibold">Bulk Import Products</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          {!done ? (
            <>
              <div className="bg-slate-800/50 rounded-lg p-4 text-xs text-slate-400 space-y-1">
                <p className="text-white font-medium mb-2">CSV Format — required columns:</p>
                <p><span className="text-indigo-400">name</span>, <span className="text-indigo-400">sku</span>, upc, category, unit, costprice, sellingprice, stockqty, reorderpoint, description</p>
                <p className="mt-2">First row must be headers. Download a template:</p>
                <button onClick={() => {
                  const template = "name,sku,upc,category,unit,costprice,sellingprice,stockqty,reorderpoint,description\nExample Product,SKU-001,123456789,Electronics,each,1000,1500,50,10,Sample description";
                  const blob = new Blob([template], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = "import-template.csv"; a.click();
                }} className="text-indigo-400 hover:text-indigo-300 underline">
                  Download template.csv
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Upload CSV File</label>
                <input type="file" accept=".csv" onChange={handleFile}
                  className="w-full bg-[#0f1117] text-white text-sm rounded-lg px-3 py-2 border border-slate-700 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-indigo-600 file:text-white file:text-xs cursor-pointer" />
              </div>

              {rows.length > 0 && (
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-white text-sm font-medium">{rows.length} products found</p>
                  {errors.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {errors.map((e, i) => <p key={i} className="text-red-400 text-xs">{e}</p>)}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={onClose}
                  className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-700/50 transition">
                  Cancel
                </button>
                <button onClick={handleImport}
                  disabled={importing || rows.length === 0 || errors.length > 0}
                  className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold transition">
                  {importing ? `Importing...` : `Import ${rows.length} Products`}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-4xl mb-3">✅</p>
              <p className="text-white font-semibold text-lg">Import Complete!</p>
              <p className="text-slate-400 text-sm mt-1">{rows.length} products added successfully.</p>
              <button onClick={onClose}
                className="mt-4 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}