-- Sample data: 10 hand-written rows per table
USE NFT_Theft_Database;

INSERT INTO ARTIST VALUES
('ART001', 'Sarah Chen', '0x1a2b3c4d5e6f', 'sarah.chen@email.com', 'Verified', '2023-01-15'),
('ART002', 'Mike Johnson', '0x9z8y7x6w5v4u', 'mike.j@email.com', 'Verified', '2023-02-20'),
('ART003', 'Elena Rodriguez', '0x3t2s1r9q8p7o', 'elena.r@email.com', 'Pending', '2023-03-10'),
('ART004', 'David Kim', '0x5u4t3s2r1q0p', 'david.kim@email.com', 'Verified', '2023-04-05'),
('ART005', 'Anna Smith', '0x7w6v5u4t3s2r', 'anna.smith@email.com', 'Unverified', '2023-05-12'),
('ART006', 'James Lee', '0x8x7w6v5u4t3s', 'james.lee@email.com', 'Verified', '2023-06-18'),
('ART007', 'Maria Garcia', '0x4r3e2w1q0p9o', 'maria.garcia@email.com', 'Verified', '2023-07-22'),
('ART008', 'Alex Brown', '0x6t5r4e3w2q1z', 'alex.brown@email.com', 'Pending', '2023-08-30'),
('ART009', 'Sophie Turner', '0x2q1w0e9r8t7y', 'sophie.t@email.com', 'Verified', '2023-09-14'),
('ART010', 'Ryan Wilson', '0x9i8u7y6t5r4e', 'ryan.w@email.com', 'Unverified', '2023-10-05');

-- Insert 10 Artworks
INSERT INTO ARTWORK VALUES
('AWK001', 'ART001', 'Digital Sunrise', '2023-06-01', 'QmX1Y2Z3A4B5C6D7E8F9', 'Beautiful sunrise landscape'),
('AWK002', 'ART001', 'Cyber Dreams', '2023-06-15', 'QmA9B8C7D6E5F4G3H2I1', 'Futuristic cityscape'),
('AWK003', 'ART002', 'Ocean Waves', '2023-07-01', 'QmP0O9I8U7Y6T5R4E3W2', 'Abstract ocean art'),
('AWK004', 'ART003', 'Forest Path', '2023-07-10', 'QmQ1W2E3R4T5Y6U7I8O9', 'Nature photography'),
('AWK005', 'ART004', 'Urban Night', '2023-08-01', 'QmZ0X9C8V7B6N5M4K3J2', 'City lights at night'),
('AWK006', 'ART005', 'Abstract Mind', '2023-08-15', 'QmL1K2J3H4G5F6D7S8A9', 'Psychological abstract'),
('AWK007', 'ART006', 'Pixel Paradise', '2023-09-01', 'QmM0N9B8V7C6X5Z4A3S2', 'Retro pixel art'),
('AWK008', 'ART007', 'Neon Nights', '2023-09-20', 'QmT5R4E3W2Q1A0S9D8F7', 'Neon-lit cityscape'),
('AWK009', 'ART008', 'Crystal Cave', '2023-10-05', 'QmP9O8I7U6Y5T4R3E2W1', '3D rendered cave'),
('AWK010', 'ART009', 'Space Explorer', '2023-10-15', 'QmG6H5J4K3L2Z1X0C9V8', 'Sci-fi space scene');

-- Insert 10 Collectors
INSERT INTO COLLECTOR VALUES
('COL001', 'CryptoCollector1', '0xabc123def456', 'collector1@email.com', '2023-01-10', 85.5),
('COL002', 'NFTEnthusiast', '0xdef789ghi012', 'enthusiast@email.com', '2023-02-15', 92.0),
('COL003', 'ArtLover99', '0xjkl345mno678', 'artlover@email.com', '2023-03-20', 78.5),
('COL004', 'DigitalTrader', '0xpqr901stu234', 'trader@email.com', '2023-04-25', 88.0),
('COL005', 'MetaverseKing', '0xvwx567yz890', 'metaking@email.com', '2023-05-30', 95.5),
('COL006', 'BlockchainBuyer', '0xbcd234efg567', 'buyer@email.com', '2023-06-12', 82.0),
('COL007', 'NFTWhale', '0xhij890klm123', 'whale@email.com', '2023-07-08', 98.5),
('COL008', 'ArtCollector2023', '0xnop456qrs789', 'artcoll@email.com', '2023-08-19', 76.0),
('COL009', 'DigitalGallery', '0xtuv012wxy345', 'gallery@email.com', '2023-09-03', 90.0),
('COL010', 'CryptoArtFan', '0xzab678cde901', 'cryptofan@email.com', '2023-10-11', 84.5);

