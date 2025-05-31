import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { format, parseISO } from "date-fns";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Filter,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  GripVertical,
  Eye,
  EyeOff,
  Settings,
} from "lucide-react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { StarRating } from "./StarRating";
import { SentimentBadge } from "./SentimentBadge";
import { CompanyLogo } from "./CompanyLogo"; // Import CompanyLogo component

const columnHelper = createColumnHelper();

// All available fields for filtering
const FILTER_FIELDS = [
  { key: "reviewDateTime", label: "Date", type: "date" },
  { key: "summary", label: "Title", type: "text" },
  { key: "pros", label: "Pros", type: "text" },
  { key: "cons", label: "Cons", type: "text" },
  { key: "advice", label: "Advice", type: "text" },
  { key: "ratingOverall", label: "Overall Rating", type: "number" },
  { key: "ratingCeo", label: "CEO Approval", type: "sentiment" },
  { key: "ratingSeniorLeadership", label: "Leadership Rating", type: "number" },
  {
    key: "ratingBusinessOutlook",
    label: "Business Outlook",
    type: "sentiment",
  },
  { key: "ratingRecommendToFriend", label: "Recommend", type: "sentiment" },
  { key: "ratingCultureAndValues", label: "Culture Rating", type: "number" },
  { key: "ratingWorkLifeBalance", label: "Work-Life Balance", type: "number" },
  {
    key: "ratingCompensationAndBenefits",
    label: "Compensation Rating",
    type: "number",
  },
  {
    key: "ratingCareerOpportunities",
    label: "Career Opportunities",
    type: "number",
  },
  {
    key: "ratingDiversityAndInclusion",
    label: "Diversity Rating",
    type: "number",
  },
  { key: "jobTitle.title", label: "Job Title", type: "text" },
  { key: "employmentStatus", label: "Employment Status", type: "text" },
  { key: "lengthOfEmployment", label: "Length of Employment", type: "text" },
];

const SENTIMENT_OPTIONS = [
  "POSITIVE",
  "NEGATIVE",
  "OK",
  "APPROVE",
  "DISAPPROVE",
  "NO_OPINION",
  "UNKNOWN",
];
const EMPLOYMENT_STATUS_OPTIONS = ["REGULAR", "FORMER", "CURRENT"];

