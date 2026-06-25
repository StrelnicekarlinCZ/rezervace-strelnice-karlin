'use client';

type ReservationSearchProps = {
  value: string;
  foundCount: number;
  onChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
};

export default function ReservationSearch({
  value,
  foundCount,
  onChange,
  onSearch,
  onClear,
}: ReservationSearchProps) {
  const hasSearch = value.trim().length > 0;

  return (
    <div className="field" style={{ maxWidth: 360, marginBottom: 14 }}>
      <label>Vyhledat rezervaci</label>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') onSearch();
          }}
          placeholder="Jméno, e-mail, telefon nebo číslo rezervace"
        />

        <button type="button" className="small-btn" onClick={onSearch}>
          Vyhledat
        </button>

        <button type="button" className="small-btn" onClick={onClear}>
          Vyčistit
        </button>
      </div>

      {hasSearch && (
        <small style={{ display: 'block', marginTop: 6, opacity: 0.8 }}>
          Nalezeno {foundCount} rezervací
        </small>
      )}
    </div>
  );
}