-- Insert 10 Platforms
INSERT INTO PLATFORM VALUES
('PLT001', 'OpenSea', 'https://opensea.io', 'Verified', '+1-555-0001', 'support@opensea.io'),
('PLT002', 'Rarible', 'https://rarible.com', 'Verified', '+1-555-0002', 'help@rarible.com'),
('PLT003', 'Foundation', 'https://foundation.app', 'Verified', '+1-555-0003', 'contact@foundation.app'),
('PLT004', 'SuperRare', 'https://superrare.com', 'Verified', '+1-555-0004', 'support@superrare.com'),
('PLT005', 'Nifty Gateway', 'https://niftygateway.com', 'Pending', '+1-555-0005', 'help@niftygateway.com'),
('PLT006', 'Magic Eden', 'https://magiceden.io', 'Verified', '+1-555-0006', 'support@magiceden.io'),
('PLT007', 'LooksRare', 'https://looksrare.org', 'Verified', '+1-555-0007', 'help@looksrare.org'),
('PLT008', 'X2Y2', 'https://x2y2.io', 'Pending', '+1-555-0008', 'contact@x2y2.io'),
('PLT009', 'Blur', 'https://blur.io', 'Unverified', '+1-555-0009', 'support@blur.io'),
('PLT010', 'Zora', 'https://zora.co', 'Verified', '+1-555-0010', 'help@zora.co');

-- Insert 10 NFT Collections
INSERT INTO NFT_COLLECTION VALUES
('COLL001', 'ART001', 'Digital Dreams Collection', '0xContract001', 'Ethereum', 100, '2023-06-01'),
('COLL002', 'ART002', 'Ocean Series', '0xContract002', 'Ethereum', 50, '2023-07-01'),
('COLL003', 'ART003', 'Nature Portfolio', '0xContract003', 'Polygon', 75, '2023-07-15'),
('COLL004', 'ART004', 'Urban Nights', '0xContract004', 'Ethereum', 25, '2023-08-01'),
('COLL005', 'ART005', 'Abstract Worlds', '0xContract005', 'Solana', 200, '2023-08-15'),
('COLL006', 'ART006', 'Pixel Perfect', '0xContract006', 'Ethereum', 150, '2023-09-01'),
('COLL007', 'ART007', 'Neon Collection', '0xContract007', 'Polygon', 80, '2023-09-20'),
('COLL008', 'ART008', 'Crystal Universe', '0xContract008', 'Ethereum', 60, '2023-10-05'),
('COLL009', 'ART009', 'Space Odyssey', '0xContract009', 'Solana', 120, '2023-10-15'),
('COLL010', 'ART010', 'Modern Art Series', '0xContract010', 'Ethereum', 90, '2023-10-25');

-- Insert 10 Theft Reports
INSERT INTO THEFT_REPORT VALUES
('RPT001', 'AWK001', 'ART001', 'PLT001', '2023-09-01 10:30:00', 'Under Investigation', 'Artwork copied without permission', 'https://fake-site.com/stolen1'),
('RPT002', 'AWK002', 'ART001', 'PLT002', '2023-09-05 14:20:00', 'Open', 'Unauthorized minting detected', 'https://fake-site.com/stolen2'),
('RPT003', 'AWK003', 'ART002', 'PLT001', '2023-09-10 09:15:00', 'Resolved', 'Copyright infringement', 'https://fake-site.com/stolen3'),
('RPT004', 'AWK004', 'ART003', 'PLT003', '2023-09-15 16:45:00', 'Open', 'Stolen and resold', 'https://fake-site.com/stolen4'),
('RPT005', 'AWK005', 'ART004', 'PLT001', '2023-09-20 11:00:00', 'Under Investigation', 'Plagiarism claim', 'https://fake-site.com/stolen5'),
('RPT006', 'AWK006', 'ART005', 'PLT004', '2023-09-25 13:30:00', 'Open', 'Fake listing found', 'https://fake-site.com/stolen6'),
('RPT007', 'AWK007', 'ART006', 'PLT002', '2023-10-01 15:00:00', 'Under Investigation', 'Unauthorized derivative work', 'https://fake-site.com/stolen7'),
('RPT008', 'AWK008', 'ART007', 'PLT005', '2023-10-05 10:45:00', 'Resolved', 'Counterfeit NFT', 'https://fake-site.com/stolen8'),
('RPT009', 'AWK009', 'ART008', 'PLT001', '2023-10-10 12:20:00', 'Open', 'Art theft and resale', 'https://fake-site.com/stolen9'),
('RPT010', 'AWK010', 'ART009', 'PLT003', '2023-10-15 14:50:00', 'Under Investigation', 'Metadata manipulation', 'https://fake-site.com/stolen10');

