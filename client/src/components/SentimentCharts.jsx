import React, { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { format, parseISO } from "date-fns";
import {
  Eye,
  EyeOff,
  GripVertical,
  Settings,
  X,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { CompanyLogo } from "./CompanyLogo";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as BarTooltip,
  Legend as BarLegend,
} from "recharts";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const DEFAULT_CHART_ORDER = [
  "ratingOverall",
  "ratingCeo",
  "ratingBusinessOutlook",
  "ratingRecommendToFriend",
  "ratingSeniorLeadership",
  "ratingCultureAndValues",
  "ratingWorkLifeBalance",
  "ratingCompensationAndBenefits",
  "ratingCareerOpportunities",
  "ratingDiversityAndInclusion",
];

const RATING_CATEGORIES = [
  { key: "ratingOverall", label: "Overall rating" },
  { key: "ratingCeo", label: "CEO approval" },
  { key: "ratingSeniorLeadership", label: "Senior leadership" },
  { key: "ratingBusinessOutlook", label: "Business outlook" },
  { key: "ratingCultureAndValues", label: "Culture and values" },
  { key: "ratingWorkLifeBalance", label: "Work-life balance" },
  { key: "ratingCompensationAndBenefits", label: "Compensation and benefits" },
  { key: "ratingCareerOpportunities", label: "Career opportunities" },
  { key: "ratingDiversityAndInclusion", label: "Diversity and inclusion" },
  { key: "ratingRecommendToFriend", label: "Recommend to a friend" },
];

// Color scheme: Red (poor), Yellow (fair), Green (good), Grey (no response)
const RATING_COLORS = {
  Poor: "#ef4444", // Red
  Fair: "#eab308", // Yellow
  Good: "#10b981", // Green
  "No response": "#6b7280", // Grey
};

const SENTIMENT_COLORS = {
  Positive: "#10b981", // Green (approve)
  Negative: "#ef4444", // Red (disapprove)
  Approve: "#10b981", // Green (approve)
  Disapprove: "#ef4444", // Red (disapprove)
  Ok: "#eab308", // Yellow (neutral)
  "No opinion": "#eab308", // Yellow (neutral)
  Neutral: "#eab308", // Yellow (neutral)
  "No response": "#6b7280", // Grey
};

// Helper for segment order
const SEGMENT_ORDER = [
  "Good",
  "Fair",
  "Poor",
  "Positive",
  "Approve",
  "Neutral",
  "Ok",
  "No opinion",
  "Disapprove",
  "Negative",
  "No response",
];

// Helper to determine if a color is "dark" (for label contrast)
function isDarkColor(hex) {
  if (!hex) return false;
  // Remove # if present
  hex = hex.replace("#", "");
  // Convert 3-digit to 6-digit
  if (hex.length === 3)
    hex = hex
      .split("")
      .map((x) => x + x)
      .join("");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // Perceived brightness
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 140;
}

export function SentimentCharts({
  companies,
  compareMode,
  dateRange,
  activeCompanyTab,
  onSelectCompany,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Chart order and visibility state
  const defaultChartOrder = RATING_CATEGORIES.map((c) => c.key);
  const defaultHiddenCharts = {};
  const compareChartOrder = [
    "ratingOverall",
    "ratingRecommendToFriend",
    "ratingCeo",
    "ratingBusinessOutlook",
  ];
  const compareHiddenCharts = RATING_CATEGORIES.reduce((acc, c) => {
    acc[c.key] = !compareChartOrder.includes(c.key);
    return acc;
  }, {});

  const [chartOrder, setChartOrder] = React.useState(() => {
    if (compareMode) {
      const saved = localStorage.getItem("sentimentChartsOrderCompare");
      return saved ? JSON.parse(saved) : compareChartOrder;
    } else {
      const saved = localStorage.getItem("sentimentChartsOrder");
      return saved ? JSON.parse(saved) : defaultChartOrder;
    }
  });
  const [hiddenCharts, setHiddenCharts] = React.useState(() => {
    if (compareMode) {
      const saved = localStorage.getItem("sentimentChartsHiddenCompare");
      return saved ? JSON.parse(saved) : compareHiddenCharts;
    } else {
      const saved = localStorage.getItem("sentimentChartsHidden");
      return saved ? JSON.parse(saved) : defaultHiddenCharts;
    }
  });
  // Add hidingCharts state for animation (if not already defined)
  const [hidingCharts, setHidingCharts] = React.useState({});

  React.useEffect(() => {
    if (compareMode) {
      localStorage.setItem(
        "sentimentChartsOrderCompare",
        JSON.stringify(chartOrder)
      );
    } else {
      localStorage.setItem("sentimentChartsOrder", JSON.stringify(chartOrder));
    }
  }, [chartOrder, compareMode]);
  React.useEffect(() => {
    if (compareMode) {
      localStorage.setItem(
        "sentimentChartsHiddenCompare",
        JSON.stringify(hiddenCharts)
      );
    } else {
      localStorage.setItem(
        "sentimentChartsHidden",
        JSON.stringify(hiddenCharts)
      );
    }
  }, [hiddenCharts, compareMode]);

  // Filter reviews for each company based on dateRange
  const filteredCompanies = useMemo(() => {
    return companies.map((company) => {
      // Normalize company schema to ensure consistent properties
      const normalizedCompany = {
        ...company,
        // Ensure consistent naming properties exist
        name: company.name || company.display_name || company.shortName,
        display_name: company.display_name || company.name || company.shortName,
        shortName: company.shortName || company.name || company.display_name,
        // Keep the logo URL consistent
        logoUrl: company.logoUrl || null,
      };

      let filtered = normalizedCompany.reviews || [];
      if (dateRange && dateRange.startMonth && dateRange.endMonth) {
        filtered = filtered.filter((review) => {
          const reviewMonth = format(
            parseISO(review.reviewDateTime),
            "yyyy-MM"
          );
          return (
            reviewMonth >= dateRange.startMonth &&
            reviewMonth <= dateRange.endMonth
          );
        });
      }
      return { ...normalizedCompany, filteredReviews: filtered };
    });
  }, [companies, dateRange]);

  // For each company and category, build stacked bar data
  const stackedBarData = useMemo(() => {
    // { [categoryKey]: { [companyId]: { data, total } } }
    const result = {};
    chartOrder.forEach((key) => {
      result[key] = {};
      filteredCompanies.forEach((company) => {
        const reviews = company.filteredReviews;
        let data = [];
        let total = reviews.length;
        if (
          key === "ratingRecommendToFriend" ||
          key === "ratingCeo" ||
          key === "ratingBusinessOutlook"
        ) {
          // Sentiment
          const counts = reviews.reduce((acc, review) => {
            const value = review[key] || "UNKNOWN";
            let displayName;
            if (value === "UNKNOWN") displayName = "No response";
            else if (value === "POSITIVE") displayName = "Positive";
            else if (value === "NEGATIVE") displayName = "Negative";
            else if (value === "APPROVE") displayName = "Approve";
            else if (value === "DISAPPROVE") displayName = "Disapprove";
            else if (value === "OK") displayName = "Ok";
            else if (value === "NO_OPINION") displayName = "No opinion";
            else if (value === "NEUTRAL") displayName = "Neutral";
            else
              displayName =
                value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
            acc[displayName] = (acc[displayName] || 0) + 1;
            return acc;
          }, {});
          data = SEGMENT_ORDER.map((seg) => ({
            name: seg,
            value: counts[seg] || 0,
            percent: total
              ? (((counts[seg] || 0) / total) * 100).toFixed(1)
              : 0,
            color: SENTIMENT_COLORS[seg] || "#6b7280",
          })).filter((d) => d.value > 0);
        } else {
          // Numeric
          const validRatings = reviews.filter(
            (r) => r[key] != null && r[key] > 0
          );
          const noScoreCount = reviews.length - validRatings.length;
          const buckets = {
            Poor: 0,
            Fair: 0,
            Good: 0,
            "No response": noScoreCount,
          };
          validRatings.forEach((review) => {
            const rating = review[key];
            if (rating >= 1 && rating < 2.33) buckets["Poor"]++;
            else if (rating >= 2.33 && rating < 3.67) buckets["Fair"]++;
            else if (rating >= 3.67 && rating <= 5) buckets["Good"]++;
          });
          data = Object.entries(buckets)
            .map(([name, value]) => ({
              name,
              value,
              percent: total ? ((value / total) * 100).toFixed(1) : 0,
              color: RATING_COLORS[name],
            }))
            .filter((d) => d.value > 0);
        }
        result[key][company.id] = { data, total };
      });
    });
    return result;
  }, [filteredCompanies, chartOrder]);

  // Open modal with current state
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Animate out before actually hiding (for main grid only)
  const toggleChartVisibility = (key) => {
    if (!hiddenCharts[key]) {
      // Hide: animate out (main grid only)
      setHidingCharts((h) => ({ ...h, [key]: true }));
      setTimeout(() => {
        setHiddenCharts((h) => ({ ...h, [key]: true }));
        setHidingCharts((h) => {
          const { [key]: _, ...rest } = h;
          return rest;
        });
      }, 250); // match transition duration
    } else {
      // Show: animate in
      setHiddenCharts((h) => ({ ...h, [key]: false }));
    }
  };

  // Move chart up in the order
  const moveChartUp = (idx) => {
    if (idx === 0) return;
    setChartOrder((order) => {
      const newOrder = [...order];
      [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
      return newOrder;
    });
  };
  // Move chart down in the order
  const moveChartDown = (idx) => {
    setChartOrder((order) => {
      if (idx === order.length - 1) return order;
      const newOrder = [...order];
      [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
      return newOrder;
    });
  };

  // Compare mode: current side-by-side grid
  // Responsive: use tabs for companies on small screens
  const [localActiveTab, setLocalActiveTab] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Use either the shared activeCompanyTab or a local state if none provided
  const activeTab =
    activeCompanyTab !== undefined ? activeCompanyTab : localActiveTab;
  const setActiveTab = onSelectCompany || setLocalActiveTab;

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (compareMode && filteredCompanies.length > 0 && activeTab == null) {
      setActiveTab(filteredCompanies[0].id);
    }
  }, [compareMode, filteredCompanies, activeTab, setActiveTab]);

  if (!compareMode) {
    // Single-company grid layout (original)
    const company = companies[0];
    // Normalize the company object to ensure consistent schema
    const normalizedCompany = company
      ? {
          ...company,
          // Ensure consistent naming properties exist
          name: company.name,
          // Keep the logo URL consistent
          logoUrl: company.logoUrl,
        }
      : null;

    const filteredReviews = normalizedCompany
      ? (normalizedCompany.reviews || []).filter((review) => {
          if (!dateRange || !dateRange.startMonth || !dateRange.endMonth)
            return true;
          const reviewMonth = format(
            parseISO(review.reviewDateTime),
            "yyyy-MM"
          );
          return (
            reviewMonth >= dateRange.startMonth &&
            reviewMonth <= dateRange.endMonth
          );
        })
      : [];
    // Build chart data for each category
    const ratingPieCharts = RATING_CATEGORIES.map(({ key, label }) => {
      const allReviews = filteredReviews;
      if (
        key === "ratingRecommendToFriend" ||
        key === "ratingCeo" ||
        key === "ratingBusinessOutlook"
      ) {
        const counts = allReviews.reduce((acc, review) => {
          const value = review[key] || "UNKNOWN";
          acc[value] = (acc[value] || 0) + 1;
          return acc;
        }, {});
        const total = allReviews.length;
        const pieData = Object.entries(counts).map(([key, value]) => {
          let displayName;
          if (key === "UNKNOWN") displayName = "No response";
          else if (key === "POSITIVE") displayName = "Positive";
          else if (key === "NEGATIVE") displayName = "Negative";
          else if (key === "APPROVE") displayName = "Approve";
          else if (key === "DISAPPROVE") displayName = "Disapprove";
          else if (key === "OK") displayName = "Ok";
          else if (key === "NO_OPINION") displayName = "No opinion";
          else if (key === "NEUTRAL") displayName = "Neutral";
          else
            displayName =
              key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
          return {
            name: displayName,
            value,
            percent: ((value / total) * 100).toFixed(1),
            color: SENTIMENT_COLORS[displayName] || "#6b7280",
          };
        });
        return {
          key,
          label,
          data: pieData,
          total: allReviews.length,
        };
      }
      // Numeric
      const validRatings = allReviews.filter(
        (r) => r[key] != null && r[key] > 0
      );
      const noScoreCount = allReviews.length - validRatings.length;
      const buckets = {
        Poor: 0,
        Fair: 0,
        Good: 0,
        "No response": noScoreCount,
      };
      validRatings.forEach((review) => {
        const rating = review[key];
        if (rating >= 1 && rating < 2.33) buckets["Poor"]++;
        else if (rating >= 2.33 && rating < 3.67) buckets["Fair"]++;
        else if (rating >= 3.67 && rating <= 5) buckets["Good"]++;
      });
      const total = allReviews.length;
      const pieData = Object.entries(buckets)
        .filter(([_, count]) => count > 0)
        .map(([name, value]) => ({
          name,
          value,
          percent: ((value / total) * 100).toFixed(1),
          color: RATING_COLORS[name],
        }));
      return {
        key,
        label,
        data: pieData,
        total: allReviews.length,
      };
    }).filter((chart) => chart.data.length > 0);
    return (
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Sentiment</h3>
            <button
              onClick={openModal}
              className="p-2 rounded hover:bg-gray-100"
              title="Manage charts"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
          <div
            className={`grid gap-8 ${
              chartOrder[0] === "ratingOverall" &&
              !hiddenCharts["ratingOverall"]
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {chartOrder.map((key, idx) => {
              const chart = ratingPieCharts.find((c) => c.key === key);
              const cat = RATING_CATEGORIES.find((c) => c.key === key);
              if (!chart || (hiddenCharts[key] && !hidingCharts[key]))
                return null;
              // Order segments by SEGMENT_ORDER, then alphabetically
              const segmentNames = [...chart.data.map((seg) => seg.name)].sort(
                (a, b) => {
                  const ia = SEGMENT_ORDER.indexOf(a);
                  const ib = SEGMENT_ORDER.indexOf(b);
                  if (ia === -1 && ib === -1) return a.localeCompare(b);
                  if (ia === -1) return 1;
                  if (ib === -1) return -1;
                  return ia - ib;
                }
              );
              const barData = [
                segmentNames.reduce((acc, seg) => {
                  acc[seg] = chart.data.find((s) => s.name === seg)?.value || 0;
                  acc[seg + "_percent"] =
                    chart.data.find((s) => s.name === seg)?.percent || 0;
                  return acc;
                }, {}),
              ];
              // Make "Overall rating" span all columns if it's the first and visible
              const isOverallFirst =
                key === "ratingOverall" &&
                idx === 0 &&
                !hiddenCharts["ratingOverall"];
              return (
                <div
                  key={key}
                  className={
                    "bg-gray-50 rounded-lg border border-gray-200 p-4 flex flex-col transition-all duration-300 " +
                    (hidingCharts[key]
                      ? "opacity-0 scale-95 pointer-events-none h-0 p-0 m-0"
                      : hiddenCharts[key]
                      ? "opacity-0 scale-95 pointer-events-none h-0 p-0 m-0"
                      : "opacity-100 scale-100") +
                    (isOverallFirst
                      ? " col-span-1 md:col-span-2 lg:col-span-3"
                      : "")
                  }
                  style={{
                    maxHeight: hidingCharts[key] || hiddenCharts[key] ? 0 : 999,
                    overflow: "hidden",
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center">
                      <h4
                        className="text-md font-medium truncate max-w-[160px]"
                        title={cat ? cat.label : key}
                      >
                        {cat ? cat.label : key}
                      </h4>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={40}>
                    <BarChart
                      data={barData}
                      layout="vertical"
                      margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                      barCategoryGap={0}
                    >
                      <XAxis
                        type="number"
                        hide
                        domain={[
                          0,
                          chart.data.reduce((sum, seg) => sum + seg.value, 0),
                        ]}
                      />
                      <YAxis type="category" dataKey={() => ""} hide />
                      {segmentNames.map((seg, i) => (
                        <Bar
                          key={seg}
                          dataKey={seg}
                          stackId="a"
                          fill={
                            chart.data.find((s) => s.name === seg)?.color ||
                            "#ccc"
                          }
                          isAnimationActive={false}
                          barSize={30}
                          aria-label={`${seg}: ${
                            barData[0][seg + "_percent"]
                          }%`}
                          label={({ x, y, width, height, value }) => {
                            // Only show label if segment is wide enough
                            if (width > 40 && value > 0) {
                              return (
                                <text
                                  x={x + width / 2}
                                  y={y + height / 2 + 5}
                                  textAnchor="middle"
                                  fill="#fff"
                                  fontSize="14"
                                  fontWeight="bold"
                                >
                                  {barData[0][seg + "_percent"]}%
                                </text>
                              );
                            }
                            return null;
                          }}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              );
            })}
          </div>
          {/* Modal for chart management */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold">Manage charts</h4>
                  <button
                    onClick={closeModal}
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div>
                  <DndContext
                    collisionDetection={closestCenter}
                    onDragEnd={({ active, over }) => {
                      if (active.id !== over?.id) {
                        setChartOrder((order) => {
                          const oldIndex = order.indexOf(active.id);
                          const newIndex = order.indexOf(over.id);
                          return arrayMove(order, oldIndex, newIndex);
                        });
                      }
                    }}
                  >
                    <SortableContext
                      items={chartOrder}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {chartOrder.map((key, idx) => (
                          <DraggableChartRow
                            key={key}
                            id={key}
                            idx={idx}
                            chartKey={key}
                            label={
                              RATING_CATEGORIES.find((c) => c.key === key)
                                ?.label || key
                            }
                            checked={!hiddenCharts[key]}
                            onCheck={(e) =>
                              setHiddenCharts((h) => ({
                                ...h,
                                [key]: !e.target.checked,
                              }))
                            }
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (compareMode && isMobile) {
    return (
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Sentiment</h3>
            <button
              onClick={openModal}
              className="p-2 rounded hover:bg-gray-100"
              title="Manage charts"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
          <div className="mb-4 flex gap-2 overflow-x-auto">
            {filteredCompanies.map((company) => (
              <button
                key={company.id}
                className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-colors whitespace-nowrap ${
                  activeTab === company.id
                    ? "bg-gray-100 border-gray-400 font-semibold"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => setActiveTab(company.id)}
              >
                <CompanyLogo company={company} size="sm" />
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table
              className="min-w-full border-separate"
              style={{ borderSpacing: 0, tableLayout: "fixed", width: "100%" }}
            >
              <thead>
                <tr>
                  <th className="p-2 w-[180px]" />
                  <th className="p-2 min-w-[180px] font-normal text-gray-800">
                    {activeTab && (
                      <CompanyLogo
                        company={filteredCompanies.find(
                          (c) => c.id === activeTab
                        )}
                        size="sm"
                      />
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {chartOrder.map((key) => {
                  if (hiddenCharts[key] && !hidingCharts[key]) return null;
                  const cat = RATING_CATEGORIES.find((c) => c.key === key);
                  const chart =
                    stackedBarData[key] && activeTab
                      ? stackedBarData[key][activeTab]
                      : { data: [], total: 0 };
                  let finalData = [];

                  // Check if chart exists before accessing its data
                  if (chart && chart.data) {
                    if (
                      [
                        "ratingRecommendToFriend",
                        "ratingCeo",
                        "ratingBusinessOutlook",
                      ].includes(key)
                    ) {
                      const sentimentOrder = [
                        "Positive",
                        "Approve",
                        "Neutral",
                        "Ok",
                        "No opinion",
                        "Negative",
                        "Disapprove",
                        "No response",
                      ];
                      const orderedData = sentimentOrder
                        .map((seg) => chart.data.find((d) => d.name === seg))
                        .filter(Boolean);
                      const extra = chart.data.filter(
                        (d) => !sentimentOrder.includes(d.name)
                      );
                      finalData = [...orderedData, ...extra];
                    } else {
                      const ordered = ["Good", "Fair", "Poor", "No response"];
                      const orderedData = ordered
                        .map((seg) => chart.data.find((d) => d.name === seg))
                        .filter(Boolean);
                      const extra = chart.data.filter(
                        (d) => !ordered.includes(d.name)
                      );
                      finalData = [...orderedData, ...extra];
                    }
                  }
                  return (
                    <tr
                      key={key}
                      className="align-middle transition-colors group hover:bg-gray-50"
                      style={{ height: 56 }}
                    >
                      <td
                        className="p-2 font-medium text-gray-700 whitespace-nowrap w-[180px] align-middle truncate max-w-[160px]"
                        title={cat ? cat.label : key}
                      >
                        <div className="flex items-center gap-2">
                          <div className="font-medium">
                            {cat ? cat.label : key}
                          </div>
                        </div>
                      </td>
                      <td
                        className="p-2 align-middle min-w-[180px]"
                        style={{ verticalAlign: "middle" }}
                      >
                        <div className="flex items-center h-full min-h-[36px]">
                          <ResponsiveContainer
                            width="100%"
                            height={36}
                            minWidth={120}
                          >
                            <BarChart
                              data={[
                                finalData.reduce((acc, seg) => {
                                  acc[seg.name] = seg.value;
                                  return acc;
                                }, {}),
                              ]}
                              layout="vertical"
                              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                              barCategoryGap={0}
                            >
                              <XAxis
                                type="number"
                                hide
                                domain={[
                                  0,
                                  finalData.reduce(
                                    (sum, seg) => sum + seg.value,
                                    0
                                  ),
                                ]}
                              />
                              <YAxis type="category" dataKey={() => ""} hide />
                              {finalData.map((seg, i) => (
                                <Bar
                                  key={seg.name}
                                  dataKey={seg.name}
                                  stackId="a"
                                  fill={seg.color}
                                  isAnimationActive={false}
                                  barSize={28}
                                  aria-label={`${seg.name}: ${seg.percent}%`}
                                  label={({ x, y, width, height, value }) => {
                                    if (width > 32 && value > 0) {
                                      return (
                                        <text
                                          x={x + width / 2}
                                          y={y + height / 2 + 5}
                                          textAnchor="middle"
                                          fill="#fff"
                                          fontSize="13"
                                          fontWeight="bold"
                                        >
                                          {seg.percent}%
                                        </text>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                              ))}
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Modal for chart management */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold">Manage charts</h4>
                  <button
                    onClick={closeModal}
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div>
                  <DndContext
                    collisionDetection={closestCenter}
                    onDragEnd={({ active, over }) => {
                      if (active.id !== over?.id) {
                        setChartOrder((order) => {
                          const oldIndex = order.indexOf(active.id);
                          const newIndex = order.indexOf(over.id);
                          return arrayMove(order, oldIndex, newIndex);
                        });
                      }
                    }}
                  >
                    <SortableContext
                      items={chartOrder}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {chartOrder.map((key, idx) => (
                          <DraggableChartRow
                            key={key}
                            id={key}
                            idx={idx}
                            chartKey={key}
                            label={
                              RATING_CATEGORIES.find((c) => c.key === key)
                                ?.label || key
                            }
                            checked={!hiddenCharts[key]}
                            onCheck={(e) =>
                              setHiddenCharts((h) => ({
                                ...h,
                                [key]: !e.target.checked,
                              }))
                            }
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop/tablet compare mode (side-by-side table)
  if (compareMode && !isMobile) {
    console.log(filteredCompanies);
    return (
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Sentiment</h3>
            <button
              onClick={openModal}
              className="p-2 rounded hover:bg-gray-100"
              title="Manage charts"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table
              className="min-w-full border-separate"
              style={{ borderSpacing: 0, tableLayout: "fixed", width: "100%" }}
            >
              <thead>
                <tr>
                  <th className="p-2 w-[180px]" />
                  {filteredCompanies.map((company) => (
                    <th
                      key={company.id}
                      className="p-2 min-w-[180px] font-normal text-gray-800"
                      style={{ fontWeight: "normal", textTransform: "none" }}
                    >
                      <CompanyLogo company={company} size="sm" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chartOrder.map((key) => {
                  if (hiddenCharts[key] && !hidingCharts[key]) return null;
                  const cat = RATING_CATEGORIES.find((c) => c.key === key);
                  return (
                    <tr
                      key={key}
                      className="align-middle transition-colors group hover:bg-gray-50"
                      style={{ height: 56 }}
                    >
                      <td
                        className="p-2 font-medium text-gray-700 whitespace-nowrap w-[180px] align-middle truncate max-w-[160px]"
                        title={cat ? cat.label : key}
                      >
                        <div className="flex items-center gap-2">
                          <div className="font-medium">
                            {cat ? cat.label : key}
                          </div>
                        </div>
                      </td>
                      {filteredCompanies.map((company) => {
                        let chart =
                          stackedBarData[key] && company.id
                            ? stackedBarData[key][company.id]
                            : { data: [], total: 0 };
                        let finalData;
                        if (
                          [
                            "ratingRecommendToFriend",
                            "ratingCeo",
                            "ratingBusinessOutlook",
                          ].includes(key)
                        ) {
                          const sentimentOrder = [
                            "Positive",
                            "Approve",
                            "Neutral",
                            "Ok",
                            "No opinion",
                            "Negative",
                            "Disapprove",
                            "No response",
                          ];
                          const orderedData = sentimentOrder
                            .map((seg) =>
                              chart.data.find((d) => d.name === seg)
                            )
                            .filter(Boolean);
                          const extra = chart.data.filter(
                            (d) => !sentimentOrder.includes(d.name)
                          );
                          finalData = [...orderedData, ...extra];
                        } else {
                          const ordered = [
                            "Good",
                            "Fair",
                            "Poor",
                            "No response",
                          ];
                          const orderedData = ordered
                            .map((seg) =>
                              chart.data.find((d) => d.name === seg)
                            )
                            .filter(Boolean);
                          const extra = chart.data.filter(
                            (d) => !ordered.includes(d.name)
                          );
                          finalData = [...orderedData, ...extra];
                        }
                        return (
                          <td
                            key={company.id}
                            className="p-2 align-middle min-w-[180px]"
                            style={{ verticalAlign: "middle" }}
                          >
                            <div className="flex items-center h-full min-h-[36px]">
                              <ResponsiveContainer
                                width="100%"
                                height={36}
                                minWidth={120}
                              >
                                <BarChart
                                  data={[
                                    finalData.reduce((acc, seg) => {
                                      acc[seg.name] = seg.value;
                                      return acc;
                                    }, {}),
                                  ]}
                                  layout="vertical"
                                  margin={{
                                    top: 0,
                                    right: 0,
                                    left: 0,
                                    bottom: 0,
                                  }}
                                  barCategoryGap={0}
                                >
                                  <XAxis
                                    type="number"
                                    hide
                                    domain={[
                                      0,
                                      finalData.reduce(
                                        (sum, seg) => sum + seg.value,
                                        0
                                      ),
                                    ]}
                                  />
                                  <YAxis
                                    type="category"
                                    dataKey={() => ""}
                                    hide
                                  />
                                  {finalData.map((seg, i) => (
                                    <Bar
                                      key={seg.name}
                                      dataKey={seg.name}
                                      stackId="a"
                                      fill={seg.color}
                                      isAnimationActive={false}
                                      barSize={28}
                                      aria-label={`${seg.name}: ${seg.percent}%`}
                                      label={({
                                        x,
                                        y,
                                        width,
                                        height,
                                        value,
                                      }) => {
                                        if (width > 32 && value > 0) {
                                          return (
                                            <text
                                              x={x + width / 2}
                                              y={y + height / 2 + 5}
                                              textAnchor="middle"
                                              fill="#fff"
                                              fontSize="13"
                                              fontWeight="bold"
                                            >
                                              {seg.percent}%
                                            </text>
                                          );
                                        }
                                        return null;
                                      }}
                                    />
                                  ))}
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Modal for chart management */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold">Manage charts</h4>
                  <button
                    onClick={closeModal}
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div>
                  <DndContext
                    collisionDetection={closestCenter}
                    onDragEnd={({ active, over }) => {
                      if (active.id !== over?.id) {
                        setChartOrder((order) => {
                          const oldIndex = order.indexOf(active.id);
                          const newIndex = order.indexOf(over.id);
                          return arrayMove(order, oldIndex, newIndex);
                        });
                      }
                    }}
                  >
                    <SortableContext
                      items={chartOrder}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {chartOrder.map((key, idx) => (
                          <DraggableChartRow
                            key={key}
                            id={key}
                            idx={idx}
                            chartKey={key}
                            label={
                              RATING_CATEGORIES.find((c) => c.key === key)
                                ?.label || key
                            }
                            checked={!hiddenCharts[key]}
                            onCheck={(e) =>
                              setHiddenCharts((h) => ({
                                ...h,
                                [key]: !e.target.checked,
                              }))
                            }
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  function DraggableChartRow({
    id,
    idx,
    chartKey,
    label,
    checked,
    onCheck,
    children,
  }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: chartKey });
    return (
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isDragging ? 0.5 : 1,
          background: isDragging ? "#e0e7ef" : undefined,
        }}
        className="flex items-center gap-2 p-2 border rounded bg-gray-50 cursor-grab"
        {...attributes}
      >
        {/* Grip handle on the left */}
        <span
          className="mr-2 flex items-center cursor-grab select-none text-gray-400"
          {...listeners}
        >
          <GripVertical className="w-5 h-5" />
        </span>
        <span className="flex-1">{label}</span>
        {/* Toggle for visible/hidden on the right */}
        <button
          onClick={() => onCheck({ target: { checked: !checked } })}
          className={`ml-2 p-1 rounded-full border border-gray-200 ${
            checked ? "bg-white text-gray-500" : "bg-gray-200 text-gray-400"
          }`}
          title={checked ? "Hide chart" : "Show chart"}
          aria-label={checked ? "Hide chart" : "Show chart"}
          type="button"
        >
          {checked ? (
            <Eye className="w-5 h-5" />
          ) : (
            <EyeOff className="w-5 h-5" />
          )}
        </button>
        {children}
      </div>
    );
  }
}
