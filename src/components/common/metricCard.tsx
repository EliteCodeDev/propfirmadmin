import { CardContent, Card } from "../ui/card";

import type { MetricCardProps } from "@/types";

export default function MetricCard({color, label, icon, value}: MetricCardProps) {
  return (
    <Card className={`bg-gradient-to-br from-${color}-50 to-${color}-100 dark:from-${color}-900/20 dark:to-${color}-800/20 border-${color}-200 dark:border-${color}-800 text-${color}-600 dark:text-${color}-400 text-${color}-700 dark:text-${color}-300 text-${color}-500 dark:text-${color}-400`}>
      <CardContent className="p-6 flex justify-between items-center">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className="opacity-50">{icon}</div>
      </CardContent>
    </Card>
  );

}