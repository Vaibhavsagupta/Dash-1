"use client";
import React, { useState } from 'react';
import { Bar, Line, Radar, PolarArea } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    RadialLinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { BarChart3, LineChart, PieChart, Activity } from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    RadialLinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface DynamicChartProps {
    data: any;
    title?: string;
    subtitle?: string;
    defaultType?: 'bar' | 'line' | 'radar' | 'polar';
    height?: number;
}

export default function DynamicChart({
    data,
    title,
    subtitle,
    defaultType = 'bar',
    height = 280
}: DynamicChartProps) {
    const [chartType, setChartType] = useState<'bar' | 'line' | 'radar' | 'polar'>(defaultType);

    const renderChart = () => {
        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom' as const,
                    labels: { color: '#334155', font: { size: 11, weight: 600 } }
                }
            }
        };

        switch (chartType) {
            case 'line':
                return <Line data={data} options={commonOptions} />;
            case 'radar':
                return <Radar data={data} options={commonOptions} />;
            case 'polar':
                return <PolarArea data={data} options={commonOptions} />;
            case 'bar':
            default:
                return <Bar data={data} options={commonOptions} />;
        }
    };

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    {title && <h3 className="text-lg font-bold text-slate-900">{title}</h3>}
                    {subtitle && <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>}
                </div>

                {/* Graph Type Selection Control */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
                    <button
                        onClick={() => setChartType('bar')}
                        className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${chartType === 'bar' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                        title="Bar Chart"
                    >
                        <BarChart3 size={14} />
                        <span className="hidden md:inline">Bar</span>
                    </button>
                    <button
                        onClick={() => setChartType('line')}
                        className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${chartType === 'line' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                        title="Line Chart"
                    >
                        <LineChart size={14} />
                        <span className="hidden md:inline">Line</span>
                    </button>
                    <button
                        onClick={() => setChartType('radar')}
                        className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${chartType === 'radar' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                        title="Radar Chart"
                    >
                        <Activity size={14} />
                        <span className="hidden md:inline">Radar</span>
                    </button>
                    <button
                        onClick={() => setChartType('polar')}
                        className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${chartType === 'polar' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                        title="Polar Area Chart"
                    >
                        <PieChart size={14} />
                        <span className="hidden md:inline">Polar</span>
                    </button>
                </div>
            </div>

            <div style={{ height: `${height}px` }}>
                {renderChart()}
            </div>
        </div>
    );
}