-- Insert 10 Investigators
INSERT INTO INVESTIGATOR VALUES
('INV001', 'John Detective', 'BADGE001', 'john.det@agency.com', 'Blockchain Forensics', '2022-01-10'),
('INV002', 'Lisa Tracker', 'BADGE002', 'lisa.track@agency.com', 'Digital Art Authentication', '2022-02-15'),
('INV003', 'Robert Holmes', 'BADGE003', 'robert.h@agency.com', 'NFT Fraud Investigation', '2022-03-20'),
('INV004', 'Maria Inspector', 'BADGE004', 'maria.i@agency.com', 'Copyright Law', '2022-04-25'),
('INV005', 'Tom Analyst', 'BADGE005', 'tom.a@agency.com', 'Transaction Analysis', '2022-05-30'),
('INV006', 'Emma Davis', 'BADGE006', 'emma.d@agency.com', 'Smart Contract Security', '2022-06-15'),
('INV007', 'Carlos Martinez', 'BADGE007', 'carlos.m@agency.com', 'Digital Forensics', '2022-07-20'),
('INV008', 'Nina Patel', 'BADGE008', 'nina.p@agency.com', 'Intellectual Property', '2022-08-10'),
('INV009', 'Oliver White', 'BADGE009', 'oliver.w@agency.com', 'Cybercrime Investigation', '2022-09-05'),
('INV010', 'Rachel Green', 'BADGE010', 'rachel.g@agency.com', 'Blockchain Analytics', '2022-10-12');

-- Insert 10 Investigations
INSERT INTO INVESTIGATION VALUES
('INVS001', 'RPT001', '2023-09-02', NULL, 'High', 'Active', 'Ongoing blockchain analysis'),
('INVS002', 'RPT002', '2023-09-06', NULL, 'Medium', 'Active', 'Collecting evidence'),
('INVS003', 'RPT003', '2023-09-11', '2023-09-25', 'Low', 'Completed', 'Case resolved successfully'),
('INVS004', 'RPT004', '2023-09-16', NULL, 'Critical', 'Active', 'High priority case'),
('INVS005', 'RPT005', '2023-09-21', NULL, 'Medium', 'Pending', 'Awaiting artist response'),
('INVS006', 'RPT006', '2023-09-26', NULL, 'High', 'Active', 'Platform cooperation obtained'),
('INVS007', 'RPT007', '2023-10-02', NULL, 'Medium', 'Active', 'Evidence collection phase'),
('INVS008', 'RPT008', '2023-10-06', '2023-10-18', 'Low', 'Completed', 'Fake listing removed'),
('INVS009', 'RPT009', '2023-10-11', NULL, 'Critical', 'Active', 'Multiple jurisdictions involved'),
('INVS010', 'RPT010', '2023-10-16', NULL, 'High', 'Suspended', 'Awaiting legal clearance');

