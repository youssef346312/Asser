import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface ActiveGame {
  id: number;
  strategy: string;
  correctAnswer: number;
  duration: number;
  createdAt: string;
  isActive: boolean;
}

interface Participation {
  id: number;
  gameId: number;
  investedAmount: string;
  currency: string;
  selectedDoor: number;
  isCorrect: boolean;
  reward: string;
  participatedAt: string;
}

export default function SmartStrategyGame() {
  const [activeGame, setActiveGame] = useState<ActiveGame | null>(null);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [loading, setLoading] = useState(false);
  const [gameLoading, setGameLoading] = useState(true);
  const [selectedDoor, setSelectedDoor] = useState<number | null>(null);
  const [investedAmount, setInvestedAmount] = useState("");
  const [currency, setCurrency] = useState("asser");
  const [timeRemaining, setTimeRemaining] = useState(100);
  const [gameResult, setGameResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchActiveGame();
    fetchParticipations();
    
    // Set up synchronized timer polling
    const syncTimer = setInterval(() => {
      fetchTimerSync();
    }, 1000);
    
    return () => clearInterval(syncTimer);
  }, []);

  const fetchActiveGame = async () => {
    try {
      const response = await apiRequest("GET", "/api/smart-strategy/active");
      if (response.ok) {
        const game = await response.json();
        setActiveGame(game);
      }
    } catch (error) {
      console.error("Error fetching active game:", error);
    } finally {
      setGameLoading(false);
    }
  };

  const fetchTimerSync = async () => {
    try {
      const response = await apiRequest("GET", "/api/smart-strategy/timer-sync");
      if (response.ok) {
        const timerData = await response.json();
        setTimeRemaining(timerData.timeRemaining || 0);
        
        if (timerData.hasActiveGame && !activeGame) {
          setActiveGame({
            id: timerData.gameId,
            strategy: timerData.strategy,
            correctAnswer: 0,
            duration: timerData.duration,
            createdAt: timerData.startTime,
            isActive: timerData.isActive
          });
        } else if (!timerData.hasActiveGame && activeGame) {
          setActiveGame(null);
          setShowResult(false);
          setSelectedDoor(null);
        }
      }
    } catch (error) {
      console.error("Error syncing timer:", error);
    }
  };

  const fetchParticipations = async () => {
    try {
      const response = await apiRequest("GET", "/api/smart-strategy/my-participations");
      if (response.ok) {
        const data = await response.json();
        setParticipations(data);
      }
    } catch (error) {
      console.error("Error fetching participations:", error);
    }
  };

  const handleDoorClick = (doorNumber: number) => {
    if (timeRemaining > 0 && !showResult) {
      setSelectedDoor(doorNumber);
    }
  };

  const handleParticipate = async () => {
    if (!activeGame || !selectedDoor || !investedAmount) {
      toast({
        title: "خطأ",
        description: "الرجاء اختيار باب وتحديد مبلغ الاستثمار",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(investedAmount) < 10) {
      toast({
        title: "خطأ",
        description: "الحد الأدنى للاستثمار 10 عملة",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/smart-strategy/participate", {
        gameId: activeGame.id,
        investedAmount,
        currency,
        selectedDoor
      });

      if (response.ok) {
        const result = await response.json();
        setGameResult(result);
        setShowResult(true);
        toast({
          title: result.isCorrect ? "تهانينا!" : "حظ أفضل المرة القادمة",
          description: result.message,
          variant: result.isCorrect ? "default" : "destructive",
        });
        fetchParticipations();
      } else {
        const error = await response.json();
        toast({
          title: "خطأ",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في المشاركة في اللعبة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (gameLoading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>جاري تحميل اللعبة...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!activeGame) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">لا توجد لعبة نشطة حالياً</h2>
            <p className="text-gray-600 mb-4">انتظر إعلان اللعبة القادمة من الإدارة</p>
            <Button onClick={fetchActiveGame}>تحديث</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Game Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">Asser Smart Strategy</CardTitle>
          <div className="text-center">
            <div className={`text-2xl font-bold mb-2 p-4 rounded-lg ${
              timeRemaining > 60 ? 'bg-green-100 text-green-700' :
              timeRemaining > 30 ? 'bg-yellow-100 text-yellow-700' :
              timeRemaining > 0 ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              العد التنازلي المزامن: {formatTime(timeRemaining)}
            </div>
            <div className="text-sm text-gray-600 mb-2">
              جميع المستخدمين يرون نفس الوقت المتبقي
            </div>
            {timeRemaining === 0 && !showResult && (
              <div className="text-red-600 font-bold text-xl animate-pulse">انتهى الوقت!</div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Strategy Display */}
      <Card>
        <CardHeader>
          <CardTitle>الاستراتيجية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-medium p-4 bg-gray-50 rounded-lg text-center">
            {activeGame.strategy}
          </div>
        </CardContent>
      </Card>

      {/* Investment Settings */}
      {!showResult && timeRemaining > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>إعدادات الاستثمار</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">مبلغ الاستثمار (الحد الأدنى: 10)</label>
              <Input
                type="number"
                value={investedAmount}
                onChange={(e) => setInvestedAmount(e.target.value)}
                placeholder="ادخل المبلغ"
                min="10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">العملة</label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asser">Asser Coin</SelectItem>
                  <SelectItem value="usdt">USDT</SelectItem>
                  <SelectItem value="egp">EGP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Doors */}
      <Card>
        <CardHeader>
          <CardTitle>اختر الباب الصحيح (1-10)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4 max-w-2xl mx-auto">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((doorNumber) => (
              <Button
                key={doorNumber}
                variant={selectedDoor === doorNumber ? "default" : "outline"}
                onClick={() => handleDoorClick(doorNumber)}
                disabled={timeRemaining === 0 || showResult}
                className={`aspect-square text-lg font-bold relative ${
                  showResult && gameResult?.correctAnswer === doorNumber 
                    ? "bg-green-500 hover:bg-green-600" 
                    : ""
                } ${
                  showResult && selectedDoor === doorNumber && !gameResult?.isCorrect
                    ? "bg-red-500 hover:bg-red-600"
                    : ""
                }`}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-2xl mb-1">👻</div>
                  <div>{doorNumber}</div>
                  {showResult && gameResult?.correctAnswer === doorNumber && (
                    <div className="absolute -top-2 -right-2 text-green-600">✓</div>
                  )}
                </div>
              </Button>
            ))}
          </div>

          {selectedDoor && !showResult && timeRemaining > 0 && (
            <div className="text-center mt-6">
              <p className="mb-4">اخترت الباب رقم: {selectedDoor}</p>
              <Button 
                onClick={handleParticipate} 
                disabled={loading || !investedAmount}
                className="px-8 py-2"
              >
                {loading ? "جاري المشاركة..." : "تأكيد المشاركة"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Game Result */}
      {showResult && gameResult && (
        <Card>
          <CardHeader>
            <CardTitle className={gameResult.isCorrect ? "text-green-600" : "text-red-600"}>
              نتيجة اللعبة
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-lg">
              الباب الصحيح كان: <span className="font-bold">{gameResult.correctAnswer}</span>
            </div>
            <div className="text-lg">
              اختيارك: <span className="font-bold">{selectedDoor}</span>
            </div>
            {gameResult.isCorrect ? (
              <div className="text-green-600 space-y-2">
                <div className="text-xl font-bold">✓ إجابة صحيحة!</div>
                <div>حصلت على مكافأة: {gameResult.reward} {currency.toUpperCase()}</div>
              </div>
            ) : (
              <div className="text-red-600">
                <div className="text-xl font-bold">✗ إجابة خاطئة</div>
                <div>لم تخسر المبلغ المستثمر، فقط لا تحصل على المكافأة</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Participation History */}
      {participations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>سجل المشاركات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {participations.slice(0, 5).map((participation) => (
                <div 
                  key={participation.id} 
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium">
                      مبلغ: {participation.investedAmount} {participation.currency.toUpperCase()}
                    </div>
                    <div className="text-sm text-gray-600">
                      الباب المختار: {participation.selectedDoor}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${participation.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      {participation.isCorrect ? '✓ صحيح' : '✗ خطأ'}
                    </div>
                    {participation.isCorrect && (
                      <div className="text-sm text-green-600">
                        مكافأة: {participation.reward}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Game Rules */}
      <Card>
        <CardHeader>
          <CardTitle>قواعد اللعبة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>• قم بحل الاستراتيجية المعروضة للحصول على رقم بين 1-10</div>
          <div>• اختر الباب الذي يحمل الرقم الصحيح</div>
          <div>• الحد الأدنى للاستثمار: 10 عملة</div>
          <div>• عند الإجابة الصحيحة: تحصل على مكافأة 2% من المبلغ المستثمر</div>
          <div>• عند الإجابة الخاطئة: لا تخسر المبلغ المستثمر، فقط لا تحصل على المكافأة</div>
          <div>• اللعبة مبنية على مهارة التفكير الاستراتيجي وليس الحظ</div>
        </CardContent>
      </Card>
    </div>
  );
}