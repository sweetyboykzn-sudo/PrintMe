export default function OrderForm({ total, loading, onSubmit }) {
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        onSubmit({
          name: fd.get('name'),
          phone: fd.get('phone'),
          email: fd.get('email'),
          address: fd.get('address'),
          comment: fd.get('comment')
        });
      }}
    >
      <div className="flex items-center justify-between text-lg">
        <span>Итого</span>
        <span className="font-bold text-blue-600">{total.toLocaleString('ru-RU')} ₽</span>
      </div>
      <input name="name" required placeholder="Имя *" className="w-full border rounded-xl px-4 py-3" />
      <input name="phone" required placeholder="Телефон *" className="w-full border rounded-xl px-4 py-3" />
      <input name="email" type="email" placeholder="Email" className="w-full border rounded-xl px-4 py-3" />
      <input name="address" placeholder="Адрес доставки" className="w-full border rounded-xl px-4 py-3" />
      <textarea name="comment" rows={2} placeholder="Комментарий" className="w-full border rounded-xl px-4 py-3" />
      <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-4 rounded-xl">
        {loading ? 'Создаём оплату...' : 'Оплатить ' + total.toLocaleString('ru-RU') + ' ₽'}
      </button>
    </form>
  );
}
