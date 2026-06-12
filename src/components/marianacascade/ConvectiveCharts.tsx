import React, { useEffect, useRef } from "react";
import * as echarts from "echarts";

interface ConvectiveChartsProps {
  cape: number;
  cin: number;
  windShear: number;
  alertLevel: string;
}

export const ConvectiveCharts: React.FC<ConvectiveChartsProps> = ({
  cape,
  cin,
  windShear,
  alertLevel,
}) => {
  const evolutionRef = useRef<HTMLDivElement>(null);
  const shearRef = useRef<HTMLDivElement>(null);

  // Generate 24-hour simulation data based on the current telemetry values
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);

  // Simulate CAPE rising during the day (peak at 16:00) and CIN breaking
  const capeData = Array.from({ length: 24 }, (_, i) => {
    const factor = Math.sin(((i - 8) / 16) * Math.PI); // peak around hour 16
    const base = Math.max(100, factor * cape);
    return Math.round(base + Math.random() * (cape * 0.05));
  });

  const cinData = Array.from({ length: 24 }, (_, i) => {
    // CIN decreases as surface heats up
    const base = i >= 12 && i <= 19 ? Math.max(0, cin - (i - 12) * 20) : cin;
    return Math.round(base + Math.random() * 5);
  });

  // 1. CAPE vs CIN Evolution Chart Option
  const getEvolutionOption = () => {
    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
      },
      legend: {
        data: ["CAPE (Energy)", "CIN (Inhibition)"],
        bottom: 0,
        textStyle: { fontFamily: "Inter, sans-serif", color: "#475569" },
      },
      grid: {
        left: "3%",
        right: "4%",
        top: "10%",
        bottom: "15%",
        containLabel: true,
      },
      xAxis: [
        {
          type: "category",
          data: hours,
          axisLine: { lineStyle: { color: "#e3e8f1" } },
          axisLabel: { color: "#475569", fontFamily: "Inter, sans-serif" },
        },
      ],
      yAxis: [
        {
          type: "value",
          name: "CAPE (J/kg)",
          position: "left",
          axisLine: { show: false },
          axisLabel: { color: "#ef4444", fontFamily: "Inter, sans-serif" },
          splitLine: { lineStyle: { color: "#f1f5f9" } },
        },
        {
          type: "value",
          name: "CIN (J/kg)",
          position: "right",
          axisLine: { show: false },
          axisLabel: { color: "#3b7ff0", fontFamily: "Inter, sans-serif" },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: "CAPE (Energy)",
          type: "line",
          smooth: true,
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(239, 68, 68, 0.2)" },
                { offset: 1, color: "rgba(239, 68, 68, 0.0)" },
              ],
            },
          },
          itemStyle: { color: "#ef4444" },
          lineStyle: { width: 3 },
          data: capeData,
        },
        {
          name: "CIN (Inhibition)",
          type: "line",
          yAxisIndex: 1,
          smooth: true,
          itemStyle: { color: "#3b7ff0" },
          lineStyle: { width: 2, type: "dashed" },
          data: cinData,
        },
      ],
    };
  };

  // 2. Wind Shear Profile Chart Option (0-1km, 0-3km, 0-6km)
  const getShearOption = () => {
    const shear0_1 = Math.round(windShear * 0.4);
    const shear0_3 = Math.round(windShear * 0.7);
    const shear0_6 = Math.round(windShear);

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
      },
      grid: {
        left: "3%",
        right: "4%",
        top: "10%",
        bottom: "10%",
        containLabel: true,
      },
      xAxis: {
        type: "value",
        name: "Shear (m/s)",
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "#f1f5f9" } },
      },
      yAxis: {
        type: "category",
        data: ["0-1 km (Low Level)", "0-3 km (Mid Level)", "0-6 km (Deep Layer)"],
        axisLine: { lineStyle: { color: "#e3e8f1" } },
        axisLabel: { color: "#475569", fontFamily: "Inter, sans-serif" },
      },
      series: [
        {
          name: "Wind Shear",
          type: "bar",
          barWidth: "40%",
          label: {
            show: true,
            position: "right",
            formatter: "{c} m/s",
            fontFamily: "Inter, sans-serif",
            fontWeight: "bold",
          },
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: "#3b7ff0" },
                { offset: 1, color: windShear > 20 ? "#ef4444" : "#f59e0b" },
              ],
            },
            borderRadius: [0, 8, 8, 0],
          },
          data: [shear0_1, shear0_3, shear0_6],
        },
      ],
    };
  };

  useEffect(() => {
    if (!evolutionRef.current) return;
    const chart = echarts.init(evolutionRef.current);
    chart.setOption(getEvolutionOption());

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [cape, cin]);

  useEffect(() => {
    if (!shearRef.current) return;
    const chart = echarts.init(shearRef.current);
    chart.setOption(getShearOption());

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [windShear]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart 1: CAPE/CIN Trend */}
      <div className="border border-[#e3e8f1] bg-white rounded-3xl p-6 shadow-md">
        <div className="mb-4">
          <h4 className="text-xs font-bold text-[#0f1a2c] uppercase tracking-wider font-sans">
            CAPE vs. CIN 24H Forecast Trend
          </h4>
          <p className="text-[10px] text-slate-450 uppercase tracking-widest mt-0.5 font-sans">
            Instability energy vs convective inhibition cap
          </p>
        </div>
        <div className="h-64">
          <div ref={evolutionRef} className="h-full w-full" />
        </div>
      </div>

      {/* Chart 2: Vertical Wind Shear Profile */}
      <div className="border border-[#e3e8f1] bg-white rounded-3xl p-6 shadow-md">
        <div className="mb-4">
          <h4 className="text-xs font-bold text-[#0f1a2c] uppercase tracking-wider font-sans">
            Vertical Wind Shear Profile
          </h4>
          <p className="text-[10px] text-slate-450 uppercase tracking-widest mt-0.5 font-sans">
            Wind speed & direction change by altitude (0-6km)
          </p>
        </div>
        <div className="h-64">
          <div ref={shearRef} className="h-full w-full" />
        </div>
      </div>
    </div>
  );
};
