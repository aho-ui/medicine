"use client";
import { useEffect, useState } from "react";

interface Lot {
  id: string;
  lot_number: string;
  product_name: string;
  remaining_quantity: number;
}

interface DistributionEvent {
  id: string;
  lot_number: string;
  actor: string;
  quantity: number;
  location: string;
  timestamp: string;
}

export default function DistributionPage() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [events, setEvents] = useState<DistributionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("http://127.0.0.1:8000/api/lots/").then((r) => r.json()),
      fetch("http://127.0.0.1:8000/api/distribution/").then((r) => r.json()),
    ])
      .then(([lotsData, eventsData]) => {
        setLots(lotsData.lots || []);
        setEvents(eventsData.events || []);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = e.currentTarget;
    const data = {
      lot_id: (form.elements.namedItem("lot_id") as HTMLSelectElement).value,
      quantity: parseInt((form.elements.namedItem("quantity") as HTMLInputElement).value),
      location: (form.elements.namedItem("location") as HTMLInputElement).value,
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/api/distribution/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to record");
      }

      // Refresh data
      const [lotsData, eventsData] = await Promise.all([
        fetch("http://127.0.0.1:8000/api/lots/").then((r) => r.json()),
        fetch("http://127.0.0.1:8000/api/distribution/").then((r) => r.json()),
      ]);
      setLots(lotsData.lots || []);
      setEvents(eventsData.events || []);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Distribution Tracking</h1>

      <h2 className="text-xl font-bold mb-2">Record Distribution</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mb-8">
        <div>
          <label className="block">Select Lot</label>
          <select name="lot_id" className="border w-full p-2 bg-gray-700 text-white" required>
            <option value="">-- Select --</option>
            {lots.map((lot) => (
              <option key={lot.id} value={lot.id}>
                {lot.lot_number} - {lot.product_name} ({lot.remaining_quantity} left)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block">Quantity</label>
          <input name="quantity" type="number" className="border w-full p-2 bg-gray-700 text-white" required />
        </div>
        <div>
          <label className="block">Location</label>
          <input name="location" type="text" className="border w-full p-2 bg-gray-700 text-white" required />
        </div>
        <button type="submit" disabled={submitting} className="bg-blue-500 text-white px-4 py-2 disabled:bg-gray-400">
          {submitting ? "Recording..." : "Record"}
        </button>
        {error && <p className="text-red-600">{error}</p>}
      </form>

      <h2 className="text-xl font-bold mb-2">Distribution History</h2>
      {events.length === 0 ? (
        <p>No distribution events.</p>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="border p-2">Lot</th>
              <th className="border p-2">Quantity</th>
              <th className="border p-2">Location</th>
              <th className="border p-2">Actor</th>
              <th className="border p-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id}>
                <td className="border p-2">{e.lot_number}</td>
                <td className="border p-2">{e.quantity}</td>
                <td className="border p-2">{e.location}</td>
                <td className="border p-2">{e.actor}</td>
                <td className="border p-2">{new Date(e.timestamp).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
