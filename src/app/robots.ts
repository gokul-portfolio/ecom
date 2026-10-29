import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://store.enterprise.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/products/", "/categories/", "/brands/"],
        disallow: [
          "/admin/",
          "/dashboard/",
          "/api/admin/",
          "/staff/",
          "/departments/",
          "/warehouses/",
          "/inventory/",
          "/categories/form",
          "/brands/form",
          "/manufacturers/form",
          "/products/form",
          "/attributes/form",
          "/settings/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
