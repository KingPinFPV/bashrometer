# משימות להשלמת פרוייקט בשרומטר

## משימות קריטיות להשקה

### 1. השלמת ממשק הניהול (Admin UI)
**מיקום:** `frontend/src/app/admin/`

**משימות ספציפיות:**
- [ ] יצירת טופס הוספת מוצר חדש (`/admin/products/new`)
- [ ] עריכת פרטי מוצר קיים (`/admin/products/[id]/edit`)
- [ ] מחיקת מוצר עם אישור (`DELETE` action ב-products table)
- [ ] ניהול קמעונאים - CRUD מלא (`/admin/retailers/`)
- [ ] ממשק אישור/דחיית דיווחי מחיר (`/admin/reports/`) - **✅ הושלם**
- [ ] הוספת חיפוש וסינון בכל הרשימות
- [ ] ניהול משתמשים (`/admin/users/`)
- [ ] הגדרות מערכת (`/admin/settings/`)

**קובצים לעדכן:**
```
frontend/src/app/admin/products/page.tsx - ✅ הושלם
frontend/src/app/admin/products/new/page.tsx
frontend/src/app/admin/products/[id]/edit/page.tsx
frontend/src/app/admin/retailers/page.tsx
frontend/src/app/admin/retailers/new/page.tsx
frontend/src/app/admin/retailers/[id]/edit/page.tsx
frontend/src/app/admin/users/page.tsx (חדש)
frontend/src/app/admin/settings/page.tsx (חדש)
frontend/src/components/admin/ (קומפוננטות משותפות)
```

### 2. שיפור חוויית המשתמש
**מיקום:** `frontend/src/`

**משימות ספציפיות:**
- [ ] הוספת חיפוש מוצרים בעמוד הראשי
- [ ] סינון לפי קטגוריה, כשרות, קמעונאי
- [ ] עימוד (pagination) עם 20 פריטים בעמוד
- [ ] מיון לפי מחיר (נמוך לגבוה/גבוה לנמוך), תאריך
- [ ] שיפור טופס דיווח מחיר עם וולידציה טובה יותר
- [ ] הוספת loading states ו-error handling - **✅ הושלם חלקית**
- [ ] הוספת מערכת התראות (notifications/toasts)
- [ ] שיפור עמוד מוצר עם היסטוריית מחירים
- [ ] הוספת מערכת לייקים/דירוגים לדיווחים

**קובצים לעדכן:**
```
frontend/src/app/products/page.tsx
frontend/src/app/products/[productId]/page.tsx
frontend/src/app/report-price/page.tsx
frontend/src/components/ProductList.tsx
frontend/src/components/SearchFilters.tsx (חדש)
frontend/src/components/Pagination.tsx (חדש)
frontend/src/components/Notifications.tsx (חדש)
```

### 3. השלמת מערכת האנליטיקות
**מיקום:** `frontend/src/app/admin/analytics/` - **✅ הושלם בסיסי**

**משימות ספציפיות:**
- [x] דף אנליטיקה בסיסי עם גרפי מגמות - **✅ הושלם**
- [ ] השוואת קמעונאים מתקדמת עם גרפים
- [ ] ניתוח פעילות משתמשים
- [ ] דוחות מוצרים פופולריים
- [ ] ייצוא נתונים ל-CSV/Excel
- [ ] גרפי עוגה לחלק שוק קמעונאים
- [ ] מגמות מחירים לפי קטגוריות

### 4. אימות נתונים ובדיקות
**מיקום:** `api/` ו-`frontend/`

**משימות ספציפיות:**
- [ ] הוספת וולידציה מלאה לכל נתיבי API
- [ ] בדיקות יחידה ל-Frontend (Jest + React Testing Library)
- [ ] בדיקות E2E (Playwright או Cypress)
- [ ] הוספת rate limiting לנתיבי auth
- [ ] שיפור error handling עם הודעות ברורות בעברית - **✅ הושלם חלקית**
- [ ] הוספת input sanitization
- [ ] בדיקות אבטחה למניעת SQL injection

**קובצים לעדכן:**
```
api/middleware/validation.js (חדש)
api/middleware/rateLimiter.js (חדש)
frontend/src/__tests__/ (תיקיית בדיקות חדשה)
frontend/src/components/__tests__/ (בדיקות קומפוננטות)
api/tests/ (בדיקות API מתקדמות)
```

### 5. הכנה לפרודקשן
**מיקום:** שורש הפרוייקט

**משימות ספציפיות:**
- [ ] יצירת Dockerfile לשרת (`api/Dockerfile`) - **✅ קיים**
- [ ] יצירת Dockerfile ל-UI (`frontend/Dockerfile`) - **✅ קיים**
- [ ] יצירת docker-compose.yml לפיתוח מקומי
- [ ] הגדרת GitHub Actions CI/CD (`.github/workflows/`)
- [ ] שיפור מנגנון לוגים (Winston או Pino)
- [ ] הוספת environment variables לפרודקשן
- [ ] הגדרת HTTPS ו-SSL certificates
- [ ] אופטימיזציה לביצועים (caching, CDN)

