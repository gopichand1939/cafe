// Frontend/src/components/Dashboard/Dashboard.jsx
function StatCard({ title, value, note, accent }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #d8ece3",
        borderRadius: 18,
        padding: 22,
        boxShadow: "0 10px 30px rgba(30, 76, 60, 0.08)",
        display: "grid",
        gap: 10,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: accent,
          opacity: 0.16,
        }}
      />
      <span
        style={{
          color: "#64748b",
          fontSize: "0.9rem",
          fontWeight: 700,
        }}
      >
        {title}
      </span>
      <strong
        style={{
          fontSize: "2rem",
          lineHeight: 1,
          color: "#1f2937",
        }}
      >
        {value}
      </strong>
      <span
        style={{
          color: "#475569",
          fontSize: "0.95rem",
        }}
      >
        {note}
      </span>
    </div>
  );
}

function Dashboard() {
  return (
    <div
      style={{
        display: "grid",
        gap: 24,
        alignContent: "start",
      }}
    >
      <section
        style={{
          display: "grid",
          gap: 16,
          padding: 28,
          borderRadius: 24,
          background:
            "linear-gradient(135deg, rgba(86, 186, 144, 0.18) 0%, rgba(74, 165, 127, 0.08) 100%)",
          border: "1px solid #d8ece3",
          boxShadow: "0 12px 30px rgba(30, 76, 60, 0.08)",
        }}
      >
        <p
          style={{
            margin: 0,
            color: "#3f9773",
            fontSize: "0.82rem",
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Dashboard
        </p>

        <div
          style={{
            display: "grid",
            gap: 10,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "clamp(2rem, 3vw, 3rem)",
              lineHeight: 1.05,
              color: "#1f2937",
            }}
          >
            Restaurant control center
          </h2>

          <p
            style={{
              margin: 0,
              maxWidth: 720,
              color: "#475569",
              fontSize: "1rem",
              lineHeight: 1.6,
            }}
          >
            Track menu activity, restaurant availability, and daily operations from one place.
            This page is ready for you to connect live analytics and API-driven metrics later.
          </p>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 18,
        }}
      >
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

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.4fr) minmax(280px, 0.8fr)",
          gap: 18,
        }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #d8ece3",
            borderRadius: 18,
            padding: 24,
            boxShadow: "0 10px 30px rgba(30, 76, 60, 0.08)",
            display: "grid",
            gap: 18,
          }}
        >
          <div
            style={{
              display: "grid",
              gap: 8,
            }}
          >
            <strong
              style={{
                fontSize: "1.2rem",
                color: "#1f2937",
              }}
            >
              Quick overview
            </strong>

            <p
              style={{
                margin: 0,
                color: "#64748b",
                lineHeight: 1.6,
              }}
            >
              Use this space for restaurant insights like total categories, active items, pending
              orders, customer feedback, or sales snapshots.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gap: 14,
            }}
          >
            {[
              "Keep menu categories clean and active.",
              "Update item availability before service hours begin.",
              "Use Timings to automate active and inactive restaurant windows.",
              "Extend this page later with charts, order pipelines, and admin notices.",
            ].map((item) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 16px",
                  borderRadius: 14,
                  background: "#f8fcfa",
                  border: "1px solid #e3f0ea",
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: "#57b98f",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    color: "#334155",
                    fontWeight: 600,
                  }}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #d8ece3",
            borderRadius: 18,
            padding: 24,
            boxShadow: "0 10px 30px rgba(30, 76, 60, 0.08)",
            display: "grid",
            gap: 16,
            alignContent: "start",
          }}
        >
          <strong
            style={{
              fontSize: "1.15rem",
              color: "#1f2937",
            }}
          >
            Recommended next steps
          </strong>

          <div
            style={{
              display: "grid",
              gap: 12,
            }}
          >
            {[
              "Add your first category if the menu is still empty.",
              "Review restaurant timings and automatic active hours.",
              "Connect dashboard cards to live API values.",
            ].map((item, index) => (
              <div
                key={item}
                style={{
                  display: "grid",
                  gridTemplateColumns: "34px 1fr",
                  gap: 12,
                  alignItems: "start",
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: "#eef7f2",
                    color: "#2f7d5b",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 800,
                  }}
                >
                  {index + 1}
                </div>

                <p
                  style={{
                    margin: 0,
                    color: "#475569",
                    lineHeight: 1.55,
                  }}
                >
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
