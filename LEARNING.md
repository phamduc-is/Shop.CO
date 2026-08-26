# Kỹ thuật chưa tìm hiểu

Ghi lại các kỹ thuật/khái niệm mới gặp trong lúc làm Shop.Co, kèm tóm tắt +
ví dụ áp dụng thực tế vào theme. Mỗi mục thêm mới ở cuối file.

---

## 1. `<picture>` + `<source media>` — art direction cho ảnh responsive

**Ngày ghi:** 2026-08-26

### Là gì

`<picture>` là thẻ bọc ngoài, chứa nhiều `<source>` + đúng một `<img>` bắt buộc
(dùng làm fallback). Trình duyệt đọc các `<source media="...">` **từ trên
xuống dưới**, `media` nào khớp viewport trước thì dùng ảnh đó và dừng lại;
không khớp cái nào thì rơi về `<img>`.

```html
<picture>
  <source media="(max-width: 749px)" srcset="anh-mobile.jpg">
  <source media="(min-width: 750px)" srcset="anh-desktop.jpg">
  <img src="anh-desktop.jpg" alt="...">
</picture>
```

### Khác gì với `srcset`/`sizes` trên một `<img>` duy nhất

| | `<picture>` + `<source media>` | `srcset` + `sizes` |
|---|---|---|
| Mục đích | **Art direction** — đổi hẳn ảnh/bố cục/crop khác nhau | **Resolution switching** — cùng 1 ảnh, đổi độ phân giải theo màn hình |
| Ví dụ | Ảnh dọc crop sát chủ thể cho mobile, ảnh ngang toàn cảnh cho desktop | Cùng một ảnh hero, chỉ tải bản nhỏ hơn trên màn hình nhỏ |
| Trình duyệt chọn theo | `media` (viewport width, hoặc bất kỳ media query nào) | độ rộng thực tế cần hiển thị + density màn hình |

### Áp dụng vào `sections/hero.liquid`

Schema đã có sẵn 2 setting nhưng `hero__media` mới chỉ dùng 1:

```liquid
"settings": [
  { "type": "image_picker", "id": "image", "label": "Image" },
  { "type": "image_picker", "id": "image_mobile", "label": "Mobile image" }
]
```

Gợi ý áp dụng (**chưa apply vào file**, chỉ lưu tham khảo):

```liquid
<picture class="hero__media">
  {%- if section.settings.image_mobile != blank -%}
    <source
      media="(max-width: 749px)"
      srcset="{{ section.settings.image_mobile | image_url: width: 750 }} 750w,
              {{ section.settings.image_mobile | image_url: width: 1500 }} 1500w"
      sizes="100vw"
    >
  {%- endif -%}
  <img
    src="{{ section.settings.image | image_url: width: 1500 }}"
    srcset="{{ section.settings.image | image_url: width: 1500 }} 1500w,
            {{ section.settings.image | image_url: width: 3000 }} 3000w"
    sizes="100vw"
    alt="{{ section.settings.image.alt | escape }}"
    width="{{ section.settings.image.width }}"
    height="{{ section.settings.image.height }}"
    loading="lazy"
  >
</picture>
```

### Lưu ý khi dùng

- Breakpoint trong `media` (ví dụ `749px`) phải **trùng breakpoint CSS**
  đang dùng cho `.hero` — lệch một điểm là ảnh "nhảy" lúc resize ngay
  ngưỡng đó.
- `<img>` luôn phải có mặt — không phải "lựa chọn thứ 3", mà là phần tử
  thật sự được render khi không `<source>` nào khớp.
- Dùng filter `image_url` (không phải `img_url` cũ) để build `srcset` theo
  chuẩn Shopify OS 2.0.

### Nguồn

- MDN: [`<picture>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/picture)
- Shopify Liquid: [`image_url` filter](https://shopify.dev/docs/api/liquid/filters/image_url)
