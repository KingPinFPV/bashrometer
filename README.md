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


הגדרת משתני סביבה

API Configuration - צור api/.env:

envPORT=3000
DATABASE_URL=postgresql://user:password@host:5432/bashrometer
JWT_SECRET=your-secret-key
NODE_ENV=development

Frontend Configuration - צור frontend/.env.local:

envNEXT_PUBLIC_API_URL=http://localhost:3000
הרצה בסביבת פיתוח
bash# הרצת שני השירותים במקביל
npm run dev

# או הרצה נפרדת:
# Terminal 1 - API
npm run dev:api

# Terminal 2 - Frontend
npm run dev:frontend
הרצת בדיקות
bashnpm test
🌐 כתובות

Frontend: http://localhost:3001
API: http://localhost:3000
API Docs: http://localhost:3000/api-docs (בקרוב)

👤 משתמש לדוגמה (Admin)
Email: admin@example.com
Password: [צור משתמש admin ראשון]
📝 רישיון
כל הזכויות שמורות © 2025
EOF