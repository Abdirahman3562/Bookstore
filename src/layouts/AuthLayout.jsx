export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-10 rounded shadow-lg w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
