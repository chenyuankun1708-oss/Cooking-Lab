# Source And Rights Policy

最近更新：2026-09-05

## Source Audit

#38 的 Source/Evidence contract 已能表达 HTTPS 页面、DOI、ISBN、archive/catalog identity 和 physical citation，Evidence 可以记录 page/chapter/section/paragraph/timestamp/folio。#39 的真实研究练习只暴露了三个最小缺口：

- SourceType 缺少 library、official cultural institution、open educational resource、open media 和 patent 等实际类别。
- Source 没有记录 active/unreachable/moved/superseded/rights-changed 的健康状态。
- ResearchRecord 不存在，无法解释为什么接受、拒绝或降级某一 claim。

本轮只补齐这些边界以及 open-license obligation；没有重做 #38。`Source.reliability` 仍是编辑判断，不是真假概率；`Source.rights` 控制复用边界，不代表事实强度；`Evidence` 独占 claim relationship 和来源内部 locator。

| Audit question | Conclusion |
| --- | --- |
| Already expressible | Web pages, offline books, journals, DOI/ISBN records, archives/holdings, supports/contradicts/context Evidence, and all four Story claim kinds |
| Previously difficult | Provider catalogs, explicit library/open-media/patent identity, link-rot state, and retained accepted/rejected editorial decisions |
| Overly strict | No remaining real ingestion blocker was found after #38 removed mandatory Web URLs; Evidence locators correctly remain optional when the whole work is relevant |
| Insufficiently strict | Open-license obligations were incomplete, Source health was absent, and unresolved/changed rights could pass publishing eligibility |
| Source metadata | Bibliographic identity, retrievable locators, rights, health, reliability assessment and source-level notes |
| Evidence | Claim relationship, strength, source-internal location and evidence-specific interpretation |
| Editorial judgment | Credibility, claim kind, uncertainty wording, copyright ambiguity and final publication decision |

## Source Catalog

`data/research/evaluated-sources.ts` 是经过评估、值得持续参考的 provider/resource catalog，不是 production Evidence registry，也不表示其中全部内容均可复用。

