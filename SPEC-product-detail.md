# SPEC — block `_product-detail`

> Cột phải của Product Detail Page (Figma `#1:2` desktop 1440 / `#35:1062` mobile 390).
> Static block, chỉ render từ `sections/main-product.liquid`, cặp với `_product-media`.
>
> Figma đang bị rate-limit khi viết spec → mọi số đo đánh dấu `[?]` cần mở lại
> file `AXFvzD9Zu9A2xkNwOItGWL` xác nhận trước khi chốt.

---

## 1. Phạm vi

Block chịu trách nhiệm **toàn bộ cột thông tin bên phải**, theo thứ tự dọc:

| # | Khối | Nội dung |
|---|------|----------|
| 1 | Title | `product.title`, `<h1>`, Archivo Black uppercase |
| 2 | Rating | metafield `custom.ratings`, dùng lại `snippets/rating-star.liquid` |
| 3 | Price | giá hiện tại + `compare_at_price` gạch ngang + badge `-N%` |
| 4 | Description | `product.description`, muted, có divider dưới |
| 5 | Color picker | option tên "Color" → swatch tròn |
| 6 | Size picker | option tên "Size" → chip pill `.btn--muted` |
| 7 | Cart row | quantity stepper + nút **Add to Cart** |

**KHÔNG thuộc block này:** gallery (đã có `_product-media`), tabs
Details/Reviews/FAQs, "You might also like" — đó là section riêng, làm sau.

---

## 2. Cấu trúc file cần tạo / sửa

| File | Việc |
|------|------|
| `blocks/_product-detail.liquid` | viết markup + `{% doc %}` + `{% schema %}` |
| `src/scss/blocks/_product-detail.scss` | style block (file mới) |
| `src/scss/blocks/_index.scss` | `@forward 'product-detail';` (file mới) |
| `src/scss/theme.scss` | thêm `@use 'blocks';` sau `@use 'components';` |
| `src/scss/sections/_main-product.scss` | `.main-product__grid` 2 cột (file mới) |
| `src/scss/sections/_index.scss` | `@forward 'main-product';` |
| `assets/product-detail.js` | custom element `<product-detail>` (file mới) |
| `locales/en.default.json` | key mục 7 |

> **Quyết định:** thêm hẳn thư mục `src/scss/blocks/` để cây SCSS phản chiếu
> 1:1 cây theme (`sections/`, `snippets/`, `blocks/`). Không nhét vào
> `components/` — nơi đó chỉ dành cho thứ dùng lại nhiều chỗ (`button`,
> `badge`, `rating`, `product-card`).

---

## 3. Markup

Class gốc `.product-detail`, BEM, không lồng quá 2 cấp.

```liquid
<div class="product-detail" {{ block.shopify_attributes }}>
  <h1 class="product-detail__title">…</h1>
  <div class="product-detail__rating">…</div>
  <div class="product-detail__price">…</div>
  <p class="product-detail__description">…</p>

  <product-detail-form class="product-detail__form" data-url="{{ product.url }}">
    {% form 'product', product, id: form_id, novalidate: 'novalidate' %}
      <input type="hidden" name="id" value="{{ current_variant.id }}">

      <fieldset class="product-detail__option product-detail__option--color"> … </fieldset>
      <fieldset class="product-detail__option product-detail__option--size">  … </fieldset>

      <div class="product-detail__cart-row">
        <div class="product-detail__qty"> … </div>
        <button type="submit" class="btn btn--dark product-detail__submit"> … </button>
      </div>
    {% endform %}
  </product-detail-form>
</div>
```

### 3.1 Title
- Thẻ `<h1>` (đây là H1 duy nhất của trang product).
- Mixin `heading(var(--text-h3))` → 24px mobile / 40px desktop, đã có sẵn trong token.

### 3.2 Rating
```liquid
{% assign product_rating = product.metafields.custom.ratings.value %}
{% if product_rating %}
  {% render 'rating-star', rating: product_rating.rating, scale_max: product_rating.scale_max, show_value: true %}
{% endif %}
```
Snippet tự bọc `.rating`, không render gì khi `percent == 0` → không cần guard thêm.

### 3.3 Price
Logic **giống hệt** `snippets/product-card.liquid` (giữ nguyên cách tính `price_percent`),
chỉ khác cỡ chữ. Dùng `current_variant.price` / `current_variant.compare_at_price`,
**không** dùng `product.price` — giá phải đổi theo variant đang chọn.

- Luôn qua filter `money`.
- `<s>` cho compare price, `.badge.badge--sale` cho `-N%`.
- Cỡ chữ: `--text-2xl` (32px) desktop, `--text-xl` (24px) mobile `[?]`.

### 3.4 Description
`{{ product.description }}` — **không** `strip_html`, merchant có thể nhập rich text.
Màu `--color-text-muted`, `--text-base`. Divider `1px solid var(--color-border)` bên dưới.

### 3.5 Option pickers

Duyệt `product.options_with_values`, phân loại theo `option.name | downcase`:

| name | render |
|------|--------|
| `color` | swatch tròn 37×37 `[?]`, màu nền lấy từ `value | downcase | replace: ' ', ''` qua CSS `background-color` |
| `size` | chip pill `.btn--muted`, chữ `--text-base` |
| khác | fallback: chip pill giống size |

Mỗi value là một `<input type="radio">` + `<label>`, **không** dùng `<button>`:
radio cho ta selected state bằng CSS thuần (`:checked + label`) và hoạt động
được cả khi JS chưa load.

