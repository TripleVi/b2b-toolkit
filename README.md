# B2B Toolkit

[![Version](https://img.shields.io/badge/version-v0.1.1-blue.svg)](https://github.com/TripleVi/b2b-toolkit)
[![Platform](https://img.shields.io/badge/platform-Tampermonkey-emerald.svg)](https://www.tampermonkey.net/)

**B2B Toolkit** là một userscript (internal support toolkit) được phát triển nhằm hỗ trợ đội ngũ kỹ thuật và support trong việc debug, kiểm tra và tối ưu hiển thị của ứng dụng BSS B2B trên giao diện Storefront của Shopify.

---

## Installation

### Step 1: Install Tampermonkey Extension
1. Truy cập Web Store trên trình duyệt của bạn (Chrome, Edge, Brave...) và tìm kiếm **Tampermonkey**.
2. Chọn **Add to Chrome** (hoặc trình duyệt tương ứng) để cài đặt.

   ![Install](.github/assets/install.png)

3. **Cấu hình quan trọng cho Extension:**
   * Vào phần quản lý Extension của trình duyệt $\rightarrow$ Chọn **Tampermonkey** $\rightarrow$ **Details**.
   * Tại mục **Site access**, chọn `On all sites`.
   * Bật tùy chọn **Allow User Scripts** (cho phép chạy mã nguồn chưa được kiểm duyệt bởi store nếu có cảnh báo bảo mật).

   ![Install](.github/assets/install2.png)

### Step 2: Install B2B Toolkit Script
1. Click trực tiếp vào đường dẫn cài đặt script tự động sau:
   👉 [https://triplevi.github.io/b2b-toolkit/b2b-toolkit.user.js](https://triplevi.github.io/b2b-toolkit/b2b-toolkit.user.js)
2. Giao diện Tampermonkey sẽ hiện ra, nhấn nút **Install** (hoặc **Reinstall**) để hoàn tất.

   ![Install](.github/assets/Install3.png)

3. Bật script trên website

   ![Install](.github/assets/Install4.png)

4. Script được inject và chạy thành công trên storefront như sau:

   ![Install](.github/assets/Install5.png)

4. Lúc này có thể truy cập tool qua namespace `BSS_B2B.support`.

   ![Install](.github/assets/support.png)

---

## Features

### 1. Highlight Elements & Quick Info
Tự động quét và highlight các phần tử bss-b2b-selectors phổ biến trên Storefront như: *Product List, Product Form, Mini Cart, Main Cart, Search Bar, Quick View...*
* **Hover Badge:** Khi di chuột vào các phần tử được highlight sẽ hiển thị badge ở trên đầu tóm tắt thông tin sản phẩm và pricing rule được áp dụng. Có thể truy cập trực tiếp vào Shopify admin.

   ![Highlight collection](.github/assets/highlight_collection.png)

* **Console Log Info:** Khi bấm vào **biểu tượng chữ "i" (info icon)** trên badge, hệ thống sẽ log toàn bộ dữ liệu chi tiết của target đó ra tab Console (bao gồm: `availableRules`, `appliedRules`, `currVariant`, `priceEls`, `related elements`...).

   ![Log info](.github/assets/log_info.png)

Notes:
* Với product list, phải set attribute `bss-b2b-product-qb-id` cho product card để có thể query elements.
* Phần rule info hiện tại mới xử lý cho CP, PL, VP and TD.

Tương tự cho search bar,

![Highlight search bar](.github/assets/highlight_searchbar.png)

Tương tự cho quick view,

![Highlight quick view](.github/assets/highlight_quick_view.png)

Tương tự cho product form,

![Highlight product form](.github/assets/highlight_pdp.png)

Tương tự cho mini cart,

![Highlight mini cart](.github/assets/highlight_mini_cart.png)

Tương tự cho main cart,

![Highlight main cart](.github/assets/highlight_cart.png)

### 2. Event Tracker
Vì app phải tương thích với theme nên không biết khi nào các variant, search, quick view, cart,… handlers được gọi và có được xử lý như mong muốn hay không nên tool sẽ log các event tương ứng kèm info khi chúng được xử lý theo flow của app.
* Hệ thống tự động bắt và log lại các luồng xử lý như thay đổi variant, mở search bar, gọi quick view, cập nhật giỏ hàng... 
* Giúp bạn biết chính xác khi nào các handler được gọi và luồng dữ liệu của ứng dụng chạy có đúng mong muốn hay không.

![Event tracker](.github/assets/event_tracker.png)

### 3. Inline Install
Hỗ trợ install Pricing Module trực tiếp bằng JavaScript từ DevTools Console, không cần sandbox. Chỉ cần cung cấp selector tương ứng. Mọi thứ vẫn đi qua hook `custom:config_theme/installation`.

Truy cập tính năng thông qua namespace: `BSS_B2B.support.customSelector`.

1. Init custom selectors:
   ```javascript
   BSS_B2B.support.customSelector.init()
   ```
   ![Custom selector](.github/assets/customSelector.png)

2. Gán giá trị mới cho một component (e.g., `collection`):
   ```javascript
   BSS_B2B.support.customSelector.values.collection = {
       "selectorCard": ":not(*)",
       "selectorPrice": ":not(*)",
       "selectorQuickviewBtn": ":not(*)",
       "selectorSearchBar": ":not(*)"
   }
   ```
3. Save values to local storage và gọi function tương ứng để process prices:
   ```javascript
   BSS_B2B.support.customSelector.save()
   BSS_B2B.support.utils.processProductList()
   ```

#### API Reference: `customSelector`
| Function / Property | Description |
| :--- | :--- |
| `values` | Reads or writes the current custom selectors state object. |
| `init()` | Sets up the feature. |
| `disable()` | Disables the feature. |
| `enable()` | Enables the feature. |
| `isEnabled()` | Checks whether the feature is enabled. |
| `isDisabled()` | Checks whether the feature is disabled. |
| `save()` | Saves the modified custom selectors to storage. |
| `hasData()` | Checks whether custom selectors currently exist in storage. |

### 4. Inline Functions
Hỗ trợ register and execute các đoạn code tùy biến ngay khi tool bắt đầu chạy, giúp inject nhanh các đoạn script test hoặc custom handler.

Truy cập tính năng thông qua namespace: `BSS_B2B.support.customFn`.

#### JavaScript Function Structural Breakdown
Cú pháp function phải tuân thủ nghiêm ngặt cấu trúc dưới đây để tool có thể xử lý và thực thi một cách ổn định.

![Function structure](.github/assets/function.png)

#### Implementation Guide
1. Đầu tiên, cần bật tính năng này khi truy cập site lần đầu:
   ```javascript
   BSS_B2B.support.customFn.enable()
   ```
2. Đăng ký hàm (`registerFn`): Hàm sẽ được khai báo ở phạm vi global scope nên cần đảm bảo tên hàm (name) là duy nhất.
3. Thêm hàm thực thi ngay (`addRunnableFn`): Hàm này sẽ tự động chạy ngay khi toolkit bắt đầu khởi tạo.

   ![Custom function](.github/assets/customFn.png)

4. Sau đó tiến hành **F5 / Reload** lại website để xem kết quả logs chạy hàm trong tab Developer Console.

   ![Custom function](.github/assets/customFn2.png)

#### API Reference: `customFn`
| Function / Property | Description |
| :--- | :--- |
| `registerFn(fn)` | Registers a function in the global scope. |
| `addRunnableFn(fn)` | Adds a function to run on launch. |
| `getRegisteredFns()` | Gets all registered functions. |
| `getRunnableFns()` | Gets all runnable functions. |
| `removeRegisteredFn(name)`| Remove a registered function by name. |
| `removeRunnableFn(name)`  | Remove a runnable function by name. |
| `enable()` | Enables the feature. |
| `disable()` | Disables the feature. |
| `isEnabled()` | Checks whether the feature is enabled. |
| `isDisabled()` | Checks whether the feature is disabled. |

### 5. Tool Configs
Xem và điều chỉnh trực tiếp các cấu hình cốt lõi của hệ thống toolkit (ví dụ: mã màu highlight, bật/tắt highlight của từng cấu phần chi tiết...).

Kiểm tra cấu hình hiện tại bằng cách chạy lệnh sau trên Console:
```javascript
BSS_B2B.support.configs.values
```

![App config](.github/assets/config.png)

Có thể thay đổi các thuộc tính tùy ý, sau đó gọi hàm sau để lưu cấu hình vào Storage:
```javascript
BSS_B2B.support.configs.save()
```

---

## Other Utils
Cung cấp các hàm tiện ích tính toán, bật/tắt hoặc re-process hiển thị nằm trong namespace `BSS_B2B.support.utils`.

#### API Reference: `utils`
| Function / Property | Description |
| :--- | :--- |
| `enableDevMode` | Enables developer mode. |
| `disableDevMode()` | Disables developer mode. |
| `isDevModeEnabled()` | Checks whether developer mode is enabled. |
| `isDevModeDisabled()` | Checks whether developer mode is disabled. |
| `processProductList()` | Reprocesses pricing for product lists. |
| `processForms()` | Reprocesses pricing for product forms. |
| `processCart()` | Reprocesses pricing for cart items. |
| `highlightSearch()` | Highlights search elements. |
| `highlightCollection()` | Highlights collection elements. |
| `highlightForms()` | Highlights product form elements. |
| `highlightCart()` | Highlights cart elements. |
| `unhighlightSearch()` | Removes search highlights. |
| `unhighlightCollection()` | Removes collection highlights. |
| `unhighlightForms()` | Removes product form highlights. |
| `unhighlightCart()` | Removes cart highlights. |

Here's an example of using dev mode in the sandbox:
```javascript
if (BSS_B2B.support.utils.isDevModeDisabled()) return;
// Code here
```

---

## Contributions & Bug Reports
Mọi ý kiến đóng góp phát về bug report hoặc feature improvements, vui lòng thực hiện thông qua các kênh sau:
1. **GitHub Issues:** Tạo Issue trực tiếp tại repo chính thức [TripleVi/b2b-toolkit](https://github.com/TripleVi/b2b-toolkit/issues) kèm theo mô tả lỗi, hình ảnh (nếu có) và log lỗi trên Console Storefront.
2. **Pull Requests:** Nếu bạn đã có sẵn mã nguồn khắc phục hoặc cải tiến, hãy mở PR thẳng vào nhánh `main` để dev review và merge.
3. **Internal Contact:** Đối với các vấn đề nội bộ khẩn cấp trong quá trình support khách hàng của BSS, có thể liên hệ trực tiếp qua hệ thống chat nội bộ.