-- Insert 10 Evidence records
INSERT INTO EVIDENCE VALUES
('EV001', 'INVS001', 'Screenshot', 'Hash001ABC', '2023-09-03 10:00:00', 'Screenshot of fake listing', 'https://evidence.com/ev001'),
('EV002', 'INVS001', 'Transaction Log', 'Hash002DEF', '2023-09-04 11:30:00', 'Blockchain transaction data', 'https://evidence.com/ev002'),
('EV003', 'INVS002', 'Email', 'Hash003GHI', '2023-09-07 09:15:00', 'Communication with platform', 'https://evidence.com/ev003'),
('EV004', 'INVS003', 'Smart Contract', 'Hash004JKL', '2023-09-12 14:20:00', 'Contract code analysis', 'https://evidence.com/ev004'),
('EV005', 'INVS004', 'Image Comparison', 'Hash005MNO', '2023-09-17 16:45:00', 'Original vs stolen comparison', 'https://evidence.com/ev005'),
('EV006', 'INVS005', 'Metadata', 'Hash006PQR', '2023-09-22 13:10:00', 'IPFS metadata analysis', 'https://evidence.com/ev006'),
('EV007', 'INVS006', 'Wallet Trace', 'Hash007STU', '2023-09-27 15:30:00', 'Wallet transaction history', 'https://evidence.com/ev007'),
('EV008', 'INVS007', 'Screenshot', 'Hash008VWX', '2023-10-03 11:45:00', 'Unauthorized listing proof', 'https://evidence.com/ev008'),
('EV009', 'INVS009', 'Legal Document', 'Hash009YZA', '2023-10-12 09:20:00', 'Copyright registration proof', 'https://evidence.com/ev009'),
('EV010', 'INVS010', 'Video Recording', 'Hash010BCD', '2023-10-17 14:00:00', 'Screen recording of theft', 'https://evidence.com/ev010');

-- Insert 10 Suspicious Wallets
INSERT INTO SUSPICIOUS_WALLET VALUES
('WAL001', '0xSuspicious001', 'High', '2023-08-01', '2023-09-20', 'Monitoring'),
('WAL002', '0xSuspicious002', 'Critical', '2023-08-05', '2023-09-19', 'Blocked'),
('WAL003', '0xSuspicious003', 'Medium', '2023-08-10', '2023-09-18', 'Active'),
('WAL004', '0xSuspicious004', 'Low', '2023-08-15', '2023-09-17', 'Cleared'),
('WAL005', '0xSuspicious005', 'High', '2023-08-20', '2023-09-21', 'Monitoring'),
('WAL006', '0xSuspicious006', 'Critical', '2023-08-25', '2023-09-22', 'Blocked'),
('WAL007', '0xSuspicious007', 'Medium', '2023-09-01', '2023-10-01', 'Monitoring'),
('WAL008', '0xSuspicious008', 'High', '2023-09-05', '2023-10-05', 'Active'),
('WAL009', '0xSuspicious009', 'Low', '2023-09-10', '2023-10-10', 'Cleared'),
('WAL010', '0xSuspicious010', 'Critical', '2023-09-15', '2023-10-15', 'Blocked');

-- Insert 10 Transactions
INSERT INTO TRANSACTION VALUES
('TXN001', 'AWK001', 'WAL001', 12345678, '0xFrom001', '0xTo001', '0xTxHash001', '2023-09-01 10:00:00', 2.5),
('TXN002', 'AWK002', 'WAL002', 12345679, '0xFrom002', '0xTo002', '0xTxHash002', '2023-09-02 11:00:00', 1.8),
('TXN003', 'AWK003', 'WAL003', 12345680, '0xFrom003', '0xTo003', '0xTxHash003', '2023-09-03 12:00:00', 3.2),
('TXN004', 'AWK004', 'WAL004', 12345681, '0xFrom004', '0xTo004', '0xTxHash004', '2023-09-04 13:00:00', 0.9),
('TXN005', 'AWK005', 'WAL005', 12345682, '0xFrom005', '0xTo005', '0xTxHash005', '2023-09-05 14:00:00', 4.1),
('TXN006', 'AWK006', 'WAL006', 12345683, '0xFrom006', '0xTo006', '0xTxHash006', '2023-09-06 15:00:00', 1.5),
('TXN007', 'AWK007', 'WAL007', 12345684, '0xFrom007', '0xTo007', '0xTxHash007', '2023-09-07 16:00:00', 2.9),
('TXN008', 'AWK008', 'WAL008', 12345685, '0xFrom008', '0xTo008', '0xTxHash008', '2023-09-08 17:00:00', 3.7),
('TXN009', 'AWK009', 'WAL009', 12345686, '0xFrom009', '0xTo009', '0xTxHash009', '2023-09-09 18:00:00', 0.8),
('TXN010', 'AWK010', 'WAL010', 12345687, '0xFrom010', '0xTo010', '0xTxHash010', '2023-09-10 19:00:00', 5.2);

