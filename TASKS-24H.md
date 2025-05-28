# משימות ל-24 שעות הקרובות - בשרומטר

## יעד: השלמת CRUD מוצרים וקמעונאים + שיפורי UX בסיסיים

---

## 🔥 משימות דחופות (0-8 שעות)

### 1. השלמת ניהול מוצרים (2-3 שעות)
**עדיפות: גבוהה ביותר**

#### 1.1 תיקון עמוד הוספת מוצר חדש
- **קובץ:** `frontend/src/app/admin/products/new/page.tsx`
- **משימות:**
  - [ ] תיקון טופס ההוספה עם validation מלא
  - [ ] הוספת autocomplete לקטגוריות
  - [ ] הוספת בחירת תמונה (אופציונלי)
  - [ ] טיפול בשגיאות עם הודעות בעברית
  - [ ] הפניה לרשימת מוצרים לאחר הוספה מוצלחת

#### 1.2 תיקון עמוד עריכת מוצר
- **קובץ:** `frontend/src/app/admin/products/edit/[productId]/page.tsx`
- **משימות:**
  - [ ] טעינת נתוני המוצר הקיים
  - [ ] טופס עריכה עם ערכים קיימים
  - [ ] שמירת שינויים עם PUT request
  - [ ] validation זהה להוספת מוצר

#### 1.3 הוספת מחיקת מוצר
- **קובץ:** `frontend/src/components/ProductsManagement.tsx`
- **משימות:**
  - [ ] כפתור מחיקה בטבלת המוצרים
  - [ ] modal אישור מחיקה
  - [ ] קריאת DELETE API
  - [ ] עדכון הרשימה לאחר מחיקה

### 2. השלמת ניהול קמעונאים (2-3 שעות)
**עדיפות: גבוהה ביותר**

#### 2.1 תיקון עמוד קמעונאים
- **קובץ:** `frontend/src/app/admin/retailers/page.tsx`
- **משימות:**
  - [ ] רשימת קמעונאים עם טבלה מסודרת
  - [ ] חיפוש וסינון קמעונאים
  - [ ] כפתורי עריכה ומחיקה
  - [ ] pagination עבור רשימה ארוכה

#### 2.2 טופס הוספת קמעונאי חדש
- **קובץ:** `frontend/src/app/admin/retailers/new/page.tsx`
- **משימות:**
  - [ ] טופס מלא עם כל השדות הנדרשים
  - [ ] validation לכתובת ופרטי קשר
  - [ ] העלאת לוגו (אופציונלי)
  - [ ] integration עם API הקיים

#### 2.3 עריכת קמעונאי קיים
- **קובץ:** `frontend/src/app/admin/retailers/edit/[retailerId]/page.tsx`
- **משימות:**
  - [ ] טעינת נתוני הקמעונאי הקיים
  - [ ] טופס עריכה עם ערכים נוכחיים
  - [ ] שמירה עם PUT request

---

## ⚡ משימות חשובות (8-16 שעות)

### 3. שיפור עמוד הראשי (2-3 שעות)
**עדיפות: גבוהה**

#### 3.1 הוספת חיפוש מוצרים
- **קובץ:** `frontend/src/app/products/page.tsx`
- **משימות:**
  - [ ] שדה חיפוש בראש העמוד
  - [ ] חיפוש ב-product name ו-description
  - [ ] debounced search (500ms delay)
  - [ ] הצגת תוצאות בזמן אמת

#### 3.2 הוספת סינונים
- **קובץ חדש:** `frontend/src/components/ProductFilters.tsx`
- **משימות:**
  - [ ] סינון לפי קטגוריה
  - [ ] סינון לפי כשרות
  - [ ] סינון לפי קמעונאי
  - [ ] טווח מחירים (min-max)
  - [ ] איפוס סינונים

#### 3.3 מיון תוצאות
- **משימות:**
  - [ ] מיון לפי מחיר (נמוך לגבוה/גבוה לנמוך)
  - [ ] מיון לפי תאריך עדכון
  - [ ] מיון לפי פופולריות (מספר דיווחים)
  - [ ] dropdown עם אפשרויות מיון

### 4. שיפור דף מוצר בודד (1-2 שעות)
**עדיפות: בינונית**

#### 4.1 הוספת היסטוריית מחירים
- **קובץ:** `frontend/src/app/products/[productId]/page.tsx`
- **משימות:**
  - [ ] טבלת מחירים אחרונים (10-20 דיווחים)
  - [ ] הצגת תאריך ושעה
  - [ ] הבדלה בין מחיר רגיל למבצע
  - [ ] הצגת הקמעונאי המדווח

#### 4.2 הוספת גרף מחירים בסיסי
- **משימות:**
  - [ ] שימוש ב-Recharts הקיים
  - [ ] גרף קו פשוט של מחירים לאורך זמן
  - [ ] 30 ימים אחרונים
  - [ ] tooltip עם פרטי המחיר

### 5. שיפור ממשק דיווח מחיר (1-2 שעות)
**עדיפות: בינונית**

#### 5.1 שיפור טופס הדיווח
- **קובץ:** `frontend/src/app/report-price/page.tsx`
- **משימות:**
  - [ ] validation משופר עם הודעות שגיאה ברורות
  - [ ] autocomplete משופר למוצרים וקמעונאים
  - [ ] הוספת preview לפני שליחה
  - [ ] confirmation message לאחר דיווח מוצלח

#### 5.2 הוספת תמונה לדיווח
- **משימות:**
  - [ ] אפשרות העלאת תמונת המוצר/קבלה
  - [ ] preview התמונה לפני העלאה
  - [ ] דחיסה אוטומטית של התמונה
  - [ ] שמירה בשרת או cloud storage

