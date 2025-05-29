import React from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { PriceTrendData } from '@/lib/analyticsApi';

interface PriceTrendChartProps {
  data: PriceTrendData[];
  showNormalizedPrice?: boolean;
  height?: number;
}

export const PriceTrendChart: React.FC<PriceTrendChartProps> = ({
  data,
  showNormalizedPrice = true,
  height = 300
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he', { month: 'short', day: 'numeric' });
  };

  const formatPrice = (value: number) => `₪${value.toFixed(2)}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tickFormatter={formatDate}
          axisLine={false}
          tickLine={false}
        />
        <YAxis 
          tickFormatter={formatPrice}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip 
          formatter={(value: number, name: string) => [
            formatPrice(value), 
            name === 'normalized_price' ? 'מחיר מנורמל (100 גרם)' : 'מחיר ממוצע'
          ]}
          labelFormatter={formatDate}
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
          }}
        />
        
        {showNormalizedPrice && (
          <Area 
            type="monotone" 
            dataKey="normalized_price" 
            stroke="#3B82F6" 
            fill="#3B82F6" 
            fillOpacity={0.1}
            strokeWidth={3}
            name="מחיר מנורמל"
          />
        )}
        
        <Area 
          type="monotone" 
          dataKey="average_price" 
          stroke="#10B981" 
          fill="none"
          strokeWidth={2}
          strokeDasharray="5 5"
          name="מחיר ממוצע"
        />
        
        <Line 
          type="monotone" 
          dataKey="min_price" 
          stroke="#22C55E" 
          strokeWidth={1}
          dot={false}
          name="מחיר מינימום"
        />
        
        <Line 
          type="monotone" 
          dataKey="max_price" 
          stroke="#EF4444" 
          strokeWidth={1}
          dot={false}
          name="מחיר מקסימום"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};