-- Insert 10 Resolutions
INSERT INTO RESOLUTION VALUES
('RES001', 'RPT003', 'INV003', '2023-09-25', 'Recovered', 'Artwork taken down', 'Successfully recovered and verified'),
('RES002', 'RPT008', 'INV002', '2023-10-18', 'Recovered', 'Fake NFT removed', 'Platform cooperation achieved'),
('RES003', 'RPT001', 'INV001', '2023-10-20', 'Ongoing', 'Under investigation', 'Awaiting final evidence'),
('RES004', 'RPT002', 'INV004', '2023-10-22', 'Compensated', 'Artist compensated', 'Settlement reached with platform'),
('RES005', 'RPT004', 'INV005', '2023-10-24', 'Ongoing', 'Legal action pending', 'Case filed in court'),
('RES006', 'RPT005', 'INV006', '2023-10-26', 'Recovered', 'Original reinstated', 'Plagiarized version removed'),
('RES007', 'RPT006', 'INV007', '2023-10-28', 'Dismissed', 'No evidence found', 'False claim determined'),
('RES008', 'RPT007', 'INV008', '2023-10-30', 'Ongoing', 'Evidence collection', 'Investigation in progress'),
('RES009', 'RPT009', 'INV009', '2023-11-01', 'Compensated', 'Financial recovery', 'Funds returned to artist'),
('RES010', 'RPT010', 'INV010', '2023-11-03', 'Ongoing', 'Technical analysis', 'Metadata investigation ongoing');

-- Insert 10 Collection_Artwork records
INSERT INTO COLLECTION_ARTWORK VALUES
('COLL001', 'AWK001', '2023-06-01'),
('COLL001', 'AWK002', '2023-06-15'),
('COLL002', 'AWK003', '2023-07-01'),
('COLL003', 'AWK004', '2023-07-15'),
('COLL004', 'AWK005', '2023-08-01'),
('COLL005', 'AWK006', '2023-08-15'),
('COLL006', 'AWK007', '2023-09-01'),
('COLL007', 'AWK008', '2023-09-20'),
('COLL008', 'AWK009', '2023-10-05'),
('COLL009', 'AWK010', '2023-10-15');

-- Insert 10 Collector_Ownership records
INSERT INTO COLLECTOR_OWNERSHIP VALUES
('COL001', 'AWK001', '2023-06-10', 2.5, TRUE),
('COL002', 'AWK002', '2023-06-20', 3.0, TRUE),
('COL003', 'AWK003', '2023-07-05', 1.8, FALSE),
('COL004', 'AWK004', '2023-07-20', 2.2, TRUE),
('COL005', 'AWK005', '2023-08-05', 4.5, TRUE),
('COL006', 'AWK006', '2023-08-20', 1.5, FALSE),
('COL007', 'AWK007', '2023-09-05', 3.8, TRUE),
('COL008', 'AWK008', '2023-09-25', 2.9, TRUE),
('COL009', 'AWK009', '2023-10-08', 5.1, TRUE),
('COL010', 'AWK010', '2023-10-20', 3.5, TRUE);

-- Insert 10 Investigation_Assignment records
INSERT INTO INVESTIGATION_ASSIGNMENT VALUES
('INVS001', 'INV001', '2023-09-02', 'Lead'),
('INVS001', 'INV005', '2023-09-03', 'Assistant'),
('INVS002', 'INV002', '2023-09-06', 'Lead'),
('INVS003', 'INV003', '2023-09-11', 'Lead'),
('INVS004', 'INV004', '2023-09-16', 'Lead'),
('INVS005', 'INV006', '2023-09-21', 'Consultant'),
('INVS006', 'INV007', '2023-09-26', 'Lead'),
('INVS007', 'INV008', '2023-10-02', 'Forensic Analyst'),
('INVS009', 'INV009', '2023-10-11', 'Lead'),
('INVS010', 'INV010', '2023-10-16', 'Lead');

-- Insert 10 Platform_Reports records
INSERT INTO PLATFORM_REPORTS VALUES
('PLT001', 'RPT001', '2023-09-01'),
('PLT002', 'RPT002', '2023-09-05'),
('PLT001', 'RPT003', '2023-09-10'),
('PLT003', 'RPT004', '2023-09-15'),
('PLT001', 'RPT005', '2023-09-20'),
('PLT004', 'RPT006', '2023-09-25'),
('PLT002', 'RPT007', '2023-10-01'),
('PLT005', 'RPT008', '2023-10-05'),
('PLT001', 'RPT009', '2023-10-10'),
('PLT003', 'RPT010', '2023-10-15');

