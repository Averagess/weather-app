import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case "GET":
      const { lat, lng } = req.body;

      if (!lat || !lng || typeof lat !== "number" || typeof lng !== "number")
        return res
          .status(400)
          .json({ error: "Lat or Lng was missing or invalid" });

      try {
        const { data } = await axios.get(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m`
        );
        return res.status(200).json({ data });
      } catch (error) {
        return res.status(404).json({ error: "City not found" });
      }

    default:
      return res.status(405).json({ error: "Method not allowed" });
  }
}
