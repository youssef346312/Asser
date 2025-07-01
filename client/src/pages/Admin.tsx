import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Search, Shield, Settings, Database, GamepadIcon, Calculator } from "lucide-react";

export default function Admin() {
  const { getAuthHeaders, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [newRates, setNewRates] = useState({
    usdtToAsser: "",
    egpToAsser: "",
    asserToUsdt: "",
    asserToEgp: ""
  });
  const [selectedStrategy, setSelectedStrategy] = useState("");
  const [gameDuration, setGameDuration] = useState("100");

  // التحقق من صلاحيات الإدارة
  const { data: adminStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["/api/user/admin-status"],
    queryFn: async () => {
      const response = await fetch("/api/user/admin-status", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch admin status");
      return response.json();
    },
    enabled: !!user,
  });

  // البحث عن المستخدمين (فقط للمشرفين)
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["/api/admin/users/search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await fetch(`/api/admin/users/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to search users");
      return response.json();
    },
    enabled: !!user && !!searchQuery.trim() && adminStatus?.isAdmin === true,
  });

  // جلب أسعار الصرف
  const { data: exchangeRates } = useQuery({
    queryKey: ["/api/exchange-rates"],
    queryFn: async () => {
      const response = await fetch("/api/exchange-rates");
      if (!response.ok) throw new Error("Failed to fetch exchange rates");
      return response.json();
    },
    enabled: adminStatus?.isAdmin === true,
  });

  // جلب استراتيجيات اللعبة
  const { data: strategies = [] } = useQuery({
    queryKey: ["/api/admin/smart-strategy/strategies"],
    queryFn: async () => {
      const response = await fetch("/api/admin/smart-strategy/strategies", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch strategies");
      return response.json();
    },
    enabled: adminStatus?.isAdmin === true,
  });

  // جلب الألعاب النشطة
  const { data: activeGames = [] } = useQuery({
    queryKey: ["/api/admin/smart-strategy/games"],
    queryFn: async () => {
      const response = await fetch("/api/admin/smart-strategy/games", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch games");
      return response.json();
    },
    enabled: adminStatus?.isAdmin === true,
    refetchInterval: 5000,
  });

  // تحديث حالة المستخدم
  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: number; isActive: boolean }) => {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) throw new Error("Failed to update user status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/search"] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة المستخدم بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث حالة المستخدم",
        variant: "destructive",
      });
    },
  });

  // تحديث أسعار الصرف
  const updateRatesMutation = useMutation({
    mutationFn: async (rates: any) => {
      const response = await fetch("/api/admin/exchange-rates", {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rates),
      });
      if (!response.ok) throw new Error("Failed to update exchange rates");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exchange-rates"] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث أسعار الصرف بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث أسعار الصرف",
        variant: "destructive",
      });
    },
  });

  // إنشاء لعبة جديدة
  const createGameMutation = useMutation({
    mutationFn: async (gameData: { strategyId: string; duration: string }) => {
      const response = await fetch("/api/admin/smart-strategy/create", {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gameData),
      });
      if (!response.ok) throw new Error("Failed to create game");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/smart-strategy/games"] });
      toast({
        title: "تم إنشاء اللعبة",
        description: `تم إنشاء لعبة جديدة بنجاح. الباب الصحيح: ${data.correctDoor}`,
      });
      setSelectedStrategy("");
      setGameDuration("100");
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إنشاء اللعبة",
        variant: "destructive",
      });
    },
  });

  // حذف جميع المستخدمين
  const clearUsersMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/users/clear", {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to clear users");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم الحذف",
        description: "تم حذف جميع المستخدمين بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف المستخدمين",
        variant: "destructive",
      });
    },
  });

  // تحميل الأسعار الحالية في النموذج
  useEffect(() => {
    if (exchangeRates) {
      setNewRates({
        usdtToAsser: exchangeRates.usdtToAsser || "",
        egpToAsser: exchangeRates.egpToAsser || "",
        asserToUsdt: exchangeRates.asserToUsdt || "",
        asserToEgp: exchangeRates.asserToEgp || ""
      });
    }
  }, [exchangeRates]);

  // عرض شاشة التحميل
  if (statusLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-muted-foreground">جاري التحقق من صلاحيات الإدارة...</p>
        </div>
      </div>
    );
  }

  // عرض رسالة عدم الصلاحية
  if (!adminStatus?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center bg-red-50 p-8 rounded-2xl border border-red-200 max-w-md mx-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-red-800 mb-4">غير مصرح بالدخول</h2>
          <p className="text-red-600 mb-6">ليس لديك صلاحيات للوصول إلى لوحة الإدارة</p>
          <p className="text-sm text-red-500">هذه الصفحة مخصصة للمشرفين فقط</p>
        </div>
      </div>
    );
  }

  // Additional check - redirect if somehow accessed without admin rights
  if (user && !user.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-red-800 mb-2">غير مصرح</h3>
          <p className="text-red-600">ليس لديك صلاحيات للوصول لهذه الصفحة</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-blue-800 mb-2">🛡️ لوحة الإدارة</h1>
        <p className="text-blue-600">إدارة النظام والمستخدمين</p>
      </div>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search">البحث عن المستخدمين</TabsTrigger>
          <TabsTrigger value="games">إدارة الألعاب</TabsTrigger>
          <TabsTrigger value="rates">أسعار الصرف</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
        </TabsList>

        <TabsContent value="search">
          {/* البحث عن المستخدمين */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                البحث عن المستخدمين
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="text"
                placeholder="ابحث بالاسم أو البريد الإلكتروني..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
              
              {searchLoading && <p className="text-muted-foreground">جاري البحث...</p>}
              
              {searchResults && searchResults.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium">نتائج البحث:</h3>
                  {searchResults.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{user.fullName}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">ID: {user.userId}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={user.isActive ? "default" : "destructive"}>
                          {user.isActive ? "نشط" : "معطل"}
                        </Badge>
                        {user.isAdmin && <Badge variant="secondary">مشرف</Badge>}
                        <Button
                          size="sm"
                          variant={user.isActive ? "destructive" : "default"}
                          onClick={() => updateStatusMutation.mutate({ 
                            userId: user.id, 
                            isActive: !user.isActive 
                          })}
                          disabled={updateStatusMutation.isPending}
                        >
                          {user.isActive ? "تعطيل" : "تفعيل"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {searchQuery && searchResults && searchResults.length === 0 && !searchLoading && (
                <p className="text-muted-foreground">لا توجد نتائج للبحث</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="games">
          {/* إدارة الألعاب الذكية */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GamepadIcon className="h-5 w-5" />
                إنشاء لعبة ذكية جديدة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">اختر الاستراتيجية</label>
                <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر استراتيجية من الـ 50 استراتيجية" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {strategies.map((strategy: any) => (
                      <SelectItem key={strategy.id} value={strategy.id.toString()}>
                        {strategy.id}. {strategy.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">مدة اللعبة (بالثواني)</label>
                <Input
                  type="number"
                  value={gameDuration}
                  onChange={(e) => setGameDuration(e.target.value)}
                  placeholder="100"
                  min="30"
                  max="300"
                />
              </div>

              <Button
                onClick={() => createGameMutation.mutate({ 
                  strategyId: selectedStrategy, 
                  duration: gameDuration 
                })}
                disabled={!selectedStrategy || createGameMutation.isPending}
                className="w-full"
              >
                {createGameMutation.isPending ? "جاري الإنشاء..." : "إنشاء لعبة جديدة"}
              </Button>
            </CardContent>
          </Card>

          {/* الألعاب النشطة */}
          <Card>
            <CardHeader>
              <CardTitle>الألعاب النشطة</CardTitle>
            </CardHeader>
            <CardContent>
              {activeGames.length > 0 ? (
                <div className="space-y-2">
                  {activeGames.map((game: any) => (
                    <div key={game.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">استراتيجية: {game.strategy}</p>
                          <p className="text-sm text-muted-foreground">
                            المدة: {game.duration} ثانية
                          </p>
                        </div>
                        <Badge variant={game.isActive ? "default" : "secondary"}>
                          {game.isActive ? "نشطة" : "منتهية"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">لا توجد ألعاب نشطة حالياً</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates">
          {/* أسعار الصرف */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                أسعار الصرف
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">USDT إلى AsserCoin</label>
                  <Input
                    type="number"
                    value={newRates.usdtToAsser}
                    onChange={(e) => setNewRates(prev => ({ ...prev, usdtToAsser: e.target.value }))}
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">EGP إلى AsserCoin</label>
                  <Input
                    type="number"
                    value={newRates.egpToAsser}
                    onChange={(e) => setNewRates(prev => ({ ...prev, egpToAsser: e.target.value }))}
                    placeholder="0.2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">AsserCoin إلى USDT</label>
                  <Input
                    type="number"
                    value={newRates.asserToUsdt}
                    onChange={(e) => setNewRates(prev => ({ ...prev, asserToUsdt: e.target.value }))}
                    placeholder="0.10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">AsserCoin إلى EGP</label>
                  <Input
                    type="number"
                    value={newRates.asserToEgp}
                    onChange={(e) => setNewRates(prev => ({ ...prev, asserToEgp: e.target.value }))}
                    placeholder="5"
                  />
                </div>
              </div>
              <Button
                onClick={() => updateRatesMutation.mutate(newRates)}
                disabled={updateRatesMutation.isPending}
                className="w-full"
              >
                {updateRatesMutation.isPending ? 'جاري التحديث...' : 'تحديث الأسعار'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          {/* الإجراءات الخطيرة */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Database className="h-5 w-5" />
                إجراءات خطيرة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => {
                  if (confirm("هل أنت متأكد من حذف جميع المستخدمين؟ هذا الإجراء لا يمكن التراجع عنه!")) {
                    clearUsersMutation.mutate();
                  }
                }}
                disabled={clearUsersMutation.isPending}
                variant="destructive"
                className="w-full"
              >
                {clearUsersMutation.isPending ? 'جاري الحذف...' : 'حذف جميع المستخدمين'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
