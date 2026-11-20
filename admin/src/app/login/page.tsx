import Image from "next/image";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/client/components/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md overflow-hidden pt-0">
        <div className="flex justify-center bg-[#1f2a44] px-6 py-5">
          <Image
            src="/img/tenjo-logo-white.png"
            alt="TENJO KANAZAWA"
            width={240}
            height={102}
            priority
          />
        </div>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            管理者ログイン
          </CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            TENJOインタビュー 管理画面
          </p>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading...</div>}>
            <LoginForm />
          </Suspense>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">© TENJO KANAZAWA</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
