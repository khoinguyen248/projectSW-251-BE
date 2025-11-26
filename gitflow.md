# HƯỚNG DẪN TẠO NHÁNH & RELEASE

Lưu ý: luôn checkout từ main và luôn pull code mới nhất.

## B1: Tạo nhánh feature

- git checkout main
- git pull origin main
- git checkout -b features/ten-nhanh

## B2: Code trên nhánh feature

- git add .
- git commit -m "message"
- git push origin features/ten-nhanh

## B3: Tạo nhánh release từ main

- git checkout main
- git pull origin main
- git checkout -b release/ten-release

## B4: Merge code feature vào nhánh release

- check out sang nhánh release: git checkout ten-nhanh-release
- git pull origin features/ten-nhanh-feature
- xử lý conflict nếu có
- lặp lại nếu có nhiều nhánh feature
- git add .
- git commit -m "resolve conflict"
- git push origin release/ten-release

## B5: Tạo Pull Request

- Tạo PR từ nhánh release lên main.
