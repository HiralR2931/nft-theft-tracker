import { render, screen, fireEvent } from "@testing-library/react";
import App from "./App";

const responses = {
  "/api/stats": { totalReports: 510, activeInvestigations: 92, totalWallets: 210, resolvedCases: 267, totalTransactions: 510 },
  "/api/data-quality": {
    checkedAt: "2026-01-01T00:00:00.000Z",
    summary: { checks: 2, passed: 1, failed: 1, score: 50 },
    results: [
      { id: "fk-artwork-artist_id", category: "Referential integrity", table: "ARTWORK", rule: "ARTWORK.Artist_ID points to an existing ARTIST", failingRows: 0, totalRows: 510, passed: true },
      { id: "open-report-investigated", category: "Consistency", table: "THEFT_REPORT", rule: "Open reports have no investigation yet", failingRows: 4, totalRows: 510, passed: false }
    ]
  }
};

beforeEach(() => {
  global.fetch = jest.fn(url => {
    const path = Object.keys(responses).find(p => url.endsWith(p));
    return Promise.resolve({ ok: true, json: () => Promise.resolve(path ? responses[path] : []) });
  });
});

test("shows live stats on the overview", async () => {
  render(<App />);
  expect(await screen.findByText("510 Active Cases")).toBeInTheDocument();
  expect(screen.getByText("267")).toBeInTheDocument();
});

test("data quality tab lists failing checks first", async () => {
  render(<App />);
  fireEvent.click(screen.getByText("DATA QUALITY"));
  expect(await screen.findByText("50%")).toBeInTheDocument();
  const rows = screen.getAllByRole("row");
  expect(rows[1]).toHaveTextContent("FAIL");
  expect(rows[1]).toHaveTextContent("Open reports have no investigation yet");
});
