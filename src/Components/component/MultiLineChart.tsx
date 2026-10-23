import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface LineConfig {
  key: string;
  name: string;
  color: string;
}

interface ChartData {
  year?: number;
  month_data: any[]; // Or define a more specific type if known
}

interface MultiLineChartProps {
  data: ChartData;
  lineConfigs?: LineConfig[];
  value?: number;
  onChange?: (year: number) => void;
}

const MultiLineChart: React.FC<MultiLineChartProps> = ({ data, lineConfigs = [] }) => {
  const [isMobile, setIsMobile] = useState(false);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-gray-700 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              <span className="font-medium">{entry.name}:</span> {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Removed translateMonths as utils/date-format was not found. Using raw month data.
  const months = data?.month_data || [];

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800"></h2>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={months}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              className="text-xs"
              interval={isMobile ? 1 : 0}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#666666" }}
              domain={[0, 'auto']} // Adjusted domain for flexibility
              // ticks removed to auto-scale or keep if specific range needed: ticks={[0, 25, 50, 75, 100]}
            />

            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {lineConfigs.map((line) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.name}
                stroke={line.color}
                strokeWidth={2}
                dot={{ fill: line.color, strokeWidth: 0, r: 3 }}
                activeDot={{
                  r: 5,
                  stroke: line.color,
                  strokeWidth: 2,
                  fill: "#fff",
                }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MultiLineChart;
