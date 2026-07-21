function SummaryCard({ title, value, subtitle }) {
  return (
    <div className="summary-card card">
      <p className="summary-card__title">{title}</p>
      <h2 className="summary-card__value">{value}</h2>
      {subtitle && <p className="summary-card__subtitle">{subtitle}</p>}
    </div>
  );
}

export default SummaryCard;
