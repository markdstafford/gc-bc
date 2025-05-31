import React from "react";

/**
 * A reusable component to display a company name with its logo if available
 * @param {Object} props
 * @param {Object} props.company - The company object containing id, name/shortName/display_name, and logoUrl
 * @param {string} [props.size="md"] - Size of the logo: "sm" (16px), "md" (24px), "lg" (32px)
 * @param {string} [props.className=""] - Additional CSS classes to apply to the wrapper
 * @param {boolean} [props.nameOnly=false] - If true, only shows the company name without the logo
 */
export function CompanyLogo({
  company,
  size = "md",
  className = "",
  nameOnly = false,
}) {
  if (!company) return null;

  // Normalize company data to handle schema inconsistencies
  const normalizedCompany = {
    ...company,
    name: company.name || company.display_name || company.shortName,
    logoUrl: company.logoUrl || company.logo_url || null,
  };

  // Extract company name using fallbacks
  const companyName = normalizedCompany.name || "Unknown Company";

  // Determine logo size in pixels
  const sizeMap = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };
  const logoSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {!nameOnly && company.logoUrl && (
        <img
          src={company.logoUrl}
          alt={companyName}
          className={`${logoSize} object-contain rounded-full`}
        />
      )}
      <span className="text-gray-900 font-medium truncate">{companyName}</span>
    </div>
  );
}