| Resource | Type / content | Rights | Copy / adapt | Attribution / SA | Facts | Images | Recipe structure | Main risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [Wikimedia Commons](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia) | open media | file-specific | review each file | file-specific | secondary only | good after file audit | poor | license and third-party rights vary |
| [Wikibooks Cookbook](https://en.wikibooks.org/wiki/Cookbook:Table_of_Contents) | open educational recipes | generally CC BY-SA | yes under exact terms | attribution + share alike | useful, verify | limited | good as secondary input | community quality varies |
| [Library of Congress](https://www.loc.gov/free-to-use/) | library collections | collection/item-specific | review each item | item-specific | excellent primary material | good in cleared sets | historical only | access does not prove public domain |
| [Internet Archive](https://archive.org/) | digitized archive | item-specific | review each item | item-specific | strong locator/discovery value | item-specific | historical editions | uploader metadata and rights vary |
| [Smithsonian Open Access](https://www.si.edu/openaccess) | museum records/assets | CC0 only when marked | yes for marked assets | not required, attribution preferred | strong object context | good for marked assets | limited | not all Smithsonian content is open |
| [UNESCO ICH](https://ich.unesco.org/en/lists) | official cultural records | reference-only unless stated | no site prose reuse | cite institution | strong for inscription and attributed tradition | separate rights | poor | inscription does not prove exclusive origin |
| [Food Culture of Taiwan](https://www.fcdc.org.tw/en-us/summary-detail/%E2%80%9CWith-No-Meat,-One-Becomes-Thin%E2%80%9D:--The-Invention-and-Spread-of-Dongpo-Pork-i.43) | academic food history | reference-only | no prose reuse | citation required | strong scholarly argument | no | context only | one paper is not final consensus |
| [Specialty Coffee Association](https://sca.coffee/) | professional coffee material | reference-only | no prose reuse | citation required | strong for current professional practice | separate rights | technical context | definitions evolve |
| [Smithsonian Magazine](https://www.smithsonianmag.com/) | reputable editorial secondary | reference-only | no prose reuse | citation required | good orientation/cross-check | separate rights | limited | narrative can compress disagreement |
| [Google Patents](https://patents.google.com/) | patent records | record/jurisdiction-specific | review document | item-specific | strong for filing chronology | poor | equipment history | patent is not proof of first invention |
| [De'Longhi Manuals](https://www.delonghi.com/en-us/manuals) | producer documentation | reference-only | no text/diagram reuse | citation required | strong for named equipment | no | equipment-specific | model-specific and movable URLs |

The table is a discovery and policy aid. Every production Source still requires its own bibliographic identity, locator, rights judgment and editorial note.

## Facts And Creative Expression

Facts can be researched, compared and expressed in Cooking Lab's own words. Copyrighted creative expression cannot be copied merely because a page is publicly accessible.

Commercial recipe sites are reference-only unless an explicit compatible license or permission says otherwise. Do not copy introductions, instruction wording, chef notes, descriptive prose, photographs or page structure. Similar cooking facts must be synthesized from multiple sources and culinary review, then independently structured and written.

## Rights Status

- `public-domain`：record the legal/institutional basis; public availability alone is insufficient.
- `open-license`：record exact `licenseId`, HTTPS license URL, attribution text, whether material is unmodified/adapted/not reused, share-alike requirement and notes.
- `permission-granted`：retain the grant scope and conditions in notes.
- `reference-only`：facts may inform original writing; source expression is not reused.
- `unknown`：may remain a research candidate, but cannot authorize copying or a reusable asset.

CC BY, CC BY-SA, CC0 and Public Domain are not interchangeable. Attribution, adaptation marking and share-alike must follow the exact version and work-level license. A Source record identifies the work and author/institution; its rights record identifies the intended Cooking Lab use.

## Image Separation

Text Source rights never authorize an image. Images continue through `RecipeImage` provenance with original file page, author, exact license, attribution, asset match and allowed transformations. A CC BY-SA article can contain an image under another license; a public-domain scan can appear on a copyrighted page. `docs/IMAGE_SYSTEM.md` remains canonical for image ingestion.

## Source Persistence And Link Rot

Cooking Lab retains its own structured knowledge, Source metadata, locators, access date, health observation, rights judgment, Evidence notes and claim relationship. It does not mirror whole copyrighted articles, books or recipe prose.

`Source.health` records `active | unreachable | moved | superseded | rights-changed` plus `checkedAt`. Non-active states require notes. This is an observation about retrieval or rights, not a reliability score:

- `unreachable` does not erase a valid physical/DOI/archive identity or automatically disprove a claim.
- `moved` means locators should be updated while retaining the former identity in editorial notes when useful.
- `superseded` keeps the historical Source available but prompts review of current claims.
- `rights-changed` immediately triggers rights review; previously copied assets/content may need removal even when facts remain usable.

Publishing eligibility blocks Sources whose rights remain `unknown` or whose health is `rights-changed`. Other health states remain visible to editorial review because a moved URL or superseded edition can still be valid historical Evidence when its bibliographic identity is retrievable.

Future automation may check response status, redirects, duplicate locators and missing `accessedAt`. It cannot decide credibility, historical truth, copyright ambiguity or publication. No scheduler exists in this Issue.

## Registry Responsibilities

Source Registry answers: “What source is this, and how can an editor retrieve it?” It owns title, authorship/institution, publication metadata, locators, rights, health, reliability assessment and editorial notes.

Evidence Registry answers: “Which part of that source bears on a claim?” It owns Source ID, `supports / contradicts / context`, strength, page/chapter/section/paragraph/timestamp/folio and the evidence note.

ResearchRecord answers: “Why did the editorial team accept, reject, include, exclude or defer this material?” It links accepted Sources and considered Evidence without becoming a production Story.

Story Claim owns the publishable semantic assertion and language class. These registries must not be flattened into a generic tag or URL list.

## Reliability Policy

`primary | authoritative-secondary | general-secondary | contested` is an editorial assessment of the Source's role for a specific research context. It is not a confidence percentage. A primary source can be biased, mistaken, period-bound, or unable to prove a modern claim. An authoritative secondary source can still describe only one institution's interpretation. Conflicting Evidence remains present; it is not deleted to manufacture certainty.

AI-generated prose, search snippets and unattributed summaries are never Evidence. They may suggest search terms but cannot close a research question.

## Production Use In #40

当前 6 个 production Story 使用 7 个具体 Source。每个 claim 只陈述来源能支持的窄事实或传统；东坡肉保留 disputed attribution，UNESCO 名录不被扩大为唯一 origin 证明，Espresso 明确为多阶段发展。Fino 的官方产区资料只支持酒花膜下生物熟成这一窄生产事实。

没有可靠 source 的 item 不创建 Story。现代 preparation、Flavor 和服务说明可以作为原创编辑内容发布，但不得借空 Story、provider 首页或随意 URL 冒充文化 provenance。图片 license 继续由独立 image registry 管理，文字 Source 权利状态不会自动授权页面内图片。
