import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "deposit" | "withdrawal";
}

export default function PaymentModal({ isOpen, onClose, type }: PaymentModalProps) {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("egp");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [approvalStatus, setApprovalStatus] = useState<any>(null);
  const [checkingApproval, setCheckingApproval] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const checkApprovalStatus = async () => {
    setCheckingApproval(true);
    try {
      const response = await fetch(`/api/payments/approval-status/${type}/${currency}`);
      const data = await response.json();
      setApprovalStatus(data);
      
      if (!data.hasApproval) {
        // Request approval automatically
        await fetch("/api/payments/request-approval", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentType: type, currency })
        });
        setApprovalStatus({ ...data, status: "pending" });
      }
    } catch (error) {
      console.error("Error checking approval:", error);
    }
    setCheckingApproval(false);
  };

  const handleNextStep = async () => {
    if (!amount || !currency) {
      toast({
        title: "خطأ",
        description: "الرجاء ملء جميع البيانات المطلوبة",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(amount) < 50) {
      toast({
        title: "خطأ",
        description: "الحد الأدنى 50 جنيه",
        variant: "destructive",
      });
      return;
    }

    // Check approval status before proceeding
    await checkApprovalStatus();
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!fullName || !phoneNumber) {
      toast({
        title: "خطأ",
        description: "الرجاء ملء جميع البيانات المطلوبة",
        variant: "destructive",
      });
      return;
    }

    if (type === "withdrawal" && currency === "usdt" && !walletAddress) {
      toast({
        title: "خطأ",
        description: "عنوان المحفظة مطلوب للسحب بـ USDT",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const endpoint = type === "deposit" ? "/api/payments/deposit" : "/api/payments/withdraw";
      const response = await apiRequest("POST", endpoint, {
        amount,
        currency,
        fullName,
        phoneNumber,
        walletAddress: type === "withdrawal" ? walletAddress : undefined
      });

      if (response.ok) {
        const result = await response.json();
        if (type === "deposit") {
          setPaymentInfo(result.paymentInfo);
        }
        setStep(3);
        toast({
          title: "تم بنجاح",
          description: result.message,
        });
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
        description: `فشل في إرسال طلب ${type === "deposit" ? "الإيداع" : "السحب"}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setAmount("");
    setCurrency("egp");
    setFullName("");
    setPhoneNumber("");
    setWalletAddress("");
    setPaymentInfo(null);
    setApprovalStatus(null);
    onClose();
  };

  const getTitle = () => {
    return type === "deposit" ? "إيداع" : "سحب";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">اختر العملة</label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="egp">EGP</SelectItem>
                  <SelectItem value="usdt">USDT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">المبلغ (الحد الأدنى: 50)</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="ادخل المبلغ"
                min="50"
              />
            </div>

            <Button onClick={handleNextStep} className="w-full">
              تأكيد {getTitle()}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">الاسم الثلاثي</label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="ادخل اسمك الثلاثي"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">رقم الهاتف</label>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="ادخل رقم الهاتف"
              />
            </div>

            {type === "withdrawal" && currency === "usdt" && (
              <div>
                <label className="block text-sm font-medium mb-2">عنوان المحفظة</label>
                <Input
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="ادخل عنوان محفظة USDT"
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="w-full">
                رجوع
              </Button>
              <Button onClick={handleSubmit} disabled={loading} className="w-full">
                {loading ? "جاري الإرسال..." : `دفع فوري`}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            {type === "deposit" && paymentInfo && (
              <Card>
                <CardHeader>
                  <CardTitle>معلومات التحويل</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {currency === "egp" && paymentInfo.egp && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span>📱 فودافون كاش</span>
                      <span className="font-mono">{paymentInfo.egp}</span>
                    </div>
                  )}
                  {currency === "usdt" && paymentInfo.usdt && (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">عنوان المحفظة:</div>
                      <div className="p-3 bg-gray-50 rounded-lg break-all font-mono text-sm">
                        {paymentInfo.usdt}
                      </div>
                    </div>
                  )}
                  <div className="text-center space-y-2">
                    <div className="text-2xl">📷</div>
                    <div className="text-sm text-gray-600">امسح الكود أو انسخ الرقم</div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {type === "withdrawal" && (
              <Card>
                <CardHeader>
                  <CardTitle>تفاصيل السحب</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-600">المبلغ: {amount} {currency.toUpperCase()}</div>
                    <div className="text-sm text-blue-600">الاسم: {fullName}</div>
                    <div className="text-sm text-blue-600">الهاتف: {phoneNumber}</div>
                    {walletAddress && (
                      <div className="text-sm text-blue-600">المحفظة: {walletAddress}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="text-center space-y-2">
              <div className="text-green-600 font-bold">✓ تم إرسال الطلب بنجاح</div>
              <div className="text-sm text-gray-600">
                {type === "deposit" 
                  ? "قم بالتحويل وسيتم إضافة المبلغ خلال دقائق" 
                  : "سيتم مراجعة طلب السحب وتحويل المبلغ خلال ساعات قليلة"
                }
              </div>
            </div>

            <Button onClick={handleClose} className="w-full">
              إغلاق
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}