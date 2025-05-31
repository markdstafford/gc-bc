import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from "recharts";
import {
  format,
  parseISO,
  startOfMonth,
  subMonths as dateFnsSubMonths,
  addMonths,
} from "date-fns";
import { Loader2 } from "lucide-react";
import { CompanyLogo } from "./CompanyLogo";

// Helper hook for mobile detection (as per requirements for responsive height)
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 640
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isMobile;
}

const lineColors = [
  "#3b82f6",
  "#f59e42",
  "#10b981",
  "#ef4444",
  "#a78bfa",
  "#f472b6",
];

export function TimelineChart({
  companies = [],
  compareMode = false,
  timelineRange = "year",
  setTimelineRange,
  onBrushChange,
}) {
  const isMobile = useIsMobile();
  const isDragging = useRef(false);
  const draggedIndicesRef = useRef({ startIndex: 0, endIndex: 0 });
  const lastBrushUpdateTs = useRef(0);
  const prevDateRangeRef = useRef({ startMonth: null, endMonth: null });

  // console.log('[TimelineChart] Props:', { companies, compareMode, timelineRange });

  const mergedMonths = useMemo(() => {
    const monthSet = new Set();
    (companies || []).forEach((company) => {
      (company.reviews || []).forEach((review) => {
        if (review.reviewDateTime) {
          try {
            const date = parseISO(review.reviewDateTime);
            const monthKey = format(startOfMonth(date), "yyyy-MM");
            monthSet.add(monthKey);
          } catch (e) {
            /* Silently ignore parse errors for now */
          }
        }
      });
    });
    return Array.from(monthSet).sort();
  }, [companies]);

  const chartData = useMemo(() => {
    if (!mergedMonths.length) return [];
    return mergedMonths.map((monthKey) => {
      const dateLabel = format(parseISO(monthKey + "-01"), "MMM yyyy");
      const entry = { month: monthKey, date: dateLabel };
      (companies || []).forEach((company) => {
        if (!company || !company.id) return;
        const monthReviews = (company.reviews || []).filter((r) => {
          if (!r.reviewDateTime) return false;
          try {
            const rMonth = format(
              startOfMonth(parseISO(r.reviewDateTime)),
              "yyyy-MM"
            );
            return rMonth === monthKey;
          } catch (e) {
            return false;
          }
        });
        const avgRating = monthReviews.length
          ? monthReviews.reduce((sum, r) => sum + (r.ratingOverall || 0), 0) /
            monthReviews.length
          : null;
        entry[`avg_${company.id}`] =
          avgRating !== null ? parseFloat(avgRating.toFixed(2)) : null;
        entry[`count_${company.id}`] = monthReviews.length;
      });
      return entry;
    });
  }, [mergedMonths, companies]);

  const [brushIndices, setBrushIndices] = useState({
    startIndex: 0,
    endIndex: Math.max(0, chartData.length - 1),
  });

  // ... (useEffect hooks, brush handlers - kept for now but brush UI will be removed temporarily)
  useEffect(() => {
    draggedIndicesRef.current = brushIndices;
  }, [brushIndices]);

  useEffect(() => {
    // Handle empty chart data case
    if (!chartData.length) {
      const currentRange = { startMonth: null, endMonth: null };
      if (
        onBrushChange &&
        (prevDateRangeRef.current.startMonth !== currentRange.startMonth ||
          prevDateRangeRef.current.endMonth !== currentRange.endMonth)
      ) {
        onBrushChange(currentRange);
        prevDateRangeRef.current = currentRange;
      }
      const emptyIndices = { startIndex: 0, endIndex: 0 };
      setBrushIndices(emptyIndices);
      draggedIndicesRef.current = emptyIndices;
      return;
    }

    // Ensure we have valid indices for non-empty data
    let newStartIndex = 0;
    let newEndIndex = Math.max(0, chartData.length - 1);

    if (timelineRange !== "all") {
      const monthsMap = { year: 12, "6mo": 6, "3mo": 3 };
      const numMonthsToLookBack = monthsMap[timelineRange];
      if (numMonthsToLookBack) {
        const lastDataMonthDate = parseISO(
          chartData[chartData.length - 1].month + "-01"
        );
        const targetStartDate = dateFnsSubMonths(
          startOfMonth(lastDataMonthDate),
          numMonthsToLookBack - 1
        );
        const cutoffMonthKey = format(targetStartDate, "yyyy-MM");
        const idx = chartData.findIndex((d) => d.month >= cutoffMonthKey);
        newStartIndex = idx !== -1 ? idx : 0;
      }
    }

    const clampedStartIndex = Math.max(
      0,
      Math.min(newStartIndex, chartData.length - 1)
    );
    const clampedEndIndex = Math.max(
      0,
      Math.min(newEndIndex, chartData.length - 1)
    );
    const finalStartIndex = Math.min(clampedStartIndex, clampedEndIndex);
    const finalEndIndex = Math.max(clampedStartIndex, clampedEndIndex);

    if (
      !isDragging.current &&
      (brushIndices.startIndex !== finalStartIndex ||
        brushIndices.endIndex !== finalEndIndex)
    ) {
      setBrushIndices({ startIndex: finalStartIndex, endIndex: finalEndIndex });
    }

    const newStartMonth = chartData[finalStartIndex]?.month;
    const newEndMonth = chartData[finalEndIndex]?.month;
    const newCalculatedRange = {
      startMonth: newStartMonth,
      endMonth: newEndMonth,
    };

    // console.log('[TimelineChart] useEffect [timelineRange]: newCalculatedRange:', newCalculatedRange, 'prevDateRangeRef:', prevDateRangeRef.current); // Keep this commented for now
    if (
      onBrushChange &&
      (prevDateRangeRef.current.startMonth !== newCalculatedRange.startMonth ||
        prevDateRangeRef.current.endMonth !== newCalculatedRange.endMonth)
    ) {
      // console.log('[TimelineChart] useEffect [timelineRange]: Calling onBrushChange with:', newCalculatedRange); // Keep this commented
      onBrushChange(newCalculatedRange);
      prevDateRangeRef.current = newCalculatedRange;
    }
  }, [
    timelineRange,
    chartData,
    onBrushChange,
    brushIndices.startIndex,
    brushIndices.endIndex,
  ]);

  const handleBrushMD = (e) => {
    let target = e.target;
    let isBrushElement = false;
    while (target && target !== e.currentTarget) {
      if (
        target.classList &&
        (target.classList.contains("recharts-brush-traveller") ||
          target.classList.contains("recharts-brush-slide") ||
          target.classList.contains("recharts-brush-background"))
      ) {
        isBrushElement = true;
        break;
      }
      target = target.parentNode;
    }
    if (isBrushElement) {
      isDragging.current = true;
      lastBrushUpdateTs.current = 0;
    }
  };

  const handleBrushMU = () => {
    if (isDragging.current) {
      isDragging.current = false;
      setBrushIndices(draggedIndicesRef.current);

      if (onBrushChange) {
        const { startIndex, endIndex } = draggedIndicesRef.current;
        if (
          chartData.length > 0 &&
          startIndex !== undefined &&
          endIndex !== undefined
        ) {
          const rangeToEmit = {
            startMonth: chartData[startIndex]?.month,
            endMonth: chartData[endIndex]?.month,
          };
          onBrushChange(rangeToEmit);
          prevDateRangeRef.current = rangeToEmit;
        } else if (chartData.length === 0) {
          const emptyRange = { startMonth: null, endMonth: null };
          onBrushChange(emptyRange);
          prevDateRangeRef.current = emptyRange;
        }
      }
    }
  };

  const handleRechartsBrushChange = (newRechartsRange) => {
    // Always update brushIndices so the brush position stays in sync with drag
    if (
      !newRechartsRange ||
      typeof newRechartsRange.startIndex !== "number" ||
      typeof newRechartsRange.endIndex !== "number"
    )
      return;
    if (!chartData.length) return;

    // Set isDragging to true on first drag event
    if (!isDragging.current) isDragging.current = true;

    let { startIndex, endIndex } = newRechartsRange;
    startIndex = Math.max(0, Math.min(startIndex, chartData.length - 1));
    endIndex = Math.max(0, Math.min(endIndex, chartData.length - 1));
    if (startIndex > endIndex) {
      [startIndex, endIndex] = [endIndex, startIndex];
    }
    draggedIndicesRef.current = { startIndex, endIndex };
    setBrushIndices({ startIndex, endIndex });

    const now = Date.now();
    if (now - lastBrushUpdateTs.current < 100) {
      // Debounce
    } else {
      lastBrushUpdateTs.current = now;
      if (onBrushChange) {
        const currentRange = {
          startMonth: chartData[startIndex]?.month,
          endMonth: chartData[endIndex]?.month,
        };
        onBrushChange(currentRange);
        prevDateRangeRef.current = currentRange;
      }
    }
  };

  const handlePresetButtonClick = (range) => {
    if (setTimelineRange) {
      isDragging.current = false;
      setTimelineRange(range);
    }
  };

  useEffect(() => {
    if (chartData.length > 0) {
      const newEndIndex = chartData.length - 1;
      if (
        brushIndices.endIndex !== newEndIndex ||
        brushIndices.startIndex > newEndIndex
      ) {
        const newStartIndex = Math.min(brushIndices.startIndex, newEndIndex);
        if (!isDragging.current) {
          if (
            brushIndices.startIndex !== newStartIndex ||
            brushIndices.endIndex !== newEndIndex
          ) {
            setBrushIndices({
              startIndex: newStartIndex,
              endIndex: newEndIndex,
            });
          }
        }
      }
    }
  }, [chartData.length, brushIndices.startIndex, brushIndices.endIndex]);

  // More robust handling of firstCompanyId for tooltip formatter
  const firstCompanyId = useMemo(() => {
    // Safe extraction of the first company's ID for tooltip formatting
    if (companies && Array.isArray(companies) && companies.length > 0) {
      const firstCompany = companies[0];
      return firstCompany && firstCompany.id ? firstCompany.id : undefined;
    }
    return undefined;
  }, [companies]);

  if (
    !companies ||
    companies.length === 0 ||
    !companies.some((c) => c.reviews && c.reviews.length > 0)
  ) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-[300px] flex items-center justify-center">
        <p className="text-gray-500">No review data available to display.</p>
      </div>
    );
  }

  // --- 3. Chart Elements & Styling (Simplified for testing) ---
  return (
    <div className="bg-white p-2 sm:p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <h3 className="text-lg font-semibold">Rating timeline</h3>
        <div className="flex flex-wrap sm:flex-nowrap gap-2 overflow-x-auto scrollbar-hide">
          {["all", "year", "6mo", "3mo"].map((range) => (
            <button
              key={range}
              className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm min-w-[44px] min-h-[36px] ${
                timelineRange === range
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
              onClick={() => handlePresetButtonClick(range)}
            >
              {range === "all"
                ? "All time"
                : range === "year"
                ? "Last year"
                : range === "6mo"
                ? "Last 6 months"
                : "Last 3 months"}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
        <ComposedChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          onMouseDown={handleBrushMD} // Keep these for drag state logic
          onMouseUp={handleBrushMU} // even if Brush UI is removed
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: isMobile ? 10 : 12 }} />
          <YAxis
            yAxisId="rating"
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            allowDecimals={false}
            tick={{ fontSize: isMobile ? 10 : 12 }}
            orientation="left"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              borderRadius: "0.5rem",
              padding: "0.5rem 1rem",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            }}
            formatter={(value, name, props) => {
              // Guard against null/undefined values
              if (value === null || value === undefined || isNaN(value)) {
                return ["N/A", name];
              }

              // Handle rating values (most common case)
              if (name && name.includes("Avg Rating")) {
                return [
                  typeof value === "number"
                    ? parseFloat(value).toFixed(2)
                    : value,
                  name,
                ];
              }

              // Handle count values
              if (name && name.includes("Review Count")) {
                return [value, name];
              }

              return [value, name];
            }}
          />
          <Legend
            wrapperStyle={{
              fontSize: isMobile ? "11px" : "13px",
              paddingTop: "10px",
            }}
          />
          {/* --- 2. Operational Modes --- */}
          {compareMode ? (
            // Compare Mode - Map companies to Lines with guards against bad data
            (companies || []).map((company, idx) => {
              // Skip if no company or ID
              if (!company || !company.id) return null;

              return (
                <Line
                  key={`avg_rating_compare_${company.id}`}
                  yAxisId="rating"
                  type="monotone"
                  dataKey={`avg_${company.id}`}
                  name={`${
                    company.name || company.shortName || "Company"
                  } - Avg Rating`}
                  stroke={lineColors[idx % lineColors.length]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls={true} // Skip null/undefined data points
                  isAnimationActive={!company.loading} // Disable animation if loading to prevent flicker
                  strokeDasharray={company.loading ? "5 5" : undefined}
                  opacity={company.loading ? 0.6 : 1}
                />
              );
            })
          ) : // Single Company Mode with guards
          companies.length > 0 && companies[0] && companies[0].id ? (
            <>
              <YAxis
                yAxisId="count"
                orientation="right"
                allowDecimals={false}
                width={isMobile ? 30 : 40}
                stroke="#82ca9d"
                tick={{ fontSize: isMobile ? 10 : 12 }}
                axisLine={{ stroke: "#82ca9d" }}
                tickLine={{ stroke: "#82ca9d" }}
              />
              <Bar
                yAxisId="count"
                dataKey={`count_${companies[0].id}`}
                name={`${
                  companies[0].name ||
                  companies[0].shortName ||
                  companies[0].display_name ||
                  "Company"
                } - Review Count`}
                fill={lineColors[1]}
                opacity={0.7}
                connectNulls={true}
              />
              <Line
                yAxisId="rating"
                type="monotone"
                dataKey={`avg_${companies[0].id}`}
                name={`${
                  companies[0].name ||
                  companies[0].shortName ||
                  companies[0].display_name ||
                  "Company"
                } - Avg Rating`}
                stroke={lineColors[0]}
                strokeWidth={2}
                dot={false}
                connectNulls={true}
              />
            </>
          ) : null}
          // Return null if no valid company
          {/* --- Re-introducing the Brush --- */}
          {chartData.length > 1 && (
            <Brush
              dataKey="date"
              height={30}
              stroke={lineColors[0]}
              fill="#f3f4f6"
              travellerWidth={10}
              gap={5}
              padding={{ left: 10, right: 10 }}
              startIndex={Math.min(
                brushIndices.startIndex,
                chartData.length - 1
              )}
              endIndex={Math.min(brushIndices.endIndex, chartData.length - 1)}
              onChange={handleRechartsBrushChange}
              alwaysShowText={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      {/* Compare mode loading indicator can remain if it was outside the main chart area */}
      {compareMode && companies.some((c) => c.loading) && (
        <div className="flex items-center justify-center gap-2 mt-2 text-blue-600 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Updating comparison data...</span>
        </div>
      )}
    </div>
  );
}
