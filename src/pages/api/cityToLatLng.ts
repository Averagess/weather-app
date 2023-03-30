import type { NextApiRequest, NextApiResponse } from 'next'
import axios from "axios";

type Data = {
  lat?: number,
  lng?: number,
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch(req.method) {
    case "GET":
      const { city } = req.query;
    
      if(!city || typeof city !== "string") return res.status(400).json({ error: "City was missing or invalid" });
    
      const { data } = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${city}`);
      if(!data.results || !data.results[0].latitude || !data.results[0].longitude) return res.status(404).json({ error: "City not found" });
    
      const lat = data.results[0].latitude;
      const lng = data.results[0].longitude;
    
      if(typeof lat !== "number" || typeof lng !== "number") return res.status(404).json({ error: "City not found" });
    
      return res.status(200).json({ lat, lng })
    default: 
      return res.status(405).json({ error: "Method not allowed" });
  }
}