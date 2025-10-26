import React from "react";
import { Footprints, Bus } from "lucide-react";

interface JourneyViewProps {
  journey: {
    totalDuration: number | string;
    totalDistance: string; // keep as km
    destinationName?: string;
    segments: {
      type: string;
      title: string;
      distance?: string; // km for bus, plain for walk
      duration?: string;
      boardAt?: string;
      getOffAt?: string;
    }[];
  };
  onClose: () => void;
}

// 🔹 helper: convert only for bus segments
const convertKmToMi = (kmString?: string) => {
  if (!kmString) return "";
  const km = parseFloat(kmString);
  if (isNaN(km)) return kmString;
  const miles = km * 0.621371;
  return `${miles.toFixed(2)} mi`;
};

export const JourneyView: React.FC<JourneyViewProps> = ({ journey, onClose }) => {
  if (!journey) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-white shadow-xl border-t border-gray-200 rounded-t-2xl z-50">
      {/* Header */}
      <div className="bg-[#CC0000] text-white px-4 py-3 flex justify-between items-center rounded-t-2xl">
        <h2 className="font-semibold">
          {journey.destinationName
            ? `Your Journey to ${journey.destinationName}`
            : "Your Journey"}
        </h2>
        <button onClick={onClose} className="text-white text-lg font-bold">
          ×
        </button>
      </div>

      {/* Summary */}
      <div className="p-4 space-y-4">
        <div className="text-center text-gray-600 mb-2">
          🕒 {journey.totalDuration} min · {journey.totalDistance} mi
        </div>

        {/* Segments */}
        {journey.segments.map((segment, idx) => {
          let segmentTitle = segment.title;

          // 🧠 Replace "Walk to Stop" with next bus stop name
          if (
            segment.type === "walk" &&
            segment.title.toLowerCase().includes("stop")
          ) {
            const nextSegment = journey.segments[idx + 1];
            if (nextSegment?.boardAt) {
              segmentTitle = `Walk to ${nextSegment.boardAt}`;
            }
          }

          // 🧠 Replace "Walk to Destination" with actual place name
          if (
            segment.type === "walk" &&
            segment.title.toLowerCase().includes("destination")
          ) {
            segmentTitle = journey.destinationName
              ? `Walk to ${journey.destinationName}`
              : "Walk to Destination";
          }

          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border ${
                segment.type === "walk"
                  ? "border-gray-300 bg-gray-50"
                  : "border-blue-400 bg-blue-50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {segment.type === "walk" ? (
                    <Footprints className="w-5 h-5 text-gray-700" />
                  ) : (
                    <Bus className="w-5 h-5 text-blue-700" />
                  )}
                  <span className="font-medium">{segmentTitle}</span>
                </div>
                <span className="text-sm text-gray-500">
                  {segment.duration || "—"} •{" "}
                  {segment.type === "bus"
                    ? convertKmToMi(segment.distance) // ✅ bus only in miles
                    : segment.distance || ""}
                </span>
              </div>

              {segment.boardAt && (
                <p className="text-sm text-gray-700">
                  🚏 Board at: <strong>{segment.boardAt}</strong>
                </p>
              )}
              {segment.getOffAt && (
                <p className="text-sm text-gray-700">
                  ⛳ Get off at: <strong>{segment.getOffAt}</strong>
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