function FilterGroup({ filter, onUpdate, onRemove, isFirst }) {
  const field = FILTER_FIELDS.find((f) => f.key === filter.field);

  const renderValueInput = () => {
    switch (field?.type) {
      case "sentiment":
        return (
          <select
            value={filter.value}
            onChange={(e) => onUpdate({ ...filter, value: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Any</option>
            {SENTIMENT_OPTIONS.map((option) => {
              let displayLabel = option;
              switch (option) {
                case "POSITIVE":
                  displayLabel = "Positive";
                  break;
                case "NEGATIVE":
                  displayLabel = "Negative";
                  break;
                case "OK":
                  displayLabel = "Ok";
                  break;
                case "APPROVE":
                  displayLabel = "Approve";
                  break;
                case "DISAPPROVE":
                  displayLabel = "Disapprove";
                  break;
                case "NO_OPINION":
                  displayLabel = "No opinion";
                  break;
                case "UNKNOWN":
                  displayLabel = "Unknown";
                  break;
              }
              return (
                <option key={option} value={option}>
                  {displayLabel}
                </option>
              );
            })}
          </select>
        );
      case "number":
        return (
          <div className="flex gap-2">
            <select
              value={filter.operator}
              onChange={(e) =>
                onUpdate({ ...filter, operator: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="equals">Equals</option>
              <option value="greater">Greater than</option>
              <option value="less">Less than</option>
              <option value="between">Between</option>
            </select>
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={filter.value}
              onChange={(e) => onUpdate({ ...filter, value: e.target.value })}
              placeholder="Value"
              className="px-3 py-2 border border-gray-300 rounded-md text-sm w-24"
            />
            {filter.operator === "between" && (
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={filter.value2 || ""}
                onChange={(e) =>
                  onUpdate({ ...filter, value2: e.target.value })
                }
                placeholder="To"
                className="px-3 py-2 border border-gray-300 rounded-md text-sm w-24"
              />
            )}
          </div>
        );
      case "date":
        return (
          <div className="flex gap-2">
            <select
              value={filter.operator}
              onChange={(e) =>
                onUpdate({ ...filter, operator: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="after">After</option>
              <option value="before">Before</option>
              <option value="between">Between</option>
            </select>
            <input
              type="date"
              value={filter.value}
              onChange={(e) => onUpdate({ ...filter, value: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            {filter.operator === "between" && (
              <input
                type="date"
                value={filter.value2 || ""}
                onChange={(e) =>
                  onUpdate({ ...filter, value2: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            )}
          </div>
        );
      default:
        return (
          <input
            type="text"
            value={filter.value}
            onChange={(e) => onUpdate({ ...filter, value: e.target.value })}
            placeholder="Search text..."
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        );
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
      {!isFirst && (
        <select
          value={filter.logic}
          onChange={(e) => onUpdate({ ...filter, logic: e.target.value })}
          className="px-2 py-1 border border-gray-300 rounded text-sm font-medium"
        >
          <option value="AND">AND</option>
          <option value="OR">OR</option>
        </select>
      )}

      <select
        value={filter.field}
        onChange={(e) => onUpdate({ ...filter, field: e.target.value })}
        className="px-3 py-2 border border-gray-300 rounded-md text-sm min-w-[150px]"
      >
        <option value="">Select field...</option>
        {FILTER_FIELDS.map((field) => (
          <option key={field.key} value={field.key}>
            {field.label}
          </option>
        ))}
      </select>

      {filter.field && renderValueInput()}

      <button
        onClick={onRemove}
        className="p-1 text-gray-400 hover:text-red-500"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// CSV Export function
const exportToCSV = (data, selectedRows, filename = "reviews.csv") => {
  const exportData = selectedRows.length > 0 ? selectedRows : data;
  const headers = [
    "Date",
    "Title",
    "Job title",
    "Employment status",
    "Length of employment",
    "Overall rating",
    "CEO approval",
    "Senior leadership rating",
    "Business outlook",
    "Recommend to friend",
    "Culture & values rating",
    "Work-Llife balance rating",
    "Compensation & benefits rating",
    "Career opportunities rating",
    "Diversity & inclusion rating",
    "Pros",
    "Cons",
    "Advice to management",
  ];

  // Helper function to properly escape CSV fields
  const escapeCSV = (text) => {
    if (text === null || text === undefined) return "";
    // Convert to string to handle numbers and other types
    const str = String(text);
    // Replace all double quotes with two double quotes
    const escaped = str.replace(/"/g, '""');
    // Replace all line breaks with spaces
    const noLineBreaks = escaped.replace(/[\r\n]+/g, " ");
    // Always wrap in quotes to handle commas and other special characters
    return `"${noLineBreaks}"`;
  };

  // Helper function to format rating values
  const formatRating = (rating) => {
    if (
      rating === null ||
      rating === undefined ||
      rating === "UNKNOWN" ||
      rating === "0" ||
      rating === 0 ||
      rating < 0
    )
      return "";
    return String(rating);
  };

  const csvContent = [
    headers.join(","),
    ...exportData.map((row) =>
      [
        format(parseISO(row.reviewDateTime), "yyyy-MM-dd"),
        escapeCSV(row.summary),
        escapeCSV(row.jobTitle?.title),
        escapeCSV(row.employmentStatus),
        escapeCSV(row.lengthOfEmployment),
        formatRating(row.ratingOverall),
        formatRating(row.ratingCeo),
        formatRating(row.ratingSeniorLeadership),
        formatRating(row.ratingBusinessOutlook),
        formatRating(row.ratingRecommendToFriend),
        formatRating(row.ratingCultureAndValues),
        formatRating(row.ratingWorkLifeBalance),
        formatRating(row.ratingCompensationAndBenefits),
        formatRating(row.ratingCareerOpportunities),
        formatRating(row.ratingDiversityAndInclusion),
        escapeCSV(row.pros),
        escapeCSV(row.cons),
        escapeCSV(row.advice),
      ].join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

const allColumnsMap = {
  date: columnHelper.accessor("reviewDateTime", {
    id: "date",
    header: "Date",
    cell: (info) => format(parseISO(info.getValue()), "MMM d, yyyy"),
    sortingFn: "datetime",
  }),
  jobTitle: columnHelper.accessor((row) => row.jobTitle?.title || "-", {
    id: "jobTitle",
    header: "Job title",
    cell: (info) => info.getValue() || "-",
  }),
  summary: columnHelper.accessor("summary", {
    header: "Title",
    cell: (info) => info.getValue() || "-",
  }),
  ratingOverall: columnHelper.accessor("ratingOverall", {
    header: "Overall",
    cell: (info) =>
      info.getValue() && info.getValue() !== "0" && info.getValue() > 0 ? (
        <StarRating rating={info.getValue()} />
      ) : (
        "-"
      ),
  }),
  ratingRecommendToFriend: columnHelper.accessor("ratingRecommendToFriend", {
    header: "Recommend",
    cell: (info) =>
      info.getValue() &&
      info.getValue() !== "0" &&
      info.getValue() !== "UNKNOWN" ? (
        <SentimentBadge value={info.getValue()} />
      ) : (
        "-"
      ),
  }),
  ratingCeo: columnHelper.accessor("ratingCeo", {
    header: "Ceo",
    cell: (info) =>
      info.getValue() &&
      info.getValue() !== "0" &&
      info.getValue() !== "UNKNOWN" ? (
        <SentimentBadge value={info.getValue()} />
      ) : (
        "-"
      ),
  }),
  ratingSeniorLeadership: columnHelper.accessor("ratingSeniorLeadership", {
    header: "Leadership",
    cell: (info) =>
      info.getValue() && info.getValue() !== "0" && info.getValue() > 0 ? (
        <StarRating rating={info.getValue()} />
      ) : (
        "-"
      ),
  }),
  ratingBusinessOutlook: columnHelper.accessor("ratingBusinessOutlook", {
    header: "Business",
    cell: (info) =>
      info.getValue() &&
      info.getValue() !== "0" &&
      info.getValue() !== "UNKNOWN" ? (
        <SentimentBadge value={info.getValue()} />
      ) : (
        "-"
      ),
  }),
  ratingCultureAndValues: columnHelper.accessor("ratingCultureAndValues", {
    header: "Culture",
    cell: (info) =>
      info.getValue() && info.getValue() !== "0" && info.getValue() > 0 ? (
        <StarRating rating={info.getValue()} />
      ) : (
        "-"
      ),
  }),
  ratingWorkLifeBalance: columnHelper.accessor("ratingWorkLifeBalance", {
    header: "Work-life",
    cell: (info) =>
      info.getValue() && info.getValue() !== "0" && info.getValue() > 0 ? (
        <StarRating rating={info.getValue()} />
      ) : (
        "-"
      ),
  }),
  ratingCompensationAndBenefits: columnHelper.accessor(
    "ratingCompensationAndBenefits",
    {
      header: "Compensation",
      cell: (info) =>
        info.getValue() && info.getValue() !== "0" && info.getValue() > 0 ? (
          <StarRating rating={info.getValue()} />
        ) : (
          "-"
        ),
    }
  ),
  ratingCareerOpportunities: columnHelper.accessor(
    "ratingCareerOpportunities",
    {
      header: "Career",
      cell: (info) =>
        info.getValue() && info.getValue() !== "0" && info.getValue() > 0 ? (
          <StarRating rating={info.getValue()} />
        ) : (
          "-"
        ),
    }
  ),
  ratingDiversityAndInclusion: columnHelper.accessor(
    "ratingDiversityAndInclusion",
    {
      header: "Diversity",
      cell: (info) =>
        info.getValue() && info.getValue() !== "0" && info.getValue() > 0 ? (
          <StarRating rating={info.getValue()} />
        ) : (
          "-"
        ),
    }
  ),
  employmentStatus: columnHelper.accessor("employmentStatus", {
    header: "Employment status",
    cell: (info) => info.getValue() || "-",
  }),
  lengthOfEmployment: columnHelper.accessor("lengthOfEmployment", {
    header: "Length",
    cell: (info) => info.getValue() || "-",
  }),
  pros: columnHelper.accessor("pros", {
    header: "Pros",
    cell: (info) => info.getValue() || "-",
  }),
  cons: columnHelper.accessor("cons", {
    header: "Cons",
    cell: (info) => info.getValue() || "-",
  }),
  advice: columnHelper.accessor("advice", {
    header: "Advice",
    cell: (info) => info.getValue() || "-",
  }),
};

export function ReviewsTable({
  reviews,
  dateRange,
  onRowSelect,
  columnsToShow,
  compareMode,
  company, // Add company prop
  activeCompanyTab, // Add activeCompanyTab prop for syncing with SentimentCharts
  onSelectCompany, // Add callback for when a company is selected from tabs
}) {
  // --- MODE LOGIC ---
  const ALL_COLUMNS = [
    "date",
    "jobTitle",
    "summary",
    "ratingOverall",
    "ratingRecommendToFriend",
    "ratingCeo",
    "ratingSeniorLeadership",
    "ratingBusinessOutlook",
    "ratingCultureAndValues",
    "ratingWorkLifeBalance",
    "ratingCompensationAndBenefits",
    "ratingCareerOpportunities",
    "ratingDiversityAndInclusion",
    "employmentStatus",
    "lengthOfEmployment",
    "pros",
    "cons",
    "advice",
  ];
  const DEFAULT_ORDER = compareMode
    ? [
        "summary",
        "ratingOverall",
        "date",
        "jobTitle",
        "ratingRecommendToFriend",
        "ratingCeo",
        "ratingBusinessOutlook",
        "ratingSeniorLeadership",
        "ratingCultureAndValues",
        "ratingWorkLifeBalance",
        "ratingCompensationAndBenefits",
        "ratingCareerOpportunities",
        "ratingDiversityAndInclusion",
        "pros",
        "cons",
        "advice",
        "employmentStatus",
        "lengthOfEmployment",
      ]
    : [
        "date",
        "jobTitle",
        "summary",
        "ratingOverall",
        "ratingRecommendToFriend",
        "ratingCeo",
        "ratingBusinessOutlook",
        "ratingSeniorLeadership",
        "ratingCultureAndValues",
        "ratingWorkLifeBalance",
        "ratingCompensationAndBenefits",
        "ratingCareerOpportunities",
        "ratingDiversityAndInclusion",
        "pros",
        "cons",
        "advice",
        "employmentStatus",
        "lengthOfEmployment",
      ];
  const DEFAULT_VISIBLE = compareMode
    ? new Set(["summary", "ratingOverall"])
    : new Set([
        "date",
        "jobTitle",
        "summary",
        "ratingOverall",
        "ratingRecommendToFriend",
        "ratingCeo",
        "ratingBusinessOutlook",
      ]);

  const [sorting, setSorting] = useState(() => {
    // Initialize sorting based on compareMode and ensure the column is visible
    const defaultSortColumn = compareMode ? "summary" : "date";
    // Check if the default column is visible in the current mode
    const isDefaultColumnVisible = DEFAULT_VISIBLE.has(defaultSortColumn);

    // If the column is not visible, find the first visible column
    if (!isDefaultColumnVisible) {
      // Find first visible column to sort by
      const firstVisibleColumn = [...DEFAULT_VISIBLE][0];
      return firstVisibleColumn
        ? [{ id: firstVisibleColumn, desc: false }]
        : [];
    }

    return compareMode
      ? [{ id: "summary", desc: false }]
      : [{ id: "date", desc: true }];
  });
  const [rowSelection, setRowSelection] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState([]);
  const [isManageColumnsOpen, setIsManageColumnsOpen] = useState(false);

  // Reset row selection when the company or reviews change
  useEffect(() => {
    setRowSelection({});
  }, [company, reviews?.length]);

  // --- COLUMN STATE ---
  const [columnOrder, setColumnOrder] = useState(() => {
    const key = compareMode
      ? "reviewsTableColumnOrderCompare"
      : "reviewsTableColumnOrder";
    const saved = localStorage.getItem(key);
    let parsed = [...DEFAULT_ORDER];
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        // Only use if all keys are present
        if (
          Array.isArray(arr) &&
          DEFAULT_ORDER.every((k) => arr.includes(k)) &&
          arr.length === DEFAULT_ORDER.length
        ) {
          parsed = arr;
        }
      } catch {}
    }
    return parsed;
  });
  const [columnVisibility, setColumnVisibility] = useState(() => {
    const key = compareMode
      ? "reviewsTableColumnVisibilityCompare"
      : "reviewsTableColumnVisibility";
    const saved = localStorage.getItem(key);
    let parsed = Object.fromEntries(
      ALL_COLUMNS.map((k) => [k, DEFAULT_VISIBLE.has(k)])
    );
    if (saved) {
      try {
        const obj = JSON.parse(saved);
        // Only use if all keys are present
        if (
          obj &&
          ALL_COLUMNS.every((k) =>
            Object.prototype.hasOwnProperty.call(obj, k)
          ) &&
          Object.keys(obj).length === ALL_COLUMNS.length
        ) {
          parsed = obj;
        }
      } catch {}
    }
    return parsed;
  });
  useEffect(() => {
    const key = compareMode
      ? "reviewsTableColumnOrderCompare"
      : "reviewsTableColumnOrder";
    localStorage.setItem(key, JSON.stringify(columnOrder));
  }, [columnOrder, compareMode]);
  useEffect(() => {
    const key = compareMode
      ? "reviewsTableColumnVisibilityCompare"
      : "reviewsTableColumnVisibility";
    localStorage.setItem(key, JSON.stringify(columnVisibility));
  }, [columnVisibility, compareMode]);

  // Move isRowVisible up so it is defined before useEffect hooks
  const isRowVisible = useCallback(
    (review) => {
      if (dateRange) {
        const reviewDate = parseISO(review.reviewDateTime);
        const startDate = parseISO(dateRange.startMonth + "-01");
        const endDate = parseISO(dateRange.endMonth + "-01");
        if (reviewDate < startDate || reviewDate > endDate) {
          return false;
        }
      }
      return true;
    },
    [dateRange]
  );

  // Add mobile responsive state
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile/small viewport
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filteredReviews = useMemo(() => {
    let result = Array.isArray(reviews) ? [...reviews] : [];

    // Apply date range filter
    if (dateRange && dateRange.startMonth && dateRange.endMonth) {
      result = result.filter((review) => {
        const reviewMonth = format(parseISO(review.reviewDateTime), "yyyy-MM");
        return (
          reviewMonth >= dateRange.startMonth &&
          reviewMonth <= dateRange.endMonth
        );
      });
    }

    // Apply custom filters
    if (filters.length > 0) {
      // Filter out incomplete filters
      const validFilters = filters.filter(
        (filter) => filter.field && filter.value
      );

      if (validFilters.length > 0) {
        result = result.filter((review) => {
          return validFilters.reduce((acc, filter, index) => {
            const getValue = (obj, path) => {
              return path
                .split(".")
                .reduce((current, key) => current?.[key], obj);
            };

            const fieldValue = getValue(review, filter.field);
            let matches = false;

            const field = FILTER_FIELDS.find((f) => f.key === filter.field);

            switch (field?.type) {
              case "sentiment":
                matches = fieldValue === filter.value;
                break;
              case "number":
                const numValue = parseFloat(fieldValue);
                const filterNum = parseFloat(filter.value);
                const filterNum2 = parseFloat(filter.value2);

                if (isNaN(numValue) || isNaN(filterNum)) {
                  matches = false;
                  break;
                }

                switch (filter.operator) {
                  case "greater":
                    matches = numValue > filterNum;
                    break;
                  case "less":
                    matches = numValue < filterNum;
                    break;
                  case "between":
                    if (isNaN(filterNum2)) {
                      matches = false;
                    } else {
                      matches = numValue >= filterNum && numValue <= filterNum2;
                    }
                    break;
                  default:
                    matches = Math.abs(numValue - filterNum) < 0.1;
                }
                break;
              case "date":
                const reviewDate = new Date(review.reviewDateTime);
                const filterDate = new Date(filter.value);

                if (
                  isNaN(reviewDate.getTime()) ||
                  isNaN(filterDate.getTime())
                ) {
                  matches = false;
                  break;
                }

                switch (filter.operator) {
                  case "after":
                    matches = reviewDate > filterDate;
                    break;
                  case "before":
                    matches = reviewDate < filterDate;
                    break;
                  case "between":
                    const filterDate2 = new Date(filter.value2);
                    if (isNaN(filterDate2.getTime())) {
                      matches = false;
                    } else {
                      matches =
                        reviewDate >= filterDate && reviewDate <= filterDate2;
                    }
                    break;
                  default:
                    matches =
                      reviewDate.toDateString() === filterDate.toDateString();
                }
                break;
              default:
                if (fieldValue) {
                  matches = fieldValue
                    .toString()
                    .toLowerCase()
                    .includes(filter.value.toLowerCase());
                } else {
                  matches = false;
                }
            }

            // For the first filter, just return the match result
            if (index === 0) {
              return matches;
            }

            // For subsequent filters, apply the logic operator
            return filter.logic === "OR" ? acc || matches : acc && matches;
          }, false); // Start with false instead of true
        });
      }
    }

    return result;
  }, [reviews, dateRange, filters]);

  // --- COLUMNS FOR TABLE ---
  const columns = useMemo(() => {
    // Only show columns that are:
    // 1. In the current column order
    // 2. Set to visible in columnVisibility
    // 3. Actually defined in allColumnsMap
    const validColumnKeys = columnOrder
      .filter((key) => columnVisibility[key] !== false)
      .filter((key) => allColumnsMap[key] !== undefined); // Ensure the column key exists in the map

    // If we end up with no valid columns (should be rare), ensure at least one column is shown
    if (validColumnKeys.length === 0 && Object.keys(allColumnsMap).length > 0) {
      // Add at least one column - prefer summary or date
      const fallbackColumns = compareMode
        ? ["summary", "ratingOverall"]
        : ["date", "summary"];
      for (const col of fallbackColumns) {
        if (allColumnsMap[col]) {
          validColumnKeys.push(col);
          break;
        }
      }
    }

    return validColumnKeys.map((key) => allColumnsMap[key]);
  }, [columnOrder, columnVisibility, compareMode]);

  const table = useReactTable({
    data: filteredReviews,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: (updater) => {
      const newSelection =
        typeof updater === "function" ? updater(rowSelection) : updater;
      setRowSelection(newSelection);
      // Get the selected reviews and pass them to the parent
      const selectedReviews = Object.keys(newSelection).map((key) => {
        const row = table.getRow(key);
        return row.original;
      });
      onRowSelect(selectedReviews);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
    initialState: {
      pagination: {
        pageSize: 25,
      },
    },
  });

  // Memoize table and isRowVisible refs to avoid triggering useEffect on every render
  const tableRef = useRef();
  tableRef.current = table;
  const isRowVisibleRef = useRef();
  isRowVisibleRef.current = isRowVisible;

  // Remove problematic useEffects and add a simple clear selection effect
  useEffect(() => {
    setRowSelection((prev) => {
      if (Object.keys(prev).length === 0) return prev;
      return {};
    });
  }, [dateRange, filters]);

  const addFilter = () => {
    setFilters([
      ...filters,
      {
        field: "",
        value: "",
        operator: "equals",
        logic: "AND",
      },
    ]);
  };

  const updateFilter = (index, updatedFilter) => {
    const newFilters = [...filters];
    newFilters[index] = updatedFilter;
    setFilters(newFilters);
  };

  const removeFilter = (index) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const clearAllFilters = () => {
    setFilters([]);
  };

  const handleExportCSV = () => {
    const selectedReviews = Object.keys(rowSelection).map((key) => {
      const row = table.getRow(key);
      return row.original;
    });
    exportToCSV(
      table.getFilteredRowModel().rows.map((row) => row.original),
      selectedReviews
    );
  };

  // Hide filters and export if minimal mode
  const minimal = columnsToShow && columnsToShow.length <= 2;

  // Modal open/close handlers
  const openManageColumns = () => setIsManageColumnsOpen(true);
  const closeManageColumns = () => setIsManageColumnsOpen(false);

  // Drag-and-drop for columns
  function DraggableColumnRow({ id, idx, label, checked, onCheck }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      background: isDragging ? "#f3f4f6" : "white",
    };
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center justify-between px-3 py-2 rounded border border-gray-200 mb-2"
        {...attributes}
      >
        <div className="flex items-center gap-2">
          <span {...listeners} className="cursor-grab text-gray-400">
            <GripVertical className="w-4 h-4" />
          </span>
          <span className="text-sm font-medium">{label}</span>
        </div>
        <button
          onClick={() => onCheck(id)}
          className="ml-2 p-1 rounded hover:bg-gray-100"
          title={checked ? "Hide column" : "Show column"}
          type="button"
        >
          {checked ? (
            <Eye className="w-5 h-5 text-gray-500" />
          ) : (
            <EyeOff className="w-5 h-5 text-gray-300" />
          )}
        </button>
      </div>
    );
  }

  // Table header with gear icon for manage columns
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <h2 className="text-lg font-semibold text-gray-800">Reviews</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={filteredReviews.length === 0}
            className="p-2 rounded hover:bg-gray-100 text-gray-500 disabled:text-gray-300 disabled:hover:bg-transparent"
            title={
              Object.keys(rowSelection).length > 0
                ? `Export selected (${Object.keys(rowSelection).length})`
                : `Export all (${filteredReviews.length})`
            }
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded hover:bg-gray-100 text-gray-500 ${
              showFilters ? "bg-gray-200" : ""
            }`}
            title={
              filters.length > 0 ? `Filters (${filters.length})` : "Filters"
            }
          >
            <Filter className="w-5 h-5" />
          </button>
          <button
            onClick={openManageColumns}
            className="p-2 rounded hover:bg-gray-100 text-gray-500"
            title="Manage columns"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Add company toggle when in compare mode and on mobile */}
      {compareMode && isMobile && (
        <div className="mb-4 px-6 overflow-x-auto">
          <div className="flex gap-2">
            {Array.isArray(company)
              ? company.map((c) => (
                  <button
                    key={c.id}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-colors whitespace-nowrap ${
                      activeCompanyTab === c.id
                        ? "bg-gray-100 border-gray-400 font-semibold"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => onSelectCompany && onSelectCompany(c.id)}
                  >
                    <CompanyLogo company={c} size="sm" />
                  </button>
                ))
              : null}
          </div>
        </div>
      )}

      {showFilters && (
        <div className="p-4 border-b border-gray-200">
          <div className="space-y-3">
            {filters.map((filter, index) => (
              <FilterGroup
                key={index}
                filter={filter}
                onUpdate={(updatedFilter) => updateFilter(index, updatedFilter)}
                onRemove={() => removeFilter(index)}
                isFirst={index === 0}
              />
            ))}
            <div className="flex gap-2">
              <button
                onClick={addFilter}
                className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
              >
                <Plus className="w-4 h-4" />
                Add filter
              </button>
              {filters.length > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={table.getIsAllRowsSelected()}
                    onChange={table.getToggleAllRowsSelectedHandler()}
                    className="rounded border-gray-300"
                  />
                </th>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getIsSorted() ? (
                        header.column.getIsSorted() === "desc" ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronUp className="w-4 h-4" />
                        )
                      ) : (
                        <ChevronsUpDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  {Array.isArray(reviews) && reviews.length === 0
                    ? "No reviews to display."
                    : !Array.isArray(reviews)
                    ? "No reviews data passed to ReviewsTable."
                    : "No rows match the current filters."}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={
                    row.getIsSelected() ? "bg-blue-50" : "hover:bg-gray-50"
                  }
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={row.getIsSelected()}
                      onChange={row.getToggleSelectedHandler()}
                      className="rounded border-gray-300"
                    />
                  </td>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing{" "}
          {table.getState().pagination.pageIndex *
            table.getState().pagination.pageSize +
            1}{" "}
          to{" "}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) *
              table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}{" "}
          of {table.getFilteredRowModel().rows.length} results
          {rowSelection && Object.keys(rowSelection).length > 0 && (
            <span className="ml-4 font-medium">
              ({Object.keys(rowSelection).length} selected)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      {isManageColumnsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Manage columns</h4>
              <button
                onClick={closeManageColumns}
                className="p-1 rounded hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={({ active, over }) => {
                if (active.id !== over?.id) {
                  const oldIndex = columnOrder.indexOf(active.id);
                  const newIndex = columnOrder.indexOf(over.id);
                  if (oldIndex !== -1 && newIndex !== -1) {
                    const newOrder = arrayMove(columnOrder, oldIndex, newIndex);
                    setColumnOrder(newOrder);
                  }
                }
              }}
            >
              <SortableContext
                items={columnOrder}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {columnOrder.map((colKey, idx) => (
                    <DraggableColumnRow
                      key={colKey}
                      id={colKey}
                      idx={idx}
                      label={allColumnsMap[colKey]?.header || colKey}
                      checked={columnVisibility[colKey] !== false}
                      onCheck={(id) => {
                        setColumnVisibility((prev) => ({
                          ...prev,
                          [id]: !(prev[id] !== false),
                        }));
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            {/* Show all columns not in current order at the end, so user can add them */}
            <div className="mt-4">
              {ALL_COLUMNS.filter(
                (colKey) => !columnOrder.includes(colKey)
              ).map((colKey) => (
                <DraggableColumnRow
                  key={colKey}
                  id={colKey}
                  idx={columnOrder.length}
                  label={allColumnsMap[colKey]?.header || colKey}
                  checked={columnVisibility[colKey] !== false}
                  onCheck={(id) => {
                    setColumnVisibility((prev) => ({
                      ...prev,
                      [id]: !(prev[id] !== false),
                    }));
                    // If user checks a column not in order, add it to the end
                    if (!columnOrder.includes(id)) {
                      setColumnOrder((prev) => [...prev, id]);
                    }
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
