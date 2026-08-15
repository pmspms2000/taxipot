import type { MetadataRoute } from "next";

const BASE = "https://taxipot00.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, changeFrequency: "hourly", priority: 1 },
    { url: `${BASE}/create`, changeFrequency: "monthly", priority: 0.8 },
  ];
}
