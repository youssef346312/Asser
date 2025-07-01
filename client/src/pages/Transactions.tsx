import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { 
  ArrowUpDown, 
  Coins,
  RefreshCw,
  TrendingUp,
  Wallet,
  DollarSign,
  Banknote
} from "lucide-react";

export default function Transactions() {
  const { getAuthHeaders } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [fromCurrency, setFromCurrency] = useState("asser");
  const [toCurrency, setToCurrency] = useState("usdt");
  const [amount, setAmount] = useState("");
  const [isQuickExchange, setIsQuickExchange] = useState(true);
  const [isTransfer, setIsTransfer] = useState(false);
  const [transferUserId, setTransferUserId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");

  const { data: exchangeRates, isLoading: ratesLoading } = useQuery({
    queryKey: ["/api/exchange-rates"],
    queryFn: async () => {
      const response = await fetch("/api/exchange-rates", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch rates");
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

  const exchangeMutation = useMutation({
    mutationFn: async (data: { fromCurrency: string; toCurrency: string; amount: string }) => {
      const response = await fetch("/api/exchange", {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Exchange failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم التحويل بنجاح",
        description: `تم تحويل ${data.fromAmount} ${fromCurrency.toUpperCase()} إلى ${data.toAmount} ${toCurrency.toUpperCase()}`,
      });
      setAmount("");
      queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التحويل",
        description: error.message || "حدث خطأ أثناء التحويل",
        variant: "destructive",
      });
    },
  });

  const transferMutation = useMutation({
    mutationFn: async (data: { recipientUserId: string; amount: string }) => {
      const response = await fetch("/api/transfer/asser-coin", {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Transfer failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم التحويل بنجاح",
        description: `تم تحويل ${data.transferAmount} AC إلى المستخدم ${data.recipientUserId} (رسوم: ${data.transferFee} AC)`,
      });
      setTransferUserId("");
      setTransferAmount("");
      queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التحويل",
        description: error.message || "حدث خطأ أثناء التحويل",
        variant: "destructive",
      });
    },
  });

  const currencies = [
    { 
      id: "asser", 
      name: "AC", 
      fullName: "AsserCoin",
      icon: <Coins className="h-6 w-6" />,
      color: "bg-gradient-to-r from-purple-500 to-blue-500",
      balance: balance?.asserCoin || "0"
    },
    { 
      id: "usdt", 
      name: "USDT", 
      fullName: "Tether USD",
      icon: <DollarSign className="h-6 w-6" />,
      color: "bg-gradient-to-r from-green-500 to-emerald-500",
      balance: balance?.usdt || "0"
    },
    { 
      id: "egp", 
      name: "EGP", 
      fullName: "الجنيه المصري",
      icon: <Banknote className="h-6 w-6" />,
      color: "bg-gradient-to-r from-orange-500 to-red-500",
      balance: balance?.egp || "0"
    }
  ];

  const getCurrentRate = () => {
    if (!exchangeRates) return 0;

    if (fromCurrency === "asser" && toCurrency === "usdt") {
      return parseFloat(exchangeRates.asserToUsdt || "0.02");
    } else if (fromCurrency === "asser" && toCurrency === "egp") {
      return parseFloat(exchangeRates.asserToEgp || "0.5");
    } else if (fromCurrency === "usdt" && toCurrency === "asser") {
      return parseFloat(exchangeRates.usdtToAsser || "50");
    } else if (fromCurrency === "egp" && toCurrency === "asser") {
      return parseFloat(exchangeRates.egpToAsser || "2");
    } else if (fromCurrency === "usdt" && toCurrency === "egp") {
      return 30; // 1 USDT = 30 EGP
    } else if (fromCurrency === "egp" && toCurrency === "usdt") {
      return 0.033; // 1 EGP = 0.033 USDT
    }

    return 1;
  };

  const getEstimatedAmount = () => {
    if (!amount || isNaN(parseFloat(amount))) return "0.00";
    return (parseFloat(amount) * getCurrentRate()).toFixed(2);
  };

  const swapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  const handleExchange = () => {
    if (!amount || isNaN(parseFloat(amount))) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال مبلغ صحيح",
        variant: "destructive",
      });
      return;
    }

    exchangeMutation.mutate({
      fromCurrency,
      toCurrency,
      amount,
    });
  };

  const handleTransfer = () => {
    if (!transferUserId || !transferAmount || isNaN(parseFloat(transferAmount))) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال ID المستخدم والمبلغ بشكل صحيح",
        variant: "destructive",
      });
      return;
    }

    transferMutation.mutate({
      recipientUserId: transferUserId,
      amount: transferAmount,
    });
  };

  const CurrencyCard = ({ currency, isSelected, onClick }: any) => (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
        isSelected ? "ring-2 ring-purple-500 shadow-lg" : "hover:shadow-md"
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className={`w-12 h-12 rounded-full ${currency.color} flex items-center justify-center text-white`}>
            {currency.icon}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">{currency.name}</h3>
            <p className="text-sm text-gray-500">{currency.fullName}</p>
            <p className="text-sm font-medium">الرصيد: {parseFloat(currency.balance).toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (ratesLoading) {
    return (
      <div className="p-4 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-center justify-center">
            <RefreshCw className="h-6 w-6" />
            تحويل العملات
          </CardTitle>
          <p className="text-center text-purple-100">
            حول عملاتك بسهولة وأمان
          </p>
        </CardHeader>
      </Card>

      {/* Options Toggle */}
      <div className="flex justify-center">
        <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg">
          <button
            onClick={() => {
              setIsQuickExchange(true);
              setIsTransfer(false);
            }}
            className={`px-3 py-2 rounded-md transition-all text-sm ${
              isQuickExchange && !isTransfer
                ? "bg-purple-600 text-white shadow-md" 
                : "text-gray-600 hover:bg-gray-200"
            }`}
          >
            تحويل عملات
          </button>
          <button
            onClick={() => {
              setIsTransfer(true);
              setIsQuickExchange(false);
            }}
            className={`px-3 py-2 rounded-md transition-all text-sm ${
              isTransfer 
                ? "bg-green-600 text-white shadow-md" 
                : "text-gray-600 hover:bg-gray-200"
            }`}
          >
            تحويل AC
          </button>
          <button
            onClick={() => {
              setIsQuickExchange(false);
              setIsTransfer(false);
            }}
            className={`px-3 py-2 rounded-md transition-all text-sm ${
              !isQuickExchange && !isTransfer
                ? "bg-blue-600 text-white shadow-md" 
                : "text-gray-600 hover:bg-gray-200"
            }`}
          >
            عرض الأرصدة
          </button>
        </div>
      </div>

      {isTransfer && (
      <Card>
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <DollarSign className="h-6 w-6" />
            تحويل عملة AC
          </CardTitle>
          <p className="text-center text-gray-600 text-sm">
            حول عملة AC إلى مستخدمين آخرين برسوم 2%
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Recipient User ID */}
          <div>
            <Label htmlFor="transferUserId">ID المستخدم المستلم</Label>
            <Input
              id="transferUserId"
              type="text"
              value={transferUserId}
              onChange={(e) => setTransferUserId(e.target.value)}
              placeholder="أدخل ID المستخدم (مثال: 12345)"
              className="text-lg text-center"
            />
            <p className="text-sm text-gray-500 mt-1">
              أدخل الرقم التعريفي للمستخدم المراد التحويل إليه
            </p>
          </div>

          {/* Transfer Amount */}
          <div>
            <Label htmlFor="transferAmount">مبلغ التحويل (AC)</Label>
            <Input
              id="transferAmount"
              type="number"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="أدخل المبلغ"
              className="text-lg text-center"
              step="0.001"
              min="0.01"
            />
            <p className="text-sm text-gray-500 mt-1">
              رصيدك الحالي: {parseFloat(balance?.asserCoin || "0").toFixed(3)} AC
            </p>
          </div>

          {/* Transfer Fee Info */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-yellow-800">رسوم التحويل</h3>
                <p className="text-sm text-yellow-700">
                  رسوم التحويل: 2% من المبلغ
                </p>
                {transferAmount && !isNaN(parseFloat(transferAmount)) && (
                  <div className="space-y-1">
                    <p className="text-sm">
                      المبلغ المراد تحويله: {parseFloat(transferAmount).toFixed(3)} AC
                    </p>
                    <p className="text-sm">
                      رسوم التحويل: {(parseFloat(transferAmount) * 0.02).toFixed(3)} AC
                    </p>
                    <p className="text-sm font-bold">
                      إجمالي المبلغ المخصوم: {(parseFloat(transferAmount) * 1.02).toFixed(3)} AC
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transfer Button */}
          <Button
            onClick={handleTransfer}
            disabled={!transferUserId || !transferAmount || parseFloat(transferAmount) <= 0 || transferMutation.isPending}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-lg py-6"
            size="lg"
          >
            {transferMutation.isPending ? (
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <DollarSign className="h-5 w-5 mr-2" />
            )}
            {transferMutation.isPending ? "جاري التحويل..." : "تحويل الآن"}
          </Button>
        </CardContent>
      </Card>
      )}

      {isQuickExchange && !isTransfer && (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">محول العملات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* From Currency */}
          <div>
            <Label className="text-lg font-semibold mb-3 block">من العملة</Label>
            <div className="grid grid-cols-1 gap-3">
              {currencies.map((currency) => (
                <CurrencyCard
                  key={currency.id}
                  currency={currency}
                  isSelected={fromCurrency === currency.id}
                  onClick={() => setFromCurrency(currency.id)}
                />
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <Label htmlFor="amount">المبلغ</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="أدخل المبلغ"
              className="text-lg text-center"
            />
            <p className="text-sm text-gray-500 mt-1 text-center">
              الرصيد المتاح: {parseFloat(currencies.find(c => c.id === fromCurrency)?.balance || "0").toFixed(2)} {currencies.find(c => c.id === fromCurrency)?.name}
            </p>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="lg"
              onClick={swapCurrencies}
              className="rounded-full w-16 h-16 p-0"
            >
              <ArrowUpDown className="h-6 w-6" />
            </Button>
          </div>

          {/* To Currency */}
          <div>
            <Label className="text-lg font-semibold mb-3 block">إلى العملة</Label>
            <div className="grid grid-cols-1 gap-3">
              {currencies.filter(c => c.id !== fromCurrency).map((currency) => (
                <CurrencyCard
                  key={currency.id}
                  currency={currency}
                  isSelected={toCurrency === currency.id}
                  onClick={() => setToCurrency(currency.id)}
                />
              ))}
            </div>
          </div>

          {/* Exchange Rate Info */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">سعر الصرف الحالي</p>
                <p className="text-lg font-bold">
                  1 {currencies.find(c => c.id === fromCurrency)?.name} = {getCurrentRate()} {currencies.find(c => c.id === toCurrency)?.name}
                </p>
                <p className="text-sm text-gray-500">
                  ستحصل على تقريباً: {getEstimatedAmount()} {currencies.find(c => c.id === toCurrency)?.name}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Exchange Button */}
          <Button
            onClick={handleExchange}
            disabled={!amount || parseFloat(amount) <= 0 || exchangeMutation.isPending}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg py-6"
            size="lg"
          >
            {exchangeMutation.isPending ? (
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <TrendingUp className="h-5 w-5 mr-2" />
            )}
            {exchangeMutation.isPending ? "جاري التحويل..." : "تبادل فوري"}
          </Button>
        </CardContent>
      </Card>
      )}

      {/* Balances Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            ملخص الأرصدة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {currencies.map((currency) => (
              <div key={currency.id} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className={`w-8 h-8 rounded-full ${currency.color} flex items-center justify-center text-white mx-auto mb-2`}>
                  {currency.icon}
                </div>
                <p className="font-semibold text-lg">{parseFloat(currency.balance).toFixed(2)}</p>
                <p className="text-sm text-gray-500">{currency.name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}