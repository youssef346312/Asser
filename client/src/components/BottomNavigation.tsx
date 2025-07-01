
import { Home, User, BarChart3, Users, Shield, MessageSquare } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface BottomNavigationProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export default function BottomNavigation({ currentPage, setCurrentPage }: BottomNavigationProps) {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();

  const baseNavigation = [
    { id: "home", label: "الرئيسية", icon: Home, path: "/" },
    { id: "telegram-games", label: "تليجرام", icon: MessageSquare, path: "/telegram-games" },
    { id: "transactions", label: "المعاملات", icon: BarChart3, path: "/transactions" },
    { id: "team", label: "الفريق", icon: Users, path: "/team" },
    { id: "profile", label: "الملف الشخصي", icon: User, path: "/profile" },
  ];

  // Add admin navigation if user is admin
  const navigation = user?.isAdmin 
    ? [
        ...baseNavigation.slice(0, 3), // Home, Telegram Games, Transactions
        { id: "admin-panel", label: "إدارة", icon: Shield, path: "/admin-panel" },
        baseNavigation[4] // Profile
      ]
    : baseNavigation;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb z-50">
      <div className="grid grid-cols-5 h-16">
        {navigation.map((item) => {
          const isActive = currentPage === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => {
                setCurrentPage(item.id);
                setLocation(item.path);
              }}
              className={`
                flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors
                ${isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-gray-600 hover:text-primary"
                }
              `}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
