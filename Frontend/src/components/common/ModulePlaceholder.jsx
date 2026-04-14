function ModulePlaceholder({ title }) {
  return (
    <div
      style={{
        display: "grid",
        gap: 18,
        padding: 28,
        borderRadius: 20,
        background: "#ffffff",
        border: "1px solid #d8ece3",
        boxShadow: "0 10px 30px rgba(30, 76, 60, 0.08)",
      }}
    >
      <div style={{ display: "grid", gap: 8 }}>
        <p
          style={{
            margin: 0,
            color: "#57b98f",
            fontSize: "0.82rem",
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Module
        </p>
        <h2
          style={{
            margin: 0,
            color: "#1f2937",
            fontSize: "2rem",
            lineHeight: 1.1,
          }}
        >
          {title}
        </h2>
        <p
          style={{
            margin: 0,
            color: "#64748b",
            lineHeight: 1.6,
            maxWidth: 680,
          }}
        >
          This page is enabled by the menu permissions returned from login. You can now attach
          module-specific API actions like Add, View, Edit, and Delete without hardcoding
          sidebar structure in the frontend.
        </p>
      </div>
    </div>
  );
}

export default ModulePlaceholder;
