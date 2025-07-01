import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Team() {
  const { user, getAuthHeaders } = useAuth();
  const { toast } = useToast();

  const { data: profileData } = useQuery({
    queryKey: ["/api/user/profile"],
    queryFn: async () => {
      const response = await fetch("/api/user/profile", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch profile");
      return response.json();
    },
  });

  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ["/api/team/members"],
    queryFn: async () => {
      const response = await fetch("/api/team/members", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch team members");
      return response.json();
    },
  });

  const copyReferralLink = async () => {
    if (profileData?.referralLink) {
      try {
        await navigator.clipboard.writeText(profileData.referralLink);
        toast({
          title: "تم النسخ",
          description: "تم نسخ رابط الدعوة بنجاح",
        });
      } catch (error) {
        toast({
          title: "خطأ",
          description: "فشل في نسخ الرابط",
          variant: "destructive",
        });
      }
    }
  };

  const copyReferralCode = async () => {
    if (user?.userId) {
      try {
        await navigator.clipboard.writeText(user.userId);
        toast({
          title: "تم النسخ",
          description: "تم نسخ كود الدعوة بنجاح",
        });
      } catch (error) {
        toast({
          title: "خطأ",
          description: "فشل في نسخ الكود",
          variant: "destructive",
        });
      }
    }
  };

  const referralStats = profileData?.referralStats || { count: 0, earnings: 0 };

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      {/* Team Stats */}
      <Card className="asser-gradient-secondary text-white border-0">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="h-6 w-6" />
            إحصائيات الفريق
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold font-inter">{referralStats.count}</p>
              <p className="text-sm text-white/80">إجمالي الأعضاء</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold font-inter">
                {parseFloat(referralStats.earnings).toFixed(0)}
              </p>
              <p className="text-sm text-white/80">أرباح الفريق</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral Code - Main Method */}
      <Card className="asser-card border-2 border-yellow-400">
        <CardHeader>
          <CardTitle className="text-center text-lg">كود الدعوة الخاص بك</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-4">
            <div className="inline-block bg-yellow-100 border-2 border-yellow-400 rounded-lg px-6 py-4 mb-3">
              <span className="text-3xl font-bold font-inter text-yellow-800">
                {user?.userId || "-----"}
              </span>
            </div>
            <Button
              size="lg"
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
              onClick={copyReferralCode}
            >
              <Copy className="h-5 w-5 mr-2" />
              نسخ كود الدعوة
            </Button>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800 text-center">
              <strong>شارك هذا الكود مع أصدقائك!</strong><br/>
              ساعد أصدقائك في الانضمام للمنصة
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Referral Link - Alternative Method */}
      <Card className="asser-card">
        <CardHeader>
          <CardTitle>رابط الدعوة (بديل)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            <code className="flex-1 text-sm bg-gray-100 rounded px-3 py-2 font-inter truncate">
              {profileData?.referralLink || `https://assercoin.com/ref/${user?.userId}`}
            </code>
            <Button
              size="sm"
              variant="outline"
              className="px-4"
              onClick={copyReferralLink}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            أو شارك هذا الرابط مع أصدقائك
          </p>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card className="asser-card">
        <CardHeader>
          <CardTitle>أعضاء الفريق</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : teamMembers && teamMembers.length > 0 ? (
            <div className="space-y-3">
              {teamMembers.map((member: any) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {member.fullName?.charAt(0) || "؟"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {member.fullName || "عضو جديد"}
                      </p>
                      <p className="text-xs text-gray-500 font-inter">
                        ID: {member.userId}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-secondary font-inter">
                      +{parseFloat(member.earnings || "0").toFixed(0)}
                    </p>
                    <p className="text-xs text-gray-500 font-inter">
                      {new Date(member.createdAt).toLocaleDateString("ar-EG")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>لا يوجد أعضاء في فريقك بعد</p>
              <p className="text-sm">ادع أصدقاءك للانضمام واحصل على مكافآت</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
