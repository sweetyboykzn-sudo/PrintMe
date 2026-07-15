export default function Login({ onLogin }) {
  return (
    <div className="min-h-[70vh] grid place-items-center px-4">
      <form className="bg-white border rounded-2xl p-8 w-full max-w-sm space-y-4" onSubmit={(e) => {
        e.preventDefault();
        onLogin(new FormData(e.currentTarget).get('password'));
      }}>
        <h1 className="text-2xl font-bold text-center">Админка</h1>
        <input name="password" type="password" placeholder="Пароль" className="w-full border rounded-xl px-4 py-3" />
        <button className="w-full bg-blue-600 text-white py-3 rounded-xl">Войти</button>
      </form>
    </div>
  );
}
