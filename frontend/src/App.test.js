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
  expect(await screen.findByText("510 cases · 92 under investigation")).toBeInTheDocument();
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

test("cases tab files a report and opens it", async () => {
  const options = {
    artworks: [{ id: "AWK100", title: "NFT_Artwork_100", artist: "Artist_24" }],
    platforms: [{ id: "PLT001", name: "OpenSea" }],
    investigators: [{ id: "INV011", name: "Investigator_11", expertise: "Digital Forensics", activeCases: 0 }],
    evidenceTypes: ["Screenshot"], outcomes: ["Recovered"]
  };
  const created = { id: "RPT600", status: "Open", artwork: "NFT_Artwork_100", artworkId: "AWK100", artist: "Artist_24",
    platform: "OpenSea", reportedAt: "2026-01-01T00:00:00.000Z", description: "Copied", investigation: null, resolution: null };
  global.fetch = jest.fn((url, init) => {
    const body = init?.method === "POST" ? created
      : url.endsWith("/api/options") ? options
      : url.endsWith("/api/reports/RPT600") ? created
      : url.includes("/api/reports?") ? [] : [];
    return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
  });

  render(<App />);
  fireEvent.click(screen.getByText("CASES"));
  fireEvent.change(await screen.findByPlaceholderText(/type to search/i), { target: { value: "AWK100" } });
  fireEvent.change(screen.getByDisplayValue("Choose a platform"), { target: { value: "PLT001" } });
  fireEvent.change(screen.getByPlaceholderText(/unauthorized copy/i), { target: { value: "Copied" } });
  fireEvent.click(screen.getByText("FILE REPORT"));

  expect(await screen.findByText("Case RPT600")).toBeInTheDocument();
  const post = global.fetch.mock.calls.find(([, init]) => init?.method === "POST");
  expect(post[0]).toMatch(/\/api\/reports$/);
  expect(JSON.parse(post[1].body)).toMatchObject({ artworkId: "AWK100", platformId: "PLT001", description: "Copied" });
  expect(await screen.findByText("OPEN INVESTIGATION")).toBeInTheDocument();
});
