
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

import type {
  Group,
  SplitRequest,
  SplitPreview,
  SplitExecution,
} from '@/lib/api';

export default function HomePage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [totalAmount, setTotalAmount] = useState('1');
  const [recipientOne, setRecipientOne] = useState('');
  const [recipientTwo, setRecipientTwo] = useState('');
  const [nameOne, setNameOne] = useState('');
  const [nameTwo, setNameTwo] = useState('');
  const [percentageOne, setPercentageOne] = useState('50');
  const [percentageTwo, setPercentageTwo] = useState('50');

  const [preview, setPreview] =
    useState<SplitPreview | null>(null);

  const [execution, setExecution] =
    useState<SplitExecution | null>(null);

  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('1');
  const [beneficiaryAddress, setBeneficiaryAddress] =
    useState('');

  const [contributor, setContributor] = useState('');
  const [contributionAmount, setContributionAmount] =
    useState('');
  const [transactionId, setTransactionId] = useState('');

  async function loadGroups() {
    try {
      const result = await api.listGroups();
      setGroups(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load groups.',
      );
    }
  }

  useEffect(() => {
    void loadGroups();
  }, []);

  function buildSplitRequest(): SplitRequest {
    const first = Number(percentageOne);
    const second = Number(percentageTwo);

    if (!nameOne.trim() || !nameTwo.trim()) {
      throw new Error('Enter both recipient names.');
    }

    if (!recipientOne.trim() || !recipientTwo.trim()) {
      throw new Error('Enter both BCH recipient addresses.');
    }

    if (recipientOne.trim() === recipientTwo.trim()) {
      throw new Error('Recipients must have different addresses.');
    }

    if (first + second !== 100) {
      throw new Error('Recipient percentages must total 100%.');
    }

    if (Number(totalAmount) <= 0) {
      throw new Error('Enter a valid BCH amount.');
    }

    return {
      totalAmount: Number(totalAmount),
      recipients: [
        {
          name: nameOne,
          address: recipientOne.trim(),
          percentage: first,
        },
        {
          name: nameTwo,
          address: recipientTwo.trim(),
          percentage: second,
        },
      ],
    };
  }

  async function handlePreview() {
    setBusy(true);
    setError('');
    setSuccess('');
    setExecution(null);

    try {
      const result = await api.previewSplit(
        buildSplitRequest(),
      );

      setPreview(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to preview split.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleExecute() {
    if (!preview) return;

    setBusy(true);
    setError('');
    setSuccess('');

    try {
      const result = await api.executeSplit(
        buildSplitRequest(),
      );

      setExecution(result);
      setSuccess('Split transaction submitted successfully.');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Split execution failed.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateGroup() {
    setBusy(true);
    setError('');
    setSuccess('');

    try {
      const group = await api.createGroup({
        name: groupName,
        description,
        targetAmount: Number(targetAmount),
        creatorAddress: beneficiaryAddress.trim(),
      });

      setGroups((previous) => [
        { ...group, contributions: group.contributions ?? [] },
        ...previous,
      ]);

      setGroupName('');
      setDescription('');
      setSuccess('GroupVault created successfully.');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create group.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleContribution(groupId: string) {
    setBusy(true);
    setError('');
    setSuccess('');

    try {
      await api.addContribution(groupId, {
        contributor,
        amount: Number(contributionAmount),
        transactionId: transactionId.trim(),
      });

      setContributor('');
      setContributionAmount('');
      setTransactionId('');

      await loadGroups();

      setSuccess('Contribution transaction verified and recorded.');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to record contribution.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function copyAddress(address: string) {
    await navigator.clipboard.writeText(address);
    setSuccess('Address copied.');
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          split<span>pay</span>
        </div>

        <div className="pill">BITCOIN CASH · CHIPNET</div>
      </header>

      <section className="hero">
        <div className="eyebrow">
          Group payments on Bitcoin Cash
        </div>

        <h1>
          Payments made
          <br />
          <span style={{ color: 'var(--accent)' }}>
            simpler together.
          </span>
        </h1>

        <p className="sub">
          Split payments between recipients or collect group
          contributions with CashScript-enforced settlement
          on Bitcoin Cash Chipnet.
        </p>

        <div className="stats">
          <div className="stat">
            <b>{groups.length}</b>
            <span>Funding groups</span>
          </div>

          <div className="stat">
            <b>2</b>
            <span>SplitRouter recipients</span>
          </div>

          <div className="stat">
            <b>Chipnet</b>
            <span>Blockchain network</span>
          </div>
        </div>
      </section>

      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="success" role="status">
          {success}
        </div>
      )}

      <section className="panel">
        <h2>SplitRouter</h2>
        <p>
          Distribute one BCH payment between exactly two
          recipients. The contract enforces the specified
          outputs.
        </p>

        <div className="field">
          <label>Total amount (BCH)</label>
          <input
            type="number"
            min="0.00000001"
            step="0.00000001"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
          />
        </div>

        <div className="grid">
          <div>
            <h3>Recipient one</h3>

            <div className="field">
              <label>Name</label>
              <input
                value={nameOne}
                onChange={(e) => setNameOne(e.target.value)}
                placeholder="Recipient name"
              />
            </div>

            <div className="field">
              <label>Chipnet BCH address</label>
              <input
                value={recipientOne}
                onChange={(e) => setRecipientOne(e.target.value)}
                placeholder="bchtest:..."
              />
            </div>

            <div className="field">
              <label>Percentage</label>
              <input
                type="number"
                min="0.01"
                max="99.99"
                value={percentageOne}
                onChange={(e) => setPercentageOne(e.target.value)}
              />
            </div>
          </div>

          <div>
            <h3>Recipient two</h3>

            <div className="field">
              <label>Name</label>
              <input
                value={nameTwo}
                onChange={(e) => setNameTwo(e.target.value)}
                placeholder="Recipient name"
              />
            </div>

            <div className="field">
              <label>Chipnet BCH address</label>
              <input
                value={recipientTwo}
                onChange={(e) => setRecipientTwo(e.target.value)}
                placeholder="bchtest:..."
              />
            </div>

            <div className="field">
              <label>Percentage</label>
              <input
                type="number"
                min="0.01"
                max="99.99"
                value={percentageTwo}
                onChange={(e) => setPercentageTwo(e.target.value)}
              />
            </div>
          </div>
        </div>

        <button
          className="primary"
          disabled={busy}
          onClick={handlePreview}
        >
          {busy ? 'Processing...' : 'Preview split'}
        </button>

        {preview && (
          <div className="result">
            <h3>Contract preview</h3>

            {preview.allocations.map((item) => (
              <p key={item.address}>
                {item.name}: <strong>{item.amount} BCH</strong>
              </p>
            ))}

            <p>
              Total: {preview.totalAmount} BCH
            </p>

            <p>
              Miner fee: {preview.minerFeeSatoshis} satoshis
            </p>

            <p>
              Required funding: {preview.requiredFundingSatoshis} satoshis
            </p>

            <p>
              Network: {preview.network}
            </p>

            <p>
              Status: {preview.status}
            </p>

            <div className="field">
              <label>SplitRouter contract address</label>
              <input
                readOnly
                value={preview.contractAddress}
              />
              <button
                className="secondary"
                onClick={() => copyAddress(preview.contractAddress)}
              >
                Copy contract address
              </button>
            </div>

            <p className="note">
              Fund this address with the exact required amount
              before executing the split.
            </p>

            <button
              className="primary"
              disabled={busy}
              onClick={handleExecute}
            >
              Execute funded split
            </button>
          </div>
        )}

        {execution && (
          <div className="result">
            <h3>Transaction submitted</h3>
            <p>Transaction ID: {execution.transactionId}</p>
            <p>Status: {execution.status}</p>
          </div>
        )}
      </section>

      <section className="panel" style={{ marginTop: 18 }}>
        <h2>GroupVault</h2>
        <p>
          Create a shared funding goal and collect BCH
          contributions from participants.
        </p>

        <div className="field">
          <label>Group name</label>
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Team trip fund"
          />
        </div>

        <div className="field">
          <label>Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this group collecting for?"
          />
        </div>

        <div className="field">
          <label>Target amount (BCH)</label>
          <input
            type="number"
            min="0.00000001"
            step="0.00000001"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Beneficiary Chipnet BCH address</label>
          <input
            value={beneficiaryAddress}
            onChange={(e) => setBeneficiaryAddress(e.target.value)}
            placeholder="bchtest:..."
          />
        </div>

        <button
          className="primary"
          disabled={
            busy ||
            !groupName.trim() ||
            !beneficiaryAddress.trim()
          }
          onClick={handleCreateGroup}
        >
          Create GroupVault
        </button>
      </section>

      <section className="panel" style={{ marginTop: 18 }}>
        <h2>Funding groups</h2>

        <div className="actions">
          <button
            className="secondary"
            onClick={loadGroups}
          >
            Refresh groups
          </button>
        </div>

        {groups.length === 0 ? (
          <p>No groups created yet.</p>
        ) : (
          <div className="group-list">
            {groups.map((group) => (
              <div className="group-item" key={group.id}>
                <h3>{group.name}</h3>

                <p>
                  Target: {group.targetAmount} BCH
                </p>

                <p>Status: {group.status}</p>

                <p>
                  Contributions: {group.contributions?.length ?? 0}
                </p>

                {group.vaultAddress && (
                  <div className="field">
                    <label>GroupVault address</label>
                    <input
                      readOnly
                      value={group.vaultAddress}
                    />
                    <button
                      className="secondary"
                      onClick={() => copyAddress(group.vaultAddress!)}
                    >
                      Copy vault address
                    </button>
                  </div>
                )}

                <h3>Submit a contribution</h3>

                <div className="field">
                  <label>Contributor name</label>
                  <input
                    value={contributor}
                    onChange={(e) => setContributor(e.target.value)}
                    placeholder="Your name"
                  />
                </div>

                <div className="field">
                  <label>Contribution amount (BCH)</label>
                  <input
                    type="number"
                    min="0.00000001"
                    step="0.00000001"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    placeholder="0.1"
                  />
                </div>

                <div className="field">
                  <label>BCH transaction ID</label>
                  <input
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="64-character transaction ID"
                  />
                </div>

                <button
                  className="primary"
                  disabled={
                    busy ||
                    !contributor.trim() ||
                    !transactionId.trim() ||
                    Number(contributionAmount) <= 0
                  }
                  onClick={() => handleContribution(group.id)}
                >
                  Verify contribution
                </button>

                <h3>Contribution history</h3>

                {(group.contributions ?? []).map((item) => (
                  <p key={item.id}>
                    {item.contributor} · {item.amount} BCH ·{' '}
                    {item.confirmed ? 'Confirmed' : 'Pending'}
                  </p>
                ))}
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="note" style={{ marginTop: 24 }}>
        SplitPay currently targets Bitcoin Cash Chipnet.
        Always verify the contract address and required funding
        before sending test funds.
      </p>
    </main>
  );
}
