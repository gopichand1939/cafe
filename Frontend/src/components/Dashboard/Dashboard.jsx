const accentClassMap = {
  "#22c55e": "bg-green-500",
  "#f97316": "bg-orange-500",
  "#3b82f6": "bg-blue-500",
  "#8b5cf6": "bg-violet-500",
};

function StatCard({ title, value, note, accent }) {
  return (
    <div className="grid gap-[10px] rounded-[18px] border border-[#d8ece3] bg-white p-[22px] shadow-[0_10px_30px_rgba(30,76,60,0.08)]">
      <div className={`h-[42px] w-[42px] rounded-xl opacity-15 ${accentClassMap[accent] || "bg-emerald-500"}`} />
      <span className="text-[0.9rem] font-bold text-slate-500">{title}</span>
      <strong className="text-[2rem] leading-none text-[#1f2937]">{value}</strong>
      <span className="text-[0.95rem] text-slate-600">{note}</span>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="grid content-start gap-6">
      <section className="grid gap-4 rounded-3xl border border-[#d8ece3] bg-[linear-gradient(135deg,rgba(86,186,144,0.18)_0%,rgba(74,165,127,0.08)_100%)] p-7 shadow-[0_12px_30px_rgba(30,76,60,0.08)]">
        <p className="m-0 text-[0.82rem] font-extrabold uppercase tracking-[0.08em] text-[#3f9773]">
          Dashboard
        </p>

        <div className="grid gap-[10px]">
          <h2 className="m-0 text-[clamp(2rem,3vw,3rem)] leading-[1.05] text-[#1f2937]">
            Restaurant control center
          </h2>

          <p className="m-0 max-w-[720px] text-base leading-[1.6] text-slate-600">
            Track menu activity, restaurant availability, and daily operations from one place.
            This page is ready for you to connect live analytics and API-driven metrics later.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[18px]">
        <StatCard
          title="Restaurant Status"
          value="Active"
          note="Manual control and timings can be managed from the Timings page."
          accent="#22c55e"
        />
        <StatCard
          title="Menu Categories"
          value="Manage"
          note="Create, edit, and organize category sections for the restaurant."
          accent="#f97316"
        />
        <StatCard
          title="Items"
          value="Ready"
          note="Keep your live food and beverage menu updated from the items module."
          accent="#3b82f6"
        />
        <StatCard
          title="Admin Access"
          value="Secure"
          note="Only authenticated admins can access this dashboard and settings."
          accent="#8b5cf6"
        />
      </section>

      <section className="grid gap-[18px] lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
        <div className="grid gap-[18px] rounded-[18px] border border-[#d8ece3] bg-white p-6 shadow-[0_10px_30px_rgba(30,76,60,0.08)]">
          <div className="grid gap-2">
            <strong className="text-[1.2rem] text-[#1f2937]">Quick overview</strong>

            <p className="m-0 leading-[1.6] text-slate-500">
              Use this space for restaurant insights like total categories, active items, pending
              orders, customer feedback, or sales snapshots.
            </p>
          </div>

          <div className="grid gap-[14px]">
            {[
              "Keep menu categories clean and active.",
              "Update item availability before service hours begin.",
              "Use Timings to automate active and inactive restaurant windows.",
              "Extend this page later with charts, order pipelines, and admin notices.",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-[14px] border border-[#e3f0ea] bg-[#f8fcfa] px-4 py-[14px]"
              >
                <span className="h-[10px] w-[10px] shrink-0 rounded-full bg-[#57b98f]" />
                <span className="font-semibold text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid content-start gap-4 rounded-[18px] border border-[#d8ece3] bg-white p-6 shadow-[0_10px_30px_rgba(30,76,60,0.08)]">
          <strong className="text-[1.15rem] text-[#1f2937]">Recommended next steps</strong>

          <div className="grid gap-3">
            {[
              "Add your first category if the menu is still empty.",
              "Review restaurant timings and automatic active hours.",
              "Connect dashboard cards to live API values.",
            ].map((item, index) => (
              <div key={item} className="grid grid-cols-[34px_1fr] items-start gap-3">
                <div className="grid h-[34px] w-[34px] place-items-center rounded-[10px] bg-[#eef7f2] font-extrabold text-[#2f7d5b]">
                  {index + 1}
                </div>

                <p className="m-0 leading-[1.55] text-slate-600">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
