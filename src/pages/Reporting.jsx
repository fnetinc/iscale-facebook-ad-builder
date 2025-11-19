import React from 'react';
import { ArrowUpRight, ArrowDownRight, MousePointer, Eye, BarChart2 } from 'lucide-react';

const StatCard = ({ title, value, change, trend, icon: Icon }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-gray-50 rounded-lg text-gray-600">
                <Icon size={20} />
            </div>
            <span className={`flex items-center text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {change}
                {trend === 'up' ? <ArrowUpRight size={16} className="ml-1" /> : <ArrowDownRight size={16} className="ml-1" />}
            </span>
        </div>
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
);

const Reporting = () => {
    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Reporting</h1>
                <p className="text-gray-600 mt-2">Track the performance of your generated ads.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                    title="Total Impressions"
                    value="124.5K"
                    change="+12.3%"
                    trend="up"
                    icon={Eye}
                />
                <StatCard
                    title="Total Clicks"
                    value="3,842"
                    change="+5.4%"
                    trend="up"
                    icon={MousePointer}
                />
                <StatCard
                    title="Avg. CTR"
                    value="3.1%"
                    change="-0.2%"
                    trend="down"
                    icon={BarChart2}
                />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Performance Overview</h3>
                <div className="h-64 flex items-end justify-between gap-2">
                    {[65, 45, 75, 55, 85, 70, 90, 60, 80, 50, 70, 95].map((h, i) => (
                        <div key={i} className="w-full bg-blue-50 rounded-t-sm relative group">
                            <div
                                className="absolute bottom-0 w-full bg-blue-500 rounded-t-sm transition-all duration-500 group-hover:bg-blue-600"
                                style={{ height: `${h}%` }}
                            ></div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-4 text-sm text-gray-500">
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                    <span>May</span>
                    <span>Jun</span>
                    <span>Jul</span>
                    <span>Aug</span>
                    <span>Sep</span>
                    <span>Oct</span>
                    <span>Nov</span>
                    <span>Dec</span>
                </div>
            </div>
        </div>
    );
};

export default Reporting;
