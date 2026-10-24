// Treasury FRN 13-week fixing helpers (LM-386, part 3 of LM-382): the
// per-issuance tenor, standardBillTerm and select, against the shared fixture
// test-fixtures/treasury-frn-fixings.json that Java and Python also pass,
// plus the skip and tie-break rules.
import * as fs from 'fs';
import * as path from 'path';
import BondSecurity from './BondSecurity';
import { standardBillTerm, select } from './TreasuryFrnFixings';
import { Tenor, Period } from './term';
import { SecurityProto, BondDetailsProto } from '../../../fintekkers/models/security/security_pb';
import { ProductTypeProto } from '../../../fintekkers/models/security/product_type_pb';
import { IssuanceProto } from '../../../fintekkers/models/security/bond/issuance_pb';
import { IndexTypeProto } from '../../../fintekkers/models/security/index/index_type_pb';
import { TenorTypeProto } from '../../../fintekkers/models/security/tenor_type_pb';
import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';
import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { ReferenceRateFixingProto } from '../../../fintekkers/requests/valuation/product_inputs_pb';
import { decodeDecimal, encodeDecimal, parseDecimalString, toCanonicalString } from '../utils/decimal';
import { daysBetween, plusDays, plusMonthsClamped } from '../utils/date';

const fixturePath = path.resolve(__dirname, '../../../../../test-fixtures/treasury-frn-fixings.json');
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

interface FixtureIssuance { auction_date?: string; auction_issue_date?: string; high_discount_rate?: string }
interface FixtureBill { maturity_date: string; issuances: FixtureIssuance[] }
interface FixtureFixing { index: string; rate: string; fixing_date: string; bill_maturity_date: string }
interface FixtureSelectBlock { bills: FixtureBill[]; cases: { case: string; date: string; fixing: FixtureFixing | null }[] }

function dateProto(s: string): LocalDateProto {
  const [y, m, d] = s.split('-').map(Number);
  return new LocalDateProto().setYear(y).setMonth(m).setDay(d);
}

/** A local-midnight Date, as localDateProtoToDate builds one. */
function localDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function decimal(s: string): DecimalValueProto {
  return encodeDecimal(parseDecimalString(s));
}

function canonical(p: DecimalValueProto | undefined): string {
  if (!p) throw new Error('no decimal');
  return toCanonicalString(decodeDecimal(p));
}

/** `P<y>Y<m>M<d>D`, any part optional, as the fixture writes periods. */
function parsePeriod(s: string): Period {
  const m = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?$/.exec(s);
  if (!m) throw new Error(`bad period ${s}`);
  return { years: Number(m[1] ?? 0), months: Number(m[2] ?? 0), days: Number(m[3] ?? 0) };
}

function issuance(auctionDate: string | null, issueDate: string | null, rate: DecimalValueProto | null): IssuanceProto {
  const p = new IssuanceProto();
  if (auctionDate) p.setAuctionDate(dateProto(auctionDate));
  if (issueDate) p.setAuctionIssueDate(dateProto(issueDate));
  if (rate) p.setHighDiscountRate(rate);
  return p;
}

function bill(maturity: string, issuances: IssuanceProto[]): BondSecurity {
  const bond = new BondDetailsProto().setMaturityDate(dateProto(maturity)).setIssuanceInfoList(issuances);
  return new BondSecurity(new SecurityProto().setProductType(ProductTypeProto.TBILL).setBondDetails(bond));
}

function fixtureBills(block: FixtureSelectBlock): BondSecurity[] {
  return block.bills.map(b => bill(b.maturity_date, b.issuances.map(i => issuance(
    i.auction_date ?? null, i.auction_issue_date ?? null, i.high_discount_rate ? decimal(i.high_discount_rate) : null))));
}

function checkIssuanceTenors(): void {
  for (const row of fixture.issuance_tenors) {
    const b = bill(row.maturity_date, [issuance(null, row.auction_issue_date, null)]);
    const tenor = b.getIssuanceTenor(b.getIssuances()[0]);
    const period = tenor.getTenor();
    expect([row.case, period]).toEqual([row.case, parsePeriod(row.period)]);
    const anchor = localDate(row.auction_issue_date);
    const end = plusDays(plusMonthsClamped(anchor, 12 * period!.years + period!.months), period!.days);
    expect([row.case, daysBetween(anchor, end)]).toEqual([row.case, row.days]);
    expect([row.case, standardBillTerm(tenor, anchor)]).toEqual([row.case, row.standard_bill_term_weeks]);
  }
}

