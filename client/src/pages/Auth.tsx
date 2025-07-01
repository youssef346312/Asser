import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const loginSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

const registerSchema = z.object({
  fullName: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  email: z.string().email("البريد الإلكتروني غير صحيح").refine(
    (email) => email.endsWith("@gmail.com"),
    "يجب استخدام Gmail فقط"
  ),
  phone: z.string().optional(),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  referralCode: z.string().optional(),
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

export default function Auth() {
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", phone: "", password: "", referralCode: "" },
  });

  const onLogin = async (data: LoginData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (response.ok) {
        login(result.token, result.user);
        toast({
          title: "تم تسجيل الدخول",
          description: "مرحباً بك مرة أخرى",
        });
        // Force navigation to home page
        window.location.href = "/home";
      } else {
        toast({
          title: "خطأ",
          description: result.message || "فشل تسجيل الدخول",
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

  const onRegister = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (response.ok) {
        localStorage.setItem("verification_data", JSON.stringify({
          userId: result.userId,
          verificationId: result.verificationId,
          email: data.email,
          phone: data.phone,
          devCodes: result.devCodes || null,
        }));
        
        if (result.devCodes) {
          toast({
            title: "تم الإرسال",
            description: `كود البريد: ${result.devCodes.emailCode}${result.devCodes.phoneCode ? ` | كود الهاتف: ${result.devCodes.phoneCode}` : ''}`,
            duration: 10000,
          });
        } else {
          toast({
            title: "تم الإرسال",
            description: "تم إرسال رموز التحقق إلى بريدك وهاتفك",
          });
        }
        setLocation("/verification");
      } else {
        toast({
          title: "خطأ",
          description: result.message || "فشل التسجيل",
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 asser-gradient-accent rounded-full flex items-center justify-center mx-auto mb-4">
            <Coins className="text-white text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">منصة آسر</h1>
          <p className="text-gray-600 text-sm">منصة الألعاب والمكافآت</p>
        </div>

        {/* Auth Tabs */}
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <Button
            variant={authMode === "login" ? "default" : "ghost"}
            className="flex-1 text-sm"
            onClick={() => setAuthMode("login")}
          >
            تسجيل دخول
          </Button>
          <Button
            variant={authMode === "register" ? "default" : "ghost"}
            className="flex-1 text-sm"
            onClick={() => setAuthMode("register")}
          >
            حساب جديد
          </Button>
        </div>

        {/* Login Form */}
        {authMode === "login" && (
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="email" 
                        placeholder="example@gmail.com"
                        className="asser-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كلمة المرور</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="password" 
                        placeholder="••••••••"
                        className="asser-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full asser-button-primary"
                disabled={isLoading}
              >
                {isLoading ? "جاري تسجيل الدخول..." : "تسجيل دخول"}
              </Button>
            </form>
          </Form>
        )}

        {/* Register Form */}
        {authMode === "register" && (
          <Form {...registerForm}>
            <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
              <FormField
                control={registerForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم الكامل</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="محمد أحمد"
                        className="asser-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={registerForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني (Gmail فقط)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="email" 
                        placeholder="example@gmail.com"
                        className="asser-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={registerForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الهاتف (اختياري)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="tel" 
                        placeholder="+20 123 456 7890"
                        className="asser-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={registerForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كلمة المرور</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="password" 
                        placeholder="••••••••"
                        className="asser-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={registerForm.control}
                name="referralCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كود الدعوة (اختياري)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="12345"
                        className="asser-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full asser-button-primary"
                disabled={isLoading}
              >
                {isLoading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
              </Button>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}
