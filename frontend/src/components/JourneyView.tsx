import React from "react";
import { MapPin, Footprints, Bus } from "lucide-react";

interface JourneyViewProps {
  journey: {
    totalDuration: number | string;
    totalDistance: string;
    segments: {
      type: string;
      title: string;
      distance?: string;
      duration?: string;
      boardAt?: string;
      getOffAt?: string;
    }[];
  };
  onClose: () => void;
}

export const JourneyView: React.FC<JourneyViewProps> = ({ journey, onClose }) => {
  if (!journey) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-white shadow-xl border-t border-gray-200 rounded-t-2xl z-50">
      <div className="bg-[#CC0000] text-white px-4 py-3 flex justify-between items-center rounded-t-2xl">
        <h2 className="font-semibold">Your Journey</h2>
        <button onClick={onClose} className="text-white text-lg font-bold">
          ×
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="text-center text-gray-600 mb-2">
          🕒 {journey.totalDuration} min · {journey.totalDistance} km total
        </div>

        {journey.segments.map((segment, idx) => (
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
                <span className="font-medium">{segment.title}</span>
              </div>
              <span className="text-sm text-gray-500">
                {segment.duration || "—"} • {segment.distance || ""}
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
        ))}
      </div>
    </div>
  );
};