**קובצים ליצור:**
```
docker-compose.yml
docker-compose.prod.yml
.github/workflows/ci.yml
.github/workflows/deploy.yml
api/utils/logger.js
nginx.conf (עבור reverse proxy)
```

## משימות משניות (רצויות)

### 6. נרמול מחירים מתקדם
**מיקום:** `lib/priceNormalization.ts` - **✅ הושלם בסיסי**

**משימות ספציפיות:**
- [x] פונקציות נרמול בסיסיות - **✅ הושלם**
- [ ] הוספת יחידות מדידה נוספות
- [ ] חישוב מחיר לק"ג אוטומטי
- [ ] השוואה ויזואלית בין מוצרים
- [ ] מחשבון חיסכון עבור כמויות שונות
- [ ] התראות על מבצעים/הנחות

### 7. מערכת משתמשים מתקדמת
**מיקום:** `frontend/src/app/profile/` ו-`api/routes/users.js`

**משימות ספציפיות:**
- [ ] עמוד פרופיל משתמש
- [ ] היסטוריית דיווחים של המשתמש
- [ ] הגדרות התראות אישיות
- [ ] מערכת תגים/השוואות מועדפות
- [ ] נקודות/רמות לפי פעילות
- [ ] שיתוף ברשתות חברתיות

### 8. תכונות מתקדמות
**מיקום:** שונה

**משימות ספציפיות:**
- [ ] מערכת התראות SMS/Email עבור מבצעים
- [ ] API נתונים פתוח למפתחים
- [ ] אפליקציית מובייל (React Native)
- [ ] תמיכה בסורקי ברקוד
- [ ] אינטגרציה עם מערכות קמעונאים
- [ ] AI לחיזוי מגמות מחירים

## סטטוס נוכחי - השגים

### ✅ הושלם:
1. **ממשק אדמין מקצועי** - layout, dashboard, navigation
2. **מערכת אנליטיקות בסיסית** - גרפים, מגמות, סטטיסטיקות
3. **ניהול דיווחי מחיר** - אישור/דחיה, חיפוש, סינון
4. **תיקון Hydration** - יציבות מלאה, SSR compatibility
5. **Type Safety** - type guards, validation, error boundaries
6. **נרמול מחירים** - כלים בסיסיים ל-100 גרם
7. **Backend Analytics** - API endpoints למגמות ושיתופי שוק

### 🚧 בעבודה:
1. **ניהול מוצרים** - CRUD חלקי, דרוש השלמה
2. **ניהול קמעונאים** - CRUD חלקי, דרוש השלמה
3. **Error Handling** - בסיסי הושלם, דרוש שיפור

### ⏳ לא החל:
1. **חיפוש וסינון** בעמוד הראשי
2. **Pagination** מתקדם
3. **בדיקות אוטומטיות**
4. **CI/CD Pipeline**
5. **ניהול משתמשים**
6. **הגדרות מערכת**

## הוראות ביצוע

### עבור Claude Code:

1. **התחל ממשימות קריטיות** - התמקד קודם בפונקציונליות הדרושה להשקה
2. **עבוד בסדר לוגי** - השלם תחילה CRUD של מוצרים, אח"כ קמעונאים, ולבסוף דיווחים
3. **שמור על עקביות** - השתמש באותו עיצוב ומוסכמות הקיימות
4. **בדוק את הקוד** - הרץ בדיקות לאחר כל שינוי
5. **תעדכן את ה-API** - ודא ש-OpenAPI מעודכן לאחר שינויים

### פריוריטזציה:
1. **גבוהה ביותר:** השלמת CRUD למוצרים וקמעונאים
2. **גבוהה:** חיפוש, סינון ו-pagination בעמוד הראשי
3. **בינונית:** בדיקות ו-validation מתקדם
4. **נמוכה:** תכונות מתקדמות ואפליקציית מובייל

### הערות חשובות:
- השתמש בקומפוננטות הקיימות כמו `AuthContext`, `ErrorBoundary`
- שמור על תמיכה ב-RTL ועברית
- ודא תאימות לטכנולוגיות הקיימות (Next.js 15, TypeScript, Tailwind)
- אל תשנה את מבנה בסיס הנתונים ללא צורך
- השתמש ב-type guards הקיימים ב-`lib/typeGuards.ts`
- עקוב אחר הדפוס של mounted state למניעת hydration errors

### טכנולוגיות מותרות להוספה:
- **UI Libraries:** Radix UI, Headless UI, React Hook Form
- **Charts:** Recharts (כבר מותקן), Chart.js, D3.js
- **Testing:** Jest, React Testing Library, Playwright
- **Utils:** date-fns, lodash, zod (לvalidation)
- **Styling:** המשך עם Tailwind CSS

---

**מטרה:** השגת גרסה יציבה ל-MVP הראשון תוך 2-3 שבועות עבודה

**עדכון אחרון:** 28 מאי 2025  
**גרסה נוכחית:** v2.2.0