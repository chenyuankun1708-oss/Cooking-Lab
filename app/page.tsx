import { RecipeDiscovery } from "@/components/recipe-discovery";
import { ingredients } from "@/data/ingredients";
import { recipes } from "@/data/recipes";
import Link from "next/link";

export default function Home() {
  return (
    <main>
      <section className="border-b border-stone-200 bg-[#173f35] px-5 py-14 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-sm font-semibold tracking-[.22em] text-emerald-200">COOKING LAB · DECISION INTERFACE</p>
          <h1 className="max-w-4xl text-4xl font-bold leading-tight sm:text-6xl">说出你现在的条件，找到最适合做的料理。</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-emerald-50/80 sm:text-lg">组合现有食材、时间、每份营养、预算与厨具限制；结果会即时更新，并解释为什么匹配。</p>
          <Link href="/recipes" className="mt-7 inline-flex min-h-11 items-center rounded-xl border border-white/30 px-5 font-semibold text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">浏览全部 30 道菜 →</Link>
        </div>
      </section>
      <RecipeDiscovery recipes={recipes} ingredients={ingredients} />
      <p className="mx-auto max-w-7xl px-5 pb-10 text-sm text-stone-500">本版本营养与价格为 demo 估算，用于产品和计算逻辑验证，不构成医学或个体化营养建议。</p>
    </main>
  );
}
