// src/components/Footer.tsx
const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-gray-100 text-gray-600 p-4 text-center mt-auto">
      <p>&copy; {currentYear} בשרומטר 1.0. כל הזכויות שמורות (דמו).</p>
    </footer>
  );
};

export default Footer;