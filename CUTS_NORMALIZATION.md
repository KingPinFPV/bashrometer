# תשתית נרמול נתחי בשר - Cuts Normalization System

## סקירה כללית

תשתית זו נועדה לנרמל ולאחד שמות של נתחי בשר בעברית, במטרה לפתור את בעיית הכפילויות והוריאציות הרבות של שמות נתחים באתר הבשרומטר.

### הבעיה שנפתרת
- **כפילויות**: "אנטריקוט", "אנטרקוט", "אנטריקוט בקר" מופיעים כמוצרים נפרדים
- **חוסר עקביות**: שגיאות כתיב וחוסר אחידות בשמות
- **קושי בהשוואה**: לא ניתן להשוות מחירים בין נתחים זהים עם שמות שונים

### הפתרון
- **נתחים מנורמלים**: רשימה מאוחדת של נתחי בשר סטנדרטיים
- **מיפוי וריאציות**: קישור בין וריאציות שונות לנתח המנורמל
- **זיהוי אוטומטי**: אלגוריתם לזיהוי והצעת נרמול אוטומטי

---

## ארכיטקטורה

### 1. Schema Database

#### טבלת `normalized_cuts`
```sql
CREATE TABLE normalized_cuts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,        -- שם הנתח המנורמל
  category VARCHAR(50) NOT NULL,            -- בקר, עוף, טלה, חזיר, דגים
  cut_type VARCHAR(50),                     -- סטייק, צלי, טחון, פילה
  subcategory VARCHAR(50),                  -- תת-קטגוריה
  description TEXT,                         -- תיאור
  is_premium BOOLEAN DEFAULT false,         -- האם זה נתח פרמיום
  typical_weight_range VARCHAR(50),         -- טווח משקל טיפוסי
  cooking_methods TEXT[],                   -- שיטות בישול מומלצות
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### טבלת `cut_variations`
```sql
CREATE TABLE cut_variations (
  id SERIAL PRIMARY KEY,
  original_name VARCHAR(200) NOT NULL,     -- השם המקורי (הוריאציה)
  normalized_cut_id INTEGER REFERENCES normalized_cuts(id),
  confidence_score DECIMAL(3,2),           -- רמת ביטחון במיפוי (0.0-1.0)
  source VARCHAR(50) DEFAULT 'manual',     -- מקור המיפוי
  verified BOOLEAN DEFAULT false,          -- האם המיפוי אומת ידנית
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. API Endpoints

#### נתחים מנורמלים
- `GET /api/cuts` - רשימת כל הנתחים המנורמלים
- `GET /api/cuts/:id` - נתח יחיד לפי ID
- `POST /api/cuts` - יצירת נתח חדש
- `PUT /api/cuts/:id` - עדכון נתח
- `DELETE /api/cuts/:id` - מחיקת נתח

#### וריאציות
- `GET /api/cuts/variations` - רשימת כל הוריאציות
- `POST /api/cuts/variations` - יצירת וריאציה חדשה
- `PUT /api/cuts/variations/:id` - עדכון וריאציה
- `DELETE /api/cuts/variations/:id` - מחיקת וריאציה

#### נרמול וניתוח
- `POST /api/cuts/normalize` - נרמול שם נתח (עם יצירת רקורדים)
- `POST /api/cuts/analyze` - ניתוח שם נתח (ללא יצירת רקורדים)
- `GET /api/cuts/suggest/:query` - הצעות לנתח מסוים
- `GET /api/cuts/stats` - סטטיסטיקות נרמול

### 3. Frontend Components

#### `CutCard`
רכיב להצגת נתח מנורמל עם כל המידע הרלוונטי והפעולות הזמינות.

#### `CutSearchAutocomplete`
רכיב חיפוש עם השלמה אוטומטית והצעות חכמות לנתחים.

#### `CutsManagementPage`
דף ניהול מלא עם כל הפונקציונליות לניהול נתחים ווריאציות.

---

## אלגוריתם הנרמול

### שלבי הניתוח

1. **ניקוי טקסט**: הסרת רווחים מיותרים, תווים מיוחדים, תיקון טעויות נפוצות
2. **זיהוי קטגוריה**: בהתבסס על מילות מפתח (בקר, עוף, דגים וכו')
3. **זיהוי סוג נתח**: זיהוי אם זה סטייק, צלי, טחון וכו'
4. **זיהוי פרמיום**: זיהוי מילות מפתח המציינות איכות גבוהה
5. **חישוב דמיון**: השוואה עם נתחים קיימים במסד הנתונים

### מדדי דמיון

הדמיון מחושב על בסיס שילוב של:
- **Levenshtein Distance** (40%): מרחק עריכה בין מחרוזות
- **Jaccard Similarity** (40%): דמיון בין קבוצות מילים
- **Substring Matching** (20%): התאמות חלקיות

### רמות ביטחון
- **מעולה (90%+)**: התאמה כמעט מושלמת
- **טוב (75-90%)**: התאמה טובה עם ביטחון גבוה
- **בינוני (60-75%)**: התאמה סבירה הדורשת בדיקה
- **נמוך (40-60%)**: התאמה חלשה הדורשת עיון ידני

---

## מיפוי נתחים קיימים

### נתחי בקר
```javascript
'אנטריקוט': [
  'אנטרקוט', 'אנטירקוט', 'אנטריקוט בקר', 
  'אנטריקוט עם עצם', 'אנטריקוט ללא עצם',
  'אנטרקוט בלק אנגוס', 'entrecote', 'ribeye'
]

'פילה בקר': [
  'פילה', 'פילה מדומה', 'פאלש פילה', 
  'false fillet', 'טנדרלוין', 'tenderloin'
]
```

### נתחי עוף
```javascript
'חזה עוף': [
  'חזה', 'פילה עוף', 'חזה ללא עור', 
  'חזה ללא עצם', 'גרמיליה', 'שניצל עוף'
]

'שוק עוף': [
  'שוק', 'שוק עליון', 'שוק תחתון', 
  'שוקיים', 'thigh', 'drumstick'
]
```

---

## התקנה והרצה

### 1. הרצת Migration
```bash
cd api
node scripts/run-cuts-migration.js
```

### 2. בדיקת התקנה
המסך יציג:
- ✅ יצירת טבלאות בהצלחה
- 📊 רשימת הטבלאות החדשות
- 🔗 רשימת האינדקסים
- 🥩 נתונים לדוגמה לפי קטגוריה
- 📈 סטטיסטיקות נרמול

### 3. בדיקת הAPI
```bash
# הפעלת השרת
npm run dev

# בדיקת endpoints בסיסיים
curl "http://localhost:3000/api/cuts"
curl "http://localhost:3000/api/cuts/stats"
curl "http://localhost:3000/api/cuts/suggest/אנטרקוט"
```

---

## שימוש בAPI

### ניתוח נתח ללא יצירת רקורדים
```javascript
POST /api/cuts/analyze
{
  "cutName": "אנטרקוט בלק אנגוס"
}
```

**תגובה:**
```javascript
{
  "originalName": "אנטרקוט בלק אנגוס",
  "suggestedCategory": "בקר",
  "suggestedCutType": "סטייק", 
  "suggestedNormalizedName": "אנטריקוט",
  "isPremium": true,
  "confidence": 0.95,
  "possibleMatches": [...]
}
```

### נרמול עם יצירת רקורדים
```javascript
POST /api/cuts/normalize
{
  "cutName": "אנטרקוט עם עצם",
  "forceCreate": false
}
```

**תגובה:**
```javascript
{
  "success": true,
  "normalizedCut": { /* נתח מנורמל */ },
  "variation": { /* וריאציה שנוצרה */ },
  "isNewCut": false,
  "confidence": 0.90
}
```

### קבלת הצעות
```javascript
GET /api/cuts/suggest/אנטרק?minConfidence=0.3&limit=5
```

---

## Frontend Components

### שימוש ב-CutSearchAutocomplete
```jsx
import CutSearchAutocomplete from '@/components/cuts/CutSearchAutocomplete';

<CutSearchAutocomplete
  onSelect={(cut) => console.log('Selected:', cut)}
  placeholder="חפש נתח בשר..."
  showCreateOption={true}
  categories={['בקר', 'עוף']}
/>
```

### שימוש ב-CutCard
```jsx
import CutCard from '@/components/cuts/CutCard';

<CutCard
  cut={normalizedCut}
  showVariations={true}
  onEdit={(cut) => openEditModal(cut)}
  onDelete={(cut) => deleteCut(cut)}
  onViewVariations={(cut) => showVariations(cut)}
/>
```

---

## ניהול דרך ממשק האדמין

גש לכתובת: `/admin/cuts`

### תכונות זמינות:
1. **ניהול נתחים מנורמלים**
   - צפייה, עריכה, מחיקה
   - סינון לפי קטגוריה וסוג נתח
   - חיפוש עם השלמה אוטומטית

2. **ניהול וריאציות**
   - צפייה בכל הוריאציות
   - אימות וריאציות
   - עריכת רמות ביטחון

3. **סטטיסטיקות**
   - סטטיסטיקות לפי קטגוריה
   - מדדי התקדמות אימות
   - ניתוח איכות הנתונים

---

## עבודה עם CSV

### ייבוא נתונים מ-CSV
```javascript
// בעתיד - endpoint לייבוא בכמויות גדולות
POST /api/cuts/bulk-import
{
  "cuts": [
    {
      "originalName": "אנטרקוט בקר",
      "category": "בקר",
      "source": "csv_import"
    }
  ],
  "options": {
    "skipExisting": true,
    "minConfidence": 0.7,
    "autoVerify": false
  }
}
```

---

## טיפוסים (TypeScript)

### נתח מנורמל
```typescript
interface NormalizedCut {
  id: number;
  name: string;
  category: MeatCategory;
  cutType?: CutType;
  subcategory?: string;
  description?: string;
  isPremium: boolean;
  typicalWeightRange?: string;
  cookingMethods?: string[];
  createdAt: string;
  updatedAt: string;
}
```

### וריאציה
```typescript
interface CutVariation {
  id: number;
  originalName: string;
  normalizedCutId: number;
  confidenceScore: number;
  source: VariationSource;
  verified: boolean;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
}
```

---

## שאלות נפוצות (FAQ)

### מה קורה כשמזינים נתח שלא קיים?
המערכת תנתח את השם ותציע אוטומטית:
1. **קטגוריה משוערת** (בקר, עוף וכו')
2. **סוג נתח משוער** (סטייק, צלי וכו')
3. **נתחים דומים קיימים**
4. **אפשרות ליצור נתח חדש**

### איך עובד חישוב הדמיון?
המערכת משתמשת באלגוריתמים מתקדמים:
- **ניקוי טקסט**: הסרת רווחים וסימנים
- **תיקון שגיאות**: תיקון טעויות כתיב נפוצות
- **חישוב דמיון**: שילוב של מרחק עריכה ודמיון מילים
- **בדיקה במסד נתונים**: חיפוש דמיון עם PostgreSQL

### איך מוסיפים נתח חדש?
1. **דרך API**: `POST /api/cuts/normalize` עם `forceCreate: true`
2. **דרך ממשק**: לחיצה על "צור נתח חדש" בחיפוש
3. **ידני**: `POST /api/cuts` עם כל הפרטים

### איך מאמתים וריאציות?
1. **ממשק האדמין**: לחץ "אמת" ליד הוריאציה
2. **API**: `PUT /api/cuts/variations/:id` עם `verified: true`
3. **בכמות**: סינון וריאציות לא מאומתות ואימות קבוצתי

---

## תכנון עתידי

### תכונות נוספות מתוכננות:
1. **ייבוא CSV אוטומטי**: ממשק להעלאת קבצי CSV גדולים
2. **למידת מכונה**: שיפור האלגוריתם על בסיס אימותים ידניים
3. **ממשק ציבורי**: אפשרות למשתמשים להציע תיקונים
4. **היסטוריה**: מעקב אחר שינויים וגרסאות
5. **תמיכה בשפות נוספות**: אנגלית וערבית

### אופטימיזציות:
1. **קאשינג**: שמירת תוצאות חיפוש פופולריות
2. **אינדקסים נוספים**: שיפור ביצועי חיפוש
3. **API pagination**: טיפול יעיל בכמויות גדולות
4. **Real-time updates**: עדכונים בזמן אמת בממשק

---

## תמיכה ופיתוח

### מבנה הקבצים:
```
api/
├── migrations/006_create_cuts_normalization.sql
├── utils/cutNormalizer.js
├── controllers/cutsController.js
├── routes/cuts.js
└── scripts/run-cuts-migration.js

frontend/src/
├── types/cuts.ts
├── lib/cutsApi.ts
├── components/cuts/
│   ├── CutCard.tsx
│   └── CutSearchAutocomplete.tsx
└── app/admin/cuts/page.tsx
```

### הכנסת קבצים לGit:
```bash
git add .
git commit -m "Add cuts normalization system

- Database schema with normalized_cuts and cut_variations tables
- Smart Hebrew text analysis and similarity matching
- Complete API with CRUD operations and normalization endpoints  
- TypeScript types and React components
- Admin interface for managing cuts and variations
- Migration script and sample data"

git push origin main
```

**המערכת מוכנה לפרודקשן!** 🎉