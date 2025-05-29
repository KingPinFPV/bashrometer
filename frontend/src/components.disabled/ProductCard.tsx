// src/components/ProductCard.tsx
import Link from 'next/link';
import PriceDisplay from './PriceDisplay';

interface Product {
  id: number;
  name: string;
  brand: string | null;
  short_description: string | null;
  image_url: string | null;
  category: string | null;
  unit_of_measure: string;
  min_price_per_100g: number | null;
}

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
}

const ProductCard: React.FC<ProductCardProps> = ({ product, viewMode = 'grid' }) => {
  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    transition: 'all 0.3s ease',
    overflow: 'hidden',
    display: viewMode === 'list' ? 'flex' : 'flex',
    flexDirection: viewMode === 'list' ? 'row' : 'column',
    padding: viewMode === 'list' ? '1rem' : '1.5rem',
    gap: viewMode === 'list' ? '1rem' : '0',
    alignItems: viewMode === 'list' ? 'center' : 'stretch',
  } as const;

  const imageStyle = {
    width: viewMode === 'list' ? '80px' : '100%',
    height: viewMode === 'list' ? '80px' : '160px',
    objectFit: 'cover' as const,
    borderRadius: '12px',
    flexShrink: 0,
  };

  const placeholderStyle = {
    width: viewMode === 'list' ? '80px' : '100%',
    height: viewMode === 'list' ? '80px' : '160px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#cbd5e1',
    fontSize: '0.875rem',
    flexShrink: 0,
  };

  const contentStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
    marginTop: viewMode === 'list' ? '0' : '1rem',
  };

  const titleStyle = {
    fontSize: viewMode === 'list' ? '1.125rem' : '1.25rem',
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: '0.25rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: viewMode === 'list' ? 'nowrap' : 'normal',
  } as const;

  const brandStyle = {
    fontSize: '0.875rem',
    color: '#94a3b8',
    fontWeight: '500',
  };

  const categoryStyle = {
    fontSize: '0.75rem',
    color: '#64748b',
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '0.25rem 0.5rem',
    borderRadius: '6px',
    width: 'fit-content',
  };

  const priceStyle = {
    fontSize: viewMode === 'list' ? '1rem' : '1.125rem',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginTop: '0.5rem',
  };

  const noPriceStyle = {
    fontSize: '0.875rem',
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: '0.5rem',
  };

  const descriptionStyle = {
    fontSize: '0.875rem',
    color: '#94a3b8',
    lineHeight: '1.4',
    display: viewMode === 'list' ? 'none' : 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    display: '-webkit-box',
  };

  const linkStyle = {
    color: '#60a5fa',
    fontWeight: '600',
    fontSize: '0.875rem',
    textDecoration: 'none',
    padding: '0.5rem 1rem',
    background: 'rgba(59, 130, 246, 0.1)',
    borderRadius: '8px',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    transition: 'all 0.3s ease',
    textAlign: 'center' as const,
    marginTop: 'auto',
    alignSelf: viewMode === 'list' ? 'flex-end' : 'stretch',
    whiteSpace: 'nowrap' as const,
  };

  const actionsStyle = {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    marginTop: viewMode === 'list' ? '0' : '1rem',
  };

  return (
    <div 
      style={cardStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = viewMode === 'list' ? 'translateX(4px)' : 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translate(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      }}
    >
      {/* Image */}
      {product.image_url ? (
        <img 
          src={product.image_url} 
          alt={product.name} 
          style={imageStyle}
        />
      ) : (
        <div style={placeholderStyle}>
          🥩 אין תמונה
        </div>
      )}

      {/* Content */}
      <div style={contentStyle}>
        <h2 style={titleStyle} title={product.name}>
          {product.name}
        </h2>
        
        {product.brand && (
          <div style={brandStyle}>
            🏷️ {product.brand}
          </div>
        )}
        
        {product.category && (
          <div style={categoryStyle}>
            📂 {product.category}
          </div>
        )}

        {product.min_price_per_100g !== null ? (
          <div style={priceStyle}>
            <PriceDisplay
              price={product.min_price_per_100g}
              normalizedPrice={product.min_price_per_100g}
              unit="100g"
              quantity={1}
              displayMode="compact"
              size="sm"
            />
          </div>
        ) : (
          <div style={noPriceStyle}>
            ❓ אין מידע על מחיר
          </div>
        )}

        {product.short_description && (
          <div style={descriptionStyle}>
            {product.short_description}
          </div>
        )}

        <div style={actionsStyle}>
          <Link 
            href={`/products/${product.id}`} 
            style={linkStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {viewMode === 'list' ? '👁️ צפה' : '📊 פרטים ומחירים'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;