function checkSelectBlock(block: FixtureSelectBlock): void {
  const bills = fixtureBills(block);
  for (const c of block.cases) {
    const got = select(bills, localDate(c.date));
    if (c.fixing === null) {
      expect([c.case, got]).toEqual([c.case, null]);
      continue;
    }
    expect(c.fixing.index).toBe('T_BILL_13_WEEK');
    const want = new ReferenceRateFixingProto()
      .setIndex(IndexTypeProto.T_BILL_13_WEEK)
      .setFixingDate(dateProto(c.fixing.fixing_date))
      .setRate(decimal(c.fixing.rate))
      .setBillMaturityDate(dateProto(c.fixing.bill_maturity_date));
    expect([c.case, got?.toObject()]).toEqual([c.case, want.toObject()]);
    // The published rate comes back unchanged, scale included.
    expect([c.case, canonical(got?.getRate())]).toEqual([c.case, c.fixing.rate]);
  }
}

// ---------- metric line 1 ----------

test('fixture issuance_tenors: period, days and standard bill term', () => {
  checkIssuanceTenors();
});

test('reopened bill: per-issuance tenors are 26W (original) and 13W (reopening)', () => {
  const b = bill('2026-10-22', [
    issuance('2026-04-20', '2026-04-23', null),
    issuance('2026-07-20', '2026-07-23', null),
  ]);
  const [original, reopening] = b.getIssuances();
  const originalTenor = b.getIssuanceTenor(original);
  const reopeningTenor = b.getIssuanceTenor(reopening);
  expect(originalTenor.getTenor()).toEqual(parsePeriod('P5M29D'));
  expect(reopeningTenor.getTenor()).toEqual(parsePeriod('P2M29D'));
  expect(standardBillTerm(originalTenor, original.getIssueDate())).toBe(26);
  expect(standardBillTerm(reopeningTenor, reopening.getIssueDate())).toBe(13);
});

// ---------- metric line 2 ----------

test('fixture standard_bill_terms on both anchors', () => {
  for (const row of fixture.standard_bill_terms) {
    const tenor = new Tenor(TenorTypeProto.TERM, parsePeriod(row.period));
    for (const anchor of row.anchors) {
      expect([row.case, anchor, standardBillTerm(tenor, localDate(anchor))])
        .toEqual([row.case, anchor, row.standard_bill_term_weeks]);
    }
  }
});

// ---------- metric line 3 ----------

test('fixture select', () => {
  checkSelectBlock(fixture.select);
});

test('fixture select_skips', () => {
  checkSelectBlock(fixture.select_skips);
});

describe('fixture cases off UTC', () => {
  const originalTz = process.env.TZ;
  afterEach(() => {
    if (originalTz === undefined) delete process.env.TZ;
    else process.env.TZ = originalTz;
  });

  for (const tz of ['America/New_York', 'Pacific/Auckland']) {
    test(`issuance_tenors and select give the same results in ${tz}`, () => {
      process.env.TZ = tz;
      checkIssuanceTenors();
      checkSelectBlock(fixture.select);
      checkSelectBlock(fixture.select_skips);
    });
  }
});

// ---------- metric line 4 ----------

test('select skips an issuance missing a field or with an empty rate', () => {
  const onDate = '2026-07-20';
  const bills = [
    bill('2026-10-22', [issuance(null, '2026-07-23', decimal('4.900'))]),
    bill('2026-10-22', [issuance(onDate, null, decimal('4.800'))]),
    bill('2026-10-22', [issuance(onDate, '2026-07-23', null)]),
    bill('2026-10-22', [issuance(onDate, '2026-07-23', new DecimalValueProto())]),
    bill('2026-10-15', [issuance('2026-07-13', '2026-07-16', decimal('4.190'))]),
  ];
  const got = select(bills, localDate(onDate));
  expect(canonical(got?.getRate())).toBe('4.190');
  expect(got?.getFixingDate()?.toObject()).toEqual(dateProto('2026-07-13').toObject());
  expect(got?.getBillMaturityDate()?.toObject()).toEqual(dateProto('2026-10-15').toObject());
});

test('select: a tie on auction date goes to the first in input order', () => {
  // Same auction date; the first has the smaller rate and earlier maturity,
  // so a "max rate" or "max maturity" rule would pick the other one.
  const first = () => bill('2026-10-21', [issuance('2026-07-20', '2026-07-22', decimal('4.100'))]);
  const second = () => bill('2026-10-22', [issuance('2026-07-20', '2026-07-23', decimal('4.215'))]);
  const date = localDate('2026-07-20');

  let got = select([first(), second()], date);
  expect(canonical(got?.getRate())).toBe('4.100');
  expect(got?.getBillMaturityDate()?.toObject()).toEqual(dateProto('2026-10-21').toObject());

  got = select([second(), first()], date);
  expect(canonical(got?.getRate())).toBe('4.215');
  expect(got?.getBillMaturityDate()?.toObject()).toEqual(dateProto('2026-10-22').toObject());
});
