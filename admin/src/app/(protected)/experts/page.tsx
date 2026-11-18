import { redirect } from "next/navigation";
import { ExpertList } from "@/features/experts/server/components/expert-list";
import { loadExperts } from "@/features/experts/server/loaders/load-experts";
import { getCurrentAdmin } from "@/features/auth/server/lib/auth-server";
import { routes } from "@/lib/routes";

export default async function ExpertsPage() {
  const currentAdmin = await getCurrentAdmin();

  if (!currentAdmin) {
    redirect(routes.login());
  }

  const experts = await loadExperts();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">連絡先を残した回答者</h1>

      <p className="-mt-6 mb-8 text-gray-600">
        インタビューの最後に「専門家として登録」を選び、名前と連絡先を残した回答者です。追加で話を聞きたいときに使えます。
      </p>

      <section className="rounded-lg border bg-white p-6">
        <ExpertList experts={experts} />
      </section>
    </div>
  );
}
