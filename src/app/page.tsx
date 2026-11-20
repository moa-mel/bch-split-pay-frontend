'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Group = { id: string; name: string; targetAmount: string; status: string; contributions: Array<{ amount: string }> };
type Preview = { allocations: Array<{ name: string; address: string; percentage: number; amount: number }>; roundingRemainder: number; warning: string };

export default function HomePage() {
  const [total, setTotal] = useState('1');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [groupName, setGroupName] = useState('');
  const [target, setTarget] = useState('2');
  const [groups, setGroups] = useState<Group[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadGroups() {
    try { setGroups(await api.listGroups()); } catch (e) { setError(e instanceof Error ? e.message : 'Could not load groups'); }
  }
  useEffect(() => { void loadGroups(); }, []);

  async function runPreview() {
    setBusy(true); setError('');
    try {
      const result = await api.previewSplit({
        totalAmount: Number(total),
        recipients: [
          { name: 'Recipient A', address: 'bitcoincash:qrecipientaddress000000000000000001', percentage: 50 },
          { name: 'Recipient B', address: 'bitcoincash:qrecipientaddress000000000000000002', percentage: 30 },
          { name: 'Recipient C', address: 'bitcoincash:qrecipientaddress000000000000000003', percentage: 20 },
        ],
      });
      setPreview(result);
    } catch (e) { setError(e instanceof Error ? e.message : 'Preview failed'); }
    finally { setBusy(false); }
  }

  async function createGroup() {
    setBusy(true); setError('');
    try {
      await api.createGroup({ name: groupName, targetAmount: Number(target) });
      setGroupName('');
      await loadGroups();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not create group'); }
    finally { setBusy(false); }
  }

  return (
    <main className="shell">
      <header className="topbar"><div className="brand">split<span>pay</span></div><div className="pill">BCH · CHIPNET MVP</div></header>
      <section className="hero">
        <div className="eyebrow">Group payments, made clearer</div>
        <h1>Move money together.<br /><span style={{ color: 'var(--accent)' }}>Settle transparently.</span></h1>
        <p className="sub">Create a shared funding goal or preview how a payment should be distributed. XO contract enforcement and Chipnet settlement are the next integration milestone.</p>
        <div className="stats">
          <div className="stat"><b>50 / 30 / 20</b><span>Example split allocation</span></div>
          <div className="stat"><b>{groups.length}</b><span>Funding groups created</span></div>
          <div className="stat"><b>Chipnet</b><span>Target network</span></div>
        </div>
      </section>

      <section className="grid">
        <div className="panel">
          <h2>SplitRouter preview</h2>
          <p>Preview a fixed distribution across three recipients. This is an off-chain estimate, not a contract-enforced payment.</p>
          <div className="field"><label>Total amount (BCH)</label><input type="number" min="0.00000001" step="0.00000001" value={total} onChange={e => setTotal(e.target.value)} /></div>
          <button className="primary" onClick={runPreview} disabled={busy}> {busy ? 'Working…' : 'Calculate distribution'} </button>
          {preview && <div className="result">
            {preview.allocations.map(item => <p key={item.name}>{item.name} · {item.percentage}% — <strong>{item.amount.toFixed(8)} BCH</strong></p>)}
            <p>Rounding remainder: {preview.roundingRemainder.toFixed(8)} BCH</p>
            <div className="note">{preview.warning}</div>
          </div>}
        </div>

        <div className="panel">
          <h2>Create a GroupVault goal</h2>
          <p>Set a shared target. Contributions are recorded as pending until a future Chipnet verifier confirms their transactions.</p>
          <div className="field"><label>Group name</label><input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="e.g. Team trip fund" /></div>
          <div className="field"><label>Target amount (BCH)</label><input type="number" min="0.00000001" step="0.00000001" value={target} onChange={e => setTarget(e.target.value)} /></div>
          <button className="primary" disabled={busy || !groupName.trim()} onClick={createGroup}>Create funding goal</button>
        </div>
      </section>

      <section className="panel" style={{ marginTop: 18 }}>
        <h2>Your funding groups</h2>
        <p>Groups stored by the SplitPay API.</p>
        {groups.length === 0 ? <p>No groups yet. Create one above to get started.</p> :
          <div className="group-list">{groups.map(group => <div className="group-item" key={group.id}>
            <strong>{group.name}</strong><small>Target: {String(group.targetAmount)} BCH · Status: {group.status} · Contributions: {group.contributions?.length ?? 0}</small>
          </div>)}</div>}
        <div className="actions" style={{ marginTop: 14 }}><button className="secondary" onClick={loadGroups}>Refresh groups</button></div>
      </section>

      {error && <div className="error" role="alert">{error}</div>}
      <p className="note" style={{ marginTop: 24 }}>Prototype notice: no real funds are moved by this starter. Do not use production funds or treat preview data as verified blockchain settlement.</p>
    </main>
  );
}
