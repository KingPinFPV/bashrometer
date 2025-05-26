# Bashrometer V2 - פלטפורמת השוואת מחירי בשר מתקדמת 🥩

פלטפורמת SaaS קהילתית מתקדמת להשוואת מחירי בשר עם תכונות חכמות ומערכת אימות קהילתית.

## 🚀 מה חדש בגרסה 2.0

### ✅ תכונות חדשות שהוספו ביחד עם Claude Code
- **🔍 מערכת אוטוקומפליט מתקדמת**: חיפוש חכם של מוצרים וקמעונאים בזמן אמת
- **📋 רשימות סטנדרטיות מותאמות לישראל**: 57 סוגי נתחי בשר ו-54 ספקים וקמעונאים
- **➕ בקשות למוצרים/קמעונאים חדשים**: משתמשים יכולים לבקש הוספה של מוצרים או קמעונאים שלא קיימים
- **👨‍💼 מערכת ניהול בקשות מתקדמת**: אדמינים יכולים לאשר או לדחות בקשות להוספת מוצרים וקמעונאים
- **🔧 תיקוני באגים מרכזיים**: תיקון בעיות ב-API אוטוקומפליט ושיפור חוויית המשתמש
- **📱 ממשק משתמש משופר**: עיצוב מודרני ונגיש עם תמיכה מלאה בעברית

### 🎯 תכונות קיימות שהושבחו
- ✅ ממשק ניהול מלא למנהלי מערכת
- ✅ מבנה Monorepo משופר ומאורגן
- ✅ מערכת אימות משתמשים מתקדמת
- ✅ דיווחי מחירים עם ולידציה חכמה
- ✅ מערכת לייקים קהילתית לאימות מהימנות

## 🛠️ פיתוח עם Claude Code

הגרסה 2.0 פותחה בשיתוף עם Claude Code, כלי הפיתוח החדשני של Anthropic:

### 🤖 מה עשינו ביחד:
1. **ניתוח מעמיק של הקוד הקיים** - Claude Code סקר את כל הפרויקט ובצע refactoring חכם
2. **עיצוב ויישום מערכת האוטוקומפליט** - הוספת חיפוש בזמן אמת עם debouncing ו-keyboard navigation
3. **יצירת בסיס נתונים מותאם לישראל** - 57 נתחי בשר ו-54 ספקים ממוינים לפי קטגוריות
4. **בניית מערכת בקשות חדשות** - משתמשים יכולים להציע תוספות והאדמין מאשר
5. **תיקון באגים קריטיים** - פתרון בעיות ב-CORS, API endpoints, ושיפור הביצועים

### 💡 הטכנולוגיות שהשתמשנו:
- **Backend**: Node.js + Express + PostgreSQL (Neon)
- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Database**: טבלאות מתקדמות עם מיגרציות אוטומטיות
- **API**: RESTful עם תיעוד OpenAPI מלא

## 📁 מבנה הפרויקט

```
bashrometer-fullstack/
├── api/                    # Backend - Node.js/Express API
│   ├── controllers/        # בקרי API ללוגיקה עסקית
│   ├── routes/            # הגדרת נתיבי API
│   ├── middleware/        # Middleware לאימות והרשאות
│   ├── migrations/        # מיגרציות בסיס נתונים
│   ├── utils/             # כלי עזר ופונקציות שירות
│   └── tests/             # בדיקות יחידה ואינטגרציה
├── frontend/              # Frontend - Next.js Application
│   ├── src/app/           # דפי האפליקציה (App Router)
│   ├── src/components/    # קומפוננטות UI חוזרות
│   └── src/contexts/      # קונטקסטים גלובליים
├── package.json           # Root package.json for monorepo
└── README.md             # המדריך הזה
```

## 🛠️ התקנה והרצה

### דרישות מקדימות
- Node.js 18+ 
- PostgreSQL (או חשבון Neon)
- npm או yarn

### התקנה מהירה

```bash
# Clone the repository
git clone https://github.com/KingPinFPV/bashrometer.git
cd bashrometer/v2/bashrometer-fullstack

# Install all dependencies (both API and Frontend)
npm run install:all
```

### הגדרת משתני סביבה

