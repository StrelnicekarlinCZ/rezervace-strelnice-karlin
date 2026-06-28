'use client';

import { Database } from 'lucide-react';

type ServiceStat = {
  name: string;
  count: number;
  checked: number;
  revenue: number;
};

type AdminDashboardProps = {
  dayReservationsCount: number;
  dayCheckedIn: number;
  dayConfirmed: number;
  dayRevenue: number;
  dayCheckedRevenue: number;
  monthReservationsCount: number;
  monthCheckedIn: number;
  monthConfirmed: number;
  monthNoShow: number;
  monthCancelled: number;
  monthRevenue: number;
  monthCheckedRevenue: number;
  serviceStats: ServiceStat[];
};

function percent(part: number, total: number) {
  if (!total) return '0 %';
  return `${Math.round((part / total) * 100)} %`;
}

export default function AdminDashboard({
  dayReservationsCount,
  dayCheckedIn,
  dayConfirmed,
  dayRevenue,
  dayCheckedRevenue,
  monthReservationsCount,
  monthCheckedIn,
  monthConfirmed,
  monthNoShow,
  monthCancelled,
  monthRevenue,
  monthCheckedRevenue,
  serviceStats,
}: AdminDashboardProps) {
  return (
    <>
      <div className="stats stats-four">
        <div className="stat">
          <p>Rezervací ve dni</p>
          <strong>{dayReservationsCount}</strong>
        </div>

        <div className="stat">
          <p>Odbaveno ve dni</p>
          <strong>{dayCheckedIn}</strong>
          <small>{percent(dayCheckedIn, dayReservationsCount)} dne</small>
        </div>

        <div className="stat">
          <p>Čeká</p>
          <strong>{dayConfirmed}</strong>
        </div>

        <div className="stat">
          <p>Denní tržba odhad</p>
          <strong>{dayRevenue.toLocaleString('cs-CZ')} Kč</strong>
          <small>odbaveno {dayCheckedRevenue.toLocaleString('cs-CZ')} Kč</small>
        </div>
      </div>

      <div className="stats stats-four" style={{ marginTop: 12 }}>
        <div className="stat">
          <p>Tento měsíc</p>
          <strong>{monthReservationsCount}</strong>
          <small>rezervací</small>
        </div>

        <div className="stat">
          <p>Měsíc odbaveno</p>
          <strong>{monthCheckedIn}</strong>
          <small>{percent(monthCheckedIn, monthReservationsCount)}</small>
        </div>

        <div className="stat">
          <p>Měsíc čeká / no-show</p>
          <strong>{monthConfirmed} / {monthNoShow}</strong>
          <small>storno {monthCancelled}</small>
        </div>

        <div className="stat">
          <p>Měsíční tržba odhad</p>
          <strong>{monthRevenue.toLocaleString('cs-CZ')} Kč</strong>
          <small>odbaveno {monthCheckedRevenue.toLocaleString('cs-CZ')} Kč</small>
        </div>
      </div>

      <div className="admin-card" style={{ marginTop: 16 }}>
        <div className="section-title" style={{ marginTop: 0 }}>
          <div>
            <h2><Database size={18}/> Statistiky služeb</h2>
            <p>Top služby podle počtu rezervací. Tržba je orientační podle nastavených cen služeb.</p>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Služba</th>
                <th>Rezervací</th>
                <th>Odbaveno</th>
                <th>Úspěšnost</th>
                <th>Tržba odhad</th>
              </tr>
            </thead>

            <tbody>
              {serviceStats.length === 0 && (
                <tr>
                  <td colSpan={5}>Zatím nejsou žádná statistická data.</td>
                </tr>
              )}

              {serviceStats.map(s => (
                <tr key={s.name}>
                  <td><strong>{s.name}</strong></td>
                  <td>{s.count}</td>
                  <td>{s.checked}</td>
                  <td>{percent(s.checked, s.count)}</td>
                  <td>{s.revenue.toLocaleString('cs-CZ')} Kč</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
