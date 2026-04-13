function EmptyState({ title, message, action }) {
  return (
    <div className="panel empty-state">
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  );
}

export default EmptyState;