**API Configuration** - צור `api/.env`:
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:password@host:5432/bashrometer
JWT_SECRET=your-very-strong-secret-key
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3002
```

**Frontend Configuration** - צור `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### הרצה בסביבת פיתוח

```bash
# הרצת שני השירותים במקביל
npm run dev

# או הרצה נפרדת:
# Terminal 1 - API
npm run dev:api

# Terminal 2 - Frontend  
npm run dev:frontend
```

### הרצת מיגרציות בסיס נתונים

```bash
# הרצה ידנית של מיגרציות (אוטומטית בפעם הראשונה)
cd api
node run_migration.js
```

### הרצת בדיקות

```bash
npm test
```

## 🌐 כתובות

- **Frontend**: http://localhost:3000 (או 3002 אם 3000 תפוס)
- **API**: http://localhost:3001  
- **API Docs**: http://localhost:3001 (OpenAPI documentation)

## 👤 משתמש לדוגמה

נדרש ליצור משתמש admin ראשון דרך:
- הרשמה רגילה באתר
- עדכון ידני של שדה `role` למשתמש זה ל-`admin` בבסיס הנתונים

## 🔧 תכונות מתקדמות

### מערכת האוטוקומפליט
- חיפוש בזמן אמת עם debouncing (300ms)
- נווטציה במקלדת (חצים, Enter, Escape)  
- תמיכה מלאה בעברית וקידוד URL
- הצגת קטגוריות ומידע נוסף על כל פריט

### בקשות למוצרים וקמעונאים חדשים
- משתמשים יכולים לבקש הוספת מוצר/קמעונאי שלא קיים
- מערכת אישור/דחייה מרכזית לאדמינים
- מעקב אחר בקשות עם timestamps ופרטי המבקש
- הוספה אוטומטית למאגר לאחר אישור

### רשימות מותאמות לישראל
- **57 נתחי בשר** מקוטלגים לפי סוג בעל חיים
- **54 ספקים וקמעונאים** ידועים בישראל
- עדכון קל של הרשימות דרך מיגרציות DB
- תמיכה בקטגוריות: בקר, חזיר, טלה, עוף, הודו, אווז, דגים, פירות ים

## 🧑‍💻 עבודה עם הקוד

### הוספת נתח בשר חדש
```sql
INSERT INTO meat_cuts (name, category) VALUES ('שם הנתח', 'קטגוריה');
```

### הוספת קמעונאי חדש
```sql
INSERT INTO brands (name, type) VALUES ('שם הקמעונאי', 'supplier');
```

### API Endpoints חדשים
- `GET /api/autocomplete/meat-cuts?q=search_term`
- `GET /api/autocomplete/brands?q=search_term`
- `POST /api/requests/products` - בקשה למוצר חדש
- `POST /api/requests/retailers` - בקשה לקמעונאי חדש
- `GET /api/requests/products/pending` - בקשות מוצרים (אדמין)
- `GET /api/requests/retailers/pending` - בקשות קמעונאים (אדמין)

## 🎯 מה הלאה בגרסה 3.0?

- 📊 נתוני אנליטיקה ומגמות מחירים
- 🔄 CI/CD עם GitHub Actions
- 🐳 Docker support מלא
- 🌍 הוספת שפות נוספות (i18n)
- 📱 אפליקציה לנייד
- 🤖 בוט טלגרם לדיווחי מחירים מהירים

## 🤝 תרומה לפרויקט

הפרויקט פתוח לתרומות! אנחנו מחפשים:
- מפתחים לתכונות חדשות
- מעצבי UX/UI
- בודקי איכות
- תורמי תוכן (רשימות מוצרים וקמעונאים)

## 📈 סטטיסטיקות פיתוח

- **שפות**: TypeScript, JavaScript, SQL
- **בדיקות**: Jest, Supertest
- **Lines of Code**: ~3,000+ (Backend), ~2,500+ (Frontend)
- **מיגרציות DB**: 3 מיגרציות עם נתונים מובנים
- **API Endpoints**: 25+ נתיבים מתועדים

## 📝 רישיון

כל הזכויות שמורות © 2025 Bashrometer Team

---

**נבנה בשיתוף עם [Claude Code](https://claude.ai/code) - הכלי החדשני לפיתוח תוכנה של Anthropic** 🤖✨