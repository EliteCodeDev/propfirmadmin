import {
  HomeIcon,
  UserGroupIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
export const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  {
    name: "User Challenges",
    href: "/dashboard/user-challenges",
    icon: UserGroupIcon,
  },
  {
    name: "Challenge Templates",
    href: "/dashboard/challenge-templates",
    icon: ChartBarIcon,
  },
];
