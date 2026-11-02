(function () {
  "use strict";

  const Kayam = (window.Kayam = window.Kayam || {});
  const PLACEHOLDER_IMAGE = "assets/images/product-placeholder.svg";
  let cachedData = null;
  let inFlight = null;
  let cachedAt = 0;
  const CACHE_MS = 60000;

  function pexelsImageUrl(id, width) {
    return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width || 1200}`;
  }

  // Temporary, local-only catalogue used until Supabase is configured.
  // Prices, weights, stock and ingredient lists are intentionally not invented.
  const STATIC_CATEGORIES = [
    { id: "static-category-spice-powders", name: "Spice Powders", slug: "spice-powders", description: "Everyday spice powders for Indian kitchens.", is_active: true, display_order: 1 },
    { id: "static-category-traditional-masalas", name: "Traditional Masalas", slug: "traditional-masalas", description: "Traditional blends for familiar home cooking.", is_active: true, display_order: 2 },
    { id: "static-category-premixes", name: "Premixes", slug: "premixes", description: "Convenient premixes for everyday meals.", is_active: true, display_order: 3 },
    { id: "static-category-cooking-masalas", name: "Cooking Masalas", slug: "cooking-masalas", description: "Masalas for curries, biryanis, and special dishes.", is_active: true, display_order: 4 },
    { id: "static-category-podi-chutney-powders", name: "Podi & Chutney Powders", slug: "podi-chutney-powders", description: "Podi and chutney powders to serve alongside meals.", is_active: true, display_order: 5 },
  ];

  const STATIC_PRODUCTS = [
    { slug: "chilli-powder", name: "Chilli Powder", category_slug: "spice-powders", short_description: "A pantry staple for adding colour and heat to everyday recipes.", description: "Chilli Powder from the KAYAM SPICES pantry. Final weight options, price, stock and product details will be published when confirmed.", is_featured: true, display_order: 1, imagePath: pexelsImageUrl(33440709, 1200), altText: "Red chilli powder in a marble bowl with dried red chillies." },
    { slug: "turmeric-powder", name: "Turmeric Powder", category_slug: "spice-powders", short_description: "A golden spice for curries, dals and everyday cooking.", description: "Turmeric Powder from the KAYAM SPICES pantry. Final weight options, price, stock and product details will be published when confirmed.", is_featured: true, display_order: 2, imagePath: pexelsImageUrl(7988014, 1200), altText: "Golden turmeric powder and turmeric roots on a dark surface." },
    { slug: "goda-masala", name: "Goda Masala", category_slug: "traditional-masalas", short_description: "A traditional Maharashtrian-style blend for home cooking.", description: "Goda Masala from the KAYAM SPICES pantry. Final weight options, price, stock and product details will be published when confirmed.", is_featured: true, display_order: 3, imagePath: pexelsImageUrl(32144884, 1200), altText: "A bowl of dark Indian spice blend with whole spices in a Dindigul kitchen setting." },
    { slug: "sambar-premix", name: "Sambar Premix", category_slug: "premixes", short_description: "A convenient premix for preparing sambar at home.", description: "Sambar Premix from the KAYAM SPICES pantry. Final weight options, price, stock and product details will be published when confirmed.", is_featured: false, display_order: 4, imagePath: pexelsImageUrl(7208238, 1200), altText: "Several coloured spice powders in metal bowls against a dark background." },
    { slug: "rasam-premix", name: "Rasam Premix", category_slug: "premixes", short_description: "A spice premix for a familiar South Indian rasam preparation.", description: "Rasam Premix from the KAYAM SPICES pantry. Final weight options, price, stock and product details will be published when confirmed.", is_featured: false, display_order: 5, imagePath: pexelsImageUrl(13149632, 1200), altText: "Red and pale spice powders presented in rustic bowls on a wooden surface." },
    { slug: "chicken-masala", name: "Chicken Masala", category_slug: "cooking-masalas", short_description: "A spice blend for chicken curries and home-style dishes.", description: "Chicken Masala from the KAYAM SPICES pantry. Final weight options, price, stock and product details will be published when confirmed.", is_featured: false, display_order: 6, imagePath: pexelsImageUrl(30203310, 1200), altText: "Indian curry presented with an assortment of whole spices and seasonings." },
    { slug: "meat-masala", name: "Meat Masala", category_slug: "cooking-masalas", short_description: "A warming masala blend for meat-based recipes.", description: "Meat Masala from the KAYAM SPICES pantry. Final weight options, price, stock and product details will be published when confirmed.", is_featured: false, display_order: 7, imagePath: pexelsImageUrl(9609831, 1200), altText: "A savoury Indian meat dish in a traditional copper bowl with spices." },
    { slug: "biryani-masala", name: "Biryani Masala", category_slug: "cooking-masalas", short_description: "An aromatic blend for preparing home-style biryani.", description: "Biryani Masala from the KAYAM SPICES pantry. Final weight options, price, stock and product details will be published when confirmed.", is_featured: true, display_order: 8, imagePath: pexelsImageUrl(32830296, 1200), altText: "A traditional Indian spice box filled with separate whole spices and powders." },
    { slug: "garlic-podi", name: "Garlic Podi", category_slug: "podi-chutney-powders", short_description: "A savoury podi for serving with everyday meals.", description: "Garlic Podi from the KAYAM SPICES pantry. Final weight options, price, stock and product details will be published when confirmed.", is_featured: false, display_order: 9, imagePath: pexelsImageUrl(2272847, 1200), altText: "Garlic cloves, red and green chillies, and spices being prepared in a mortar." },
    { slug: "gunpowder-podi", name: "Gunpowder Podi", category_slug: "podi-chutney-powders", short_description: "A bold podi traditionally served alongside rice, idli or dosa.", description: "Gunpowder Podi from the KAYAM SPICES pantry. Final weight options, price, stock and product details will be published when confirmed.", is_featured: false, display_order: 10, imagePath: pexelsImageUrl(8980448, 1200), altText: "A mixed ground-spice blend in a bowl with a spoon on a rustic surface." },
    { slug: "groundnut-chutney-powder", name: "Groundnut Chutney Powder", category_slug: "podi-chutney-powders", short_description: "A groundnut-style chutney powder for everyday meals and snacks.", description: "Groundnut Chutney Powder from the KAYAM SPICES pantry. Final weight options, price, stock and product details will be published when confirmed.", is_featured: false, display_order: 11, imagePath: pexelsImageUrl(30107827, 1200), altText: "A rustic bowl of whole groundnuts, shown as an ingredient reference for groundnut chutney powder." },
  ];

  const DEMO_PRICES = {
    "chilli-powder": [[100, 80], [250, 175], [500, 330]],
    "turmeric-powder": [[100, 65], [250, 150], [500, 280]],
    "goda-masala": [[100, 110], [250, 255], [500, 490]],
    "sambar-premix": [[100, 90], [250, 210], [500, 400]],
    "rasam-premix": [[100, 85], [250, 195], [500, 375]],
    "chicken-masala": [[100, 100], [250, 230], [500, 445]],
    "meat-masala": [[100, 110], [250, 255], [500, 490]],
    "biryani-masala": [[100, 120], [250, 275], [500, 530]],
    "garlic-podi": [[100, 95], [250, 220], [500, 420]],
    "gunpowder-podi": [[100, 90], [250, 205], [500, 395]],
    "groundnut-chutney-powder": [[100, 80], [250, 185], [500, 350]],
  };

  function makeDemoVariants(product) {
    return (DEMO_PRICES[product.slug] || []).map(function (entry, index) {
      return {
        id: `demo-${product.slug}-${entry[0]}g`,
        product_id: `static-${product.slug}`,
        weight_value: entry[0],
        weight_unit: "g",
        price: entry[1],
        sale_price: null,
        track_stock: false,
        stock_quantity: 0,
        is_active: true,
        is_demo: true,
        display_order: index + 1,
      };
    });
  }

  class CatalogueError extends Error {
    constructor(message, code, original) {
      super(message);
      this.name = "CatalogueError";
      this.code = code || "CATALOGUE_ERROR";
      this.original = original || null;
    }
  }

  function sortByOrder(a, b) {
    const orderA = Number(a.display_order) || 0;
    const orderB = Number(b.display_order) || 0;
    if (orderA !== orderB) return orderA - orderB;
    return String(a.name || a.alt_text || "").localeCompare(String(b.name || b.alt_text || ""));
  }

  function normalizeImage(image) {
    const storagePath = image.storage_path || "";
    // Local product artwork is used for static mode and until a live product image is uploaded.
    const localUrl = typeof image.local_url === "string" ? image.local_url : "";
    const url = localUrl || (window.KayamDB ? window.KayamDB.getPublicImageUrl(storagePath) : "");
    return {
      id: image.id,
      storagePath,
      altText: image.alt_text || "",
      displayOrder: Number(image.display_order) || 0,
      url: url || PLACEHOLDER_IMAGE,
    };
  }

  function normalizeVariant(variant) {
    const pricePaise = Kayam.moneyToPaise(variant.price);
    const salePricePaise =
      variant.sale_price === null || variant.sale_price === undefined || variant.sale_price === ""
        ? null
        : Kayam.moneyToPaise(variant.sale_price);
    const effectivePricePaise =
      salePricePaise !== null && salePricePaise >= 0 && salePricePaise <= pricePaise ? salePricePaise : pricePaise;
    const trackStock = Boolean(variant.track_stock);
    const stockQuantity = Number(variant.stock_quantity) || 0;
    return {
      ...variant,
      weightValue: Number(variant.weight_value),
      weightUnit: variant.weight_unit,
      label: Kayam.formatWeight(variant.weight_value, variant.weight_unit),
      pricePaise,
      salePricePaise,
      effectivePricePaise,
      onSale: salePricePaise !== null && salePricePaise < pricePaise,
      trackStock,
      stockQuantity,
      inStock: !trackStock || stockQuantity > 0,
      displayOrder: Number(variant.display_order) || 0,
      isDemo: Boolean(variant.is_demo),
    };
  }

  function normalizeProduct(product) {
    const category = product.categories || null;
    const variants = (product.product_variants || [])
      .filter(function (variant) {
        return variant.is_active !== false;
      })
      .map(normalizeVariant)
      .sort(sortByOrder);
    const storedImages = Array.isArray(product.product_images) ? product.product_images : [];
    const localProduct = STATIC_PRODUCTS.find((item) => item.slug === product.slug);
    const fallbackImages = localProduct
      ? [{
          id: `local-${localProduct.slug}`,
          storage_path: "",
          local_url: localProduct.imagePath,
          alt_text: localProduct.altText,
          display_order: 0,
        }]
      : [];
    const images = (storedImages.length ? storedImages : fallbackImages).map(normalizeImage).sort(sortByOrder);
    const availableVariants = variants.filter(function (variant) {
      return variant.inStock;
    });
    const priceVariants = availableVariants.length ? availableVariants : variants;
    const priceVariantsSorted = priceVariants.slice().sort(function (a, b) {
      return a.effectivePricePaise - b.effectivePricePaise;
    });
    const lowest = priceVariantsSorted[0] || null;
    return {
      ...product,
      category: category
        ? {
            id: category.id,
            name: category.name,
            slug: category.slug,
            isActive: category.is_active !== false,
          }
        : null,
      categoryName: category ? category.name : "Uncategorised",
      categorySlug: category ? category.slug : "",
      variants,
      availableVariants,
      images,
      primaryImage: images[0] || null,
      imageUrl: images[0] ? images[0].url : PLACEHOLDER_IMAGE,
      hasVariants: variants.length > 0,
      hasAvailableVariant: availableVariants.length > 0,
      lowestPricePaise: lowest ? lowest.effectivePricePaise : null,
      lowestRegularPricePaise: lowest ? lowest.pricePaise : null,
      onSale: Boolean(lowest && lowest.onSale),
      isOutOfStock: variants.length > 0 && availableVariants.length === 0,
      hasDemoPrices: variants.some((variant) => variant.isDemo),
      displayOrder: Number(product.display_order) || 0,
    };
  }

  function normalizeCategory(category) {
    return {
      ...category,
      displayOrder: Number(category.display_order) || 0,
    };
  }

  function buildStaticCatalogue() {
    const categories = STATIC_CATEGORIES.map(normalizeCategory);
    const categoriesBySlug = new Map(categories.map((category) => [category.slug, category]));
    const products = STATIC_PRODUCTS.map(function (item) {
      const category = categoriesBySlug.get(item.category_slug);
      return normalizeProduct({
        ...item,
        id: `static-${item.slug}`,
        category_id: category ? category.id : null,
        categories: category ? {
          id: category.id,
          name: category.name,
          slug: category.slug,
          is_active: true,
        } : null,
        is_active: true,
        product_variants: makeDemoVariants(item),
        product_images: [],
      });
    });
    return { categories, products, source: "demo", isDemoMode: true };
  }

  async function fetchCatalogue(options) {
    const opts = options || {};
    if (!window.KayamDB || !window.KayamDB.isConfigured()) {
      return buildStaticCatalogue();
    }

    try {
      const client = window.KayamDB.getClient();
      const categoryRequest = client
        .from("categories")
        .select("id,name,slug,description,is_active,display_order")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });
      const productRequest = client
        .from("products")
        .select(
          "id,category_id,name,slug,short_description,description,ingredients,is_active,is_featured,display_order,created_at,updated_at,categories(id,name,slug,is_active),product_variants(id,product_id,weight_value,weight_unit,price,sale_price,track_stock,stock_quantity,is_active,is_demo,display_order),product_images(id,product_id,storage_path,alt_text,display_order)",
        )
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });

      const [categoryResult, productResult] = await Promise.all([categoryRequest, productRequest]);
      if (categoryResult.error || productResult.error) {
        throw categoryResult.error || productResult.error;
      }

      const categories = (categoryResult.data || []).map(normalizeCategory);
      const rawProducts = productResult.data || [];
      const products = rawProducts
        .filter(function (product) {
          return !product.category_id || categories.some((category) => category.id === product.category_id);
        })
        .map(normalizeProduct);

      const hasAnyConfiguredVariants = products.some((product) => product.variants.length > 0);
      if (!categories.length || !products.length || !hasAnyConfiguredVariants) {
        const demo = buildStaticCatalogue();
        demo.fallbackReason = "The live catalogue has not been populated with sellable weight and price options yet.";
        return demo;
      }

      return {
        categories,
        products,
        source: "supabase",
        isDemoMode: products.some((product) => product.hasDemoPrices),
      };
    } catch (error) {
      console.warn("KAYAM SPICES is displaying the sample catalogue until Supabase is ready.", error);
      const demo = buildStaticCatalogue();
      demo.fallbackReason = "The live catalogue could not be reached. Sample products and sample prices are being displayed.";
      return demo;
    }
  }

  async function loadAll(options) {
    const opts = options || {};
    const now = Date.now();
    if (!opts.force && cachedData && now - cachedAt < CACHE_MS) {
      return cachedData;
    }
    if (inFlight) return inFlight;
    inFlight = fetchCatalogue(opts)
      .then(function (data) {
        cachedData = data;
        cachedAt = Date.now();
        return data;
      })
      .finally(function () {
        inFlight = null;
      });
    return inFlight;
  }

  function invalidateCache() {
    cachedData = null;
    cachedAt = 0;
  }

  async function findProduct(slug, options) {
    const data = await loadAll(options);
    return data.products.find((product) => product.slug === slug) || null;
  }

  function priceToken(paise) {
    let hash = 2166136261;
    const source = `ks1:${Number(paise) || 0}`;
    for (let index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function productUrl(product) {
    return `product.html?slug=${encodeURIComponent(product.slug)}`;
  }

  function primaryVariant(product) {
    if (!product || !product.variants) return null;
    return product.availableVariants[0] || product.variants[0] || null;
  }

  function responsivePexelsAttrs(url, sizes, widths) {
    const match = String(url || "").match(/images[.]pexels[.]com[/]photos[/]([0-9]+)[/]pexels-photo-[0-9]+[.]jpeg/i);
    if (!match) return "";
    const candidates = (widths || [320, 480, 800, 1200]).map(function (width) {
      return `https://images.pexels.com/photos/${match[1]}/pexels-photo-${match[1]}.jpeg?auto=compress&cs=tinysrgb&w=${width} ${width}w`;
    }).join(", ");
    return `srcset="${Kayam.escapeHTML(candidates)}" sizes="${Kayam.escapeHTML(sizes || "100vw")}"`;
  }

  function cardImageAttributes(product) {
    const responsive = responsivePexelsAttrs(
      product.imageUrl,
      "(max-width: 599px) 46vw, (max-width: 899px) 30vw, (max-width: 1199px) 22vw, 18vw",
      [320, 480, 640, 800, 1200],
    );
    return `src="${Kayam.escapeHTML(product.imageUrl)}" ${responsive} alt="${Kayam.escapeHTML(
      product.primaryImage && product.primaryImage.altText ? product.primaryImage.altText : `${product.name} from KAYAM SPICES`,
    )}" width="800" height="1000" loading="lazy" decoding="async" data-fallback="${PLACEHOLDER_IMAGE}"`;
  }

  function priceMarkup(product, selectedVariant) {
    if (!product.hasVariants) {
      return '<span class="product-card__coming">Pricing to be confirmed</span>';
    }
    if (!selectedVariant || selectedVariant.effectivePricePaise === null) {
      return '<span class="product-card__coming">Pricing to be confirmed</span>';
    }
    const old =
      selectedVariant.onSale && selectedVariant.pricePaise > selectedVariant.effectivePricePaise
        ? `<span class="price-old">${Kayam.formatMoney(selectedVariant.pricePaise)}</span>`
        : "";
    return `<span class="price" data-product-price>${Kayam.formatMoney(
      selectedVariant.effectivePricePaise,
    )}</span>${old}`;
  }

  function renderProductCard(product) {
    const defaultVariant = primaryVariant(product);
    const canAdd = Boolean(defaultVariant && defaultVariant.inStock);
    const options = product.variants
      .map(function (variant) {
        return `<option value="${Kayam.escapeHTML(variant.id)}" data-price-paise="${variant.effectivePricePaise}" data-in-stock="${variant.inStock ? "true" : "false"}" data-is-demo="${variant.isDemo ? "true" : "false"}"${defaultVariant && defaultVariant.id === variant.id ? " selected" : ""}${variant.inStock ? "" : " disabled"}>${Kayam.escapeHTML(variant.label)} · ${Kayam.formatMoney(variant.effectivePricePaise)}</option>`;
      })
      .join("");
    const availability = !product.hasVariants
      ? '<p class="product-card__availability product-card__availability--soon">Details soon</p>'
      : product.isOutOfStock
        ? '<p class="product-card__availability product-card__availability--out">Out of stock</p>'
        : '<p class="product-card__availability">Available</p>';
    const badges = [];
    if (product.onSale) badges.push('<span class="badge badge--sale">Sale</span>');
    if (product.is_featured) badges.push('<span class="badge badge--gold">Featured</span>');
    if (product.isOutOfStock) badges.push('<span class="badge badge--muted">Out of stock</span>');
    const quickAdd = canAdd
      ? `<button class="product-card__quick-add" type="button" data-add-product="${Kayam.escapeHTML(
          product.id,
        )}" data-add-variant="${Kayam.escapeHTML(defaultVariant.id)}" aria-label="Add ${Kayam.escapeHTML(
          product.name,
        )} to cart">${Kayam.icon("plus")}</button>`
      : "";
    const action = canAdd
      ? `<button class="btn btn--dark btn--small btn--block" type="button" data-add-product="${Kayam.escapeHTML(
          product.id,
        )}" data-add-variant="${Kayam.escapeHTML(defaultVariant.id)}">Add to cart</button>`
      : `<a class="btn btn--outline btn--small btn--block" href="${productUrl(product)}">View details</a>`;
    const demoFlag = defaultVariant && defaultVariant.isDemo;

    return `<article class="product-card" data-product-card="${Kayam.escapeHTML(product.id)}">
      <a class="product-card__media" href="${productUrl(product)}" aria-label="View ${Kayam.escapeHTML(product.name)}">
        <img ${cardImageAttributes(product)}>
        <span class="product-card__badges">${badges.join("")}</span>
      </a>
      ${quickAdd}
      <div class="product-card__body">
        <p class="product-card__category">${Kayam.escapeHTML(product.categoryName)}</p>
        <h3 class="product-card__title"><a href="${productUrl(product)}">${Kayam.escapeHTML(product.name)}</a></h3>
        <p class="product-card__desc">${Kayam.escapeHTML(product.short_description || "Product details coming soon.")}</p>
        ${product.variants.length ? `<label class="product-card__variant-label" for="weight-${Kayam.escapeHTML(product.slug)}">Choose pack size</label><select class="product-card__weight-select" id="weight-${Kayam.escapeHTML(product.slug)}" data-product-variant-select aria-label="Choose pack size for ${Kayam.escapeHTML(product.name)}">${options}</select>` : ""}
        <div class="product-card__footer">
          <div class="product-card__price">${priceMarkup(product, defaultVariant)}<span class="product-card__sample-label"${demoFlag ? "" : " hidden"}>Sample price</span></div>
          ${availability}
        </div>
        <div class="product-card__actions">${action}</div>
      </div>
    </article>`;
  }

  function renderSkeletonGrid(count) {
    return `<div class="skeleton-grid" aria-hidden="true">${Array.from({ length: count || 4 })
      .map(
        function () {
          return `<div class="skeleton-card">
            <div class="skeleton skeleton--image"></div>
            <div class="skeleton skeleton--line"></div>
            <div class="skeleton skeleton--line skeleton--line-short"></div>
          </div>`;
        },
      )
      .join("")}</div>`;
  }

  function setupCardActions(container) {
    if (!container || container.dataset.cardActionsBound === "true") return;
    container.dataset.cardActionsBound = "true";
    container.addEventListener("change", function (event) {
      const select = event.target.closest("[data-product-variant-select]");
      if (!select) return;
      const card = select.closest("[data-product-card]");
      const option = select.selectedOptions[0];
      if (!card || !option) return;
      const variantId = select.value;
      const pricePaise = Number(option.dataset.pricePaise);
      const available = option.dataset.inStock === "true";
      const priceNode = card.querySelector("[data-product-price]");
      const sampleNode = card.querySelector(".product-card__sample-label");
      if (priceNode && Number.isFinite(pricePaise)) priceNode.textContent = Kayam.formatMoney(pricePaise);
      if (sampleNode) sampleNode.hidden = option.dataset.isDemo !== "true";
      card.querySelectorAll("[data-add-product]").forEach(function (button) {
        button.dataset.addVariant = variantId;
        button.disabled = !available;
      });
    });
    container.addEventListener("click", function (event) {
      const button = event.target.closest("[data-add-product][data-add-variant]");
      if (!button) return;
      event.preventDefault();
      const productId = button.dataset.addProduct;
      const variantId = button.dataset.addVariant;
      if (!window.KayamCart) {
        Kayam.showToast("The cart is still loading. Please try again.", "error");
        return;
      }
      window.KayamCart.addByIds(productId, variantId, 1)
        .then(function () {
          Kayam.showToast("Added to your cart.", "success");
        })
        .catch(function (error) {
          Kayam.showToast(error.message || "This item could not be added to the cart.", "error");
        });
    });
  }

  Kayam.Catalogue = {
    loadAll,
    findProduct,
    invalidateCache,
    priceToken,
    primaryVariant,
    productUrl,
    renderProductCard,
    renderSkeletonGrid,
    setupCardActions,
    placeholder: PLACEHOLDER_IMAGE,
    CatalogueError,
  };
})();
