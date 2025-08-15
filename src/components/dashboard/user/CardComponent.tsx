import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserIcon, PencilIcon } from "@heroicons/react/24/outline";

interface ContactCardProps {
  title?: string;
  icon?: React.ReactNode;
  fields?: Array<{
    label: string;
    value: string;
  }>;
}

export default function CardComponent({
  title = "Contact Information",
  icon = <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
  fields = [
    { label: "Email", value: "rehanadil900@gmail.com" },
    { label: "Phone", value: "+923035703023" },
    { label: "Name", value: "Arslan Ahmed" },
    { label: "Address", value: "None of your business" },
  ],
}: ContactCardProps) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {title}
          </CardTitle>
        </div>
        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
          <PencilIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </CardHeader>
      <CardContent className="space-y-3">
        {fields.map((field, index) => (
          <div key={index}>
            <span className="text-gray-600 dark:text-gray-400 font-medium">
              {field.label}:{" "}
            </span>
            <span className="text-gray-900 dark:text-gray-100">
              {field.value}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
