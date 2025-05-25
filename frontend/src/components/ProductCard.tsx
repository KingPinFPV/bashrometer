// src/components/ProductCard.tsx
import Link from 'next/link';

interface Product {
  id: number;
  name: string;
  brand: string | null;
  short_description: string | null;
  image_url: string | null;
  category: string | null;
  unit_of_measure: string;
  min_price_per_100g: number | null; // <-- הוספה
}

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow flex flex-col">
      {/* ... קוד התמונה נשאר כפי שהוא ... */}
      {product.image_url && (
        <img 
          src={product.image_url} 
          alt={product.name} 
          className="w-full h-40 object-cover rounded-md mb-3" 
        />
      )}
      {!product.image_url && (
        <div className="w-full h-40 bg-slate-200 rounded-md mb-3 flex items-center justify-center text-slate-400">
          אין תמונה
        </div>
      )}

      <h2 className="text-xl font-semibold text-slate-800 mb-1 truncate" title={product.name}>{product.name}</h2>
      {product.brand && <p className="text-sm text-slate-500 mb-1">מותג: {product.brand}</p>}
      {product.category && <p className="text-sm text-slate-600 mb-2">קטגוריה: {product.category}</p>}

      {/* הצגת המחיר המינימלי ל-100 גרם */}
      {product.min_price_per_100g !== null && (
        <p className="text-lg font-bold text-sky-700 my-2">
           החל מ- ₪{product.min_price_per_100g.toFixed(2)} ל-100 גר'
        </p>
      )}
      {product.min_price_per_100g === null && (
         <p className="text-sm text-slate-500 my-2">
          (אין מידע על מחיר)
        </p>
      )}

      {product.short_description && (
        <p className="text-xs text-slate-500 mb-3 flex-grow min-h-[3rem]"> 
          {product.short_description}
        </p>
      )}
      <div className="mt-auto"> 
        <Link 
          href={`/products/${product.id}`} 
          className="text-sky-600 hover:text-sky-800 font-medium text-sm"
        >
          פרטים נוספים ומחירים...
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;