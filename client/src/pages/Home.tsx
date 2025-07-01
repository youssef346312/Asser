import NewFarmGame from "@/components/games/NewFarmGame";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Calendar, Users, Gift } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const { getAuthHeaders } = useAuth();
  const [activeGame, setActiveGame] = useState("farm");

  

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      {/* Game Navigation */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-green-500 to-blue-600 text-white">
          <CardTitle className="flex items-center gap-2">
            🎮 اختر لعبتك
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Game Navigation Tabs */}
          <div className="grid grid-cols-2 gap-4 mb-6">
              <Button
                variant={activeGame === "farm" ? "default" : "outline"}
                onClick={() => setActiveGame("farm")}
                className="h-20 flex flex-col gap-2"
              >
                <div className="text-3xl">🌾</div>
                <span>المزرعة</span>
              </Button>
              <Button
                variant={activeGame === "competitions" ? "default" : "outline"}
                onClick={() => setActiveGame("competitions")}
                className="h-20 flex flex-col gap-2"
                disabled
              >
                <div className="text-3xl">🏆</div>
                <span>قادم قريباً</span>
              </Button>
            </div>

          {/* Game Rendering */}
            {activeGame === "farm" && <NewFarmGame />}
        </CardContent>
      </Card>

      {/* Competitions Section */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            المسابقات والجوائز
            <Badge variant="secondary" className="bg-white/20 text-white">
              جديد
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Daily Competition */}
            <div className="relative bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200 overflow-hidden">
              <div className="absolute top-2 right-2">
                <Calendar className="h-5 w-5 text-purple-500" />
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">🏆</div>
                <h3 className="font-bold text-purple-800 mb-2">مسابقة يومية</h3>
                <p className="text-sm text-purple-600 mb-4">
                  اربح جوائز يومية من خلال المشاركة في التحديات
                </p>
                <Button 
                  disabled 
                  className="w-full bg-purple-100 text-purple-500 cursor-not-allowed hover:bg-purple-100"
                >
                  قادم قريباً
                </Button>
              </div>
            </div>

            {/* Weekly Challenge */}
            <div className="relative bg-gradient-to-br from-green-50 to-teal-50 rounded-lg p-6 border border-green-200 overflow-hidden">
              <div className="absolute top-2 right-2">
                <Users className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">🎯</div>
                <h3 className="font-bold text-green-800 mb-2">تحدي أسبوعي</h3>
                <p className="text-sm text-green-600 mb-4">
                  تنافس مع الآخرين واربح جوائز أسبوعية مميزة
                </p>
                <Button 
                  disabled 
                  className="w-full bg-green-100 text-green-500 cursor-not-allowed hover:bg-green-100"
                >
                  قادم قريباً
                </Button>
              </div>
            </div>

            {/* Monthly Prize */}
            <div className="relative bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-6 border border-orange-200 overflow-hidden">
              <div className="absolute top-2 right-2">
                <Gift className="h-5 w-5 text-orange-500" />
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">💰</div>
                <h3 className="font-bold text-orange-800 mb-2">جائزة شهرية</h3>
                <p className="text-sm text-orange-600 mb-4">
                  جوائز شهرية كبيرة للأعضاء الأكثر نشاطاً
                </p>
                <Button 
                  disabled 
                  className="w-full bg-orange-100 text-orange-500 cursor-not-allowed hover:bg-orange-100"
                >
                  قادم قريباً
                </Button>
              </div>
            </div>

            {/* Special Event */}
            <div className="relative bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-6 border border-pink-200 overflow-hidden">
              <div className="absolute top-2 right-2">
                <Trophy className="h-5 w-5 text-pink-500" />
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">🎉</div>
                <h3 className="font-bold text-pink-800 mb-2">فعاليات خاصة</h3>
                <p className="text-sm text-pink-600 mb-4">
                  فعاليات موسمية وجوائز استثنائية
                </p>
                <Button 
                  disabled 
                  className="w-full bg-pink-100 text-pink-500 cursor-not-allowed hover:bg-pink-100"
                >
                  قادم قريباً
                </Button>
              </div>
            </div>
          </div>

          {/* Coming Soon Notice */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="text-center">
              <div className="text-2xl mb-2">🚀</div>
              <h4 className="font-bold text-blue-800 mb-2">المسابقات قادمة قريباً!</h4>
              <p className="text-sm text-blue-600">
                نحن نعمل على إعداد نظام مسابقات مثير ومليء بالجوائز. 
                ابق معنا للحصول على فرصة ربح جوائز مذهلة!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Games */}
      <Card className="asser-card">
        <CardHeader>
          <CardTitle>الألعاب النشطة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            <p>لا توجد ألعاب نشطة حالياً</p>
            <p className="text-sm">ابدأ لعبة جديدة للحصول على المكافآت</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}