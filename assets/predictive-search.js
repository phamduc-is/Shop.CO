class PredictiveSearch extends HTMLElement {
  connectedCallback() {
    // Trình duyệt tự gọi hàm này khi thẻ <predictive-search> có mặt trên trang
    this.input = this.querySelector('input[name="q"]'); // ô input có sẵn trong header
    this.results = this.querySelector("[data-results]");
    this.url = this.dataset.url; // đọc data-url

    // Input --> chạy hàm onInput
    this.input.addEventListener("input", () => this.onInput());
    // Esc đóng dropdown
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.close();
    });

    //click overlay --> đóng dropdown
    document.addEventListener("click", (e) => {
      if (!this.contains(e.target)) this.close();
    });
  }
  onInput() {
    const term = this.input.value.trim(); // bỏ khoảng trắng ở hai đầu
    clearTimeout(this.timer);
    if (term.length < 2) {
      this.close();
      return;
    }
    this.timer = setTimeout(() => this.search(term), 300); //setTimeout
  }

  async search(term) {
    //Nếu request trc còn đang chạy --> huỷ
    this.controller?.abort();
    this.controller = new AbortController();

    // Dựng query string. URLSearchParams tự encode các ký tự đặc biệt như & # khoảng trắng
    const params = new URLSearchParams({
      q: term,
      "resources[type]": "product",
      "resources[limit]": "6",
      section_id: "predictive-search", // tên file section, không có đuôi .liquid
    });

    try {
      const response = await fetch(`${this.url}?${params}`, {
        signal: this.controller.signal, // gắn "công tắc huỷ" vào request
      });
      if (!response.ok) return;

      const html = await response.text(); // lấy HTML dạng chuỗi

      // Shopify bọc section trong <div class="shopify-section">…</div>.
      // Parse chuỗi thành DOM để lấy phần bên trong.
      const doc = new DOMParser().parseFromString(html, "text/html");
      const section = doc.querySelector(".shopify-section");

      this.results.innerHTML = section ? section.innerHTML : "";
      this.open();
    } catch (error) {
      // Bị abort là chuyện bình thường, không cần báo lỗi
      if (error.name !== "AbortError") console.error(error);
    }
  }
  open() {
    this.results.hidden = false;
  }

  close() {
    this.results.hidden = true;
  }
}

customElements.define('predictive-search', PredictiveSearch);