---

## 🔧 משימות טכניות (16-24 שעות)

### 6. שיפור הטיפול בשגיאות (1-2 שעות)
**עדיפות: בינונית-גבוהה**

#### 6.1 הוספת מערכת notifications
- **קובץ חדש:** `frontend/src/components/ui/Toast.tsx`
- **משימות:**
  - [ ] קומפוננט Toast לhתראות
  - [ ] Context provider לניהול התראות
  - [ ] success, error, warning, info types
  - [ ] auto dismiss לאחר 5 שניות

#### 6.2 שיפור error boundaries
- **משימות:**
  - [ ] הוספת ErrorBoundary לכל הדפים הראשיים
  - [ ] לוגים מפורטים יותר לשגיאות
  - [ ] retry mechanism לקריאות API כושלות

### 7. אופטימיזציות ביצועים (1-2 שעות)
**עדיפות: בינונית**

#### 7.1 שיפור טעינת דפים
- **משימות:**
  - [ ] הוספת loading skeletons למקום spinners
  - [ ] lazy loading לתמונות
  - [ ] pagination עם 20 פריטים בעמוד
  - [ ] caching בסיסי לקריאות API

#### 7.2 שיפור responsive design
- **משימות:**
  - [ ] בדיקת כל הדפים במובייל
  - [ ] תיקון בעיות תצוגה בטאבלט
  - [ ] הסתרה/הצגה של עמודות בטבלאות קטנות

### 8. שיפורי אבטחה בסיסיים (1 שעה)
**עדיפות: בינונית**

#### 8.1 Client-side validation
- **משימות:**
  - [ ] הוספת Zod schema validation לטפסים
  - [ ] sanitization של קלטים
  - [ ] rate limiting בצד הלקוח

#### 8.2 שיפור אימות הרשאות
- **משימות:**
  - [ ] בדיקת תפוגת טוקן בכל קריאת API
  - [ ] redirect אוטומטי ל-login כשהטוקן פג
  - [ ] הסתרת תפריטי admin למשתמשים רגילים

---

## ✅ רשימת בדיקות יומית

### בדיקות פונקציונליות:
- [ ] התחברות כמנהל עובדת
- [ ] הוספת מוצר חדש פועלת
- [ ] עריכת מוצר קיים פועלת
- [ ] מחיקת מוצר פועלת (עם אישור)
- [ ] הוספת קמעונאי חדש פועלת
- [ ] עריכת קמעונאי פועלת
- [ ] חיפוש מוצרים בעמוד הראשי פועל
- [ ] סינונים עובדים נכון
- [ ] דיווח מחיר חדש פועל
- [ ] אנליטיקות נטענות נכון

### בדיקות טכניות:
- [ ] אין שגיאות hydration בקונסול
- [ ] אין שגיאות TypeScript
- [ ] `npm run build` עובר בהצלחה
- [ ] כל הדפים נטענים מהר (מתחת ל-3 שניות)
- [ ] תצוגה נכונה במובייל ובדסקטופ
- [ ] ErrorBoundary תופס שגיאות נכון

---

## 🎯 יעדי ביצועים

### קובצים לעדכן בוודאות:
```
frontend/src/app/admin/products/new/page.tsx ❌
frontend/src/app/admin/products/edit/[productId]/page.tsx ❌
frontend/src/app/admin/retailers/page.tsx ❌
frontend/src/app/admin/retailers/new/page.tsx ❌
frontend/src/app/admin/retailers/edit/[retailerId]/page.tsx ❌
frontend/src/app/products/page.tsx ❌
frontend/src/app/products/[productId]/page.tsx ❌
frontend/src/app/report-price/page.tsx ❌
frontend/src/components/ProductsManagement.tsx ✅ (דרוש שיפור)
frontend/src/components/ProductFilters.tsx (חדש) ❌
frontend/src/components/ui/Toast.tsx (חדש) ❌
```

### קובצי API לבדוק:
```
api/routes/products.js ✅ (דרוש בדיקה)
api/routes/retailers.js ✅ (דרוש בדיקה)
api/routes/prices.js ✅
api/middleware/validation.js (חדש) ❌
```

---

## 🚀 הוראות ביצוע מהירות

### עקרונות עבודה:
1. **התמקד במשימות הדחופות תחילה** (0-8 שעות)
2. **השתמש בקומפוננטים קיימים** - ErrorBoundary, StatsCard, etc.
3. **שמור על דפוס ה-mounted state** למניעת hydration errors
4. **השתמש ב-type guards** הקיימים ב-`lib/typeGuards.ts`
5. **בדוק כל שינוי במובייל ובדסקטופ**

### טכנולוגיות לשימוש:
- **Forms:** React Hook Form + Zod validation
- **UI:** Tailwind CSS עם הדפוסים הקיימים
- **Icons:** Lucide React (כבר מותקן)
- **Charts:** Recharts (כבר מותקן)
- **State:** useState + useEffect (ללא Redux)

### דפוס העבודה:
1. קרא את הקוד הקיים
2. זהה את הדפוסים והמוסכמות
3. יצור/תקן את הקומפוננטה
4. הוסף error handling
5. בדוק responsive design
6. הרץ build לוודא שאין שגיאות TypeScript

---

**מטרה ליום:** עד סוף 24 שעות - CRUD מלא למוצרים וקמעונאים + חיפוש בסיסי בעמוד הראשי

**עדכון בזמן אמת:** עדכן קובץ זה עם ✅ עבור משימות שהושלמו

**תאריך יצירה:** 28 מאי 2025, 23:30
**מעדכן אחרון:** Claude Code Assistant