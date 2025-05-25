# נעדכן את ה-README
cat > README.md << 'EOF'
# Bashrometer - פלטפורמת השוואת מחירי בשר

פלטפורמת SaaS קהילתית להשוואת מחירי בשר בין קמעונאים שונים.

## 🚀 מה חדש בגרסה 2.0

- ✅ ממשק ניהול מלא למנהלי מערכת
- ✅ תיקוני באגים וניקוי קוד
- ✅ מבנה Monorepo משופר
- 🔄 נרמול מחירים ב-UI (בפיתוח)
- 🔄 CI/CD עם GitHub Actions (בפיתוח)
- 🔄 Docker support (בפיתוח)

## 📁 מבנה הפרויקט
bashrometer/
├── api/          # Backend - Node.js/Express API
├── frontend/     # Frontend - Next.js Application
├── package.json  # Root package.json for monorepo
└── README.md     # This file

## 🛠️ התקנה והרצה

### דרישות מקדימות
- Node.js 18+
- PostgreSQL (או חשבון Neon)
- npm או yarn

### התקנה מהירה

```bash
# Clone the repository
git clone https://github.com/KingPinFPV/bashrometer.git
cd bashrometer

# Install all dependencies
npm run install:all