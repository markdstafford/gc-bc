import React from "react";
import { Building2 } from "lucide-react";
import { CompanyLogo } from "./CompanyLogo";

export function CompanyInfoRow({
  logoUrl,
  name,
  website,
  size,
  location,
  rightContent,
  onClick,
}) {
  const clickable = typeof onClick === "function";

  // Create a company-like object from the props to pass to CompanyLogo
  const company = {
    name,
    logoUrl,
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0 ${
        clickable ? "hover:bg-blue-50 cursor-pointer" : "hover:bg-gray-50"
      }`}
      onClick={onClick}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <CompanyLogo company={company} size="lg" />
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline text-xs ml-2"
            >
              {website}
            </a>
          )}
        </div>
        <div className="text-sm text-gray-500">
          {size && <span>{size}</span>}
          {size && location && <span> • </span>}
          {location && <span>{location}</span>}
        </div>
      </div>
      {rightContent}
    </div>
  );
}
