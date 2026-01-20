"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterLotPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const data = {
      product_name: (form.elements.namedItem("product_name") as HTMLInputElement).value,
      product_code: (form.elements.namedItem("product_code") as HTMLInputElement).value,
      lot_number: (form.elements.namedItem("lot_number") as HTMLInputElement).value,
      manufacture_date: (form.elements.namedItem("manufacture_date") as HTMLInputElement).value,
      expiry_date: (form.elements.namedItem("expiry_date") as HTMLInputElement).value,
      total_quantity: parseInt((form.elements.namedItem("total_quantity") as HTMLInputElement).value),
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/api/lots/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to register");
      }

      router.push("/lots");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Register New Lot</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block">Product Name</label>
          <input name="product_name" type="text" className="border w-full p-2 bg-gray-700 text-white" required />
        </div>
        <div>
          <label className="block">Product Code</label>
          <input name="product_code" type="text" className="border w-full p-2 bg-gray-700 text-white" required />
        </div>
        <div>
          <label className="block">Lot Number</label>
          <input name="lot_number" type="text" className="border w-full p-2 bg-gray-700 text-white" required />
        </div>
        <div>
          <label className="block">Manufacture Date</label>
          <input name="manufacture_date" type="date" className="border w-full p-2 bg-gray-700 text-white" required />
        </div>
        <div>
          <label className="block">Expiry Date</label>
          <input name="expiry_date" type="date" className="border w-full p-2 bg-gray-700 text-white" required />
        </div>
        <div>
          <label className="block">Total Quantity</label>
          <input name="total_quantity" type="number" className="border w-full p-2 bg-gray-700 text-white" required />
        </div>
        <button type="submit" disabled={loading} className="bg-blue-500 text-white px-4 py-2 disabled:bg-gray-400">
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
      {error && <p className="mt-4 text-red-600">{error}</p>}
    </div>
  );
}
