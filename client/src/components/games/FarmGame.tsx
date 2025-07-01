
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ShoppingCart, Coins, TrendingUp, Info, Settings, Users, Gift, Utensils, Droplets, Send } from "lucide-react";

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
  const getSize = () => {
    switch (size) {
      case "small": return "text-4xl";
      case "medium": return "text-6xl";
      case "large": return "text-8xl";
      default: return "text-4xl";
    }
  };

  return (
    <div className={`${getSize()} animate-pulse transition-all duration-1000 ${needsWater ? 'opacity-60' : 'opacity-100'}`}>
      🌵
    </div>
  );
};

export default function FarmGame() {
  const { getAuthHeaders } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showShop, setShowShop] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferUserId, setTransferUserId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [plantedItems, setPlantedItems] = useState<PlantedItem[]>([]);
  const [showTutorial, setShowTutorial] = useState(false);

  // Simulate plant water needs and growth over time
  useEffect(() => {
    const interval = setInterval(() => {
      setPlantedItems(prev => prev.map(plant => {
        const timeSinceWatered = plant.lastWatered 
          ? Date.now() - plant.lastWatered.getTime() 
          : Date.now() - plant.plantedAt.getTime();
        
        // Plants need water every 2 hours (7200000 ms) - reduced for demo purposes
        const needsWater = timeSinceWatered > 300000; // 5 minutes for demo
        
        return {
          ...plant,
          needsWater
        };
      }));
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Check if this is a new user (show tutorial)
  useEffect(() => {
    if (plantedItems.length === 0 && !localStorage.getItem('farm_tutorial_seen')) {
      setShowTutorial(true);
    }
  }, [plantedItems.length]);

  const { data: farmState, isLoading } = useQuery({
    queryKey: ["/api/farm/state"],
    queryFn: async () => {
      const response = await fetch("/api/farm/state", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch farm state");
      return response.json();
    },
    refetchInterval: 5000,
  });

  const { data: userPlants } = useQuery({
    queryKey: ["/api/farm/plants"],
    queryFn: async () => {
      const response = await fetch("/api/farm/plants", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch plants");
      return response.json();
    },
    refetchInterval: 5000,
  });

  const { data: userBalance } = useQuery({
    queryKey: ["/api/user/balance"],
    queryFn: async () => {
      const response = await fetch("/api/user/balance", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch balance");
      return response.json();
    },
  });

  const plantCactusMutation = useMutation({
    mutationFn: async ({ size }: { size: string }) => {
      return apiRequest("/api/farm/plant-cactus", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ size }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/farm/state"] });
      toast({
        title: "نجح الزرع!",
        description: "تم زراعة الصبار بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "فشل الزرع",
        description: error.message || "حدث خطأ أثناء الزراعة",
        variant: "destructive",
      });
    },
  });

  const transferMutation = useMutation({
    mutationFn: async ({ recipientUserId, amount }: { recipientUserId: string; amount: string }) => {
      return apiRequest("/api/transfer/asser-coin", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ recipientUserId, amount: parseFloat(amount) }),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
      setShowTransfer(false);
      setTransferUserId("");
      setTransferAmount("");
      toast({
        title: "نجح التحويل!",
        description: `تم تحويل ${data.transferAmount} عملة أسير (رسوم: ${data.transferFee})`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "فشل التحويل",
        description: error.message || "حدث خطأ أثناء التحويل",
        variant: "destructive",
      });
    },
  });

  const waterPlantsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/farm/water-plants", {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to water plants");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم سقي النباتات بنجاح! 💧",
        description: `تم سقي ${data.plantsWatered} نبات بنجاح`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/farm/plants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/farm/state"] });
      // Reset the water needs simulation
      setPlantedItems(prev => prev.map(plant => ({
        ...plant,
        needsWater: false,
        lastWatered: new Date()
      })));
    },
    onError: () => {
      toast({
        title: "فشل في سقي النباتات",
        description: "حدث خطأ أثناء سقي النباتات",
        variant: "destructive",
      });
    },
  });

  const purchaseMutation = useMutation({
    mutationFn: async ({ plantType, size }: { plantType: string; size: string }) => {
      const response = await fetch("/api/farm/purchase-plant", {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plantType, size }),
      });
      if (!response.ok) throw new Error("Failed to purchase plant");
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "تم الشراء بنجاح! 🌱",
        description: `تم شراء صبار الألوفيرا ${variables.size} بنجاح`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/farm/state"] });
      queryClient.invalidateQueries({ queryKey: ["/api/farm/plants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
      setShowShop(false);
      setShowShopCategory(null);
    },
    onError: () => {
      toast({
        title: "فشل الشراء",
        description: "رصيدك غير كافي أو حدث خطأ",
        variant: "destructive",
      });
    },
  });

  const getPriceAndProduction = (size: string) => {
    const config = {
      'small': { 
        price: 4, 
        dailyProduction: 0.32,
        monthlyProduction: 0.32 * 30, // 9.6 per month = 10% monthly return
      }, 
      'medium': { 
        price: 6, 
        dailyProduction: 0.48,
        monthlyProduction: 0.48 * 30, // 14.4 per month = 10% monthly return
      }, 
      'large': { 
        price: 10, 
        dailyProduction: 0.80,
        monthlyProduction: 0.80 * 30, // 24 per month = 10% monthly return
      }, 
    };
    return config[size as keyof typeof config] || config.small;
  };

  // Convert database plants to display format
  const displayPlants = (userPlants || []).map((plant: any, index: number) => {
    const timeSinceWatered = plant.lastWatered 
      ? Date.now() - new Date(plant.lastWatered).getTime() 
      : Date.now() - new Date(plant.plantedAt).getTime();
    
    return {
      id: plant.id.toString(),
      type: plant.type,
      size: plant.size,
      plantedAt: new Date(plant.plantedAt),
      dailyProduction: parseFloat(plant.dailyProduction),
      monthlyProduction: parseFloat(plant.dailyProduction) * 30,
      position: { x: (index % 6) * 15 + 8, y: Math.floor(index / 6) * 20 + 35 },
      lastWatered: plant.lastWatered ? new Date(plant.lastWatered) : undefined,
      needsWater: timeSinceWatered > 300000 // 5 minutes for demo
    };
  });

  const totalDailyProduction = displayPlants.reduce((sum: number, item: any) => sum + item.dailyProduction, 0);
  const totalEarnings = parseFloat(farmState?.totalEarnings || "0");

  if (isLoading) {
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

  return (
    <div className="space-y-4">
      {/* Production Stats - Top Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div 
          className="rounded-2xl p-4 text-white relative overflow-hidden shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">💰</div>
            <div className="text-right">
              <div className="text-2xl font-bold">{totalEarnings.toFixed(2)} AC</div>
              <div className="text-sm opacity-90">الإنتاج الإجمالي</div>
            </div>
          </div>
        </div>
        
        <div 
          className="rounded-2xl p-4 text-white relative overflow-hidden shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">📈</div>
            <div className="text-right">
              <div className="text-lg font-bold">{totalDailyProduction.toFixed(2)}/يوم</div>
              <div className="text-sm opacity-90">الإنتاج اليومي</div>
            </div>
          </div>
        </div>
      </div>

      {/* Farm Scene */}
      <div 
        className="relative min-h-[500px] rounded-2xl overflow-hidden shadow-xl border-2 border-green-200"
        style={{
          background: 'linear-gradient(to bottom, #87ceeb 0%, #87ceeb 25%, #98fb98 25%, #98fb98 45%, #90ee90 45%, #90ee90 70%, #8fbc8f 70%, #8fbc8f 100%)',
        }}
      >
        {/* Beautiful Sky */}
        <div className="absolute top-4 right-6 text-5xl animate-pulse">🌞</div>
        <div className="absolute top-6 left-8 text-2xl opacity-60 animate-bounce" style={{animationDelay: '1s'}}>☁️</div>
        <div className="absolute top-8 right-24 text-xl opacity-50 animate-bounce" style={{animationDelay: '2s'}}>☁️</div>
        
        {/* Flying birds */}
        <div className="absolute top-12 left-1/3 text-sm opacity-40 animate-bounce" style={{animationDelay: '3s'}}>🦅</div>
        
        {/* Garden Grid Lines for organized planting */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-6 gap-1 h-full pt-24">
            {Array.from({length: 18}).map((_, i) => (
              <div key={i} className="border border-green-400 rounded-lg"></div>
            ))}
          </div>
        </div>

        {/* Mountain backdrop */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-24 opacity-15" viewBox="0 0 400 80">
            <path d="M0,80 L0,40 L60,15 L120,25 L180,8 L240,20 L300,12 L360,18 L400,25 L400,80 Z" fill="#228b22"/>
            <path d="M0,80 L0,55 L45,35 L90,40 L135,20 L180,30 L225,25 L270,35 L315,22 L360,28 L400,35 L400,80 Z" fill="#32cd32"/>
          </svg>
        </div>

        {/* Planted Items Grid System */}
        {displayPlants.map((item: any, index: number) => {
          const gridCol = index % 6;
          const gridRow = Math.floor(index / 6);
          const leftPos = 8 + (gridCol * 15);
          const topPos = 35 + (gridRow * 20);
          
          return (
            <div
              key={item.id}
              className="absolute transition-all duration-500 hover:scale-125 cursor-pointer z-10"
              style={{
                left: `${leftPos}%`,
                top: `${topPos}%`,
                transform: 'translate(-50%, -50%)',
              }}
              onClick={() => {
                if (item.needsWater) {
                  toast({
                    title: "تم سقي النبات 💧",
                    description: "نباتك سعيد الآن!",
                  });
                  // TODO: Add water plant API call
                }
              }}
            >
              <div className="relative">
                <div className={`text-5xl filter drop-shadow-lg ${item.needsWater ? 'opacity-60 grayscale' : 'brightness-110'} transition-all duration-300`}>
                  {item.size === 'small' && '🌱'}
                  {item.size === 'medium' && '🌿'}
                  {item.size === 'large' && '🌳'}
                </div>
                {item.needsWater && (
                  <div className="absolute -top-3 -right-3 text-2xl animate-bounce">
                    💧
                  </div>
                )}
                <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 w-max">
                  <div className="bg-green-600 text-white text-xs px-2 py-1 rounded-lg shadow-md">
                    +{item.dailyProduction.toFixed(2)}/يوم
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty farm message when no plants */}
        {displayPlants.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center bg-white bg-opacity-80 p-6 rounded-2xl shadow-lg">
              <div className="text-6xl mb-4">🌵</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">مزرعة الألوفيرا</h3>
              <p className="text-gray-600 mb-4">ابدأ بزراعة أول صبار لك!</p>
              <button
                onClick={() => setShowShop(true)}
                className="bg-green-500 text-white px-6 py-2 rounded-full font-bold hover:bg-green-600 transition-colors"
              >
                🛒 اشتري الآن
              </button>
            </div>
          </div>
        )}

        {/* Bottom Action Buttons */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4">
          {/* Purchase Button */}
          <button
            onClick={() => setShowShop(true)}
            className="flex flex-col items-center justify-center w-16 h-16 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full text-white shadow-xl hover:scale-105 transform transition-all duration-200"
          >
            <ShoppingCart className="h-6 w-6" />
            <span className="text-xs font-bold mt-1">شراء</span>
          </button>

          {/* Water Button */}
          <button
            onClick={() => {
              const thirstyPlants = displayPlants.filter((p: any) => p.needsWater);
              if (thirstyPlants.length > 0 || displayPlants.length > 0) {
                waterPlantsMutation.mutate();
              } else {
                toast({
                  title: "لا توجد نباتات للري",
                  description: "ازرع نباتات أولاً لتتمكن من سقيها!",
                });
              }
            }}
            disabled={waterPlantsMutation.isPending}
            className="flex flex-col items-center justify-center w-16 h-16 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full text-white shadow-xl hover:scale-105 transform transition-all duration-200 disabled:opacity-50"
          >
            <Droplets className="h-6 w-6" />
            <span className="text-xs font-bold mt-1">ري</span>
          </button>

          {/* Settings Button */}
          <button
            className="flex flex-col items-center justify-center w-16 h-16 bg-gradient-to-b from-gray-400 to-gray-600 rounded-full text-white shadow-xl opacity-50 cursor-not-allowed"
            disabled
          >
            <Settings className="h-6 w-6" />
            <span className="text-xs font-bold mt-1">إعدادات</span>
          </button>
        </div>


      </div>

      {/* Farming Tips Section - Below Farm */}
      <div className="mt-6">
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-3xl">💡</div>
            <h3 className="text-lg font-bold text-yellow-800">نصائح زراعية مهمة</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white bg-opacity-60 p-3 rounded-xl">
              <div className="text-2xl mb-2">💧</div>
              <div className="font-semibold text-blue-800 mb-1">اسقِ نباتاتك بانتظام</div>
              <div className="text-gray-600">النباتات تحتاج الماء كل 5 دقائق للنمو بشكل صحي</div>
            </div>
            <div className="bg-white bg-opacity-60 p-3 rounded-xl">
              <div className="text-2xl mb-2">📈</div>
              <div className="font-semibold text-green-800 mb-1">ازرع أكثر لأرباح أعلى</div>
              <div className="text-gray-600">كل نبات يعطيك أرباحاً يومية تصل لـ 8-10% شهرياً</div>
            </div>
            <div className="bg-white bg-opacity-60 p-3 rounded-xl">
              <div className="text-2xl mb-2">🕐</div>
              <div className="font-semibold text-purple-800 mb-1">تابع مزرعتك يومياً</div>
              <div className="text-gray-600">المتابعة المستمرة تضمن استقرار دخلك</div>
            </div>
          </div>
        </div>
      </div>

      {/* Shop Modal */}
      {showShop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">متجر المزرعة 🛒</h2>
                <button
                  onClick={() => {
                    setShowShop(false);
                    setShowShopCategory(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              {!showShopCategory ? (
                <div className="space-y-4">
                  <button
                    onClick={() => setShowShopCategory('decorative')}
                    className="w-full p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-xl text-right hover:from-emerald-100 hover:to-emerald-150 transition-all shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">🌿</span>
                      <span className="font-bold text-emerald-800">زرع الزينة</span>
                    </div>
                  </button>

                  <button
                    disabled
                    className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-right opacity-50 cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">🌾</span>
                      <div>
                        <div className="font-bold text-gray-600">محاصيل زراعية متنوعة</div>
                        <div className="text-sm text-gray-500">(قادم قريباً)</div>
                      </div>
                    </div>
                  </button>

                  <button
                    disabled
                    className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-right opacity-50 cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">🏞️</span>
                      <div>
                        <div className="font-bold text-gray-600">تأجير أرض صغيرة (1×1 متر)</div>
                        <div className="text-sm text-gray-500">(قادم قريباً)</div>
                      </div>
                    </div>
                  </button>
                </div>
              ) : showShopCategory === 'decorative' ? (
                <div className="space-y-4">
                  <button
                    onClick={() => setShowShopCategory(null)}
                    className="text-blue-500 text-sm mb-4 hover:text-blue-700"
                  >
                    ← العودة للأقسام
                  </button>
                  
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-emerald-700">
                    <span>🌵</span>
                    صبار الألوفيرا
                  </h3>

                  <div className="space-y-3">
                    {['small', 'medium', 'large'].map((size) => {
                      const config = getPriceAndProduction(size);
                      const sizeNames = { small: 'صغير', medium: 'متوسط', large: 'كبير' };
                      const sizeIcons = { small: '🌵', medium: '🌿', large: '🎋' };
                      
                      return (
                        <div key={size} className="flex items-center justify-between p-4 border-2 border-emerald-200 rounded-xl shadow-sm bg-gradient-to-r from-emerald-50 to-green-50">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{sizeIcons[size as keyof typeof sizeIcons]}</span>
                            <div>
                              <div className="font-bold text-gray-800 flex items-center gap-1">
                                ✅ {sizeNames[size as keyof typeof sizeNames]}
                              </div>
                              <div className="text-sm text-gray-600">
                                الإنتاج: {config.dailyProduction.toFixed(2)} Asser Coin يومياً
                              </div>
                              <div className="text-xs text-emerald-600 font-semibold">
                                ربح: 8-10٪ شهرياً
                              </div>
                            </div>
                          </div>
                          <div className="text-left">
                            <div className="font-bold text-xl text-emerald-600">{config.price} عملات Asser Coin</div>
                            <Button
                              size="sm"
                              onClick={() => purchaseMutation.mutate({ plantType: 'aloe', size })}
                              disabled={purchaseMutation.isPending || (userBalance?.asserCoin || 0) < config.price}
                              className="mt-2 bg-emerald-500 hover:bg-emerald-600"
                            >
                              اشتري 🛒
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Farm Guide */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            دليل مزرعة الألوفيرا
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3 text-sm">
            <h3 className="font-bold text-emerald-700">نصائح للنجاح في مزرعة الألوفيرا:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">💧</span>
                شَرِّب زرعك بانتظام لزيادة أرباحك الشهرية
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">🌱</span>
                ازرع أكثر لتحقق أرباحاً أكبر تصل لـ 8-10٪ شهرياً
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">📈</span>
                تابع مزرعتك يومياً لتحافظ على أرباحك المستقرة
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">🌵</span>
                ابدأ بالصبار الصغير ثم انتقل للأحجام الأكبر
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">💰</span>
                كل نبتة ألوفيرا تنتج عملات Asser Coin يومياً تلقائياً
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🌵</div>
                <h2 className="text-2xl font-bold text-emerald-700 mb-2">مرحباً بك في مزرعة الألوفيرا!</h2>
                <p className="text-gray-600">ابدأ رحلتك في زراعة صبار الألوفيرا وحقق أرباحاً مستدامة</p>
              </div>

              <div className="space-y-4 text-sm">
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                  <h3 className="font-bold text-emerald-700 mb-2">🛒 كيفية البدء:</h3>
                  <ul className="space-y-1 text-gray-700">
                    <li>• اضغط على زر "شراء" لفتح المتجر</li>
                    <li>• اختر "زرع الزينة" ثم "صبار الألوفيرا"</li>
                    <li>• ابدأ بالحجم الصغير (4 عملات)</li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <h3 className="font-bold text-blue-700 mb-2">💧 العناية بالنباتات:</h3>
                  <ul className="space-y-1 text-gray-700">
                    <li>• اسقِ نباتاتك عندما تظهر قطرة الماء 💧</li>
                    <li>• استخدم زر "ري" لسقي جميع النباتات</li>
                    <li>• النباتات المروية تنتج أكثر!</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                  <h3 className="font-bold text-yellow-700 mb-2">💰 الأرباح:</h3>
                  <ul className="space-y-1 text-gray-700">
                    <li>• كل نبتة تنتج عملات يومياً تلقائياً</li>
                    <li>• ربح 8-10% شهرياً من استثمارك</li>
                    <li>• كلما زرعت أكثر، ربحت أكثر!</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowTutorial(false);
                    localStorage.setItem('farm_tutorial_seen', 'true');
                  }}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-xl font-bold hover:bg-gray-600 transition-colors"
                >
                  تخطي التعليمات
                </button>
                <button
                  onClick={() => {
                    setShowTutorial(false);
                    setShowShop(true);
                    localStorage.setItem('farm_tutorial_seen', 'true');
                  }}
                  className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition-colors"
                >
                  ابدأ الزراعة 🌱
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
