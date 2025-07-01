import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function AdminPanel() {
  const { user, getAuthHeaders } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ fullName: "", userId: "" });
  const [exchangeRateForm, setExchangeRateForm] = useState({
    usdtToAsser: "",
    egpToAsser: "",
    asserToUsdt: "",
    asserToEgp: ""
  });

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await fetch("/api/admin/users", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  // Fetch payment requests with auto-refresh
  const { data: paymentRequests = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ["/api/admin/payment-requests"],
    queryFn: async () => {
      const response = await fetch("/api/admin/payment-requests", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch payment requests");
      return response.json();
    },
    refetchInterval: 3000, // Refresh every 3 seconds
    refetchOnWindowFocus: true,
  });

  // Fetch payment approvals
  const { data: paymentApprovals = [], isLoading: approvalsLoading } = useQuery({
    queryKey: ["/api/admin/payment-approvals"],
    queryFn: async () => {
      const response = await fetch("/api/admin/payment-approvals", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch payment approvals");
      return response.json();
    },
    refetchInterval: 3000,
  });

  // Fetch exchange rates
  const { data: exchangeRates } = useQuery({
    queryKey: ["/api/admin/exchange-rates"],
    queryFn: async () => {
      const response = await fetch("/api/exchange-rates", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch exchange rates");
      return response.json();
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (userData: { id: number; fullName: string; userId: string }) => {
      const response = await fetch(`/api/admin/users/${userData.id}`, {
        method: "PUT",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: userData.fullName, userId: userData.userId }),
      });
      if (!response.ok) throw new Error("Failed to update user");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "تم تحديث المستخدم بنجاح" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditingUser(null);
    },
    onError: () => {
      toast({ title: "فشل في تحديث المستخدم", variant: "destructive" });
    },
  });

  // Process payment request mutation
  const processPaymentMutation = useMutation({
    mutationFn: async (data: { id: number; approved: boolean }) => {
      const response = await fetch(`/api/admin/payment-requests/${data.id}`, {
        method: "PUT",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ approved: data.approved }),
      });
      if (!response.ok) throw new Error("Failed to process payment request");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "تم معالجة الطلب بنجاح" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-requests"] });
    },
    onError: () => {
      toast({ title: "فشل في معالجة الطلب", variant: "destructive" });
    },
  });

  // Process approval mutation
  const processApprovalMutation = useMutation({
    mutationFn: async ({ approvalId, approved }: { approvalId: number; approved: boolean }) => {
      const response = await fetch(`/api/admin/payment-approvals/${approvalId}`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ approved }),
      });
      if (!response.ok) throw new Error("Failed to process approval");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-approvals"] });
      toast({
        title: "تم",
        description: "تم معالجة طلب الموافقة بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في معالجة طلب الموافقة",
        variant: "destructive",
      });
    },
  });

  // Reset all balances mutation
  const resetBalancesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/reset-balances", {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to reset balances");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم",
        description: "تم إعادة تعيين جميع الأرصدة إلى الصفر",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إعادة تعيين الأرصدة",
        variant: "destructive",
      });
    },
  });

  const clearFarmsAndBalancesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/clear-all-farms-and-balances", {
        method: "POST",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("فشل في مسح المزارع والأرصدة");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم المسح بنجاح",
        description: "تم مسح جميع المزارع والأرصدة من جميع المستخدمين",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في مسح المزارع والأرصدة",
        variant: "destructive",
      });
    },
  });

  // Update exchange rates mutation
  const updateExchangeRatesMutation = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/exchange-rates"] });
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

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setEditForm({ fullName: user.fullName, userId: user.userId });
  };

  const handleUpdateUser = () => {
    if (editingUser) {
      updateUserMutation.mutate({
        id: editingUser.id,
        fullName: editForm.fullName,
        userId: editForm.userId,
      });
    }
  };

  const handleProcessPayment = (id: number, approved: boolean) => {
    processPaymentMutation.mutate({ id, approved });
  };

  if (!user?.isAdmin) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-red-600">غير مسموح لك بالوصول لهذه الصفحة</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">لوحة التحكم الإدارية</h1>

      <Tabs defaultValue="payments" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1">
          <TabsTrigger value="payments" className="text-xs sm:text-sm">طلبات الدفع</TabsTrigger>
          <TabsTrigger value="approvals" className="text-xs sm:text-sm">موافقات الحسابات</TabsTrigger>
          <TabsTrigger value="users" className="text-xs sm:text-sm">إدارة المستخدمين</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs sm:text-sm">الإعدادات</TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>طلبات السحب والإيداع</CardTitle>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <p>جاري التحميل...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المستخدم</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>العملة</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentRequests.map((request: any) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{request.fullName}</div>
                            <div className="text-sm text-gray-500">{request.phoneNumber}</div>
                            {request.user && (
                              <div className="text-xs text-gray-400">{request.user.email}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={request.type === "withdrawal" ? "destructive" : "secondary"}>
                            {request.type === "withdrawal" ? "سحب" : "إيداع"}
                          </Badge>
                        </TableCell>
                        <TableCell>{request.amount}</TableCell>
                        <TableCell>{request.currency.toUpperCase()}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              request.status === "approved"
                                ? "default"
                                : request.status === "rejected"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {request.status === "pending"
                              ? "قيد المراجعة"
                              : request.status === "approved"
                              ? "موافق عليه"
                              : "مرفوض"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {request.status === "pending" ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  console.log("Processing approval for request", request.id);
                                  handleProcessPayment(request.id, true);
                                }}
                                disabled={processPaymentMutation.isPending}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                {processPaymentMutation.isPending ? "جاري المعالجة..." : "موافقة"}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  console.log("Processing rejection for request", request.id);
                                  handleProcessPayment(request.id, false);
                                }}
                                disabled={processPaymentMutation.isPending}
                              >
                                {processPaymentMutation.isPending ? "جاري المعالجة..." : "رفض"}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">تم المعالجة</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle>طلبات الموافقة على حسابات الدفع</CardTitle>
            </CardHeader>
            <CardContent>
              {approvalsLoading ? (
                <p>جاري التحميل...</p>
              ) : paymentApprovals.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لا توجد طلبات موافقة</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المستخدم</TableHead>
                      <TableHead>نوع الطلب</TableHead>
                      <TableHead>العملة</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>تاريخ الطلب</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentApprovals.map((approval: any) => (
                      <TableRow key={approval.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{approval.user?.fullName}</div>
                            <div className="text-sm text-gray-500">{approval.user?.email}</div>
                            <div className="text-xs text-gray-400">ID: {approval.user?.userId}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={approval.paymentType === "withdrawal" ? "destructive" : "secondary"}>
                            {approval.paymentType === "withdrawal" ? "سحب" : "إيداع"}
                          </Badge>
                        </TableCell>
                        <TableCell>{approval.currency.toUpperCase()}</TableCell>
                        <TableCell>
                          <Badge
                            variant={approval.isApproved ? "default" : "secondary"}
                          >
                            {approval.isApproved ? "موافق عليه" : "قيد المراجعة"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(approval.createdAt).toLocaleDateString('ar-EG')}
                        </TableCell>
                        <TableCell>
                          {!approval.isApproved ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  processApprovalMutation.mutate({
                                    approvalId: approval.id,
                                    approved: true
                                  });
                                }}
                                disabled={processApprovalMutation.isPending}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                {processApprovalMutation.isPending ? "جاري المعالجة..." : "موافقة"}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  processApprovalMutation.mutate({
                                    approvalId: approval.id,
                                    approved: false
                                  });
                                }}
                                disabled={processApprovalMutation.isPending}
                              >
                                {processApprovalMutation.isPending ? "جاري المعالجة..." : "رفض"}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">تم المعالجة</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-6">
            {/* Exchange Rates */}
            <Card>
              <CardHeader>
                <CardTitle>أسعار الصرف</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>USDT إلى AsserCoin</Label>
                    <Input
                      type="number"
                      value={exchangeRateForm.usdtToAsser}
                      onChange={(e) => setExchangeRateForm(prev => ({ ...prev, usdtToAsser: e.target.value }))}
                      placeholder={exchangeRates?.usdtToAsser || "10"}
                    />
                  </div>
                  <div>
                    <Label>EGP إلى AsserCoin</Label>
                    <Input
                      type="number"
                      value={exchangeRateForm.egpToAsser}
                      onChange={(e) => setExchangeRateForm(prev => ({ ...prev, egpToAsser: e.target.value }))}
                      placeholder={exchangeRates?.egpToAsser || "0.2"}
                    />
                  </div>
                  <div>
                    <Label>AsserCoin إلى USDT</Label>
                    <Input
                      type="number"
                      value={exchangeRateForm.asserToUsdt}
                      onChange={(e) => setExchangeRateForm(prev => ({ ...prev, asserToUsdt: e.target.value }))}
                      placeholder={exchangeRates?.asserToUsdt || "0.1"}
                    />
                  </div>
                  <div>
                    <Label>AsserCoin إلى EGP</Label>
                    <Input
                      type="number"
                      value={exchangeRateForm.asserToEgp}
                      onChange={(e) => setExchangeRateForm(prev => ({ ...prev, asserToEgp: e.target.value }))}
                      placeholder={exchangeRates?.asserToEgp || "5"}
                    />
                  </div>
                </div>
                <Button
                  onClick={() => updateExchangeRatesMutation.mutate(exchangeRateForm)}
                  disabled={updateExchangeRatesMutation.isPending}
                  className="w-full"
                >
                  {updateExchangeRatesMutation.isPending ? "جاري التحديث..." : "تحديث أسعار الصرف"}
                </Button>
              </CardContent>
            </Card>

            {/* Dangerous Actions */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">إجراءات خطيرة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => {
                    if (confirm("هل أنت متأكد من إعادة تعيين جميع أرصدة المستخدمين إلى الصفر؟ هذا الإجراء لا يمكن التراجع عنه!")) {
                      resetBalancesMutation.mutate();
                    }
                  }}
                  disabled={resetBalancesMutation.isPending}
                  variant="destructive"
                  className="w-full"
                >
                  {resetBalancesMutation.isPending ? "جاري إعادة التعيين..." : "إعادة تعيين جميع الأرصدة إلى الصفر"}
                </Button>

                <Button
                  onClick={() => clearFarmsAndBalancesMutation.mutate()}
                  disabled={clearFarmsAndBalancesMutation.isPending}
                  variant="destructive"
                  className="w-full"
                >
                  {clearFarmsAndBalancesMutation.isPending ? "جاري المسح..." : "مسح جميع المزارع والأرصدة"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>إدارة المستخدمين</CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <p>جاري التحميل...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم الكامل</TableHead>
                      <TableHead>البريد الإلكتروني</TableHead>
                      <TableHead>معرف المستخدم</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.fullName}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.userId}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {user.isVerified && <Badge variant="default">مفعل</Badge>}
                            {user.isAdmin && <Badge variant="secondary">مدير</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => handleEditUser(user)}>
                            تعديل
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل بيانات المستخدم</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">الاسم الكامل</Label>
              <Input
                id="fullName"
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="userId">معرف المستخدم</Label>
              <Input
                id="userId"
                value={editForm.userId}
                onChange={(e) => setEditForm({ ...editForm, userId: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdateUser} disabled={updateUserMutation.isPending}>
                حفظ التغييرات
              </Button>
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}