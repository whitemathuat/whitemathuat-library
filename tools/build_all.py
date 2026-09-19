import build_home
import build_library
import build_detail

def main():
    print("🚀 Đang dọn dẹp và xây dựng lại toàn bộ website...")
    
    print("\n--- Xây trang chủ ---")
    build_home.main()
    
    print("\n--- Xây thư viện ---")
    build_library.main()
    
    print("\n--- Xây trang đọc truyện ---")
    build_detail.main()
    
    print("\n✅ HOÀN TẤT! Hãy F5 lại trình duyệt để kiểm tra.")

if __name__ == "__main__":
    main()