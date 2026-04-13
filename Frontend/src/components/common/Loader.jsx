function Loader({ label = "Loading..." }) {
  return (
    <div className="panel empty-state">
      <div className="loader" />
      <p>{label}</p>
    </div>
  );
}

export default Loader;
