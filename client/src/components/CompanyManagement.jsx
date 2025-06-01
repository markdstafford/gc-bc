import React, { useState, useRef } from "react";
import {
  Plus,
  RefreshCw,
  Trash2,
  X,
  Check,
  Search,
  Building2,
} from "lucide-react";
import { cn } from "../utils/cn";
import { CompanyInfoRow } from "./CompanyInfoRow";
import { CompanyLogo } from "./CompanyLogo";
import { reviewApi } from "../utils/api";

export function CompanyManagement({
  companies,
  onAdd,
  onUpdate,
  onDelete,
  onSearch,
  onRefreshReviews,
}) {
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    logoUrl: "",
    website: "",
    size: "",
    location: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef();
  const [deletingId, setDeletingId] = useState(null);
  const [addingId, setAddingId] = useState(null);

  // Normalize companies to ensure they have the right fields and sort alphabetically by name
  // This will help during transition from server-side to local storage
  const normalizedCompanies = companies
    .map((company) => ({
      id: company.id,
      name: company.name || "",
      logoUrl: company.logoUrl,
      website: company.website,
      size: company.size,
      location: company.location || company.headquarters,
    }))
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  const handleSearch = async (queryOverride) => {
    const query = queryOverride !== undefined ? queryOverride : searchQuery;
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const results = await onSearch(query);
      // Normalize search results to match our new schema
      setSearchResults(
        results.map((result) => ({
          id: result.id,
          name: result.name || "",
          logoUrl: result.logoUrl,
          website: result.website,
          size: result.size,
          location: result.location || result.headquarters,
        }))
      );
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = async (result) => {
    setAddingId(result.id);
    try {
      await onAdd(
        result.id,
        result.name,
        result.logoUrl,
        result.website,
        result.size,
        result.location
      );
      setSearchResults([]);
      setSearchQuery("");
    } finally {
      setAddingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await onUpdate(
        editingId,
        formData.name,
        formData.logoUrl,
        formData.website,
        formData.size,
        formData.location
      );
      setEditingId(null);
    } else {
      await onAdd(
        formData.id,
        formData.name,
        formData.logoUrl,
        formData.website,
        formData.size,
        formData.location
      );
    }
    setFormData({
      id: "",
      name: "",
      logoUrl: "",
      website: "",
      size: "",
      location: "",
    });
  };

  const handleEdit = (company) => {
    setEditingId(company.id);
    setFormData({
      id: company.id || "",
      name: company.name || "",
      logoUrl: company.logoUrl || "",
      website: company.website || "",
      size: company.size || "",
      location: company.location || "",
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      id: "",
      name: "",
      logoUrl: "",
      website: "",
      size: "",
      location: "",
    });
    setSearchResults([]);
    setSearchQuery("");
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      handleSearch(value);
    }, 1000);
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  // Handler to refresh reviews for a company row
  const handleRefreshReviews = async (company) => {
    try {
      // Optionally show a loading state here
      await reviewApi.fetchAllReviews(company.id);
      // Optionally show a success message or update UI
    } catch (error) {
      console.error("Failed to refresh reviews for company:", company, error);
      // Optionally show an error message
    }
  };

  // Add a simple skeleton loader component
  function SkeletonRow() {
    return (
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 animate-pulse">
        <div className="w-8 h-8 bg-gray-200 rounded" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <label className="block text-sm font-medium text-gray-700">
        Search for company
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchInputChange}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Enter company name..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={isSearching}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>
      {/* Search Results: first from local, then from Glassdoor if no match */}
      {searchQuery.trim() && (
        <div className="border border-gray-200 rounded-md max-h-48 overflow-y-auto mt-2">
          {isSearching ? (
            // Show skeletons while searching
            <>
              <SkeletonRow key="skeleton-1" />
              <SkeletonRow key="skeleton-2" />
              <SkeletonRow key="skeleton-3" />
            </>
          ) : normalizedCompanies.filter(
              (c) =>
                c.name &&
                c.name.toLowerCase().includes(searchQuery.toLowerCase())
            ).length > 0 ? (
            normalizedCompanies
              .filter(
                (c) =>
                  c.name &&
                  c.name.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((company) => (
                <CompanyInfoRow
                  key={company.id}
                  logoUrl={company.logoUrl}
                  name={company.name}
                  website={company.website}
                  size={company.size}
                  location={company.location}
                  rightContent={null}
                />
              ))
          ) : (
            searchResults.map((result) =>
              addingId === result.id ? (
                <SkeletonRow key={result.id} />
              ) : (
                <CompanyInfoRow
                  key={result.id}
                  logoUrl={result.logoUrl}
                  name={result.name}
                  website={result.website}
                  size={result.size}
                  location={result.location}
                  rightContent={
                    <button
                      onClick={() => handleSelectSearchResult(result)}
                      className="ml-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      Add
                    </button>
                  }
                />
              )
            )
          )}
        </div>
      )}
      {/* Company List */}
      <div className="space-y-2 mt-4">
        {normalizedCompanies.map((company) =>
          deletingId === company.id ? (
            <SkeletonRow key={company.id} />
          ) : (
            <CompanyInfoRow
              key={company.id}
              logoUrl={company.logoUrl}
              name={company.name}
              website={company.website}
              size={company.size}
              location={company.location}
              rightContent={
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRefreshReviews(company)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                    title="Refresh Reviews"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(company.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              }
            />
          )
        )}
      </div>
    </div>
  );
}
