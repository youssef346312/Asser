import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const verificationSchema = z.object({
  emailCode: z.string().length(6, "كود البريد يجب أن يكون 6 أرقام"),
  phoneCode: z.string().optional(),
});

type VerificationData = z.infer<typeof verificationSchema>;

export default function Verification() {
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();
  const form = useForm<VerificationData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: { emailCode: "", phoneCode: "" },
  });

  const onSubmit = async (data: VerificationData) => {
    setIsLoading(true);
    try {
      const verificationData = localStorage.getItem("verification_data");
      if (!verificationData) {
        toast({
          title: "خطأ",
          description: "بيانات التحقق غير موجودة",
          variant: "destructive",
        });
        setLocation("/");
        return;
      }

      const { verificationId } = JSON.parse(verificationData);

      const verificationPayload: any = {
        verificationId,
        emailCode: data.emailCode,
      };

      // Only include phoneCode if it was provided
      if (data.phoneCode) {
        verificationPayload.phoneCode = data.phoneCode;
      }

      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(verificationPayload),
      });

      const result = await response.json();

      if (response.ok) {
        localStorage.removeItem("verification_data");
        login(result.token, result.user);
        toast({
          title: "تم التحقق بنجاح",
          description: "مرحباً بك في منصة آسر",
        });
        window.location.href = "/home";
      } else {
        toast({
          title: "خطأ",
          description: result.message || "فشل التحقق",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ في الاتصال",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen asser-gradient-primary flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center animate-slide-up">
        <div className="w-16 h-16 asser-gradient-secondary rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="text-white text-2xl" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">تحقق من الهوية</h2>
        <p className="text-gray-600 mb-6">تم إرسال رمز التحقق إلى بريدك الإلكتروني</p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="emailCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>كود التحقق من البريد</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="text" 
                      placeholder="123456"
                      maxLength={6}
                      className="asser-input text-center font-inter text-lg tracking-wider"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full asser-button-secondary"
              disabled={isLoading}
            >
              {isLoading ? "جاري التحقق..." : "تأكيد التحقق"}
            </Button>
          </form>
        </Form>

        <div className="mt-4">
          <Button 
            variant="outline" 
            onClick={() => setLocation("/")}
            className="text-sm"
          >
            العودة للتسجيل
          </Button>
        </div>
      </div>
    </div>
  );
}