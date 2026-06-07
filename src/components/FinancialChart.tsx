import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");

interface Props {
  data: Array<{
    name: string;
    Pemasukan: number;
    Pengeluaran: number;
    "Keuntungan Bersih": number;
  }>;
}

export default function FinancialChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorPemasukan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorPengeluaran" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorKeuntungan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
        <XAxis dataKey="name" className="text-[10px] fill-muted-foreground" />
        <YAxis 
          className="text-[10px] fill-muted-foreground"
          tickFormatter={(val) => `Rp ${val / 1000000}M`}
        />
        <Tooltip
          formatter={(value: number) => [rupiah(value), ""]}
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            borderColor: "hsl(var(--border))",
            borderRadius: "12px",
            fontSize: "12px"
          }}
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "15px" }} />
        <Area 
          type="monotone" 
          dataKey="Pemasukan" 
          stroke="#10b981" 
          fillOpacity={1} 
          fill="url(#colorPemasukan)" 
          strokeWidth={2}
        />
        <Area 
          type="monotone" 
          dataKey="Pengeluaran" 
          stroke="#ef4444" 
          fillOpacity={1} 
          fill="url(#colorPengeluaran)" 
          strokeWidth={2}
        />
        <Area 
          type="monotone" 
          dataKey="Keuntungan Bersih" 
          stroke="#3b82f6" 
          fillOpacity={1} 
          fill="url(#colorKeuntungan)" 
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
