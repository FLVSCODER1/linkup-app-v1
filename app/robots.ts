import type { MetadataRoute } from "next";
import { SITE_URL } from "./lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/signup", "/request-school", "/beta"],
      disallow: [
        "/admin/",
        "/api/",
        "/event/",
        "/events/",
        "/matches/",
        "/people/",
        "/profile/",
        "/verify-email",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

