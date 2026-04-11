export function Topbar() {
  return (
    <header className="fixed top-0 right-0 left-64 h-16 z-40 bg-[#F8F9FA] flex justify-between items-center px-8 border-b border-transparent">
      <div className="flex items-center bg-[#F3F4F5] px-4 py-2 rounded-lg w-96">
        <span className="material-symbols-outlined text-gray-400 text-lg mr-2">search</span>
        <input
          className="bg-transparent border-none focus:ring-0 text-sm w-full font-medium"
          placeholder="Buscar solicitudes, IDs o entidades..."
          type="text"
        />
      </div>
      <div className="flex items-center gap-6">
        <button className="relative text-[#43474F] hover:text-[#001834]">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#BB0013] rounded-full" />
        </button>
        <div className="h-8 w-px bg-gray-300" />
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-bold text-[#191C1D]">Admin User</p>
            <p className="text-[10px] text-gray-500 font-medium uppercase">
              Secretaria General
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#001834] flex items-center justify-center text-white text-sm font-bold">
            AU
          </div>
        </div>
      </div>
    </header>
  );
}
