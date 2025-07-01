import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, 
  Clock, 
  Coins, 
  Users,
  ExternalLink,
  Calendar,
  Trophy,
  Wallet
} from "lucide-react";

const GAME_TIMES = [
  { time: "15:00", label: "3:00 مساءً" },
  { time: "18:00", label: "6:00 مساءً" },
  { time: "21:00", label: "9:00 مساءً" }
];

const SUBSCRIPTION_COST = 5; // 5 Asser Coin per game

export default function TelegramGames() {
  const { user, getAuthHeaders } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

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

  const { data: subscriptions } = useQuery({
    queryKey: ["/api/telegram-games/subscriptions"],
    queryFn: async () => {
      const response = await fetch("/api/telegram-games/subscriptions", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch subscriptions");
      return response.json();
    },
  });

  const subscriptionMutation = useMutation({
    mutationFn: async (gameTime: string) => {
      const response = await fetch("/api/telegram-games/subscribe", {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ gameTime }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "فشل في الاشتراك");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم الاشتراك بنجاح",
        description: `تم اشتراكك في لعبة ${data.gameTime} - تم خصم ${SUBSCRIPTION_COST} Asser Coin`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/telegram-games/subscriptions"] });
      setSelectedTime(null);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الاشتراك",
        description: error.message || "حدث خطأ أثناء الاشتراك",
        variant: "destructive",
      });
    },
  });

  const handleSubscription = (time: string) => {
    if (parseFloat(balance?.asserCoin || "0") < SUBSCRIPTION_COST) {
      toast({
        title: "رصيد غير كافي",
        description: `تحتاج إلى ${SUBSCRIPTION_COST} Asser Coin للاشتراك`,
        variant: "destructive",
      });
      return;
    }
    subscriptionMutation.mutate(time);
  };

  const isSubscribed = (time: string) => {
    return subscriptions?.some((sub: any) => sub.gameTime === time && sub.isActive);
  };

  const getSubscriptionDate = (time: string) => {
    const sub = subscriptions?.find((s: any) => s.gameTime === time && s.isActive);
    return sub ? new Date(sub.subscribedAt).toLocaleDateString('ar-EG') : null;
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-primary">ألعاب تليجرام الثقافية</h1>
        <p className="text-muted-foreground">
          اشترك في الألعاب الثقافية والدينية على تليجرام
        </p>
      </div>

      {/* Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            رصيدك الحالي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{balance?.asserCoin || "0"}</span>
              <span className="text-muted-foreground">Asser Coin</span>
            </div>
            <Badge variant="outline">
              تكلفة الاشتراك: {SUBSCRIPTION_COST} AC
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Telegram Group Link */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <MessageSquare className="h-5 w-5" />
            مجموعة تليجرام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              انضم إلى مجموعة تليجرام للمشاركة في الألعاب الثقافية والدينية
            </p>
            <Button 
              variant="outline" 
              className="w-full border-blue-200 text-blue-700 hover:bg-blue-100"
              onClick={() => window.open("https://t.me/a1ASSER", "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              انضم إلى المجموعة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Game Times */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">مواعيد الألعاب</h2>
        <div className="grid gap-4">
          {GAME_TIMES.map((gameTime) => (
            <Card key={gameTime.time} className="relative">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {gameTime.label}
                  </div>
                  {isSubscribed(gameTime.time) && (
                    <Badge variant="default" className="bg-green-500">
                      <Trophy className="h-3 w-3 mr-1" />
                      مشترك
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {isSubscribed(gameTime.time) ? (
                    <div className="space-y-2">
                      <p className="text-sm text-green-600 font-medium">
                        أنت مشترك في هذه اللعبة
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        تاريخ الاشتراك: {getSubscriptionDate(gameTime.time)}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        اشترك في اللعبة الثقافية لهذا التوقيت
                      </p>
                      <Button
                        onClick={() => handleSubscription(gameTime.time)}
                        disabled={subscriptionMutation.isPending || parseFloat(balance?.asserCoin || "0") < SUBSCRIPTION_COST}
                        className="w-full"
                      >
                        {subscriptionMutation.isPending ? (
                          "جاري الاشتراك..."
                        ) : (
                          <>
                            <Coins className="h-4 w-4 mr-2" />
                            اشتراك - {SUBSCRIPTION_COST} AC
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Game Tips */}
      <Card className="border-yellow-200 bg-yellow-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-700">
            <Trophy className="h-5 w-5" />
            نصائح اللعبة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>مواعيد الاشتراك:</strong></p>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li>3:00 مساءً</li>
              <li>6:00 مساءً</li>
              <li>9:00 مساءً</li>
            </ul>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-700 font-medium">
                💰 معلومات مهمة عن الأرباح
              </p>
              <p className="text-blue-600 text-sm mt-1">
                الربح في اللعبة يتم دفعه للمستخدمين عن طريق صندوق Asser Platform 
                ويتم تمويله عن طريق المالك والمشرفين
              </p>
            </div>
            
            <div className="mt-3 space-y-1">
              <p><strong>كيفية اللعب:</strong></p>
              <p>1. اشترك في الوقت المناسب لك</p>
              <p>2. انضم إلى مجموعة تليجرام</p>
              <p>3. شارك في الأسئلة الثقافية والدينية</p>
              <p>4. اربح جوائز قيمة!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}