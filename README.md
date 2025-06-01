# Bashrometer - בשרומטר 🥩

**פלטפורמה חברתית להשוואת מחירי בשר בישראל**

[![Production](https://img.shields.io/badge/Production-Live-green)](https://www.basarometer.org/)
[![API](https://img.shields.io/badge/API-Active-blue)](https://bashrometer-api.onrender.com/)
[![Status](https://img.shields.io/badge/Status-Fully_Operational-brightgreen)]()
[![Documentation](https://img.shields.io/badge/Documentation-Complete-blue)](./COMPREHENSIVE_PROJECT_ANALYSIS_UPDATED.md)

## תיאור הפרויקט

בשרומטר הוא פרויקט חברתי שמטרתו לעזור לציבור הישראלי לחסוך בעלויות מזון על ידי השוואת מחירי בשר בין קמעונאים שונים. הפלטפורמה מאפשרת למשתמשים לדווח מחירים, לצפות בהשוואות, ולקבל תמונה מקיפה של מחירי הבשר בזמן אמת.

## 🌐 פרודקשן URLs

- **🌐 Frontend**: https://www.basarometer.org/
- **🔗 API**: https://bashrometer-api.onrender.com/
- **📚 API Docs**: https://bashrometer-api.onrender.com/api-docs
- **👨‍💻 GitHub**: https://github.com/KingPinFPV/bashrometer

## 🏗️ מבנה טכני (Monorepo)

```
bashrometer/
├── api/                    # Backend - Node.js/Express + PostgreSQL
├── frontend/               # Frontend - Next.js 15 + TypeScript + Tailwind
├── archive/                # Archived documentation
└── documentation/          # Current project documentation
```

### טכנולוgiות עיקריות

**Backend:**
- Node.js 18+ + Express.js
- PostgreSQL (Production on Render)
- JWT Authentication + Role-based Authorization
- OpenAPI 3.0 Documentation
- Comprehensive Jest Testing (80%+ coverage)

**Frontend:**
- Next.js 15 with App Router
- TypeScript + Tailwind CSS
- RTL Support (Hebrew interface)
- React Context for state management

**Infrastructure:**
- GitHub → Render auto-deployment
- Docker containerization ready
- CORS configured for production

## 📊 מצב פרויקט נוכחי

### ✅ פונקציונליות פעילה
- **אימות משתמשים** - רישום, התחברות, JWT
- **דיווח מחירים** - משתמשים יכולים לדווח מחירי בשר
- **מערכת לייקים** - אימות קהילתי של דיווחי מחיר
- **ממשק ניהול** - פאנל אדמין מלא לניהול המערכת
- **השוואת מחירים** - מטריקס השוואה בין קמעונאים
- **נרמול מחירים** - מחיר ל-100 גרם להשוואה מדויקת

### 📈 נתוני Production (עדכני)
- **📦 34 מוצרים פעילים** במערכת
- **📈 27 דיווחי מחירים** מהקהילה
- **👥 8 משתמשים רשומים** (6 רגילים, 2 מנהלים)
- **🔪 66 סוגי נתחי בשר** זמינים
- **📑 14 תת-קטגוריות** למיון מדויק

### 🔄 בפיתוח
- Analytics והיסטוריית מחירים
- שיפורי UX נוספים
- Mobile optimization
- Performance enhancements

## 🚀 התקנה מקומית

### דרישות מקדימות
- Node.js 18+
- PostgreSQL (או חשבון cloud database)
- npm או yarn

### הוראות התקנה מהירה

```bash
# Clone the repository
git clone https://github.com/KingPinFPV/bashrometer.git
cd bashrometer

# Install all dependencies (monorepo)
npm run install:all

# Set up environment files
cp api/.env.example api/.env
cp frontend/.env.local.example frontend/.env.local
# Edit .env files with your configuration

# Start development environment
npm run dev
```

### הרצה בסביבת פיתוח

```bash
# הרצת שני השירותים במקביל
npm run dev

# גישה ל-URLs:
# Frontend: http://localhost:3001
# API: http://localhost:3000
# API Docs: http://localhost:3000/api-docs
```

### בדיקות

```bash
# הרצת בדיקות API
cd api && npm test

# בדיקת coverage
cd api && npm run test:coverage
```

## 🎯 מאפיינים טכניים

### ארכיטקטורה
- **Monorepo Structure** - ניהול אחיד של Frontend ו-Backend
- **RESTful API** - ממשק מתועד עם OpenAPI 3.0
- **Real-time Updates** - עדכונים מיידיים של מצב לייקים
- **Community Validation** - אימות דיווחים באמצעות הקהילה
- **Admin Panel** - ממשק ניהול מלא למנהלי המערכת
- **RTL Support** - תמיכה מלאה בעברית וכיוון ימין-לשמאל

### בסיס נתונים
- **users** - משתמשים ותפקידים (user/admin/editor)
- **products** - קטלוג מוצרי בשר עם קטגוריות ונתחים
- **retailers** - רשתות קמעונאיות
- **prices** - דיווחי מחירים מהקהילה
- **price_report_likes** - מערכת אימות קהילתי

### בטיחות ואבטחה
- JWT authentication עם תפוגה של 2 שעות
- Role-based authorization
- פרמטרים מוגנים נגד SQL Injection
- Rate limiting
- CORS מוגדר כראוי לפרודקשן

## 📖 תיעוד נוסף

- **[COMPREHENSIVE_PROJECT_ANALYSIS_UPDATED.md](./COMPREHENSIVE_PROJECT_ANALYSIS_UPDATED.md)** - ניתוח טכני מקיף ועדכני
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - מדריך deployment מפורט
- **[CLAUDE_TASKS.md](./CLAUDE_TASKS.md)** - משימות ועדכוני פיתוח

## 🤝 Contributing

זהו פרויקט חברתי המיועד לעזור לציבור. תרומות מתקבלות בברכה!

### להתחיל לתרום:
1. Fork את הפרויקט
2. צור branch חדש (`git checkout -b feature/amazing-feature`)
3. הוסף את השינויים שלך עם tests מתאימים
4. וודא שכל הבדיקות עוברות (`npm test`)
5. Commit את השינויים (`git commit -m 'Add amazing feature'`)
6. Push ל-branch (`git push origin feature/amazing-feature`)
7. פתח Pull Request

### הנחיות פיתוח
- פעל לפי הקונבנציות הקיימות בקוד
- כתוב tests לפונקציונליות חדשה
- עדכן את התיעוד בעת הצורך
- בדוק API changes עם OpenAPI schema

## 📞 תמיכה

- **Issues**: [GitHub Issues](https://github.com/KingPinFPV/bashrometer/issues)
- **Documentation**: העיין בתיעוד המקיף במאגר
- **API**: בדוק את התיעוד באתר `/api-docs`

## 📝 רישיון

פרויקט חברתי - כל הזכויות שמורות © 2025  
**מטרה**: עזרה לציבור הישראלי לחסוך בעלויות מזון

---

**עודכן לאחרונה**: June 1, 2025  
**גרסה**: 2.0 Production Ready  
**מצב**: פעיל ויציב בפרודקשן 🚀