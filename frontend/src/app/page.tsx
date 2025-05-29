export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-gray-900">
          בשרומטר
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          פלטפורמה להשוואת מחירי בשר
        </p>
        
        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <h2 className="text-lg font-medium text-gray-900">המערכת בבנייה</h2>
            <p className="mt-2 text-sm text-gray-500">
              ה-API שלנו פועל ב: 
              <a href="https://bashrometer-api.onrender.com/api/products" 
                 className="text-blue-600 hover:text-blue-500">
                bashrometer-api.onrender.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
