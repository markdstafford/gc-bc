import React, { useState } from "react";
import { Search, Settings, Building2 } from "lucide-react";
import { CompanyInfoRow } from "./CompanyInfoRow";
import { CompanyLogo } from "./CompanyLogo";

export function CompanySelector({
  companies,
  selectedCompany,
  onSelect,
  onOpenManagement,
  onAddCompare,
  comparedCompanies = [],
  compareLimitReached = false,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  // Normalize company fields for display and sort alphabetically by name
  const normalizedCompanies = companies
    .map((company) => ({
      id: company.id,
      shortName: company.name,
      logoUrl: company.logoUrl,
      website: company.website,
      headquarters: company.location,
      size: company.size,
      glassdoorId: company.glassdoorId,
      name: company.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const selected = normalizedCompanies.find((c) => c.id === selectedCompany);

  const handleSelect = (id) => {
    // Find the company by id
    const company = normalizedCompanies.find((c) => c.id === id);
    console.log("CompanySelector - Selected company:", company);
    if (company) {
      // Pass the company ID for selection
      onSelect(company.id);
    }
    setDropdownOpen(false);
  };

  // Normalized selected company for CompanyInfoRow
  const selectedRow = selected && {
    logoUrl: selected.logoUrl,
    name: selected.shortName,
    website: selected.website,
    size: selected.size,
    location: selected.headquarters,
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 w-full">
        <div className="relative flex-1 min-w-[320px] w-[360px]">
          {/* Prominent style for collapsed picker button */}
          <button
            type="button"
            className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-md flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white overflow-hidden"
            onClick={() => setDropdownOpen((open) => !open)}
          >
            {selected ? (
              <CompanyLogo company={selected} size="md" />
            ) : (
              <div className="flex items-center gap-2">
                <Building2 className="w-6 h-6 text-gray-400" />
                <span className="truncate">Select a company</span>
              </div>
            )}
          </button>
          {/* Dropdown list using CompanyInfoRow */}
          {dropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-y-auto">
              {normalizedCompanies.map((company) => {
                const isAlreadyCompared = comparedCompanies.some(
                  (c) => c.id === company.id
                );
                const isSelected = selected && company.id === selected.id;
                const showCompare =
                  selected &&
                  !isSelected &&
                  !isAlreadyCompared &&
                  !compareLimitReached;
                return (
                  <CompanyInfoRow
                    key={company.id}
                    logoUrl={company.logoUrl}
                    name={company.shortName}
                    website={company.website}
                    size={company.size}
                    location={company.headquarters}
                    rightContent={
                      showCompare ? (
                        <button
                          className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onAddCompare) onAddCompare(company);
                            setDropdownOpen(false);
                          }}
                        >
                          + Compare
                        </button>
                      ) : null
                    }
                    onClick={() => handleSelect(company.id)}
                  />
                );
              })}
            </div>
          )}
        </div>
        <button
          onClick={onOpenManagement}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md flex-shrink-0"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
      {/* Company tile under picker using CompanyInfoRow */}
      {selectedRow && (
        <CompanyInfoRow
          logoUrl={selectedRow.logoUrl}
          name={selectedRow.name}
          website={selectedRow.website}
          size={selectedRow.size}
          location={selectedRow.location}
          rightContent={null}
        />
      )}
    </div>
  );
}
