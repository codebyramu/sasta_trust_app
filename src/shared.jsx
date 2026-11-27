import { pageLayers } from './page-layers';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowRight } from 'lucide-react';

export const office = {
  email: 'sastatrust@gmail.com',
  phone: '+91 93916 72398',
  tel: 'tel:+919391672398',
};
export const programmes = [
  ['Anna Prasadam', 'Free meals and drinking water at the Azhudha River camp.'],
  [
    'Temple care',
    'Support for the upkeep of heritage shrines and daily worship.',
  ],
  [
    'Pilgrim assistance',
    'Practical help for people travelling on the Sabarimala route.',
  ],
  ['Community care', 'Seva for elders and families in the local community.'],
];

export function useRecords(load) {
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(load)
      .then((data) => {
        if (active) setResult({ load, attempt, data });
      })
      .catch(() => {
        if (active) setResult({ load, attempt, error: true });
      });
    return () => {
      active = false;
    };
  }, [load, attempt]);
  if (result?.load !== load || result.attempt !== attempt)
    return { loading: true };
  return { ...result, retry: () => setAttempt((n) => n + 1) };
}

export function RecordState({ records, children }) {
  if (records.loading)
    return pageLayers(
      'RecordState',
      <p className="status" role="status">
        Retrieving records…
      </p>
    );
  if (records.error)
    return pageLayers(
      'RecordState',
      <div className="status" role="alert">
        Records are temporarily unavailable.{' '}
        <button className="link" onClick={records.retry}>
          Try again
        </button>
      </div>
    );
  return children;
}

export function Page({ title, intro, children }) {
  return pageLayers(
    'Page',
    <div className="wrap page">
      <nav className="crumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={13} />
        <span>{title}</span>
      </nav>
      <header className="page-head">
        <h1>{title}</h1>
        {intro && <p>{intro}</p>}
      </header>
      {children}
    </div>
  );
}

export function More({ to, children }) {
  return pageLayers(
    'More',
    <Link className="more" to={to}>
      {children}
      <ArrowRight size={15} />
    </Link>
  );
}
