"use client";

import React, { useMemo, useState } from "react";

/**
 * AvailabilityTimeline
 * Props:
 *  - cars: array of car objects { id, brand, model, baseImage }
 *  - bookings: array of bookings with fields:
 *      { id, carId, car: { brand, model, baseImage }, user: { name }, startDate, endDate, status }
 *
 * Notes:
 *  - expected booking.status values: "CONFIRMED" | "PROCESSING" (case-insensitive supported)
 *  - dates should be ISO-like strings (YYYY-MM-DD or full ISO)
 */

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const ROW_HEIGHT = 64; // px per booking row
const LEFT_COL_WIDTH = 280; // width for booking list column
const DAY_WIDTH = 36; // px per day column (tweak to taste)
const MAX_DAYS = 120; // clamp timeline to prevent extremely wide charts

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysBetween(a, b) {
  return Math.round((startOfDay(b) - startOfDay(a)) / MS_PER_DAY);
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function formatShortDate(d) {
  const date = new Date(d);
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" }); // e.g. "2 Oct"
}

export default function BookingsTimeline({ cars = [], bookings = [] }) {
  const [carFilter, setCarFilter] = useState("");

  // only show processing & confirmed bookings (case-insensitive)
  const filtered = useMemo(() => {
    const statuses = ["CONFIRMED", "PROCESSING", "PENDING"]; // accept common variants (PENDING => treated as PROCESSING)
    return bookings.filter((b) =>
      b?.status && statuses.includes(b.status.toUpperCase())
    ).filter(b => !carFilter || b.carId === carFilter);
  }, [bookings, carFilter]);

  // Compute min/max dates across the displayed bookings (fallback to today)
  const { minDate, maxDate, days } = useMemo(() => {
    if (!filtered.length) {
      const today = startOfDay(new Date());
      return { minDate: today, maxDate: addDays(today, 14), days: 15 };
    }
    let min = startOfDay(new Date(filtered[0].startDate));
    let max = startOfDay(new Date(filtered[0].endDate));
    filtered.forEach((b) => {
      const s = startOfDay(new Date(b.startDate));
      const e = startOfDay(new Date(b.endDate));
      if (s < min) min = s;
      if (e > max) max = e;
    });
    // clamp range to a reasonable window around bookings (optional)
    const rawDays = daysBetween(min, max) + 1;
    const clampedDays = Math.min(Math.max(rawDays, 7), MAX_DAYS);
    // if clamped shorter than raw, expand max
    const adjMax = addDays(min, clampedDays - 1);
    return { minDate: min, maxDate: adjMax, days: clampedDays };
  }, [filtered]);

  const timelineWidth = days * DAY_WIDTH;

  // Compute each booking's left offset and width in px
  const rows = useMemo(() => {
    return filtered.map((b) => {
      const s = startOfDay(new Date(b.startDate));
      const e = startOfDay(new Date(b.endDate));
      let startIndex = Math.max(0, daysBetween(minDate, s));
      let durationDays = Math.max(1, daysBetween(s, e) + 1); // inclusive
      // clamp width if booking extends beyond maxDate
      if (startIndex + durationDays > days) {
        durationDays = Math.max(0, days - startIndex);
      }
      return {
        booking: b,
        left: startIndex * DAY_WIDTH,
        width: durationDays * DAY_WIDTH,
      };
    });
  }, [filtered, minDate, days]);

  return (
    <div className="w-full">
      <h2 className="text-2xl text-black w-full text-center mb-8">Booking Availability</h2>
      <div className="flex items-center justify-between mb-4">

        <div className="flex items-center justify-center w-full gap-3">
          <label className="text-sm text-black font-base">Filter car</label>
          <select
            value={carFilter}
            onChange={(e) => setCarFilter(e.target.value)}
            className="px-3 py-2 rounded-3xl border border-gray-300 focus:outline-none focus:border-black"
          >
            <option value="">All Cars</option>
            {cars.map((c) => (
              <option key={c.id} value={c.id}>
                {c.brand} {c.model}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border border-gray-200 rounded">
        <div className="flex">
          {/* LEFT: bookings list (fixed column) */}
          <div
            style={{ width: LEFT_COL_WIDTH }}
            className="flex-shrink-0 bg-white border-r border-gray-100"
          >
            <div className="p-3 border-b border-gray-100">
              <div className="text-xs text-gray-500">Bookings</div>
            </div>

            <div>
              {rows.length === 0 && (
                <div className="p-4 text-sm text-gray-500">No bookings to display.</div>
              )}

              {rows.map(({ booking }, idx) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-3 p-3 border-b border-gray-100"
                  style={{ height: ROW_HEIGHT }}
                >
                  <div className="w-12 h-8 bg-gray-50 rounded overflow-hidden flex-shrink-0">
                    {booking.car?.baseImage ? (
                      // keep simple img tag for client component
                      <img
                        src={booking.car.baseImage}
                        alt={`${booking.car?.brand} ${booking.car?.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-black truncate">
                      {booking.user?.name || "Guest"}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {booking.car?.brand} {booking.car?.model}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(booking.startDate).toLocaleDateString()} →{" "}
                      {new Date(booking.endDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: timeline area (scrollable horizontally) */}
          <div className="flex-1 overflow-auto">
            <div style={{ minWidth: timelineWidth }} className="relative">
              {/* DATE HEADERS */}
              <div className="sticky top-0 z-20 bg-white border-b border-gray-100">
                <div className="flex">
                  {/* spacer to align with left column */}
                  <div className="flex">
                    {Array.from({ length: days }).map((_, i) => {
                      const d = addDays(minDate, i);
                      return (
                        <div
                          key={i}
                          style={{ width: DAY_WIDTH }}
                          className="text-xs text-center border-l border-gray-100 p-2"
                        >
                          <div className="text-sm">{d.getDate()}</div>
                          <div className="text-xs text-gray-500">
                            {d.toLocaleDateString(undefined, { month: "short" })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ROWS (each row same height as left items) */}
              <div>
                {rows.map(({ booking, left, width }, rowIndex) => {
                  const status = (booking.status || "").toUpperCase();
                  const isConfirmed = status === "CONFIRMED";
                  const isProcessing = status === "PROCESSING" || status === "PENDING";

                  // If width is 0 (booking outside clamped range) hide it
                  if (width <= 0) return null;

                  return (
                    <div
                      key={booking.id}
                      style={{ height: ROW_HEIGHT }}
                      className="relative border-b border-gray-100"
                    >
                      {/* background grid */}
                      <div className="absolute inset-0 flex">
                        {Array.from({ length: days }).map((_, i) => (
                          <div
                            key={i}
                            style={{ width: DAY_WIDTH }}
                            className={`border-l border-gray-50`}
                          />
                        ))}
                      </div>

                      {/* booking bar */}
                      <div
                        title={`${booking.user?.name || "Booking"} — ${new Date(
                          booking.startDate
                        ).toLocaleDateString()} → ${new Date(
                          booking.endDate
                        ).toLocaleDateString()}`}
                        className={`absolute top-2.5 h-9 rounded flex items-center gap-2 px-3 text-sm text-white shadow-sm`}
                        style={{
                          left,
                          width: Math.max(width, DAY_WIDTH * 0.75), // ensure visible min-width
                          backgroundColor: isConfirmed ? "#16a34a" : "#9ca3af", // green or gray
                        }}
                      >
                        {/* thumbnail */}
                        <div className="w-7 h-7 rounded overflow-hidden bg-white/20 flex-shrink-0">
                          {booking.car?.baseImage ? (
                            <img
                              src={booking.car.baseImage}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-white/30" />
                          )}
                        </div>

                        <div className="truncate">
                          <div className="text-sm font-medium leading-4">
                            {booking.user?.name || "Guest"}
                          </div>
                          <div className="text-xs opacity-90">
                            {booking.car?.brand} {booking.car?.model}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* bottom padding so last row has space */}
              <div style={{ height: 8 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