```liquid
<input type="radio"
       class="product-detail__option-input visually-hidden"
       id="Option-{{ section.id }}-{{ forloop.index0 }}-{{ forloop.index0 }}"
       name="option-{{ option.position }}"
       value="{{ value | escape }}"
       {% if option.selected_value == value %}checked{% endif %}>
```

- Value không tồn tại ở variant nào available → thêm class `--unavailable`
  (opacity 40%, gạch chéo) nhưng **vẫn cho chọn** (chuẩn Shopify: chọn xong
  hiện "Sold out"), không `disabled`.
- Ẩn hẳn cả `<fieldset>` khi `product.has_only_default_variant`.
- `<legend>` = `{{ option.name }}` `<span>{{ option.selected_value }}</span>` `[?]`.

### 3.6 Quantity
Pill nền `--color-surface`, radius `--radius-pill`, 3 phần: `−` / input / `+`.
- Input thật: `<input type="number" name="quantity" min="1" value="1">`,
  ẩn spinner mặc định bằng `appearance: textfield`.
- 2 nút `type="button"` có `aria-label` từ locale.
- Không JS → input number vẫn nhập tay được. JS chỉ tăng thêm tiện lợi.

### 3.7 Add to cart
```liquid
<button type="submit" name="add" class="btn btn--dark product-detail__submit"
        {% unless current_variant.available %}disabled{% endunless %}>
  {% if current_variant.available %}{{ 'products.product.add_to_cart' | t }}
  {% else %}{{ 'products.product.sold_out' | t }}{% endif %}
</button>
```
`.btn--dark` đã có sẵn; override `width: 100%` `[?]` trong `_product-detail.scss`
(rule của `_button.scss`: section tự override bề rộng).

---

## 4. JS — `assets/product-detail.js`

Custom element, ~60 dòng, **progressive enhancement**: bỏ file này đi trang vẫn
mua được (form submit bình thường, chỉ là không đổi giá khi chọn option).

```js
class ProductDetailForm extends HTMLElement {
  connectedCallback() { this.addEventListener('change', this.onChange); … }
}
customElements.define('product-detail-form', ProductDetailForm);
```

Nhiệm vụ:
1. `change` trên radio → đọc toàn bộ option đang chọn → tìm variant khớp trong
   JSON nhúng sẵn (`<script type="application/json" data-variants>{{ product.variants | json }}</script>`).
2. Cập nhật `input[name="id"]`, vùng `.product-detail__price`, trạng thái nút submit.
3. `history.replaceState` thêm `?variant=<id>` để refresh/share giữ đúng variant.
4. Click `−`/`+` → đổi `value` của input quantity, clamp `min = 1`.

Nạp cuối `<body>` hoặc `<script src="…" defer>` ngay trong block — **không**
thêm vào `theme.liquid`, vì chỉ trang product mới cần.

---

## 5. Schema

```json
{
  "name": "Product detail",
  "tag": null,
  "settings": [
    { "type": "checkbox", "id": "show_rating",      "label": "Show rating",      "default": true },
    { "type": "checkbox", "id": "show_description", "label": "Show description", "default": true },
    { "type": "checkbox", "id": "show_quantity",    "label": "Show quantity selector", "default": true }
  ]
}
```
Label schema đi kèm bản dịch trong `locales/*.schema.json` (đã có `vi`, `de`, `fr`).

---

## 6. SCSS

`src/scss/sections/_main-product.scss`:
```scss
.main-product__grid {
  display: grid;
  gap: var(--space-40); // [?]
  @include respond-to('lg') { grid-template-columns: 1fr 1fr; } // [?] Figma có thể là 6:5
}
```

`src/scss/blocks/_product-detail.scss` — quy tắc:
- Mọi màu / cỡ chữ / spacing **phải** qua token `var(--…)`. Không hardcode hex, không px lẻ.
- Dùng `@use '../abstracts' as *;` ở đầu file, `@include respond-to('lg')` cho desktop.
- Divider: `border-block-end: 1px solid var(--color-border);` + `padding-block-end`,
  đặt trên description và mỗi `__option`, **không** dùng `<hr>`.
- Dùng logical properties (`margin-block-end`, `padding-inline`) như các file SCSS hiện có.

---

## 7. Locale keys cần thêm (`locales/en.default.json`)

```json
"products": {
  "product": {
    "add_to_cart": "Add to Cart",
    "sold_out": "Out of Stock",
    "unavailable": "Unavailable",
    "quantity": "Quantity",
    "quantity_decrease": "Decrease quantity",
    "quantity_increase": "Increase quantity"
  }
}
```
Thêm song song vào `vi.schema.json` phần schema label. `en.default.json` là file
storefront string, `*.schema.json` là label trong theme editor — đừng lẫn.

---

## 8. Acceptance criteria

- [ ] `shopify theme check` — 0 offense mức `error` (hook `Stop` sẽ chặn nếu còn).
- [ ] Sản phẩm không có variant (`has_only_default_variant`) → không render fieldset nào, vẫn add to cart được.
- [ ] Sản phẩm không có metafield rating → không có khoảng trắng thừa.
- [ ] Sản phẩm không sale → không hiện `<s>` và badge.
- [ ] Variant hết hàng → nút đổi thành "Out of Stock" + `disabled`.
- [ ] Tắt JS: chọn size/color vẫn submit đúng variant mặc định, nhập quantity tay vẫn được.
- [ ] Bàn phím: Tab đi hết radio, `:focus-visible` thấy rõ, `<legend>` đọc được bằng screen reader.
- [ ] 390px: cột dọc, không tràn ngang. 1440px: 2 cột.
- [ ] Không có hex/px hardcode trong `_product-detail.scss`.
