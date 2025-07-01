
import React, { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ShoppingCart, Coins, TrendingUp, Droplets } from "lucide-react";

interface PlantedItem {
  id: string;
  type: string;
  size: string;
  plantedAt: Date;
  dailyProduction: number;
  position: { x: number; y: number };
  lastWatered?: Date;
  needsWater: boolean;
}

const CactusIcon = ({ size, needsWater }: { size: string; needsWater: boolean }) => {
  const getEmoji = () => {
    switch (size) {
      case "small": return "🌱";
      case "medium": return "🌿";
      case "large": return "🌳";
      default: return "🌱";
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case "small": return "text-5xl";
      case "medium": return "text-6xl";
      case "large": return "text-7xl";
      default: return "text-5xl";
    }
  };

  return (
    <div className={`${getSizeClass()} transition-all duration-500 hover:scale-110 ${needsWater ? 'opacity-60 grayscale' : 'brightness-110 drop-shadow-lg'}`}>
      {getEmoji()}
    </div>
  );
};

export default function NewFarmGame() {
  const { getAuthHeaders } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showShop, setShowShop] = useState(false);
  

  // جلب حالة المزرعة مع معالجة أفضل للأخطاء
  const { data: farmState, isLoading: farmLoading, error: farmError } = useQuery({
    queryKey: ["/api/farm/state"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/farm/state", {
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          throw new Error(`فشل في تحميل المزرعة: ${response.status}`);
        }
        const data = await response.json();
        return data || {}; // Return empty object if data is null
      } catch (error) {
        console.error("Farm state fetch error:", error);
        throw error;
      }
    },
    retry: (failureCount, error) => {
      // Only retry on network errors, not authentication errors
      if (error.message?.includes('401') || error.message?.includes('403')) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchInterval: 10000, // Reduced frequency to avoid overloading
    staleTime: 5000,
    gcTime: 30000, // Use gcTime instead of deprecated cacheTime
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  // جلب الرصيد مع معالجة أفضل للأخطاء
  const { data: userBalance, isLoading: balanceLoading, error: balanceError } = useQuery({
    queryKey: ["/api/user/balance"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/user/balance", {
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Balance fetch error:", error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000,
    staleTime: 2000,
    cacheTime: 10000,
  });

  // زراعة الصبار مع معالجة محسنة للأخطاء
  const plantCactusMutation = useMutation({
    mutationFn: async ({ size }: { size: string }) => {
      try {
        const response = await fetch("/api/farm/plant-cactus", {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ size }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}: فشل في زراعة الصبار`);
        }

        return response.json();
      } catch (error) {
        console.error("Plant cactus error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // تحديث البيانات فورياً
      queryClient.invalidateQueries({ queryKey: ["/api/farm/state"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
      setShowShop(false);
      toast({
        title: "نجح الزرع! 🌱",
        description: "تم زراعة الصبار بنجاح",
      });
    },
    onError: (error: any) => {
      console.error("Plant cactus mutation error:", error);
      toast({
        title: "فشل الزرع ❌",
        description: error.message || "حدث خطأ أثناء الزراعة",
        variant: "destructive",
      });
    },
  });

  // ري النباتات
  const waterPlantsMutation = useMutation({
    mutationFn: async () => {
      try {
        const response = await fetch("/api/farm/water-plants", {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}: فشل في ري النباتات`);
        }

        return response.json();
      } catch (error) {
        console.error("Water plants error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/farm/state"] });
      toast({
        title: "تم ري النباتات بنجاح! 💧",
        description: `تم ري ${data.plantsWatered || displayPlants.length} نبات`,
      });
    },
    onError: (error: any) => {
      console.error("Water plants mutation error:", error);
      toast({
        title: "فشل الري ❌",
        description: error.message || "حدث خطأ أثناء ري النباتات",
        variant: "destructive",
      });
    },
  });

  

  // معالجة النباتات المزروعة بطريقة آمنة
  const displayPlants = React.useMemo(() => {
    if (!farmState?.plantedItems) return [];

    const items = Array.isArray(farmState.plantedItems) ? farmState.plantedItems : [];

    return items.map((plant: any, index: number) => {
      try {
        const timeSinceWatered = plant?.lastWatered 
          ? Date.now() - new Date(plant.lastWatered).getTime() 
          : plant?.plantedAt 
            ? Date.now() - new Date(plant.plantedAt).getTime()
            : 0;

        // حساب الموقع في شبكة منتظمة 3x2
        const gridCols = 3;
        const col = index % gridCols;
        const row = Math.floor(index / gridCols);

        return {
          id: plant?.id?.toString() || `plant-${index}`,
          type: plant?.type || "cactus",
          size: plant?.size || "small",
          plantedAt: plant?.plantedAt ? new Date(plant.plantedAt) : new Date(),
          dailyProduction: Number(plant?.dailyProduction) || 0,
          position: { 
            x: 15 + (col * 28), // توزيع أفقي في الأسفل
            y: 65 + (row * 20)  // نقل النباتات للأسفل
          },
          lastWatered: plant?.lastWatered ? new Date(plant.lastWatered) : undefined,
          needsWater: timeSinceWatered > 300000 // 5 دقائق للتجربة
        };
      } catch (error) {
        console.error("Error processing plant:", plant, error);
        return null;
      }
    }).filter(Boolean);
  }, [farmState?.plantedItems]);

  const totalDailyProduction = parseFloat(farmState?.dailyProduction || "0");
  const totalEarnings = parseFloat(farmState?.totalEarnings || "0");
  const currentBalance = parseFloat(userBalance?.asserCoin || "0");

  // عرض شاشة التحميل
  if (farmLoading || balanceLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <ShoppingCart className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-muted-foreground">جاري تحميل المزرعة...</p>
        </div>
      </div>
    );
  }

  // عرض رسالة الخطأ
  if (farmError || balanceError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-red-800 mb-2">خطأ في تحميل البيانات</h3>
          <p className="text-red-600 mb-4">حدث خطأ أثناء تحميل المزرعة أو الرصيد</p>
          <Button 
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/farm/state"] });
              queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
            }}
            className="bg-red-600 hover:bg-red-700"
          >
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* إحصائيات الإنتاج - تصميم محسن */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-2xl p-4 text-white shadow-xl">
          <div className="text-center">
            <div className="text-2xl mb-2">💳</div>
            <div className="text-sm font-bold">{currentBalance.toFixed(2)}</div>
            <div className="text-xs opacity-90">الرصيد الحالي</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-2xl p-4 text-white shadow-xl">
          <div className="text-center">
            <div className="text-2xl mb-2">📈</div>
            <div className="text-sm font-bold">{totalDailyProduction.toFixed(3)}</div>
            <div className="text-xs opacity-90">الإنتاج اليومي</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 via-green-600 to-green-700 rounded-2xl p-4 text-white shadow-xl">
          <div className="text-center">
            <div className="text-2xl mb-2">💰</div>
            <div className="text-sm font-bold">{totalEarnings.toFixed(2)}</div>
            <div className="text-xs opacity-90">الإنتاج الإجمالي</div>
          </div>
        </div>
      </div>

      {/* مشهد المزرعة الجديد المحسن */}
      <div className="relative w-full h-[450px] rounded-3xl overflow-hidden shadow-2xl border-4 border-green-300/50">
        {/* خلفية متدرجة محسنة بألوان زاهية */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 30% 20%, rgba(255, 223, 0, 0.4) 0%, transparent 50%),
              linear-gradient(180deg, 
                #87CEEB 0%,     /* سماء زرقاء جميلة */
                #98D8E8 20%,    /* سماء زرقاء فاتحة */
                #7CB342 40%,    /* أخضر طبيعي زاهي */
                #8BC34A 60%,    /* أخضر فاتح زاهي */
                #689F38 80%,    /* أخضر متوسط */
                #558B2F 100%    /* أخضر داكن طبيعي */
              )
            `
          }}
        >
          {/* تأثيرات السماء المحسنة */}
          <div className="absolute top-6 right-8 text-6xl animate-pulse drop-shadow-lg">☀️</div>
          <div className="absolute top-4 left-16 text-4xl opacity-80 animate-bounce drop-shadow-md" style={{animationDelay: '1s'}}>☁️</div>
          <div className="absolute top-8 right-32 text-3xl opacity-70 animate-bounce drop-shadow-md" style={{animationDelay: '2s'}}>☁️</div>
          <div className="absolute top-12 left-1/2 text-2xl opacity-60 animate-bounce drop-shadow-md" style={{animationDelay: '3s'}}>☁️</div>

          {/* طيور وعناصر طبيعية */}
          <div className="absolute top-16 left-1/4 text-lg opacity-60 animate-bounce" style={{animationDelay: '4s'}}>🕊️</div>
          <div className="absolute top-20 right-1/3 text-lg opacity-50 animate-bounce" style={{animationDelay: '5s'}}>🦅</div>
          
          {/* عناصر طبيعية إضافية */}
          <div className="absolute bottom-20 left-8 text-2xl opacity-40">🌸</div>
          <div className="absolute bottom-24 right-12 text-2xl opacity-40">🌺</div>
          <div className="absolute bottom-16 left-1/3 text-xl opacity-30">🦋</div>
        </div>

        {/* أرضية المزرعة بدون خطوط */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-green-800/30 to-transparent"></div>

        {/* النباتات المزروعة مع تحسينات بصرية */}
        {displayPlants.map((item: any) => (
          <div
            key={item.id}
            className="absolute transition-all duration-700 hover:scale-125 cursor-pointer z-20"
            style={{
              left: `${item.position.x}%`,
              top: `${item.position.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="relative">
              {/* تأثير الهالة حول النبات */}
              <div className={`absolute inset-0 rounded-full blur-lg scale-150 animate-pulse ${
                item.needsWater 
                  ? 'bg-orange-400/30' 
                  : 'bg-green-400/30'
              }`}></div>
              
              <CactusIcon size={item.size} needsWater={item.needsWater} />
              
              {/* قطرة الماء مع تحسينات */}
              {item.needsWater && (
                <div className="absolute -top-3 -right-3 text-3xl animate-bounce drop-shadow-lg">
                  💧
                </div>
              )}
              
              {/* بطاقة الإنتاج المحسنة */}
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                <div className={`text-white text-xs px-3 py-1.5 rounded-full shadow-lg border backdrop-blur-sm ${
                  item.needsWater 
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 border-orange-400' 
                    : 'bg-gradient-to-r from-emerald-500 to-green-600 border-green-400'
                }`}>
                  <span className="font-bold">+{item.dailyProduction.toFixed(3)}</span>
                  <span className="opacity-90">/يوم</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* رسالة المزرعة الفارغة المحسنة */}
        {displayPlants.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl max-w-sm mx-4 border border-green-200">
              <div className="text-8xl mb-6 animate-bounce drop-shadow-lg">🌱</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                مزرعة الصبار
              </h3>
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                ابدأ رحلتك في الزراعة واحصل على عوائد يومية مضمونة!
              </p>
              <Button
                onClick={() => setShowShop(true)}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 rounded-full text-lg font-bold shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                🛒 ابدأ الزراعة الآن
              </Button>
            </div>
          </div>
        )}

        {/* أزرار التحكم المحسنة */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-30">
          {!showShop && (
            <>
              <Button
                onClick={() => setShowShop(true)}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-xl px-4 py-2 rounded-full font-bold transform hover:scale-105 transition-all duration-300"
                size="sm"
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                متجر الصبار
              </Button>

              {displayPlants.length > 0 && (
                <Button
                  onClick={() => waterPlantsMutation.mutate()}
                  disabled={waterPlantsMutation.isPending}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-xl px-4 py-2 rounded-full font-bold transform hover:scale-105 transition-all duration-300 disabled:opacity-50"
                  size="sm"
                >
                  <Droplets className="h-4 w-4 mr-1" />
                  {waterPlantsMutation.isPending ? 'جاري الري...' : 'ري النباتات'}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      

      {/* متجر الصبار المحسن */}
      {showShop && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-green-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-gradient-to-r from-green-100 to-green-200 rounded-2xl flex items-center justify-center">
                    <ShoppingCart className="h-7 w-7 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                      متجر الصبار
                    </h3>
                    <p className="text-green-600 font-medium">اختر حجم الصبار المناسب</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setShowShop(false)}
                  className="text-green-600 hover:text-green-800 hover:bg-green-100 w-10 h-10 rounded-full"
                  size="sm"
                >
                  ✕
                </Button>
              </div>

              <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                <p className="text-center text-green-800 font-bold">
                  💰 رصيدك الحالي: {currentBalance.toFixed(3)} AC
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { size: 'small', name: 'صبار صغير', price: 4, production: 0.146, emoji: '🌱', gradient: 'from-green-400 to-green-500' },
                  { size: 'medium', name: 'صبار متوسط', price: 6, production: 0.22, emoji: '🌿', gradient: 'from-blue-400 to-blue-500' },
                  { size: 'large', name: 'صبار كبير', price: 10, production: 0.336, emoji: '🌳', gradient: 'from-purple-400 to-purple-500' }
                ].map((cactus) => (
                  <div key={cactus.size} className="p-5 bg-white rounded-2xl border-2 border-gray-200 hover:border-green-300 transition-all duration-300 shadow-lg hover:shadow-xl">
                    <div className="flex items-center gap-4">
                      <div className="text-7xl drop-shadow-lg">
                        {cactus.emoji}
                      </div>
                      <div className="flex-1">
                        <h5 className="text-xl font-bold text-gray-800 mb-2">
                          {cactus.name}
                        </h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">السعر:</span>
                            <span className="font-bold text-green-600">{cactus.price} AC</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">الإنتاج اليومي:</span>
                            <span className="font-bold text-blue-600">{cactus.production.toFixed(3)} AC</span>
                          </div>
                          <div className="text-xs text-gray-500 text-center mt-2 p-2 bg-gray-50 rounded-lg">
                            ⏰ حصاد تلقائي كل 24 ساعة
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Button
                          onClick={() => plantCactusMutation.mutate({ size: cactus.size })}
                          disabled={
                            plantCactusMutation.isPending || 
                            displayPlants.length >= 6 ||
                            currentBalance < cactus.price
                          }
                          className={`bg-gradient-to-r ${cactus.gradient} hover:scale-105 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg`}
                        >
                          {plantCactusMutation.isPending ? 'جاري الزراعة...' : `شراء بـ ${cactus.price} AC`}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {displayPlants.length >= 6 && (
                <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-orange-200 rounded-xl">
                  <p className="text-orange-800 text-center font-bold">
                    🌾 وصلت للحد الأقصى من النباتات (6 نباتات)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* مؤقت الحصاد القادم */}
      {farmState?.nextHarvestTime && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-green-600" />
                <span className="font-bold text-gray-800">الحصاد القادم</span>
              </div>
              <div className="text-green-600 font-bold">
                {new Date(farmState.nextHarvestTime) > new Date() 
                  ? `${Math.ceil((new Date(farmState.nextHarvestTime).getTime() - Date.now()) / (1000 * 60 * 60))} ساعة`
                  : "متاح الآن! 🎉"
                }
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
