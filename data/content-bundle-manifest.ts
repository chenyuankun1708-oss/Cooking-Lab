import type { ContentBundleManifestV1 } from "@/types/content-bundle";

// Deliberately committed rather than derived at runtime. The content audit compares
// this review checkpoint with the live published boundary and fails when it is stale.
export const publishedContentBundleManifest = {
  "version": 1,
  "entries": [
    {
      "itemId": "apple-crumble",
      "slug": "apple-crumble",
      "itemType": "dessert",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "apple-crumble-hero",
      "usageDecisionIds": [
        "usage-apple-crumble-cost",
        "usage-apple-crumble-hero-image",
        "usage-apple-crumble-identity",
        "usage-apple-crumble-nutrition",
        "usage-apple-crumble-preparation"
      ]
    },
    {
      "itemId": "cantonese-ginger-scallion-fish",
      "slug": "cantonese-ginger-scallion-fish",
      "itemType": "dish",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "cantonese-ginger-scallion-fish-hero",
      "usageDecisionIds": [
        "usage-cantonese-ginger-scallion-fish-cost",
        "usage-cantonese-ginger-scallion-fish-hero-image",
        "usage-cantonese-ginger-scallion-fish-identity",
        "usage-cantonese-ginger-scallion-fish-nutrition",
        "usage-cantonese-ginger-scallion-fish-preparation"
      ]
    },
    {
      "itemId": "cantonese-mushroom-steamed-chicken",
      "slug": "cantonese-mushroom-steamed-chicken",
      "itemType": "dish",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "cantonese-mushroom-steamed-chicken-hero",
      "usageDecisionIds": [
        "usage-cantonese-mushroom-steamed-chicken-cost",
        "usage-cantonese-mushroom-steamed-chicken-hero-image",
        "usage-cantonese-mushroom-steamed-chicken-identity",
        "usage-cantonese-mushroom-steamed-chicken-nutrition",
        "usage-cantonese-mushroom-steamed-chicken-preparation"
      ]
    },
    {
      "itemId": "chaoshan-fish-congee",
      "slug": "chaoshan-fish-congee",
      "itemType": "dish",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "chaoshan-fish-congee-hero",
      "usageDecisionIds": [
        "usage-chaoshan-fish-congee-cost",
        "usage-chaoshan-fish-congee-hero-image",
        "usage-chaoshan-fish-congee-identity",
        "usage-chaoshan-fish-congee-nutrition",
        "usage-chaoshan-fish-congee-preparation"
      ]
    },
    {
      "itemId": "dongpo-pork",
      "slug": "dongpo-pork",
      "itemType": "dish",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [
        "dongpo-pork-name-and-attribution"
      ],
      "primaryImageId": "dongpo-pork-hero",
      "usageDecisionIds": [
        "usage-dongpo-pork-cost",
        "usage-dongpo-pork-hero-image",
        "usage-dongpo-pork-identity",
        "usage-dongpo-pork-name-and-attribution-story",
        "usage-dongpo-pork-nutrition",
        "usage-dongpo-pork-preparation"
      ]
    },
    {
      "itemId": "espresso",
      "slug": "espresso",
      "itemType": "coffee",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [
        "espresso-developed-through-stages"
      ],
      "primaryImageId": "espresso-hero",
      "usageDecisionIds": [
        "usage-espresso-cost",
        "usage-espresso-developed-through-stages-story",
        "usage-espresso-hero-image",
        "usage-espresso-identity",
        "usage-espresso-nutrition",
        "usage-espresso-preparation"
      ]
    },
    {
      "itemId": "filipino-chicken-adobo-home",
      "slug": "filipino-chicken-adobo-home",
      "itemType": "dish",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "filipino-chicken-adobo-home-hero",
      "usageDecisionIds": [
        "usage-filipino-chicken-adobo-home-cost",
        "usage-filipino-chicken-adobo-home-hero-image",
        "usage-filipino-chicken-adobo-home-identity",
        "usage-filipino-chicken-adobo-home-nutrition",
        "usage-filipino-chicken-adobo-home-preparation"
      ]
    },
    {
      "itemId": "fino-sherry",
      "slug": "fino-sherry",
      "itemType": "alcoholic-drink",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [
        "fino-aged-under-flor"
      ],
      "primaryImageId": "fino-sherry-hero",
      "usageDecisionIds": [
        "usage-fino-aged-under-flor-story",
        "usage-fino-sherry-cost",
        "usage-fino-sherry-hero-image",
        "usage-fino-sherry-identity",
        "usage-fino-sherry-nutrition",
        "usage-fino-sherry-preparation"
      ]
    },
    {
      "itemId": "french-lentil-soup",
      "slug": "french-lentil-soup",
      "itemType": "dish",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "french-lentil-soup-hero",
      "usageDecisionIds": [
        "usage-french-lentil-soup-cost",
        "usage-french-lentil-soup-hero-image",
        "usage-french-lentil-soup-identity",
        "usage-french-lentil-soup-nutrition",
        "usage-french-lentil-soup-preparation"
      ]
    },
    {
      "itemId": "french-ratatouille",
      "slug": "french-ratatouille",
      "itemType": "dish",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "french-ratatouille-hero",
      "usageDecisionIds": [
        "usage-french-ratatouille-cost",
        "usage-french-ratatouille-hero-image",
        "usage-french-ratatouille-identity",
        "usage-french-ratatouille-nutrition",
        "usage-french-ratatouille-preparation"
      ]
    },
    {
      "itemId": "greek-lemon-oregano-chicken",
      "slug": "greek-lemon-oregano-chicken",
      "itemType": "dish",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "greek-lemon-oregano-chicken-hero",
      "usageDecisionIds": [
        "usage-greek-lemon-oregano-chicken-cost",
        "usage-greek-lemon-oregano-chicken-hero-image",
        "usage-greek-lemon-oregano-chicken-identity",
        "usage-greek-lemon-oregano-chicken-nutrition",
        "usage-greek-lemon-oregano-chicken-preparation"
      ]
    },
    {
      "itemId": "greek-village-salad",
      "slug": "greek-village-salad",
      "itemType": "dish",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "greek-village-salad-hero",
      "usageDecisionIds": [
        "usage-greek-village-salad-cost",
        "usage-greek-village-salad-hero-image",
        "usage-greek-village-salad-identity",
        "usage-greek-village-salad-nutrition",
        "usage-greek-village-salad-preparation"
      ]
    },
    {
      "itemId": "hibiscus-agua-fresca",
      "slug": "hibiscus-agua-fresca",
      "itemType": "non-alcoholic-drink",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "hibiscus-agua-fresca-hero",
      "usageDecisionIds": [
        "usage-hibiscus-agua-fresca-cost",
        "usage-hibiscus-agua-fresca-hero-image",
        "usage-hibiscus-agua-fresca-identity",
        "usage-hibiscus-agua-fresca-nutrition",
        "usage-hibiscus-agua-fresca-preparation"
      ]
    },
    {
      "itemId": "home-mapo-tofu",
      "slug": "home-mapo-tofu",
      "itemType": "dish",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "home-mapo-tofu-hero",
      "usageDecisionIds": [
        "usage-home-mapo-tofu-cost",
        "usage-home-mapo-tofu-hero-image",
        "usage-home-mapo-tofu-identity",
        "usage-home-mapo-tofu-nutrition",
        "usage-home-mapo-tofu-preparation"
      ]
    },
    {
      "itemId": "huevos-rancheros-home",
      "slug": "huevos-rancheros-home",
      "itemType": "dish",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "huevos-rancheros-home-hero",
      "usageDecisionIds": [
        "usage-huevos-rancheros-home-cost",
        "usage-huevos-rancheros-home-hero-image",
        "usage-huevos-rancheros-home-identity",
        "usage-huevos-rancheros-home-nutrition",
        "usage-huevos-rancheros-home-preparation"
      ]
    },
    {
      "itemId": "hunan-chili-pork",
      "slug": "hunan-chili-pork",
      "itemType": "dish",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "hunan-chili-pork-hero",
      "usageDecisionIds": [
        "usage-hunan-chili-pork-cost",
        "usage-hunan-chili-pork-hero-image",
        "usage-hunan-chili-pork-identity",
        "usage-hunan-chili-pork-nutrition",
        "usage-hunan-chili-pork-preparation"
      ]
    },
    {
      "itemId": "indian-chana-masala-home",
      "slug": "indian-chana-masala-home",
      "itemType": "dish",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "indian-chana-masala-home-hero",
      "usageDecisionIds": [
        "usage-indian-chana-masala-home-cost",
        "usage-indian-chana-masala-home-hero-image",
        "usage-indian-chana-masala-home-identity",
        "usage-indian-chana-masala-home-nutrition",
        "usage-indian-chana-masala-home-preparation"
      ]
    },
    {
      "itemId": "indian-masoor-dal",
      "slug": "indian-masoor-dal",
      "itemType": "dish",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "indian-masoor-dal-hero",
      "usageDecisionIds": [
        "usage-indian-masoor-dal-cost",
        "usage-indian-masoor-dal-hero-image",
        "usage-indian-masoor-dal-identity",
        "usage-indian-masoor-dal-nutrition",
        "usage-indian-masoor-dal-preparation"
      ]
    },
    {
      "itemId": "indonesian-chili-eggplant",
      "slug": "indonesian-chili-eggplant",
      "itemType": "dish",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "indonesian-chili-eggplant-hero",
      "usageDecisionIds": [
        "usage-indonesian-chili-eggplant-cost",
        "usage-indonesian-chili-eggplant-hero-image",
        "usage-indonesian-chili-eggplant-identity",
        "usage-indonesian-chili-eggplant-nutrition",
        "usage-indonesian-chili-eggplant-preparation"
      ]
    },
    {
      "itemId": "italian-tomato-basil-pasta",
      "slug": "italian-tomato-basil-pasta",
      "itemType": "dish",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "italian-tomato-basil-pasta-hero",
      "usageDecisionIds": [
        "usage-italian-tomato-basil-pasta-cost",
        "usage-italian-tomato-basil-pasta-hero-image",
        "usage-italian-tomato-basil-pasta-identity",
        "usage-italian-tomato-basil-pasta-nutrition",
        "usage-italian-tomato-basil-pasta-preparation"
      ]
    },
    {
      "itemId": "japanese-miso-salmon",
      "slug": "japanese-miso-salmon",
      "itemType": "dish",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "japanese-miso-salmon-hero",
      "usageDecisionIds": [
        "usage-japanese-miso-salmon-cost",
        "usage-japanese-miso-salmon-hero-image",
        "usage-japanese-miso-salmon-identity",
        "usage-japanese-miso-salmon-nutrition",
        "usage-japanese-miso-salmon-preparation"
      ]
    },
    {
      "itemId": "japanese-miso-tofu-soup",
      "slug": "japanese-miso-tofu-soup",
      "itemType": "dish",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "japanese-miso-tofu-soup-hero",
      "usageDecisionIds": [
        "usage-japanese-miso-tofu-soup-cost",
        "usage-japanese-miso-tofu-soup-hero-image",
        "usage-japanese-miso-tofu-soup-identity",
        "usage-japanese-miso-tofu-soup-nutrition",
        "usage-japanese-miso-tofu-soup-preparation"
      ]
    },
    {
      "itemId": "japanese-oyakodon",
      "slug": "japanese-oyakodon",
      "itemType": "dish",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "japanese-oyakodon-hero",
      "usageDecisionIds": [
        "usage-japanese-oyakodon-cost",
        "usage-japanese-oyakodon-hero-image",
        "usage-japanese-oyakodon-identity",
        "usage-japanese-oyakodon-nutrition",
        "usage-japanese-oyakodon-preparation"
      ]
    },
    {
      "itemId": "junmai-sake",
      "slug": "junmai-sake",
      "itemType": "alcoholic-drink",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [
        "sake-making-with-koji"
      ],
      "primaryImageId": "junmai-sake-hero",
      "usageDecisionIds": [
        "usage-junmai-sake-cost",
        "usage-junmai-sake-hero-image",
        "usage-junmai-sake-identity",
        "usage-junmai-sake-nutrition",
        "usage-junmai-sake-preparation",
        "usage-sake-making-with-koji-story"
      ]
    },
    {
      "itemId": "korean-bibimbap-home",
      "slug": "korean-bibimbap-home",
      "itemType": "dish",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "korean-bibimbap-home-hero",
      "usageDecisionIds": [
        "usage-korean-bibimbap-home-cost",
        "usage-korean-bibimbap-home-hero-image",
        "usage-korean-bibimbap-home-identity",
        "usage-korean-bibimbap-home-nutrition",
        "usage-korean-bibimbap-home-preparation"
      ]
    },
    {
      "itemId": "korean-glass-noodle-stir-fry",
      "slug": "korean-glass-noodle-stir-fry",
      "itemType": "dish",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "korean-glass-noodle-stir-fry-hero",
      "usageDecisionIds": [
        "usage-korean-glass-noodle-stir-fry-cost",
        "usage-korean-glass-noodle-stir-fry-hero-image",
        "usage-korean-glass-noodle-stir-fry-identity",
        "usage-korean-glass-noodle-stir-fry-nutrition",
        "usage-korean-glass-noodle-stir-fry-preparation"
      ]
    },
    {
      "itemId": "korean-tofu-stew-home",
      "slug": "korean-tofu-stew-home",
      "itemType": "dish",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "korean-tofu-stew-home-hero",
      "usageDecisionIds": [
        "usage-korean-tofu-stew-home-cost",
        "usage-korean-tofu-stew-home-hero-image",
        "usage-korean-tofu-stew-home-identity",
        "usage-korean-tofu-stew-home-nutrition",
        "usage-korean-tofu-stew-home-preparation"
      ]
    },
    {
      "itemId": "lapsang-souchong",
      "slug": "lapsang-souchong",
      "itemType": "tea",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "lapsang-souchong-hero",
      "usageDecisionIds": [
        "usage-lapsang-souchong-cost",
        "usage-lapsang-souchong-hero-image",
        "usage-lapsang-souchong-identity",
        "usage-lapsang-souchong-nutrition",
        "usage-lapsang-souchong-preparation"
      ]
    },
    {
      "itemId": "lebanese-hummus-plate",
      "slug": "lebanese-hummus-plate",
      "itemType": "dish",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "lebanese-hummus-plate-hero",
      "usageDecisionIds": [
        "usage-lebanese-hummus-plate-cost",
        "usage-lebanese-hummus-plate-hero-image",
        "usage-lebanese-hummus-plate-identity",
        "usage-lebanese-hummus-plate-nutrition",
        "usage-lebanese-hummus-plate-preparation"
      ]
    },
    {
      "itemId": "lebanese-mujadara",
      "slug": "lebanese-mujadara",
      "itemType": "dish",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "lebanese-mujadara-hero",
      "usageDecisionIds": [
        "usage-lebanese-mujadara-cost",
        "usage-lebanese-mujadara-hero-image",
        "usage-lebanese-mujadara-identity",
        "usage-lebanese-mujadara-nutrition",
        "usage-lebanese-mujadara-preparation"
      ]
    },
    {
      "itemId": "longjing-green-tea",
      "slug": "longjing-green-tea",
      "itemType": "tea",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [
        "longjing-within-living-tea-practice"
      ],
      "primaryImageId": "longjing-green-tea-hero",
      "usageDecisionIds": [
        "usage-longjing-green-tea-cost",
        "usage-longjing-green-tea-hero-image",
        "usage-longjing-green-tea-identity",
        "usage-longjing-green-tea-nutrition",
        "usage-longjing-green-tea-preparation",
        "usage-longjing-within-living-tea-practice-story"
      ]
    },
    {
      "itemId": "malaysian-turmeric-chicken",
      "slug": "malaysian-turmeric-chicken",
      "itemType": "dish",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "malaysian-turmeric-chicken-hero",
      "usageDecisionIds": [
        "usage-malaysian-turmeric-chicken-cost",
        "usage-malaysian-turmeric-chicken-hero-image",
        "usage-malaysian-turmeric-chicken-identity",
        "usage-malaysian-turmeric-chicken-nutrition",
        "usage-malaysian-turmeric-chicken-preparation"
      ]
    },
    {
      "itemId": "mango-sticky-rice",
      "slug": "mango-sticky-rice",
      "itemType": "dessert",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "mango-sticky-rice-hero",
      "usageDecisionIds": [
        "usage-mango-sticky-rice-cost",
        "usage-mango-sticky-rice-hero-image",
        "usage-mango-sticky-rice-identity",
        "usage-mango-sticky-rice-nutrition",
        "usage-mango-sticky-rice-preparation"
      ]
    },
    {
      "itemId": "masala-chai",
      "slug": "masala-chai",
      "itemType": "tea",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "masala-chai-hero",
      "usageDecisionIds": [
        "usage-masala-chai-cost",
        "usage-masala-chai-hero-image",
        "usage-masala-chai-identity",
        "usage-masala-chai-nutrition",
        "usage-masala-chai-preparation"
      ]
    },
    {
      "itemId": "mexican-black-bean-tacos",
      "slug": "mexican-black-bean-tacos",
      "itemType": "dish",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "mexican-black-bean-tacos-hero",
      "usageDecisionIds": [
        "usage-mexican-black-bean-tacos-cost",
        "usage-mexican-black-bean-tacos-hero-image",
        "usage-mexican-black-bean-tacos-identity",
        "usage-mexican-black-bean-tacos-nutrition",
        "usage-mexican-black-bean-tacos-preparation"
      ]
    },
    {
      "itemId": "moroccan-mint-tea",
      "slug": "moroccan-mint-tea",
      "itemType": "tea",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "moroccan-mint-tea-hero",
      "usageDecisionIds": [
        "usage-moroccan-mint-tea-cost",
        "usage-moroccan-mint-tea-hero-image",
        "usage-moroccan-mint-tea-identity",
        "usage-moroccan-mint-tea-nutrition",
        "usage-moroccan-mint-tea-preparation"
      ]
    },
    {
      "itemId": "northwest-cumin-lamb",
      "slug": "northwest-cumin-lamb",
      "itemType": "dish",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "northwest-cumin-lamb-hero",
      "usageDecisionIds": [
        "usage-northwest-cumin-lamb-cost",
        "usage-northwest-cumin-lamb-hero-image",
        "usage-northwest-cumin-lamb-identity",
        "usage-northwest-cumin-lamb-nutrition",
        "usage-northwest-cumin-lamb-preparation"
      ]
    },
    {
      "itemId": "salted-lassi",
      "slug": "salted-lassi",
      "itemType": "non-alcoholic-drink",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "salted-lassi-hero",
      "usageDecisionIds": [
        "usage-salted-lassi-cost",
        "usage-salted-lassi-hero-image",
        "usage-salted-lassi-identity",
        "usage-salted-lassi-nutrition",
        "usage-salted-lassi-preparation"
      ]
    },
    {
      "itemId": "sichuan-smashed-cucumber",
      "slug": "sichuan-smashed-cucumber",
      "itemType": "dish",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "sichuan-smashed-cucumber-hero",
      "usageDecisionIds": [
        "usage-sichuan-smashed-cucumber-cost",
        "usage-sichuan-smashed-cucumber-hero-image",
        "usage-sichuan-smashed-cucumber-identity",
        "usage-sichuan-smashed-cucumber-nutrition",
        "usage-sichuan-smashed-cucumber-preparation"
      ]
    },
    {
      "itemId": "singapore-chicken-rice-home",
      "slug": "singapore-chicken-rice-home",
      "itemType": "dish",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "singapore-chicken-rice-home-hero",
      "usageDecisionIds": [
        "usage-singapore-chicken-rice-home-cost",
        "usage-singapore-chicken-rice-home-hero-image",
        "usage-singapore-chicken-rice-home-identity",
        "usage-singapore-chicken-rice-home-nutrition",
        "usage-singapore-chicken-rice-home-preparation"
      ]
    },
    {
      "itemId": "spanish-chickpea-spinach",
      "slug": "spanish-chickpea-spinach",
      "itemType": "dish",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "spanish-chickpea-spinach-hero",
      "usageDecisionIds": [
        "usage-spanish-chickpea-spinach-cost",
        "usage-spanish-chickpea-spinach-hero-image",
        "usage-spanish-chickpea-spinach-identity",
        "usage-spanish-chickpea-spinach-nutrition",
        "usage-spanish-chickpea-spinach-preparation"
      ]
    },
    {
      "itemId": "spanish-potato-omelet",
      "slug": "spanish-potato-omelet",
      "itemType": "dish",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "spanish-potato-omelet-hero",
      "usageDecisionIds": [
        "usage-spanish-potato-omelet-cost",
        "usage-spanish-potato-omelet-hero-image",
        "usage-spanish-potato-omelet-identity",
        "usage-spanish-potato-omelet-nutrition",
        "usage-spanish-potato-omelet-preparation"
      ]
    },
    {
      "itemId": "thai-basil-chicken",
      "slug": "thai-basil-chicken",
      "itemType": "dish",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "thai-basil-chicken-hero",
      "usageDecisionIds": [
        "usage-thai-basil-chicken-cost",
        "usage-thai-basil-chicken-hero-image",
        "usage-thai-basil-chicken-identity",
        "usage-thai-basil-chicken-nutrition",
        "usage-thai-basil-chicken-preparation"
      ]
    },
    {
      "itemId": "thai-green-papaya-salad",
      "slug": "thai-green-papaya-salad",
      "itemType": "dish",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "thai-green-papaya-salad-hero",
      "usageDecisionIds": [
        "usage-thai-green-papaya-salad-cost",
        "usage-thai-green-papaya-salad-hero-image",
        "usage-thai-green-papaya-salad-identity",
        "usage-thai-green-papaya-salad-nutrition",
        "usage-thai-green-papaya-salad-preparation"
      ]
    },
    {
      "itemId": "tiramisu",
      "slug": "tiramisu",
      "itemType": "dessert",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "tiramisu-hero",
      "usageDecisionIds": [
        "usage-tiramisu-cost",
        "usage-tiramisu-hero-image",
        "usage-tiramisu-identity",
        "usage-tiramisu-nutrition",
        "usage-tiramisu-preparation"
      ]
    },
    {
      "itemId": "tomato-scrambled-eggs",
      "slug": "tomato-scrambled-eggs",
      "itemType": "dish",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "tomato-scrambled-eggs-hero",
      "usageDecisionIds": [
        "usage-tomato-scrambled-eggs-cost",
        "usage-tomato-scrambled-eggs-hero-image",
        "usage-tomato-scrambled-eggs-identity",
        "usage-tomato-scrambled-eggs-nutrition",
        "usage-tomato-scrambled-eggs-preparation"
      ]
    },
    {
      "itemId": "tomyum-kung",
      "slug": "tomyum-kung",
      "itemType": "dish",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [
        "tomyum-kung-documented-practice"
      ],
      "primaryImageId": "tomyum-kung-hero",
      "usageDecisionIds": [
        "usage-tomyum-kung-cost",
        "usage-tomyum-kung-documented-practice-story",
        "usage-tomyum-kung-hero-image",
        "usage-tomyum-kung-identity",
        "usage-tomyum-kung-nutrition",
        "usage-tomyum-kung-preparation"
      ]
    },
    {
      "itemId": "vietnamese-beef-noodle-soup-home",
      "slug": "vietnamese-beef-noodle-soup-home",
      "itemType": "dish",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "vietnamese-beef-noodle-soup-home-hero",
      "usageDecisionIds": [
        "usage-vietnamese-beef-noodle-soup-home-cost",
        "usage-vietnamese-beef-noodle-soup-home-hero-image",
        "usage-vietnamese-beef-noodle-soup-home-identity",
        "usage-vietnamese-beef-noodle-soup-home-nutrition",
        "usage-vietnamese-beef-noodle-soup-home-preparation"
      ]
    },
    {
      "itemId": "vietnamese-iced-coffee",
      "slug": "vietnamese-iced-coffee",
      "itemType": "coffee",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "vietnamese-iced-coffee-hero",
      "usageDecisionIds": [
        "usage-vietnamese-iced-coffee-cost",
        "usage-vietnamese-iced-coffee-hero-image",
        "usage-vietnamese-iced-coffee-identity",
        "usage-vietnamese-iced-coffee-nutrition",
        "usage-vietnamese-iced-coffee-preparation"
      ]
    },
    {
      "itemId": "yunnan-mushroom-chicken-stew",
      "slug": "yunnan-mushroom-chicken-stew",
      "itemType": "dish",
      "reviewedLocales": [
        "zh-CN",
        "en"
      ],
      "storyIds": [],
      "primaryImageId": "yunnan-mushroom-chicken-stew-hero",
      "usageDecisionIds": [
        "usage-yunnan-mushroom-chicken-stew-cost",
        "usage-yunnan-mushroom-chicken-stew-hero-image",
        "usage-yunnan-mushroom-chicken-stew-identity",
        "usage-yunnan-mushroom-chicken-stew-nutrition",
        "usage-yunnan-mushroom-chicken-stew-preparation"
      ]
    }
  ]
} as const satisfies ContentBundleManifestV1;
