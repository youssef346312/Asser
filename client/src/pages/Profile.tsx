import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { User, Wallet, Trophy, Users, Settings, Copy, Eye, EyeOff, Edit, Plus, Minus } from "lucide-react";
import PaymentModal from "@/components/payments/PaymentModal";
import { apiRequest } from "@/lib/queryClient";

export default function Profile() {
  const { user, getAuthHeaders, refreshUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showBalance, setShowBalance] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || "🌵");
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; type: "deposit" | "withdrawal" | null }>({
    isOpen: false,
    type: null
  });
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || ""
  });

  const avatarOptions = [
    "🌵", "🌿", "🌱", "🌳", "🌲", "🎋", "🌾", "🌻", "🌺", "🌸",
    "😊", "😎", "🤗", "😄", "🥰", "😇", "🤠", "🧠", "💚", "🎯",
    "🚀", "⭐", "🔥", "💎", "🏆", "🎮", "💰", "🎨", "🎪", "🎭"
  ];

  const { data: stats } = useQuery({
    queryKey: ["/api/user/stats"],
    queryFn: async () => {
      const response = await fetch("/api/user/stats", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  const { data: balance } = useQuery({
    queryKey: ["/api/user/balance"],
    queryFn: async () => {
      const response = await fetch("/api/user/balance", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch balance");
      return response.json();
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      console.log("Sending profile update request:", data);
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      console.log("Profile update response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Profile update error:", errorData);
        throw new Error(errorData.message || "Failed to update profile");
      }
      
      const result = await response.json();
      console.log("Profile update success:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("Profile update mutation success:", data);
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث بياناتك الشخصية بنجاح",
      });
      setEditMode(false);
      
      // Update the form data with the new values
      setFormData({
        fullName: data.user.fullName,
        email: data.user.email,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      
      // Refresh user data in the auth context
      refreshUser();
    },
    onError: (error: any) => {
      console.error("Profile update mutation error:", error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تحديث البيانات",
        variant: "destructive",
      });
    },
  });

  const updateAvatarMutation = useMutation({
    mutationFn: async (avatar: string) => {
      const response = await fetch("/api/user/avatar", {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ avatar }),
      });
      if (!response.ok) throw new Error("Failed to update avatar");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تغيير صورتك الشخصية بنجاح",
      });
      setShowAvatarModal(false);
      refreshUser();
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الصورة",
        variant: "destructive",
      });
    },
  });

  const copyUserId = () => {
    navigator.clipboard.writeText(user?.userId || "");
    toast({
      title: "تم النسخ",
      description: "تم نسخ معرف المستخدم بنجاح",
    });
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/register?ref=${user?.userId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "تم النسخ",
      description: "تم نسخ رابط الإحالة بنجاح",
    });
  };

  const handleRefreshUser = async () => {
    await refreshUser();
  };

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      {/* Profile Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
                  <span className="text-3xl">
                    {user?.avatar || selectedAvatar}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full p-0"
                  onClick={() => setShowAvatarModal(true)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{user?.fullName}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>ID: {user?.userId}</span>
                  <Button variant="ghost" size="sm" onClick={copyUserId} className="h-6 w-6 p-0">
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={editMode ? "default" : "outline"}
                onClick={() => setEditMode(!editMode)}
              >
                <Settings className="h-4 w-4 mr-2" />
                {editMode ? "حفظ" : "تعديل"}
              </Button>
            </div>
          </div>

          {editMode ? (
            <div className="space-y-4">
              <div></div>
            </div>
          ) : (
            <div className="space-y-2">
              <p><strong>البريد الإلكتروني:</strong> {user?.email}</p>
              <p><strong>تاريخ التسجيل:</strong> {new Date().toLocaleDateString('ar-EG')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      

      {editMode && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName">الاسم الكامل</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  console.log("Submitting form data:", formData);
                  updateProfileMutation.mutate(formData);
                }}
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
              </Button>
              <Button variant="outline" onClick={() => setEditMode(false)}>
                إلغاء
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              الرصيد الحالي
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBalance(!showBalance)}
              className="h-6 w-6 p-0"
            >
              {showBalance ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-lg font-bold text-primary">
                  {showBalance ? `${balance?.asserCoin || "0.00"} AC` : "••••••"}
                </div>
                <div className="text-sm text-green-600">
                  {showBalance ? `${balance?.usdt || "0.00"} USDT` : "••••••"}
                </div>
                <div className="text-sm text-orange-600">
                  {showBalance ? `${balance?.egp || "0.00"} EGP` : "••••••"}
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setPaymentModal({ isOpen: true, type: "deposit" })}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  إيداع
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setPaymentModal({ isOpen: true, type: "withdrawal" })}
                >
                  <Minus className="h-4 w-4 mr-1" />
                  سحب
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              العملات المتاحة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-purple-600">AC</div>
                <p className="text-xs text-muted-foreground">AsserCoin</p>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">USDT</div>
                <p className="text-xs text-muted-foreground">Tether</p>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600">EGP</div>
                <p className="text-xs text-muted-foreground">جنيه مصري</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            إحصائيات الحساب
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats?.referrals || 0}</div>
              <p className="text-sm text-muted-foreground">الإحالات</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats?.transactions || 0}</div>
              <p className="text-sm text-muted-foreground">المعاملات</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats?.gamesPlayed || 0}</div>
              <p className="text-sm text-muted-foreground">الألعاب</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats?.level || 1}</div>
              <p className="text-sm text-muted-foreground">المستوى</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral Section */}
      <Card>
        <CardHeader>
          <CardTitle>رابط الإحالة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Input
              value={`${window.location.origin}/register?ref=${user?.userId}`}
              readOnly
              className="bg-transparent border-0 focus-visible:ring-0"
            />
            <Button onClick={copyReferralLink} size="sm">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            شارك هذا الرابط لمساعدة أصدقائك في الانضمام للمنصة
          </p>
        </CardContent>
      </Card>

      {/* Achievement Badges */}
      <Card>
        <CardHeader>
          <CardTitle>الإنجازات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              مستخدم جديد
            </Badge>
            {(stats?.referrals || 0) > 0 && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                مرشد
              </Badge>
            )}
            {(stats?.transactions || 0) > 5 && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                متداول نشط
              </Badge>
            )}
            {(stats?.gamesPlayed || 0) > 10 && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                لاعب محترف
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Avatar Selection Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">اختر صورتك الشخصية</h2>
                <button
                  onClick={() => setShowAvatarModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-6 gap-3 mb-6">
                {avatarOptions.map((avatar) => (
                  <button
                    key={avatar}
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all ${
                      selectedAvatar === avatar
                        ? "bg-primary text-white ring-2 ring-primary ring-offset-2"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAvatarModal(false)}
                >
                  إلغاء
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => updateAvatarMutation.mutate(selectedAvatar)}
                  disabled={updateAvatarMutation.isPending}
                >
                  حفظ
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal({ isOpen: false, type: null })}
        type={paymentModal.type || "deposit"}
      />
    </div>
  );
}