import { pageLayers } from './page-layers';
import React, { useState, useCallback } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { Download, Mail, LockKeyhole } from 'lucide-react';
import { database, read, displayDate } from './data';
import { useAccount } from './account';
import { Page, RecordState, office, useRecords } from './shared';
import { downloadImage, receiptImage } from './receipt-file';

export function SignIn() {
  const { user, ready, owner } = useAccount();
  const [params] = useSearchParams();
  const next = params.get('next') || '';
  const target = /^\/admin(?:\/receipt|\/event\/\d+)?$/.test(next)
    ? next
    : '/receipts';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(
    () =>
      params.get('error_description') ||
      new URLSearchParams(location.hash.slice(1)).get('error_description') ||
      ''
  );
  if (user)
    return (
      <Navigate
        replace
        to={target.startsWith('/admin') && !owner ? '/receipts' : target}
      />
    );
  async function login() {
    setBusy(true);
    setError('');
    try {
      const callback = new URL('/signin', window.location.origin);
      callback.searchParams.set('next', target);
      const { error } = await database.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callback.href },
      });
      if (error) throw error;
    } catch {
      setError('Sign-in could not start. Please try again.');
      setBusy(false);
    }
  }
  const staff = target.startsWith('/admin');
  return pageLayers(
    'SignIn',
    <Page title={staff ? 'Staff sign-in' : 'Supporter sign-in'}>
      <div className="split">
        <section className="paper prose login">
          <LockKeyhole size={25} />
          <h2>{staff ? 'Trust administration' : 'Access your receipts'}</h2>
          <p>
            {staff
              ? 'Sign in with the Google account authorised by the trust to manage events and issue receipts.'
              : 'Use the Google account associated with your contribution to find and download your donation receipts.'}
          </p>
          <button
            className="btn"
            disabled={!ready || !database || busy}
            onClick={login}
          >
            <b className="gmark">G</b>
            {busy ? 'Opening Google…' : 'Continue with Google'}
          </button>
          {!database && (
            <p role="status">
              Online sign-in is awaiting configuration. Please contact the
              office for receipt assistance.
            </p>
          )}
          {error && <p role="alert">{error}</p>}
        </section>
        <aside className="paper prose">
          <h2>Account assistance</h2>
          <p>
            For a missing receipt, share your name, payment date, and
            transaction reference with the trust office.
          </p>
          <a className="more" href={'mailto:' + office.email}>
            <Mail size={15} />
            {office.email}
          </a>
          <hr />
          <Link className="more" to={staff ? '/signin' : '/signin?next=/admin'}>
            {staff ? 'Supporter sign-in' : 'Staff sign-in'} →
          </Link>
        </aside>
      </div>
    </Page>
  );
}

export function Receipts() {
  const { user, owner } = useAccount();
  const load = useCallback(() => {
    let request = database
      .from('receipts')
      .select('*')
      .order('created_at', { ascending: false });
    if (!owner)
      request = request.ilike(
        'contact',
        user.email.replace(/[\\%_]/g, (c) => '\\' + c)
      );
    return read(request);
  }, [user.email, owner]);
  const records = useRecords(load);
  const [q, setQ] = useState(''),
    [error, setError] = useState('');
  const rows = (records.data || []).filter((row) =>
    [row.id, row.donor_name, row.purpose]
      .join(' ')
      .toLowerCase()
      .includes(q.toLowerCase())
  );
  async function download(row) {
    try {
      downloadImage(await receiptImage(row), row.id);
      setError('');
    } catch {
      setError('Could not prepare the receipt. Please try again.');
    }
  }
  async function exportRows() {
    try {
      const xlsx = await import('xlsx');
      const workbook = xlsx.utils.book_new();
      const sheet = xlsx.utils.json_to_sheet(
        rows.map((row) => ({
          Receipt: row.id,
          Date: row.date,
          Donor: row.donor_name,
          Amount: row.amount,
          Purpose: row.purpose,
        }))
      );
      xlsx.utils.book_append_sheet(workbook, sheet, 'Receipts');
      xlsx.writeFile(workbook, 'Sasta-Trust-Receipts.xlsx');
    } catch {
      setError('The export could not be prepared. Please try again.');
    }
  }
  return pageLayers(
    'Receipts',
    <Page
      title={owner ? 'Contribution records' : 'My receipts'}
      intro={
        owner
          ? 'Review receipts issued by the trust.'
          : 'Receipts matched to your account email.'
      }
    >
      <div className="filters">
        <input
          type="search"
          aria-label="Search receipts"
          placeholder="Search by name, purpose or receipt number"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {owner && (
          <>
            <Link className="btn" to="/admin/receipt">
              Issue receipt
            </Link>
            <button
              className="btn secondary"
              disabled={!rows.length}
              onClick={exportRows}
            >
              Export records
            </button>
          </>
        )}
      </div>
      <RecordState records={records}>
        {rows.length ? (
          <div className="table-scroll">
            <table>
              <caption className="sr">Contribution receipts</caption>
              <thead>
                <tr>
                  {[
                    'Receipt',
                    'Date',
                    'Donor',
                    'Purpose',
                    'Amount',
                    'Download',
                  ].map((x) => (
                    <th key={x}>{x}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <th>#{row.id}</th>
                    <td>{displayDate(row.date)}</td>
                    <td>{row.donor_name}</td>
                    <td>{row.purpose}</td>
                    <td>₹{Number(row.amount).toLocaleString('en-IN')}</td>
                    <td>
                      <button
                        className="link"
                        aria-label={'Download receipt ' + row.id}
                        onClick={() => download(row)}
                      >
                        <Download size={16} /> PNG
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="status">
            {q ? 'No matching receipts.' : 'There are no receipts to display.'}{' '}
            <Link className="link" to="/contact?subject=Donation%20receipt">
              Ask the trust office
            </Link>
          </div>
        )}
      </RecordState>
      {error && <p role="alert">{error}</p>}
    </Page>
  );
}
