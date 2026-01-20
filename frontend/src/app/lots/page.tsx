"use client";
import { useEffect, useState } from "react";

interface Lot {
  id: string;
  product_name: string;
  product_code: string;
  lot_number: string;
  producer: string;
  manufacture_date: string;
  expiry_date: string;
  total_quantity: number;
  remaining_quantity: number;
}

export default function LotsPage() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/lots/")
      .then((res) => res.json())
      .then((data) => setLots(data.lots || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Medicine Lots</h1>
      {lots.length === 0 ? (
        <p>No lots found.</p>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="border p-2">Lot Number</th>
              <th className="border p-2">Product</th>
              <th className="border p-2">Producer</th>
              <th className="border p-2">Remaining</th>
              <th className="border p-2">Expiry</th>
            </tr>
          </thead>
          <tbody>
            {lots.map((lot) => (
              <tr key={lot.id}>
                <td className="border p-2">{lot.lot_number}</td>
                <td className="border p-2">{lot.product_name}</td>
                <td className="border p-2">{lot.producer}</td>
                <td className="border p-2">{lot.remaining_quantity} / {lot.total_quantity}</td>
                <td className="border p-2">{lot.expiry_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
