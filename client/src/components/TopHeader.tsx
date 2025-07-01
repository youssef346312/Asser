import { useAuth } from "@/hooks/useAuth";
import { Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TopHeader() {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
            <span className="text-lg">
              {user?.avatar || "🌵"}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-800">{user?.fullName}</p>
            <p className="text-xs text-gray-500 font-inter">ID: {user?.userId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="p-2">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" className="p-2">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}