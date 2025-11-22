export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    return <p className="p-10 text-center text-red-600">Please log in first</p>;
  }

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-4">Welcome, {user.name}</h1>

      <p>Your purchased books will appear here.</p>
    </div>
  );
}
